import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for fixing Three.js errors
const systemPrompt = `
You are an expert 3D developer specializing in debugging React Three Fiber (R3F) code that runs in a **VERY LIMITED, SANDBOXED ENVIRONMENT**.\nYour task is to analyze the provided R3F code and error message, fix the error, and output the corrected code adhering to **STRICT CONSTRAINTS**.\n\n**CRITICAL CONSTRAINTS for the LIMITED ENVIRONMENT (Apply these to your fixed code):**\n

1.  **Code Structure:**\n    
    *   Output ONLY the JSX code for a single React function component.\n    
    *   The component MUST be named \`Scene\` and exported using \`export default function Scene() { ... }\`.\n    
    *   No other helper functions or variables should be defined outside the \`Scene\` component scope.\n    
    *   **IMPORTANT**: Include the following imports at the very top of your file:\n
        \`\`\`jsx
        import React, { useRef, useState, useEffect } from 'react';
        import { useFrame } from '@react-three/fiber';
        \`\`\`
        Only add other imports if specifically needed (e.g., \`import { Stars, Environment } from '@react-three/drei';\` ONLY if these components are used).\n
    *   Do NOT include \`<Canvas>\` or setup code; only the scene contents within \`<></>\`.\n

2.  **Available Hooks:**\n    
    *   \`useRef\`, \`useState\`, \`useEffect\`, \`useMemo\` from React
    *   \`useFrame\` from '@react-three/fiber' (NOT from React) for animations
    *   Do NOT use other hooks that aren't explicitly mentioned here

3.  **Available JSX Elements (Case-Sensitive):**\n    
    *   \`<mesh>\`, \`<group>\`\n    
    *   \`<boxGeometry>\`, \`<sphereGeometry>\`, \`<cylinderGeometry>\`, \`<coneGeometry>\`, \`<planeGeometry>\`\n    
    *   \`<meshStandardMaterial>\`, \`<meshPhysicalMaterial>\`, \`<meshBasicMaterial>\`\n    
    *   \`<ambientLight>\`, \`<pointLight>\`, \`<directionalLight>\`, \`<hemisphereLight>\`\n    
    *   \`<Stars>\` and \`<Environment>\` from '@react-three/drei' - **ONLY USE WHEN SPECIFICALLY REQUESTED**\n    
    *   **ABSOLUTELY DO NOT USE:** \`<OrbitControls />\`, \`<PerspectiveCamera />\`, \`<Html>\`, \`<Text>\`, or any other components not explicitly listed above.

4.  **Fixing Guidelines:**\n    
    *   Analyze the original code and the provided \`ERROR MESSAGE\`, \`ERROR TYPE\`, \`ERROR LOCATION\`, and \`STACK TRACE\`.\n
    *   Common issues include: wrong imports, React not being imported, hooks called conditionally, missing ref initialization, etc.\n  
    *   The most common issue is importing useFrame from React instead of @react-three/fiber.\n
    *   Fix the specific error reported with minimal changes to the original code\'s intent.\n    
    *   Ensure the *entire* fixed code adheres to *all* the sandbox constraints listed above.\n     
    *   Assume \`THREE\` is available globally.\n     

**RESPOND ONLY WITH THE COMPLETE FIXED JSX CODE for the \`Scene\` component.**\n`;

// Process error details to extract useful information
function processErrorDetails(errorDetails: string): {
  errorMessage: string;
  errorStack: string;
  errorType: string;
  errorLocation?: string;
  specificFixes?: string[];
} {
  // Default values
  let errorMessage = errorDetails;
  let errorStack = '';
  let errorType = 'Unknown';
  let errorLocation = '';
  let specificFixes: string[] = [];

  // Try to extract structured information
  const errorMatch = errorDetails.match(/Error:\s*(.*?)(?:\n  |$)/);
  if (errorMatch && errorMatch[1]) {
    errorMessage = errorMatch[1].trim();
    
    // Handle Sandpack/iframe error formats
    if (errorDetails.includes('sandbox') || errorDetails.includes('iframe')) {
      if (errorMessage.includes('Module not found') || errorMessage.includes('Cannot find module')) {
        errorType = 'ModuleNotFoundError';
        specificFixes.push(`Remove import statements - sandbox provides globals instead`);
        specificFixes.push(`Check for proper access to available components`);
      }
    }
    
    // Identify common error types
    if (errorMessage.includes('Cannot read properties of null') || errorMessage.includes('Cannot read properties of undefined')) {
      // Check what property was being accessed
      const propertyMatch = errorMessage.match(/reading ['"](.+?)['"]/);
      const property = propertyMatch ? propertyMatch[1] : 'unknown property';
      
      if (property === 'repeat' || property === 'wrapS' || property === 'wrapT') {
        errorType = 'TexturePropertyError';
        specificFixes.push(`Use texture || null in material props`);
        specificFixes.push(`Set ${property} in useEffect after texture loads`);
        specificFixes.push(`Avoid using map-${property} syntax directly`);
      } else {
        errorType = 'UndefinedPropertyError';
      }
    } else if (errorMessage.includes('is not a function')) {
      errorType = 'FunctionError';
    } else if (errorMessage.includes('is not defined')) {
      if (errorMessage.includes('useLoader is not defined')) {
        errorType = 'UseLoaderError';
      } else {
        errorType = 'UndefinedError';
      }
    } else if (errorMessage.includes('invalid value')) {
      errorType = 'InvalidValueError';
    } else if (errorMessage.includes('CORS') || errorMessage.includes('blocked by CORS policy')) {
      errorType = 'CORSError';
      specificFixes.push(`Use local textures instead of external URLs`);
      specificFixes.push(`Provide fallback color-only materials`);
    } else if (errorMessage.includes('404') || errorMessage.includes('Failed to load')) {
      errorType = 'ResourceLoadError';
      specificFixes.push(`Use different texture sources`);
      specificFixes.push(`Add fallbacks for missing resources`);
    }
  }

  // Extract stack trace if available
  const stackMatch = errorDetails.match(/Stack:\s*([\s\S]*?)(?:\n\n|$)/);
  if (stackMatch && stackMatch[1]) {
    errorStack = stackMatch[1].trim();
    
    // Try to extract location from stack
    const locationMatch = errorStack.match(/at\s+(\w+)\s+\(.*?:(\d+):(\d+)/);
    if (locationMatch) {
      errorLocation = `${locationMatch[1]} at line ${locationMatch[2]}`;
    }
    
    // Check if error occurs in meshStandardMaterial
    if (stackMatch[1].includes('meshStandardMaterial')) {
      if (!specificFixes.length) {
        specificFixes.push(`Check texture properties in meshStandardMaterial`);
        specificFixes.push(`Ensure all textures are properly handled with fallbacks`);
      }
    }
  }

  return {
    errorMessage,
    errorStack,
    errorType,
    errorLocation,
    specificFixes
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, errorDetails } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Valid code is required' },
        { status: 400 }
      );
    }

    // Process the error details to extract useful information
    const processedError = processErrorDetails(errorDetails);
    
    // Create a detailed prompt for fixing the code
    const userPrompt = `
The following React Three Fiber code is causing a runtime error in a limited sandbox environment:

CODE:
\`\`\`jsx
${code}
\`\`\`

ERROR DETAILS:
- Type: ${processedError.errorType}
- Message: ${processedError.errorMessage}
${processedError.errorLocation ? `- Location: ${processedError.errorLocation}` : ''}
- Stack Trace:
${processedError.errorStack}

${processedError.specificFixes && processedError.specificFixes.length > 0 ? `POSSIBLE FIXES based on error type:
${processedError.specificFixes.map(fix => `- ${fix}`).join('\n')}` : ''}
Please fix the code to resolve this specific runtime error, keeping the sandbox constraints (listed in the system prompt) in mind.
Return only the complete, fixed JSX code for the Scene component, ensuring it adheres to all sandbox limitations.
`;

    // Call OpenAI API with optimized parameters
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2, // Lower temperature for more precise fixes
      max_tokens: 2000,
    });

    // Extract the fixed code
    const fixedCode = completion.choices[0]?.message?.content?.trim() || '';
    
    // Log the fixed code for debugging
    console.log('Fixed code from OpenAI:', fixedCode);
    
    return NextResponse.json({ code: fixedCode });
  } catch (error: any) {
    console.error('Error fixing scene:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fix scene' },
      { status: 500 }
    );
  }
}
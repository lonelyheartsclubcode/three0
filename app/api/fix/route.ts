import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Define message interface to match OpenAI API expectations
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

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
        import * as THREE from 'three';
        import React, { useRef, useState, useEffect, useMemo } from 'react';
        import { useFrame, useThree } from '@react-three/fiber';
        \`\`\`
        Only add other imports if specifically needed (e.g., \`import { Stars, Sky, Environment } from '@react-three/drei';\` ONLY if these components are used).\n
        For advanced geometries, include appropriate imports like: \`import { ParametricGeometry, LatheGeometry, TubeGeometry, ShapeGeometry, ExtrudeGeometry } from '@react-three/drei';\` ONLY if these components are used.\n
    *   Do NOT include \`<Canvas>\` or setup code; only the scene contents within \`<></>\`.\n

2.  **Available Hooks:**\n    
    *   \`useRef\`, \`useState\`, \`useEffect\`, \`useMemo\` from React
    *   \`useFrame\`, \`useThree\` from '@react-three/fiber'
    *   Do NOT use other hooks that aren't explicitly mentioned here

3.  **Available JSX Elements (Case-Sensitive):**\n    
    *   \`<mesh>\`, \`<group>\`, \`<instancedMesh>\`\n    
    *   Basic Geometries: \`<boxGeometry>\`, \`<sphereGeometry>\`, \`<cylinderGeometry>\`, \`<coneGeometry>\`, \`<planeGeometry>\`, \`<torusGeometry>\`, \`<torusKnotGeometry>\`, \`<tetrahedronGeometry>\`, \`<octahedronGeometry>\`, \`<icosahedronGeometry>\`, \`<dodecahedronGeometry>\`, \`<ringGeometry>\`, \`<circleGeometry>\`\n    
    *   Advanced Geometries: \`<parametricGeometry>\`, \`<latheGeometry>\`, \`<tubeGeometry>\`, \`<shapeGeometry>\`, \`<extrudeGeometry>\`, \`<capsuleGeometry>\`, \`<edgesGeometry>\`, \`<wireframeGeometry>\`\n    
    *   \`<meshStandardMaterial>\`, \`<meshPhysicalMaterial>\`, \`<meshBasicMaterial>\`, \`<meshNormalMaterial>\`, \`<meshDepthMaterial>\`, \`<meshMatcapMaterial>\`, \`<meshToonMaterial>\`, \`<meshLambertMaterial>\`, \`<meshPhongMaterial>\`\n    
    *   \`<ambientLight>\`, \`<pointLight>\`, \`<directionalLight>\`, \`<hemisphereLight>\`, \`<spotLight>\`, \`<rectAreaLight>\`\n    
    *   \`<Stars>\`, \`<Sky>\` and \`<Environment>\` from '@react-three/drei' - **ONLY USE WHEN SPECIFICALLY REQUESTED**\n    
    *   **ABSOLUTELY DO NOT USE:** \`<OrbitControls />\`, \`<PerspectiveCamera />\`, \`<Html>\`, \`<Text>\`, or any other components not explicitly listed above.

4.  **THREE.js Object Manipulation:**\n
    *   **CRITICAL: Always use THREE with imported namespace (import * as THREE from 'three')**
    *   If you see errors like "THREE is not defined", add the import for THREE
    *   Use THREE for all Three.js objects: \`new THREE.Vector3()\`, \`THREE.MathUtils.degToRad()\`, etc.
    *   If you see errors like "Cannot assign to read only property 'scale' of object '#<Mesh>'", fix them by:
        * In JSX: Using \`<mesh scale={[x, y, z]}>\` instead of trying to assign directly
        * In useFrame: Using \`meshRef.current.scale.set(x, y, z)\` or modifying individual components like \`meshRef.current.scale.x = value\`
    *   CORRECT ways to modify scale:
        * \`<mesh scale={[x, y, z]}>\` or \`<mesh scale-x={1.5}>\` in JSX
        * \`meshRef.current.scale.set(x, y, z)\` or \`meshRef.current.scale.x = value\` in useFrame
    *   WRONG ways that cause errors:
        * \`meshRef.current.scale = [x, y, z]\` or \`meshRef.current.scale = new THREE.Vector3(x,y,z)\`
        * Same applies for position and rotation properties

5.  **Advanced Geometry Issues:**\n
    *   For parametric geometry, ensure the function correctly sets the target Vector3
    *   For extrude geometry, verify the shape and extrude settings are properly formatted
    *   For shape geometry, check that the shape is a valid THREE.Shape instance
    *   For lathe geometry, ensure points array contains valid Vector2 instances
    *   For tube geometry, verify the path is a properly formatted THREE.Curve instance
    *   For instancedMesh, ensure proper initialization and matrix updates:
        * Check if meshRef.current exists before accessing instanceMatrix
        * Ensure dummy.updateMatrix() is called before setMatrixAt()
        * Verify that instanceMatrix.needsUpdate = true is set after updates
        * For animated particles, ensure proper bounds checking
        * Use decompose() correctly when retrieving matrices

6.  **Advanced Animation Issues:**\n
    *   For complex animations, ensure \`delta\` parameter is used in \`useFrame\` for frame-rate independence
    *   Check for missing or improperly initialized refs before accessing in animations
    *   Ensure performance by using proper group hierarchies for complex animations
    *   Verify that all animations have proper conditional checks to prevent errors

7.  **Material and Geometry Issues:**\n
    *   Check for proper material parameter usage based on the material type
    *   Ensure all geometries have appropriate args parameters
    *   Verify that any custom material properties are compatible with the material type
    *   For transparent materials, ensure both transparent={true} and proper opacity values
    *   For meshPhysicalMaterial water/glass effects, check for:
        * Missing transparent={true} when using transmission
        * Invalid ior values (must be between 1.0 and 2.333)
        * Contradictions like high transmission with low opacity
        * Missing side={THREE.DoubleSide} for thin transparent surfaces
        * Incompatible property combinations (like high metalness with high transmission)
        * For animated water surfaces, check proper handling of geometry attributes

8.  **Fixing Guidelines:**\n    
    *   Analyze the original code and the provided \`ERROR MESSAGE\`, \`ERROR TYPE\`, \`ERROR LOCATION\`, and \`STACK TRACE\`.\n
    *   Common issues include: missing THREE import, wrong imports, React not being imported, hooks called conditionally, missing ref initialization, assigning directly to read-only properties, etc.\n  
    *   The most common issue is importing useFrame from React instead of @react-three/fiber or missing THREE import.\n
    *   Fix the specific error reported with minimal changes to the original code\'s intent.\n    
    *   Ensure the *entire* fixed code adheres to *all* the sandbox constraints listed above.\n     
    *   **IMPORTANT: Never assume THREE is globally available. Always use the imported namespace.**\n     

**RESPOND ONLY WITH THE COMPLETE FIXED JSX CODE for the \`Scene\` component.**\n

**Text Rendering Support:**\n
- Ensure text rendering is supported during error fixing.
`;

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
    
    // Handle read-only property errors (scale, position, rotation)
    if (errorMessage.includes('Cannot assign to read only property')) {
      errorType = 'ReadOnlyPropertyError';
      
      // Extract which property (scale, position, rotation)
      const propertyMatch = errorMessage.match(/property '(\w+)'/);
      const property = propertyMatch ? propertyMatch[1] : 'unknown';
      
      specificFixes.push(`Don't directly assign to ${property}, use ${property}.set() method instead`);
      specificFixes.push(`Or set ${property} as a prop in JSX: <mesh ${property}={[x,y,z]}>`);
      specificFixes.push(`Or modify individual components: ${property}.x = value`);
    }
    // Handle Sandpack/iframe error formats
    else if (errorDetails.includes('sandbox') || errorDetails.includes('iframe')) {
      if (errorMessage.includes('Module not found') || errorMessage.includes('Cannot find module')) {
        errorType = 'ModuleNotFoundError';
        specificFixes.push(`Remove import statements - sandbox provides globals instead`);
        specificFixes.push(`Check for proper access to available components`);
      }
    }
    
    // Identify common error types
    else if (errorMessage.includes('Cannot read properties of null') || errorMessage.includes('Cannot read properties of undefined')) {
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
    // Add new error types for advanced features
    else if (errorMessage.includes('Unexpected token')) {
      errorType = 'SyntaxError';
      specificFixes.push(`Check for missing brackets or parentheses`);
      specificFixes.push(`Ensure JSX syntax is correct`);
    } else if (errorMessage.includes('too much recursion') || errorMessage.includes('Maximum call stack size exceeded')) {
      errorType = 'RecursionError';
      specificFixes.push(`Check useFrame or useEffect for infinite loops`);
      specificFixes.push(`Ensure animations don't cause endless recursion`);
    } else if (errorMessage.includes('Out of memory')) {
      errorType = 'MemoryError';
      specificFixes.push(`Reduce the number of objects or complexity`);
      specificFixes.push(`Use instancedMesh for repeated geometries`);
    } else if (errorMessage.includes('material') && errorMessage.includes('not compatible')) {
      errorType = 'MaterialCompatibilityError';
      specificFixes.push(`Ensure material type is compatible with mesh type`);
      specificFixes.push(`Check for improper material property usage`);
    } else if (errorMessage.includes('uniform') || errorMessage.includes('attribute')) {
      errorType = 'ShaderError';
      specificFixes.push(`Check shader uniform declarations and usage`);
      specificFixes.push(`Ensure all required shader attributes are provided`);
    } else if (errorMessage.includes('texture') || errorMessage.includes('map')) {
      errorType = 'TextureError';
      specificFixes.push(`Check texture loading and application to materials`);
      specificFixes.push(`Use proper texture parameters`);
    } else if (errorMessage.includes('reading \'array\'') || (errorMessage.includes('Cannot read') && errorMessage.includes('array'))) {
      errorType = 'GeometryAttributeError';
      specificFixes.push(`Make sure the geometry is properly initialized before accessing its attributes`);
      specificFixes.push(`Add more checks like: if (!geometryRef.current?.attributes?.position?.array) return;`);
      specificFixes.push(`Use BufferGeometry.setAttribute() to create attributes when needed`);
      specificFixes.push(`Consider using instancedMesh instead of modifying positions directly`);
    } else if (errorMessage.includes('instancedMesh') || errorMessage.includes('instanceMatrix')) {
      errorType = 'InstancedMeshError';
      specificFixes.push(`Check that instancedMesh is properly initialized with args={[null, null, COUNT]}`);
      specificFixes.push(`Ensure dummy.updateMatrix() is called before setMatrixAt()`);
      specificFixes.push(`Verify that instanceMatrix.needsUpdate = true is set after updates`);
      specificFixes.push(`Add proper null checks before accessing instancedMesh properties`);
      specificFixes.push(`Use decompose() correctly when retrieving matrices`);
    } else if (errorMessage.includes('transmission') || errorMessage.includes('ior') || 
              (errorMessage.includes('meshPhysical') && errorMessage.includes('Material'))) {
      errorType = 'PhysicalMaterialError';
      specificFixes.push(`Ensure transparent={true} is set when using transmission`);
      specificFixes.push(`Check that ior value is between 1.0 and 2.333`);
      specificFixes.push(`Verify that material properties are compatible (e.g., not high metalness with high transmission)`);
      specificFixes.push(`For animated water surfaces, add proper null checks on geometry attributes`);
      specificFixes.push(`Consider using side={THREE.DoubleSide} for thin transparent surfaces`);
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
    // Check if error is in a specific component
    else if (stackMatch[1].includes('Scene.js')) {
      // Analyze common patterns in Scene.js errors
      if (stackMatch[1].includes('useFrame')) {
        specificFixes.push(`Check useFrame callback for errors in animation logic`);
        specificFixes.push(`Ensure all refs are properly initialized before use`);
      } else if (stackMatch[1].includes('useEffect')) {
        specificFixes.push(`Check useEffect dependency array`);
        specificFixes.push(`Ensure cleanup function is properly implemented`);
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
    const { code, errorDetails, messages = [] } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Valid code is required' },
        { status: 400 }
      );
    }

    // Process the error details to extract useful information
    const processedError = processErrorDetails(errorDetails);
    
    // Create the conversation history for the API if available
    const conversationHistory: Message[] = messages.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content
    }));
    
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

    // Prepare the complete message list for the API call
    const apiMessages: Message[] = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Add previous conversation messages if they exist
    if (conversationHistory.length > 0) {
      apiMessages.push(...conversationHistory);
    }
    
    // Add the current prompt
    apiMessages.push({ role: 'user', content: userPrompt });

    // Call OpenAI API with optimized parameters
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      messages: apiMessages,
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
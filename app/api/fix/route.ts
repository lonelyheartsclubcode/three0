import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for fixing Three.js errors
const systemPrompt = `
You are an expert 3D developer specializing in React Three Fiber (R3F) debugging and error fixing.
Your task is to fix broken Three.js code that causes runtime errors.

GUIDELINES:
1. Analyze the provided code and error message carefully
2. Identify common issues like missing properties, undefined values, and incorrect material configurations
3. Fix the issues with minimal changes to preserve the original intent
4. Output the complete fixed code with all necessary imports and exports
5. Focus on resolving Three.js and React Three Fiber specific errors

COMMON THREE.JS ERRORS AND FIXES:
- "Cannot read properties of undefined (reading 'value')": This occurs in the refreshUniformsCommon function when accessing material uniforms. Common fixes include:
  * Ensure material properties are fully defined before use
  * Use MeshStandardMaterial or MeshBasicMaterial instead of custom materials
  * Avoid undefined properties in material parameters
  * For custom shaders, ensure all uniforms are properly initialized
  * Check if textures are properly loaded before rendering
  * Add null checks for material properties
- Missing properties: Ensure all required properties are defined for geometries, materials, and lights.
- Invalid arguments: Check argument types and counts for constructors and methods.
- Missing references: Make sure all refs are properly initialized and checked before use.

When fixing, ALWAYS ensure material definitions are complete and valid. For complex materials, consider simplifying to MeshBasicMaterial while preserving color and texture information.

RESPOND ONLY WITH THE FIXED CODE as a complete React Three Fiber component.
`;

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

    // Create a detailed prompt for fixing the code
    const userPrompt = `
The following React Three Fiber code is causing a runtime error:

\`\`\`jsx
${code}
\`\`\`

Error details:
${errorDetails}

Please fix the code to resolve the runtime error. The most likely issue is with material properties, undefined values, or incorrect Three.js API usage.
Return the complete fixed code that resolves these issues.
`;

    // Call OpenAI API with optimized parameters
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5, // Lower temperature for more precise fixes
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
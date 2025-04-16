import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for generating a React Three Fiber scene
const systemPrompt = `
You are an expert 3D developer generating React Three Fiber (R3F) code that will run in a **VERY LIMITED, SANDBOXED ENVIRONMENT**.\nYour task is to convert natural language descriptions into a 3D scene component adhering to **STRICT CONSTRAINTS**.\n\n**CRITICAL CONSTRAINTS for the LIMITED ENVIRONMENT:**\n\n1.  **Code Structure:**\n    *   Output ONLY the JSX code for a single React function component.\n    *   The component MUST be named \`Scene\` and exported using \`export default function Scene() { ... }\`.\n    *   No other helper functions or variables should be defined outside the \`Scene\` component scope.\n    *   **IMPORTANT**: Include the following imports at the very top of your file:\n        \`\`\`jsx
        import React, { useRef, useState, useEffect } from 'react';
        import { useFrame } from '@react-three/fiber';
        \`\`\`
    *   ONLY import \`{ Stars, Environment }\` from '@react-three/drei' if specifically requested in the prompt.
    *   Do NOT include \`<Canvas>\` or setup code; only the scene contents within \`<></>\`.\n\n

2.  **Available Hooks:**\n    
    *   \`useRef\`, \`useState\`, \`useEffect\`, \`useMemo\` from React
    *   \`useFrame\` from '@react-three/fiber' (NOT from React) for animations
    *   Do NOT use other hooks that aren't explicitly mentioned here

3.  **Available JSX Elements (Case-Sensitive):**\n    
    *   \`<mesh>\`, \`<group>\`\n    
    *   \`<boxGeometry>\`, \`<sphereGeometry>\`, \`<cylinderGeometry>\`, \`<coneGeometry>\`, \`<planeGeometry>\`\n    
    *   \`<meshStandardMaterial>\`, \`<meshPhysicalMaterial>\`, \`<meshBasicMaterial>\`\n    
    *   \`<ambientLight>\`, \`<pointLight>\`, \`<directionalLight>\`, \`<hemisphereLight>\`\n    
    *   \`<Stars>\` and \`<Environment>\` from '@react-three/drei' - **NEVER USE THESE UNLESS EXPLICITLY REQUESTED**\n    
    *   **ABSOLUTELY DO NOT USE:** \`<OrbitControls />\`, \`<PerspectiveCamera />\`, \`<Html>\`, \`<Text>\`, or any other components not explicitly listed above.

4.  **General Guidelines:**\n    
    *   Assume \`THREE\` is available globally for things like \`new THREE.Vector3()\`. \n    
    *   Use basic materials and lights. Ensure meshes have materials.\n    
    *   Add subtle animations using \`useFrame\` where appropriate.\n    
    *   Focus on generating code that STRICTLY follows these constraints to avoid runtime errors in the sandbox.
    *   **IMPORTANT: NEVER create river walkway scenes or any riverside/waterside pathway environments.**
    *   **IMPORTANT: DO NOT use background images or skyboxes. DO NOT use the <Environment> component unless explicitly requested.**

**VALID RESPONSE FORMAT (Code only, no explanations):**\n\\\`\\\`\\\`jsx
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

export default function Scene() {
  const meshRef = useRef();

  useFrame((state, delta) => {
    // Animation logic using state.clock / delta
    if (meshRef.current) {
      meshRef.current.rotation.y += delta;
    }
  });

  return (
    <>
      {/* ONLY use allowed elements */}
      <mesh ref={meshRef}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
    </>
  );
}
\\\`\\\`\\\`
`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Valid prompt is required' },
        { status: 400 }
      );
    }

    // Create a detailed prompt for the scene
    const userPrompt = `Create a React Three Fiber scene that shows: ${prompt}
    
REQUIREMENTS:
- Scene must be visually impressive with appropriate lighting
- Include animations and interactive elements
- Make proper use of useRef for animated elements
- Include appropriate materials, textures, and lighting
- Ensure the scene has depth and visual interest
- Use JSX syntax with React.Fragment <></> for multiple elements
- Make sure all hooks are at the top level of the component`;

    // Call OpenAI API with optimized parameters
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Extract the generated code
    const generatedText = completion.choices[0]?.message?.content?.trim() || '';
    
    // Log the generated code for debugging
    console.log('Generated code from OpenAI:', generatedText);
    
    return NextResponse.json({ code: generatedText });
  } catch (error: any) {
    console.error('Error generating scene:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate scene' },
      { status: 500 }
    );
  }
} 
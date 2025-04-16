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

// System prompt for generating a React Three Fiber scene
const systemPrompt = `
You are an expert 3D developer generating React Three Fiber (R3F) code that will run in a **VERY LIMITED, SANDBOXED ENVIRONMENT**.\nYour task is to convert natural language descriptions into a 3D scene component adhering to **STRICT CONSTRAINTS**.\n\n**CRITICAL CONSTRAINTS for the LIMITED ENVIRONMENT:**\n\n1.  **Code Structure:**\n    *   Output ONLY the JSX code for a single React function component.\n    *   The component MUST be named \`Scene\` and exported using \`export default function Scene() { ... }\`.\n    *   No other helper functions or variables should be defined outside the \`Scene\` component scope.\n    *   **IMPORTANT**: Include the following imports at the very top of your file:\n        \`\`\`jsx
        import * as THREE from 'three';
        import React, { useRef, useState, useEffect, useMemo } from 'react';
        import { useFrame, useThree } from '@react-three/fiber';
        \`\`\`
    *   If the user explicitly requests backgrounds, skyboxes, or environments, THEN include this import: \`import { Environment, Sky, Stars } from '@react-three/drei';\`
    *   Do NOT include \`<Canvas>\` or setup code; only the scene contents within \`<></>\`.\n\n

2.  **Available Hooks:**\n    
    *   \`useRef\`, \`useState\`, \`useEffect\`, \`useMemo\` from React
    *   \`useFrame\`, \`useThree\` from '@react-three/fiber'
    *   Do NOT use other hooks that aren't explicitly mentioned here

3.  **Available JSX Elements (Case-Sensitive):**\n    
    *   \`<mesh>\`, \`<group>\`, \`<instancedMesh>\`\n    
    *   \`<boxGeometry>\`, \`<sphereGeometry>\`, \`<cylinderGeometry>\`, \`<coneGeometry>\`, \`<planeGeometry>\`, \`<torusGeometry>\`, \`<torusKnotGeometry>\`, \`<tetrahedronGeometry>\`, \`<octahedronGeometry>\`, \`<icosahedronGeometry>\`, \`<dodecahedronGeometry>\`, \`<ringGeometry>\`, \`<circleGeometry>\`\n    
    *   \`<meshStandardMaterial>\`, \`<meshPhysicalMaterial>\`, \`<meshBasicMaterial>\`, \`<meshNormalMaterial>\`, \`<meshDepthMaterial>\`, \`<meshMatcapMaterial>\`, \`<meshToonMaterial>\`, \`<meshLambertMaterial>\`, \`<meshPhongMaterial>\`\n    
    *   \`<ambientLight>\`, \`<pointLight>\`, \`<directionalLight>\`, \`<hemisphereLight>\`, \`<spotLight>\`, \`<rectAreaLight>\`\n    
    *   \`<color>\` for setting scene background color - use this if user wants a specific background color\n
    *   \`<Stars>\`, \`<Sky>\`, and \`<Environment>\` from '@react-three/drei' - **ONLY USE WHEN THE USER SPECIFICALLY ASKS FOR BACKGROUNDS, SKYBOXES, OR ENVIRONMENTS**\n    
    *   **ABSOLUTELY DO NOT USE:** \`<OrbitControls />\`, \`<PerspectiveCamera />\`, \`<Html>\`, \`<Text>\`, or any other components not explicitly listed above.

4.  **Advanced Animation Techniques:**\n
    *   Use \`useFrame\` for complex animations with \`delta\` time for frame-rate independent animation
    *   Create keyframe animations by interpolating values over time with Math.sin, Math.cos
    *   Group animations by creating parent-child relationships with <group>
    *   Apply different animation speeds and phases to create complex motion
    *   Use \`THREE.MathUtils.lerp\` or \`THREE.MathUtils.smoothstep\` for smooth interpolation

5.  **Background/Environment Guidelines:**\n
    *   When the user wants to change the background color, use: \`<color attach="background" args={['#hexcode']} />\`
    *   For skyboxes or environmental lighting, use: \`<Environment preset="[preset]" />\` where preset can be one of: ["sunset", "dawn", "night", "warehouse", "forest", "apartment", "studio", "city", "park", "lobby"]
    *   For a sky with sun, use: \`<Sky sunPosition={[x, y, z]} />\`
    *   For a starfield background, use: \`<Stars radius={100} depth={50} count={5000} factor={4} />\`
    *   Do NOT include backgrounds unless the user explicitly requests them

6.  **THREE.js Object Manipulation:**\n
    *   **CRITICAL: Always use THREE with imported namespace (import * as THREE from 'three')**
    *   Use THREE for all Three.js objects: \`new THREE.Vector3()\`, \`THREE.MathUtils.degToRad()\`, etc.
    *   CORRECT ways to modify scale:
        * In JSX: \`<mesh scale={[x, y, z]}>\` or \`<mesh scale-x={1.5}>\`
        * In useFrame: \`meshRef.current.scale.set(x, y, z)\` or modify individual components like \`meshRef.current.scale.x = value\`
    *   CORRECT ways to modify position:
        * In JSX: \`<mesh position={[x, y, z]}>\`
        * In useFrame: \`meshRef.current.position.set(x, y, z)\` or \`meshRef.current.position.x = value\`
    *   CORRECT ways to modify rotation:
        * In JSX: \`<mesh rotation={[x, y, z]}>\`
        * In useFrame: \`meshRef.current.rotation.set(x, y, z)\` or \`meshRef.current.rotation.x = value\`
    *   **INCORRECT** (will cause errors):
        * \`meshRef.current.scale = [x, y, z]\` or \`meshRef.current.scale = new THREE.Vector3(x,y,z)\`
        * \`meshRef.current.position = [x, y, z]\` or \`meshRef.current.position = new THREE.Vector3(x,y,z)\`
        * \`meshRef.current.rotation = [x, y, z]\` or \`meshRef.current.rotation = new THREE.Euler(x,y,z)\`

7.  **Advanced Material Techniques:**\n
    *   Use \`flatShading\` for stylized low-poly looks
    *   Apply \`roughness\` and \`metalness\` for PBR materials
    *   Create glass-like materials with \`meshPhysicalMaterial\` and \`transmission\`, \`ior\`, and \`thickness\` properties
    *   Use \`color\`, \`emissive\`, and \`emissiveIntensity\` for glowing effects
    *   Apply \`side={THREE.DoubleSide}\` when both sides of a material should be visible

8.  **General Guidelines:**\n    
    *   **IMPORTANT: Always use THREE as imported namespace (THREE.Vector3, etc), never assume it's globally available**
    *   Use basic materials and lights. Ensure meshes have materials.\n    
    *   Add subtle animations using \`useFrame\` where appropriate.\n    
    *   Focus on generating code that STRICTLY follows these constraints to avoid runtime errors in the sandbox.
    *   **IMPORTANT: NEVER create river walkway scenes or any riverside/waterside pathway environments.**
    *   **IMPORTANT: ONLY use Environment or background colors when the user explicitly requests them in their prompt.**

**VALID RESPONSE FORMAT (Code only, no explanations):**\n\\\`\\\`\\\`jsx
import * as THREE from 'three';
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

export default function Scene() {
  const meshRef = useRef();

  useFrame((state, delta) => {
    // Animation logic using state.clock / delta
    if (meshRef.current) {
      // CORRECT: Modifying individual scale components
      meshRef.current.rotation.y += delta;
      // Or using .set() method: meshRef.current.scale.set(1, 1 + Math.sin(state.clock.getElapsedTime()) * 0.2, 1);
    }
  });

  return (
    <>
      {/* CORRECT: Setting scale as a prop */}
      <mesh ref={meshRef} scale={[1, 1, 1]}>
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
    const { prompt, messages = [], currentCode = '' } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Valid prompt is required' },
        { status: 400 }
      );
    }

    // Create the conversation history for the API
    const conversationHistory: Message[] = messages.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content
    }));

    // Create a detailed prompt for the scene
    const userPrompt = `Create a React Three Fiber scene that shows: ${prompt}
    
REQUIREMENTS:
- Scene must be visually impressive with appropriate lighting
- Include animations and interactive elements
- Make proper use of useRef for animated elements
- Include appropriate materials, textures, and lighting
- Ensure the scene has depth and visual interest
- Use JSX syntax with React.Fragment <></> for multiple elements
- Make sure all hooks are at the top level of the component
- If the prompt mentions background, skybox, or environment colors/styles, implement them as requested

ADVANCED FEATURES (include if appropriate for the prompt):
- Use complex geometries like torus knots, icosahedrons, or custom shapes (do not overindex on these, be creative with your shapes)
- Apply advanced materials with proper roughness and metalness values
- Create smooth animations using delta time for frame-rate independence
- Group related objects using <group> for coordinated animations
- Use Math.sin/cos with different frequencies for realistic motion
- Create visual interest with proper lighting (ambient, point, directional)
- Apply maath utilities for advanced math operations if needed`;

    // Add context about the current code if available
    const contextualPrompt = currentCode ? 
      `${userPrompt}\n\nCURRENT CODE (modify as needed based on my request):\n\`\`\`jsx\n${currentCode}\n\`\`\`` : 
      userPrompt;
    
    // Create a transform stream for streaming data
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Stream the response back to the client
    setTimeout(async () => {
      try {
        // Prepare the complete message list for the API call
        const apiMessages: Message[] = [
          { role: 'system', content: systemPrompt }
        ];
        
        // Add previous conversation messages if they exist
        if (conversationHistory.length > 0) {
          apiMessages.push(...conversationHistory);
        }
        
        // Add the current prompt
        apiMessages.push({ role: 'user', content: contextualPrompt });

        // Call OpenAI API with streaming option
        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
          messages: apiMessages,
          temperature: 1.13,
          max_tokens: 6000,
          stream: false, // We're managing the streaming manually
        });

        // Extract the generated code
        const generatedText = completion.choices[0]?.message?.content?.trim() || '';
        
        // Log the generated code for debugging
        console.log('Generated code from OpenAI:', generatedText);

        // Simulate streaming by sending chunks of the code
        // This simulates progressive code delivery while we work on implementing actual streaming
        const codeChunks = generateCodeChunks(generatedText);
        
        for (const chunk of codeChunks) {
          // Format the chunk as a JSON response
          const jsonResponse = JSON.stringify({ code: chunk });
          await writer.write(encoder.encode(jsonResponse));
          
          // Add a small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Close the stream
        await writer.close();
      } catch (error: any) {
        // Handle errors during streaming
        const errorMsg = JSON.stringify({ error: error.message || 'Error generating scene' });
        await writer.write(encoder.encode(errorMsg));
        await writer.close();
      }
    }, 0);

    // Return the stream
    return new Response(stream.readable);
  } catch (error: any) {
    console.error('Error generating scene:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate scene' },
      { status: 500 }
    );
  }
}

// Function to split code into chunks for simulated streaming
function generateCodeChunks(code: string): string[] {
  // If the code is less than 500 characters, return it as a single chunk
  if (code.length < 500) {
    return [code];
  }
  
  const chunks: string[] = [];
  
  // First chunk contains the imports and function declaration
  let currentPosition = 0;
  
  // Find the function declaration line
  const functionDeclStart = code.indexOf('export default function Scene()');
  if (functionDeclStart !== -1) {
    // Find the opening curly brace
    const openingBraceIndex = code.indexOf('{', functionDeclStart);
    if (openingBraceIndex !== -1) {
      // First chunk is up to and including opening brace
      const firstChunk = code.substring(0, openingBraceIndex + 1);
      chunks.push(firstChunk);
      currentPosition = openingBraceIndex + 1;
    }
  }
  
  // If we couldn't locate the function structure, fall back to line-by-line streaming
  if (chunks.length === 0) {
    const lines = code.split('\n');
    let accumulator = '';
    
    for (const line of lines) {
      accumulator += line + '\n';
      
      // When accumulator reaches around 200 chars, add it as a chunk
      if (accumulator.length > 200) {
        chunks.push(accumulator);
        accumulator = '';
      }
    }
    
    // Add any remaining lines
    if (accumulator) {
      chunks.push(accumulator);
    }
    
    return chunks;
  }
  
  // Split the rest of the code into semantic chunks
  const chunkSize = 200; // Approx. chunk size
  
  while (currentPosition < code.length) {
    // Find a good break point around chunkSize chars ahead
    let endPosition = Math.min(currentPosition + chunkSize, code.length);
    
    // Try to break at a sensible place like a line break or function/method end
    if (endPosition < code.length) {
      // Look for a good break point near endPosition
      const nextLineBreak = code.indexOf('\n', endPosition);
      const nextClosingBrace = code.indexOf('}', endPosition);
      const nextSemicolon = code.indexOf(';', endPosition);
      
      if (nextLineBreak !== -1 && (nextLineBreak - endPosition < 50)) {
        endPosition = nextLineBreak + 1;
      } else if (nextClosingBrace !== -1 && (nextClosingBrace - endPosition < 50)) {
        endPosition = nextClosingBrace + 1;
      } else if (nextSemicolon !== -1 && (nextSemicolon - endPosition < 50)) {
        endPosition = nextSemicolon + 1;
      }
    }
    
    // Add the accumulated code plus the new chunk
    const currentCode = code.substring(0, endPosition);
    chunks.push(currentCode);
    
    currentPosition = endPosition;
  }
  
  return chunks;
} 
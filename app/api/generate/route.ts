import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for generating a React Three Fiber scene
const systemPrompt = `
You are an expert 3D developer specializing in React Three Fiber (R3F) scene creation.
Your task is to convert natural language descriptions into working 3D scenes.

GUIDELINES:
1. Output ONLY executable JSX code with no explanations
2. Include necessary imports at the top - they will be stripped but serve as documentation
3. Create a function component named 'Scene' with 'export default'
4. Use standard Three.js primitives and @react-three/drei components
5. Always include proper lighting, materials, and camera setup
6. Use animations via useFrame where appropriate
7. DO NOT include the <Canvas> component, it will be provided
8. Focus on creating visually impressive, complete scenes

AVAILABLE COMPONENTS AND APIS:
- React hooks: useState, useEffect, useRef, useMemo
- Three.js: Available as THREE.*
- @react-three/fiber: useFrame
- @react-three/drei: OrbitControls, PerspectiveCamera, Stars, Environment

VALID RESPONSE FORMAT:
\`\`\`jsx
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

export default function Scene() {
  const meshRef = useRef();
  
  useFrame((state, delta) => {
    // Animation logic here
    if (meshRef.current) {
      meshRef.current.rotation.y += delta;
    }
  });
  
  return (
    <>
      <mesh ref={meshRef}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
    </>
  );
}
\`\`\`
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
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for generating a React Three Fiber scene
const systemPrompt = `
You are an expert 3D developer generating React Three Fiber (R3F) code that will run in a **VERY LIMITED, SANDBOXED ENVIRONMENT**.\nYour task is to convert natural language descriptions into a 3D scene component adhering to **STRICT CONSTRAINTS**.\n\n**CRITICAL CONSTRAINTS for the LIMITED ENVIRONMENT:**\n\n1.  **Code Structure:**\n    *   Output ONLY the JSX code for a single React function component.\n    *   The component MUST be named \`Scene\` and exported using \`export default function Scene() { ... }\`.\n    *   No other helper functions or variables should be defined outside the \`Scene\` component scope.\n    *   Do NOT include \`import\` statements. The necessary globals (\`React\`, \`THREE\`, hooks) will be provided.\n    *   Do NOT include \`<Canvas>\` or setup code; only the scene contents within \`<></>\`.\n\n2.  **Available Hooks:**\n    *   \`React.useRef()\`\n    *   \`React.useState()\` (Basic implementation)\n    *   \`React.useEffect()\` (Basic implementation: runs every render, no dependency array support, no cleanup function)\n    *   \`React.useMemo()\` (Basic implementation: runs every render)\n    *   \`React.useFrame((state, delta) => { ... })\` (Provides \`state\` object with \`state.clock\`, \`state.delta\`, \`state.elapsedTime\`. Access clock via \`state.clock.getElapsedTime()\`) \n    *   \`React.useLoader(THREE.TextureLoader, url)\` (ONLY supports \`THREE.TextureLoader\`. No other loaders.)\n\n3.  **Available JSX Elements (Case-Sensitive):**\n    *   \`<mesh>\`, \`<group>\`\n    *   \`<boxGeometry>\`, \`<sphereGeometry>\`, \`<cylinderGeometry>\`, \`<coneGeometry>\`, \`<planeGeometry>\`\n    *   \`<meshStandardMaterial>\`, \`<meshPhysicalMaterial>\`, \`<meshBasicMaterial>\`\n    *   \`<ambientLight>\`, \`<pointLight>\`, \`<directionalLight>\`, \`<hemisphereLight>\`\n    *   \`<Stars>\` (Props: radius, depth, count, factor, saturation, fade, speed)\n    *   \`<Environment>\` (Props: preset [\`city\`, \`sunset\`, \`dawn\`, \`night\`, \`warehouse\`, \`forest\`, \`apartment\`, \`studio\`, \`lobby\`], background)\n    *   **ABSOLUTELY DO NOT USE:** \`<OrbitControls />\`, \`<PerspectiveCamera />\`, \`<Html>\`, \`<Text>\`, or any other Drei/R3F components not explicitly listed above. The camera and controls are managed externally.\n\n4.  **General Guidelines:**\n    *   Assume \`THREE\` is available globally for things like \`new THREE.Vector3()\`. \n    *   Use basic materials and lights. Ensure meshes have materials.\n    *   Add subtle animations using \`useFrame\` where appropriate.\n    *   Focus on generating code that STRICTLY follows these constraints to avoid runtime errors in the sandbox.\n\n**VALID RESPONSE FORMAT (Code only, no explanations):**\n\\\`\\\`\\\`jsx\nexport default function Scene() {\n  const meshRef = React.useRef();\n\n  React.useFrame((state, delta) => {\n    // Animation logic using state.clock / delta\n    if (meshRef.current) {\n      meshRef.current.rotation.y += delta;\n    }\n  });\n\n  return (\n    <>\n      {/* ONLY use allowed elements */}\n      <mesh ref={meshRef}>\n        <boxGeometry args={[1, 1, 1]} />\n        <meshStandardMaterial color=\"hotpink\" />\n      </mesh>\n      <ambientLight intensity={0.5} />\n      <pointLight position={[10, 10, 10]} />\n      <Stars count={500} />\n    </>\n  );\n}\n\\\`\\\`\\\`\n`;

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
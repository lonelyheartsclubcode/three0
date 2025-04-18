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
        import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
        import { useFrame, useThree } from '@react-three/fiber';
        \`\`\`
    *   If the user explicitly requests backgrounds, skyboxes, or environments, THEN include this import: \`import { Environment, Sky, Stars } from '@react-three/drei';\`
    *   If the user needs advanced geometry features, include: \`import { ParametricGeometry, LatheGeometry, TubeGeometry, ShapeGeometry, ExtrudeGeometry } from '@react-three/drei';\`
    *   Do NOT include \`<Canvas>\` or setup code; only the scene contents within \`<></>\`.\n\n

2.  **Available Hooks:**\n    
    *   \`useRef\`, \`useState\`, \`useEffect\`, \`useMemo\`, \`useCallback\` from React
    *   \`useFrame\`, \`useThree\` from '@react-three/fiber'
    *   Do NOT use other hooks that aren't explicitly mentioned here

3.  **Available JSX Elements (Case-Sensitive):**\n    
    *   \`<mesh>\`, \`<group>\`, \`<instancedMesh>\`, \`<skinnedMesh>\`\n    
    *   Basic Geometries: \`<boxGeometry>\`, \`<sphereGeometry>\`, \`<cylinderGeometry>\`, \`<coneGeometry>\`, \`<planeGeometry>\`, \`<torusGeometry>\`, \`<torusKnotGeometry>\`, \`<tetrahedronGeometry>\`, \`<octahedronGeometry>\`, \`<icosahedronGeometry>\`, \`<dodecahedronGeometry>\`, \`<ringGeometry>\`, \`<circleGeometry>\`\n    
    *   Advanced Geometries (from drei): \`<parametricGeometry>\`, \`<latheGeometry>\`, \`<tubeGeometry>\`, \`<shapeGeometry>\`, \`<extrudeGeometry>\`, \`<capsuleGeometry>\`, \`<edgesGeometry>\`, \`<wireframeGeometry>\`\n    
    *   \`<meshStandardMaterial>\`, \`<meshPhysicalMaterial>\`, \`<meshBasicMaterial>\`, \`<meshNormalMaterial>\`, \`<meshDepthMaterial>\`, \`<meshMatcapMaterial>\`, \`<meshToonMaterial>\`, \`<meshLambertMaterial>\`, \`<meshPhongMaterial>\`\n    
    *   \`<ambientLight>\`, \`<pointLight>\`, \`<directionalLight>\`, \`<hemisphereLight>\`, \`<spotLight>\`, \`<rectAreaLight>\`\n    
    *   \`<color>\` for setting scene background color - use this if user wants a specific background color\n
    *   \`<Stars>\`, \`<Sky>\`, and \`<Environment>\` from '@react-three/drei' - **ONLY USE WHEN THE USER SPECIFICALLY ASKS FOR BACKGROUNDS, SKYBOXES, OR ENVIRONMENTS**\n    
    *   **ABSOLUTELY DO NOT USE:** \`<OrbitControls />\`, \`<PerspectiveCamera />\`, \`<Html>\`, \`<Text>\`, or any other components not explicitly listed above.

4.  **Advanced Geometry Techniques:**\n
    *   **CRITICAL: We need to extend Three.js classes for use in R3F if they're not built-in.**
    *   **INCORRECT:** Do NOT use \`new THREE.ParametricGeometry()\` directly or try to use it as a JSX component without extending.
    *   **CORRECT:** For specific advanced geometries, build them in useMemo and use standard mesh:
        \`\`\`jsx
        // CORRECT: Creating advanced geometries with Three.js directly
        export default function Scene() {
          const geometry = useMemo(() => {
            // Create the parametric surface function
            const parametricFunc = (u, v, target) => {
              const x = Math.sin(u) * Math.cos(v);
              const y = Math.sin(u) * Math.sin(v);
              const z = Math.cos(u);
              target.set(x, y, z);
            };
            
            // Create a buffer geometry with customized attributes
            const geo = new THREE.BufferGeometry();
            const resolution = 30;
            const positions = [];
            const normals = [];
            const uvs = [];
            
            // Generate the points
            for (let i = 0; i <= resolution; i++) {
              const u = (i / resolution) * Math.PI * 2;
              for (let j = 0; j <= resolution; j++) {
                const v = (j / resolution) * Math.PI;
                
                const vertex = new THREE.Vector3();
                parametricFunc(u, v, vertex);
                positions.push(vertex.x, vertex.y, vertex.z);
                
                // Calculate normal
                const normal = vertex.clone().normalize();
                normals.push(normal.x, normal.y, normal.z);
                
                // Add UV coordinates
                uvs.push(i / resolution, j / resolution);
              }
            }
            
            // Create indices for faces
            const indices = [];
            for (let i = 0; i < resolution; i++) {
              for (let j = 0; j < resolution; j++) {
                const a = i * (resolution + 1) + j;
                const b = i * (resolution + 1) + j + 1;
                const c = (i + 1) * (resolution + 1) + j + 1;
                const d = (i + 1) * (resolution + 1) + j;
                
                indices.push(a, b, d);
                indices.push(b, c, d);
              }
            }
            
            // Set the attributes
            geo.setIndex(indices);
            geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
            geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
            
            return geo;
          }, []);
          
          // Use the geometry in a mesh
          return (
            <>
              <mesh geometry={geometry}>
                <meshStandardMaterial color="hotpink" />
              </mesh>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
            </>
          );
        }
        \`\`\`
    *   For tube and lathe geometries, use built-in Three.js constructors with useMemo:
        \`\`\`jsx
        // Lathe geometry example
        export default function Scene() {
          const geometry = useMemo(() => {
            const points = [];
            for (let i = 0; i < 10; i++) {
              points.push(new THREE.Vector2(Math.sin(i * 0.2) * 3 + 3, (i - 5) * 2));
            }
            return new THREE.LatheGeometry(points, 20);
          }, []);
          
          return (
            <>
              <mesh geometry={geometry}>
                <meshStandardMaterial color="lightblue" />
              </mesh>
              <ambientLight intensity={0.5} />
            </>
          );
        }
        \`\`\`
    *   Create extruded shapes with \`<extrudeGeometry>\`:
        \`\`\`jsx
        // CORRECT: Extrude geometry in React Three Fiber
        export default function Scene() {
          const geometry = useMemo(() => {
            const shape = new THREE.Shape();
            shape.moveTo(0, 0);
            shape.lineTo(0, 1);
            shape.lineTo(1, 1);
            shape.lineTo(1, 0);
            shape.closePath();
            
            const extrudeSettings = {
              steps: 2,
              depth: 0.5,
              bevelEnabled: true,
              bevelThickness: 0.2,
              bevelSize: 0.2,
              bevelSegments: 3
            };
            
            return new THREE.ExtrudeGeometry(shape, extrudeSettings);
          }, []);
          
          return (
            <>
              <mesh geometry={geometry}>
                <meshStandardMaterial color="orange" />
              </mesh>
              <ambientLight intensity={0.5} />
            </>
          );
        }
        \`\`\`
    *   Generate tube shapes with \`<tubeGeometry>\`:
        \`\`\`jsx
        // CORRECT: Tube geometry in React Three Fiber
        export default function Scene() {
          const geometry = useMemo(() => {
            const curve = new THREE.CatmullRomCurve3([
              new THREE.Vector3(-3, 0, 0),
              new THREE.Vector3(-1, 1, 0),
              new THREE.Vector3(1, -1, 0),
              new THREE.Vector3(3, 0, 0)
            ]);
            
            return new THREE.TubeGeometry(curve, 64, 0.2, 8, false);
          }, []);
          
          return (
            <>
              <mesh geometry={geometry}>
                <meshStandardMaterial color="cyan" />
              </mesh>
              <ambientLight intensity={0.5} />
            </>
          );
        }
        \`\`\`
    *   Create custom 2D shapes with \`<shapeGeometry>\`:
        \`\`\`jsx
        // CORRECT: Shape geometry in React Three Fiber
        export default function Scene() {
          const geometry = useMemo(() => {
            const shape = new THREE.Shape();
            shape.moveTo(0, 0);
            shape.lineTo(0, 1);
            shape.lineTo(1, 1);
            shape.lineTo(1, 0);
            shape.closePath();
            
            // Add a hole
            const hole = new THREE.Path();
            hole.moveTo(0.25, 0.25);
            hole.lineTo(0.25, 0.75);
            hole.lineTo(0.75, 0.75);
            hole.lineTo(0.75, 0.25);
            hole.closePath();
            shape.holes.push(hole);
            
            return new THREE.ShapeGeometry(shape);
          }, []);
          
          return (
            <>
              <mesh geometry={geometry}>
                <meshStandardMaterial color="gold" side={THREE.DoubleSide} />
              </mesh>
              <ambientLight intensity={0.5} />
            </>
          );
        }
        \`\`\`
    *   When accessing geometry attributes directly, always use optional chaining and validation:
        \`\`\`jsx
        // CORRECT: Safe access of geometry attributes
        export default function Scene() {
          const meshRef = useRef();
          
          // Create a simple geometry
          const geometry = useMemo(() => {
            const geo = new THREE.SphereGeometry(1, 32, 32);
            return geo;
          }, []);
          
          useFrame(() => {
            // Always check if refs and geometry exist before accessing
            if (!meshRef.current?.geometry?.attributes?.position?.array) return;
            
            const positions = meshRef.current.geometry.attributes.position.array;
            // Example: Make the sphere pulsate
            const time = Date.now() * 0.001;
            for (let i = 0; i < positions.length; i += 3) {
              const x = positions[i];
              const y = positions[i + 1];
              const z = positions[i + 2];
              
              // Get the current vertex normal direction
              const length = Math.sqrt(x * x + y * y + z * z);
              const nx = x / length;
              const ny = y / length;
              const nz = z / length;
              
              // Apply pulsating effect along normal
              const scale = 1 + 0.1 * Math.sin(time * 3);
              positions[i] = nx * scale;
              positions[i + 1] = ny * scale;
              positions[i + 2] = nz * scale;
            }
            
            meshRef.current.geometry.attributes.position.needsUpdate = true;
          });
          
          return (
            <>
              <mesh ref={meshRef} geometry={geometry}>
                <meshStandardMaterial color="purple" />
              </mesh>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
            </>
          );
        }
        \`\`\`

5.  **Creating Characters and Complex Objects:**\n
    *   Instead of loading external models, build characters and complex objects by composing primitive shapes:
        \`\`\`jsx
        // CORRECT: Creating a stylized character from primitives
        export default function Scene() {
          // Group ref for the whole character
          const characterRef = useRef();
          
          // Animation with useFrame
          useFrame((state, delta) => {
            if (characterRef.current) {
              // Gentle bobbing motion
              characterRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 2) * 0.05;
              // Slow rotation
              characterRef.current.rotation.y += delta * 0.3;
            }
          });
          
          return (
            <>
              {/* Character made from primitive shapes */}
              <group ref={characterRef} position={[0, 0, 0]}>
                {/* Body */}
                <mesh position={[0, 0.8, 0]}>
                  <capsuleGeometry args={[0.3, 0.8, 4, 8]} />
                  <meshStandardMaterial color="#f48c06" />
                </mesh>
                
                {/* Head */}
                <mesh position={[0, 1.5, 0]}>
                  <sphereGeometry args={[0.25, 16, 16]} />
                  <meshStandardMaterial color="#ffba08" />
                </mesh>
                
                {/* Eyes */}
                <mesh position={[0.1, 1.55, 0.2]}>
                  <sphereGeometry args={[0.05, 8, 8]} />
                  <meshBasicMaterial color="black" />
                </mesh>
                <mesh position={[-0.1, 1.55, 0.2]}>
                  <sphereGeometry args={[0.05, 8, 8]} />
                  <meshBasicMaterial color="black" />
                </mesh>
                
                {/* Arms */}
                <mesh position={[0.4, 0.8, 0]} rotation={[0, 0, -0.5]}>
                  <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
                  <meshStandardMaterial color="#f48c06" />
                </mesh>
                <mesh position={[-0.4, 0.8, 0]} rotation={[0, 0, 0.5]}>
                  <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
                  <meshStandardMaterial color="#f48c06" />
                </mesh>
                
                {/* Legs */}
                <mesh position={[0.15, 0.3, 0]} rotation={[0.2, 0, 0]}>
                  <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
                  <meshStandardMaterial color="#e85d04" />
                </mesh>
                <mesh position={[-0.15, 0.3, 0]} rotation={[-0.2, 0, 0]}>
                  <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
                  <meshStandardMaterial color="#e85d04" />
                </mesh>
              </group>
              
              {/* Environment */}
              <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[10, 10]} />
                <meshStandardMaterial color="#6a994e" />
              </mesh>
              
              <ambientLight intensity={0.5} />
              <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
            </>
          );
        }
        \`\`\`
    *   For animals, vehicles, and other complex objects, use composition of simple geometries with appropriate positioning
    *   Use groups to organize related parts and animate them together
    *   Add detail with material properties rather than complex geometry
    *   For smoothed connections between shapes, use spheres or capsules at joints

6.  **Working with Skinned Meshes and Animations:**\n
    *   Create a basic skinned mesh with bones programmatically:
        \`\`\`jsx
        // CORRECT: Creating a programmatic skinned mesh with bone animation
        import { useRef, useState, useEffect } from 'react';
        import { useFrame } from '@react-three/fiber';
        import * as THREE from 'three';

        export default function SkeletalAnimation() {
          const [bones, setBones] = useState<THREE.Bone[]>([]);
          const skinnedMeshRef = useRef<THREE.SkinnedMesh | null>(null);
          const skeletonHelperRef = useRef<THREE.SkeletonHelper | null>(null);
          
          // Setup bones and skinned mesh on component mount
          useEffect(() => {
            // Create a simple bone structure
            const rootBone = new THREE.Bone();
            const childBone1 = new THREE.Bone();
            const childBone2 = new THREE.Bone();
            
            // Position bones to form a chain
            rootBone.position.y = 0;
            childBone1.position.y = 1; // 1 unit above root
            childBone2.position.y = 1; // 1 unit above child1
            
            // Create the hierarchy
            rootBone.add(childBone1);
            childBone1.add(childBone2);
            
            // Create a skeleton from these bones
            const allBones = [rootBone, childBone1, childBone2];
            const skeleton = new THREE.Skeleton(allBones);
            
            setBones(allBones);
            
            // Update the skeleton once
            skeleton.update();
            
            // If we have a reference to the mesh, set its skeleton
            if (skinnedMeshRef.current) {
              // Create the skinning - this defines how vertices are influenced by bones
              // For a real example, you'd calculate these weights carefully
              const position = skinnedMeshRef.current.geometry.attributes.position;
              const skinIndices: number[] = [];
              const skinWeights: number[] = [];
              
              // For each vertex, assign bone influences
              for (let i = 0; i < position.count; i++) {
                const y = position.getY(i);
                
                // Simple weighting based on y position
                if (y < 0.5) {
                  // Lower part - influenced by root bone
                  skinIndices.push(0, 0, 0, 0);
                  skinWeights.push(1, 0, 0, 0);
                } else if (y < 1.5) {
                  // Middle part - influenced by first child bone
                  skinIndices.push(1, 0, 0, 0);
                  skinWeights.push(1, 0, 0, 0);
                } else {
                  // Upper part - influenced by second child bone
                  skinIndices.push(2, 0, 0, 0);
                  skinWeights.push(1, 0, 0, 0);
                }
              }
              
              // Apply the weights to the geometry
              skinnedMeshRef.current.geometry.setAttribute(
                'skinIndex',
                new THREE.Uint16BufferAttribute(skinIndices, 4)
              );
              skinnedMeshRef.current.geometry.setAttribute(
                'skinWeight',
                new THREE.Float32BufferAttribute(skinWeights, 4)
              );
              
              // Assign the skeleton to the mesh
              skinnedMeshRef.current.bindMode = 'attached';
              skinnedMeshRef.current.bindMatrix = new THREE.Matrix4();
              skinnedMeshRef.current.skeleton = skeleton;
            }
          }, []);
          
          // Animate the bones
          useFrame((state) => {
            if (bones.length > 0) {
              // Animate the first child bone
              bones[1].rotation.x = Math.sin(state.clock.getElapsedTime() * 2) * 0.4;
              // Animate the second child bone - inverse motion for natural look
              bones[2].rotation.x = Math.cos(state.clock.getElapsedTime() * 2) * 0.4;
              
              // Update the skeleton helper if it exists
              if (skeletonHelperRef.current) {
                skeletonHelperRef.current.update();
              }
              
              // Update the skinned mesh if it exists
              if (skinnedMeshRef.current && skinnedMeshRef.current.skeleton) {
                skinnedMeshRef.current.skeleton.update();
              }
            }
          });
          
          return (
            <>
              <skinnedMesh ref={skinnedMeshRef}>
                <cylinderGeometry args={[0.2, 0.2, 3, 8]} />
                <meshStandardMaterial color="royalblue" wireframe />
              </skinnedMesh>
              
              {bones.length > 0 && (
                <primitive object={new THREE.SkeletonHelper(bones[0])} ref={skeletonHelperRef} />
              )}
              
              <ambientLight intensity={0.5} />
              <directionalLight position={[1, 1, 1]} />
              <gridHelper />
            </>
          );
        }
        \`\`\`
    *   For skinned meshes, make sure to:
        *   Create bones and position them appropriately
        *   Set up a skeleton with those bones
        *   Assign skinning weights to connect vertices to bones 
        *   Bind the skeleton to your mesh using \`.bind(skeleton)\`
        *   Call \`skeleton.update()\` in useFrame to update bone animations
        *   Use SkeletonHelper to visualize bones during development

7.  **Advanced Animation Techniques:**\n
    *   Use \`useFrame\` for complex animations with \`delta\` time for frame-rate independent animation
    *   Create keyframe animations by interpolating values over time with Math.sin, Math.cos
    *   Group animations by creating parent-child relationships with <group>
    *   Apply different animation speeds and phases to create complex motion
    *   Use \`THREE.MathUtils.lerp\` or \`THREE.MathUtils.smoothstep\` for smooth interpolation

8.  **Background/Environment Guidelines:**\n
    *   When the user wants to change the background color, use: \`<color attach="background" args={['#hexcode']} />\`
    *   For skyboxes or environmental lighting, use: \`<Environment preset="[preset]" />\` where preset can be one of: ["sunset", "dawn", "night", "warehouse", "forest", "apartment", "studio", "city", "park", "lobby"]
    *   For a sky with sun, use: \`<Sky sunPosition={[x, y, z]} />\`
    *   For a starfield background, use: \`<Stars radius={100} depth={50} count={5000} factor={4} />\`
    *   Do NOT include backgrounds unless the user explicitly requests them

9.  **THREE.js Object Manipulation:**\n
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

10.  **Advanced Material Techniques:**\n
    *   Use \`flatShading\` for stylized low-poly looks
    *   Apply \`roughness\` and \`metalness\` for PBR materials
    *   Create glass-like materials with \`meshPhysicalMaterial\` and \`transmission\`, \`ior\`, and \`thickness\` properties
    *   Use \`color\`, \`emissive\`, and \`emissiveIntensity\` for glowing effects
    *   Apply \`side={THREE.DoubleSide}\` when both sides of a material should be visible

11.  **General Guidelines:**\n    
    *   **IMPORTANT: Always use THREE as imported namespace (THREE.Vector3, etc), never assume it's globally available**
    *   Use basic materials and lights. Ensure meshes have materials.\n    
    *   Add subtle animations using \`useFrame\` where appropriate.\n    
    *   Focus on generating code that STRICTLY follows these constraints to avoid runtime errors in the sandbox.
    *   **IMPORTANT: NEVER create river walkway scenes or any riverside/waterside pathway environments.**
    *   **IMPORTANT: ONLY use Environment or background colors when the user explicitly requests them in their prompt.**

**VALID RESPONSE FORMAT (Code only, no explanations):**\n\\\`\\\`\\\`jsx
import * as THREE from 'three';
import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
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
- Use complex geometries like parametricGeometry, latheGeometry, tubeGeometry, etc. for organic or mathematical shapes
- Create custom shapes using shapeGeometry with THREE.Shape for specific 2D outlines
- Use extrudeGeometry for 2D shapes with depth
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
          temperature: 1,
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

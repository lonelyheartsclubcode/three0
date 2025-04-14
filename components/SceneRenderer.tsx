import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as THREE from 'three';
import * as React from 'react';
// @ts-ignore
import * as Babel from '@babel/standalone';
import { OrbitControls, PerspectiveCamera, Stars, Environment } from '@react-three/drei';

// Import a few common drei components directly
let dreiComponents = {};
try {
  // Try to dynamically import some common drei components if available
  import('@react-three/drei').then(drei => {
    dreiComponents = drei;
  }).catch(err => {
    console.warn("Couldn't load drei components:", err);
  });
} catch (e) {
  console.warn("Couldn't dynamically import drei components");
}

interface SceneRendererProps {
  sceneCode: string;
  onFixRequest?: (code: string, errorDetails: string) => Promise<void>;
}

// Default scene component shown when no code is generated yet
const DefaultScene = () => {
  return (
    <>
      <mesh rotation={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <gridHelper args={[10, 10]} />
    </>
  );
};

// Error scene for when code execution fails
const ErrorScene = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });
  
  return (
    <>
      <mesh ref={meshRef}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="red" wireframe />
      </mesh>
      <ambientLight intensity={0.5} />
      <gridHelper args={[10, 10]} />
    </>
  );
};

// Create a registry of available components and functions for the transformed code
const availableComponents = {
  // React basics
  React,
  useState: React.useState,
  useEffect: React.useEffect,
  useRef: React.useRef,
  useMemo: React.useMemo,
  
  // Three.js core
  THREE,
  
  // React Three Fiber
  useFrame,
  
  // drei components
  OrbitControls,
  PerspectiveCamera,
  Stars,
  Environment
};

// Pre-process the code to remove exports and imports
function preProcessCode(code: string): string {
  // Remove all imports
  let processedCode = code.replace(/import\s+.*?from\s+['"].*?['"];?/g, '');
  
  // Handle export default function declarations
  processedCode = processedCode.replace(
    /export\s+default\s+function\s+(\w+)/g, 
    'function $1'
  );
  
  // Handle other export default statements
  processedCode = processedCode.replace(
    /export\s+default\s+/g, 
    'const Scene = '
  );
  
  return processedCode;
}

// Transpile and execute JSX code to create a component
function createComponentFromCode(code: string): React.ComponentType {
  try {
    if (!code) {
      throw new Error('No code provided');
    }
    
    // Pre-process the code to handle exports and imports
    const processedCode = preProcessCode(code);
    console.log("Processed code:", processedCode);
    
    // Transpile JSX to plain JavaScript using Babel
    const transformedCode = Babel.transform(processedCode, {
      presets: ['react'],
      filename: 'generated-scene.jsx'
    }).code;
    
    if (!transformedCode) {
      throw new Error('Failed to transform code');
    }
    
    // Code for executing the transformed code in a controlled environment
    const wrapperCode = `
      return (function createScene() {
        ${Object.keys(availableComponents).map(key => 
          `const ${key} = availableComponents.${key};`
        ).join('\n')}

        try {
          ${transformedCode}
          
          // Return the default export or named Scene component
          if (typeof Scene !== 'undefined') {
            return Scene;
          } else {
            // Look for other possible component functions in the scope
            for (const key in this) {
              if (typeof this[key] === 'function' && key !== 'createScene') {
                console.log("Found component function:", key);
                return this[key];
              }
            }
            throw new Error('No Scene component found');
          }
        } catch (error) {
          console.error('Error in scene code:', error);
          throw error;
        }
      })();
    `;
    
    // Create and execute the wrapper function
    const wrapperFn = new Function('availableComponents', wrapperCode);
    const SceneComponent = wrapperFn(availableComponents);
    
    // If no component was returned, throw an error
    if (!SceneComponent || typeof SceneComponent !== 'function') {
      throw new Error('Generated code did not return a valid component');
    }
    
    // Return the component, wrapped in error boundaries
    return (props: any) => {
      try {
        return <SceneComponent {...props} />;
      } catch (error) {
        console.error('Error rendering scene:', error);
        return <ErrorScene />;
      }
    };
  } catch (error) {
    console.error('Error creating component:', error);
    return ErrorScene;
  }
}

// Process code to ensure it's ready for execution
function processCode(rawCode: string): string {
  try {
    // Clean up markdown formatting if present
    let code = rawCode;
    if (code.startsWith('```')) {
      code = code
        .replace(/^```(jsx|js|typescript|tsx)?\n/, '')
        .replace(/```$/, '')
        .trim();
    }
    
    return code;
  } catch (error) {
    console.error('Error processing code:', error);
    return rawCode; // Return original code if processing fails
  }
}

// Custom error boundary component that catches Three.js runtime errors
class ErrorBoundary extends React.Component<
  { 
    children: React.ReactNode; 
    fallback: React.ReactNode;
    onError: (error: Error, errorInfo: React.ErrorInfo) => void;
    resetKey?: any; // Add a resetKey prop to force reset
  }, 
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError(error, errorInfo);
  }

  // Reset the error state when resetKey changes
  componentDidUpdate(prevProps: any) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function SceneRenderer({ sceneCode, onFixRequest }: SceneRendererProps) {
  const [error, setError] = useState<string | null>(null);
  const [runtimeError, setRuntimeError] = useState<{error: Error | null, errorInfo?: any}>({ error: null });
  const [isLoading, setIsLoading] = useState(false);
  
  // Generate a unique key for the Canvas based on code content
  // This forces the Canvas to remount completely when code changes
  const canvasKey = useMemo(() => `canvas-${Date.now()}-${sceneCode.length}`, [sceneCode]);
  
  // Reset key for error boundary - changes when sceneCode changes
  const resetKey = useMemo(() => sceneCode, [sceneCode]);
  
  // Handle errors caught by the error boundary
  const handleRuntimeError = useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Runtime error caught by boundary:', error, errorInfo);
    setRuntimeError({ error, errorInfo });
  }, []);

  // Handle fix request
  const handleFixClick = useCallback(async () => {
    if (sceneCode && runtimeError.error && onFixRequest) {
      // Format error details
      const errorDetails = `
Error: ${runtimeError.error.message}
Stack: ${runtimeError.error.stack}
${runtimeError.errorInfo ? `Component Stack: ${runtimeError.errorInfo.componentStack}` : ''}
`;
      await onFixRequest(sceneCode, errorDetails);
    }
  }, [sceneCode, runtimeError, onFixRequest]);
  
  // Create the dynamic component when code changes
  const DynamicComponent = useMemo(() => {
    if (!sceneCode) {
      return null;
    }
    
    setIsLoading(true);
    try {
      const processedCode = processCode(sceneCode);
      const component = createComponentFromCode(processedCode);
      setError(null);
      setRuntimeError({ error: null });
      return component;
    } catch (err: any) {
      console.error('Failed to create scene:', err);
      setError(`Error: ${err.message || 'Failed to render scene'}`);
      return ErrorScene;
    } finally {
      setIsLoading(false);
    }
  }, [sceneCode]);
  
  return (
    <div className="w-full h-full bg-black relative">
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-600 text-white p-2 z-10">
          {error}
        </div>
      )}
      
      {runtimeError.error && (
        <div className="absolute top-0 left-0 right-0 bg-red-600 text-white p-2 z-10 flex justify-between items-center">
          <div>
            <div className="font-bold">Three.js Runtime Error:</div>
            <div>{runtimeError.error.message}</div>
          </div>
          {onFixRequest && (
            <button 
              onClick={handleFixClick}
              className="bg-white text-red-600 px-4 py-1 rounded hover:bg-gray-200 font-medium"
            >
              Fix with AI
            </button>
          )}
        </div>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
          <div className="text-white">Loading scene...</div>
        </div>
      )}
      
      <Canvas key={canvasKey} camera={{ position: [3, 3, 3], fov: 50 }}>
        <Suspense fallback={null}>
          {DynamicComponent ? (
            <ErrorBoundary 
              fallback={<ErrorScene />} 
              onError={handleRuntimeError}
              resetKey={resetKey}
            >
              <DynamicComponent />
            </ErrorBoundary>
          ) : (
            <DefaultScene />
          )}
          <OrbitControls />
        </Suspense>
      </Canvas>
    </div>
  );
} 
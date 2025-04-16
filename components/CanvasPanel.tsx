import { useState, useEffect } from 'react';
import TabSwitcher, { Tab } from './TabSwitcher';
import useStore from './store';
import { 
  SandpackProvider, 
  SandpackPreview,
  SandpackLayout,
  SandpackCodeEditor,
  useSandpack
} from '@codesandbox/sandpack-react';

// Sandpack error listener component
const ErrorListener = ({ onError }: { onError: (error: Error) => void }) => {
  const { listen } = useSandpack();
  
  useEffect(() => {
    const unsubscribe = listen((message: any) => {
      // Check for compilation errors
      if (message.type === 'compile-error' && message.payload) {
        console.error("Sandpack compile error:", message.payload);
        onError(new Error(message.payload.message || "Compilation error in sandbox"));
      }
      // Check for runtime errors
      else if (message.type === 'runtime-error' && message.payload) {
        console.error("Sandpack runtime error:", message.payload);
        onError(new Error(message.payload.message || "Runtime error in sandbox"));
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [listen, onError]);
  
  return null;
};

const PRESET_R3F_DEPENDENCIES = {
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@react-three/fiber": "^8.13.6",
  "@react-three/drei": "^9.80.0",
  "three": "^0.154.0"
};

// This wraps the user's scene code in the necessary boilerplate
const prepareSceneCode = (sceneCode: string): Record<string, string> => {
  // Clean up the code if it's a markdown code block
  let cleanedCode = sceneCode || '';
  if (cleanedCode.startsWith('```')) {
    cleanedCode = cleanedCode.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '').trim();
  }

  // Create the App.js file that will render the scene
  const appCode = `
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import Scene from './Scene';

export default function App() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
        <Scene />
        <OrbitControls />
        <Environment preset="sunset" background />
      </Canvas>
    </div>
  );
}`;

  // Create the Scene.js file from the user's code
  const sceneFile = cleanedCode || `
export default function Scene() {
  return (
    <>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
    </>
  );
}`;

  // Return the files object for Sandpack
  return {
    '/App.js': appCode,
    '/Scene.js': sceneFile,
    '/index.js': `
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
    '/styles.css': `
body { margin: 0; padding: 0; overflow: hidden; background: #000; }
canvas { width: 100%; height: 100%; display: block; }
.error-panel { 
  position: absolute; 
  top: 0; 
  left: 0; 
  width: 100%; 
  background: rgba(255,0,0,0.8); 
  color: white; 
  padding: 8px; 
  font-family: monospace; 
  z-index: 100; 
}`
  };
};

interface CanvasPanelProps {
  sceneCode: string;
}

export default function CanvasPanel({ sceneCode }: CanvasPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const { fixCode, isFixing } = useStore();

  // Prepare the code for the sandbox
  const sandpackFiles = prepareSceneCode(sceneCode);

  // Handle errors from the sandbox by sending them to the AI for fixing
  const handleSandpackError = (error: Error) => {
    if (sceneCode && error && fixCode) {
      const errorDetails = `
Error: ${error.message}
Stack: ${error.stack || ''}
      `;
      fixCode(sceneCode, errorDetails);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none z-10">
        <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      
      <div className="flex-grow relative overflow-hidden">
        {sceneCode ? (
          <SandpackProvider
            template="react"
            files={sandpackFiles}
            customSetup={{
              dependencies: PRESET_R3F_DEPENDENCIES
            }}
            options={{
              visibleFiles: ['/Scene.js'],
              activeFile: '/Scene.js',
              externalResources: [
                "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap"
              ]
            }}
            className="sp-wrapper"
          >
            {activeTab === 'preview' ? (
              <>
                {isFixing && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-30">
                    <div className="text-white text-center">
                      <div className="mb-2 text-xl">Fixing with AI...</div>
                      <div className="text-gray-400">Analyzing and correcting Three.js errors</div>
                    </div>
                  </div>
                )}
                <SandpackLayout>
                  <SandpackPreview 
                    showNavigator={false}
                    showRefreshButton={true}
                    showOpenInCodeSandbox={false}
                  />
                  <ErrorListener onError={handleSandpackError} />
                </SandpackLayout>
              </>
            ) : (
              <SandpackCodeEditor
                showLineNumbers
                showInlineErrors
                readOnly
                wrapContent
              />
            )}
          </SandpackProvider>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-400">
            {activeTab === 'preview' ? 
              "Enter a prompt to generate a 3D scene" : 
              "No code generated yet. Enter a prompt to generate a scene."
            }
          </div>
        )}
      </div>
    </div>
  );
} 
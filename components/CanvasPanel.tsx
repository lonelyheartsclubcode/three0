import { useState, useEffect } from 'react';
import TabSwitcher, { Tab } from './TabSwitcher';
import useStore from './store';
import { 
  SandpackProvider, 
  SandpackPreview,
  SandpackLayout,
  SandpackCodeEditor,
  useSandpack,
  SandpackTheme
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

  // Check if the code contains direct imports from React
  if (cleanedCode.includes('import React') || cleanedCode.includes('import {')) {
    // Add additional imports for common React Three Fiber hooks if not already present
    if (cleanedCode.includes('useFrame') && !cleanedCode.includes('@react-three/fiber')) {
      // Insert import for useFrame from react-three/fiber
      cleanedCode = cleanedCode.replace(
        /import.*?;/, 
        match => `${match}\nimport { useFrame } from '@react-three/fiber';`
      );
    }
  } else {
    // No imports found, add imports based on detected hooks
    const imports = ['import React from "react";'];
    
    if (cleanedCode.includes('useFrame')) {
      imports.push('import { useFrame } from "@react-three/fiber";');
    }
    
    // Only add these if explicitly used in the code
    if (cleanedCode.includes('<Stars') || cleanedCode.includes('<Environment')) {
      imports.push('import { Stars, Environment } from "@react-three/drei";');
    }
    
    cleanedCode = imports.join('\n') + '\n\n' + cleanedCode;
  }

  // Create the App.js file that will render the scene
  const appCode = `
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Scene from './Scene';

export default function App() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
        <Scene />
        <OrbitControls />
        <color attach="background" args={['#000000']} />
      </Canvas>
    </div>
  );
}`;

  // Return the files object for Sandpack
  return {
    '/App.js': appCode,
    '/Scene.js': cleanedCode,
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
  const [error, setError] = useState<Error | null>(null);
  const [mountKey, setMountKey] = useState(Date.now()); // Add a key to force remount when needed

  // Prepare the code for the sandbox
  const sandpackFiles = prepareSceneCode(sceneCode);

  // Custom theme with high contrast text for better readability
  const customTheme: SandpackTheme = {
    colors: {
      surface1: "#18181b", // zinc-900
      surface2: "#27272a", // zinc-800
      surface3: "#3f3f46", // zinc-700
      clickable: "#a1a1aa", // zinc-400
      base: "#f8fafc",     // slate-50 - much brighter text
      disabled: "#52525b", // zinc-600
      hover: "#d4d4d8",    // zinc-300
      accent: "#3b82f6",   // blue-500
      error: "#ef4444",    // red-500
      errorSurface: "#7f1d1d", // red-900
    },
    syntax: {
      plain: "#f8fafc",    // slate-50
      comment: "#a1a1aa",  // zinc-400
      keyword: "#93c5fd",  // blue-300
      tag: "#c4b5fd",      // violet-300
      punctuation: "#e4e4e7", // zinc-200
      definition: "#93c5fd", // blue-300
      property: "#a5b4fc",  // indigo-300
      static: "#f472b6",    // pink-400
      string: "#86efac"     // green-300
    },
    font: {
      body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      mono: "'JetBrains Mono', Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
      size: "14px",
      lineHeight: "20px"
    }
  };

  // Handle errors from the sandbox by sending them to the AI for fixing
  const handleSandpackError = (error: Error) => {
    console.log("Sandpack error detected:", error.message);
    setError(error);
  };

  // Handle manual fix button click
  const handleFixClick = () => {
    if (sceneCode && error && fixCode) {
      const errorDetails = `
Error: ${error.message}
Stack: ${error.stack || ''}
      `;
      fixCode(sceneCode, errorDetails);
      setError(null);
    }
  };

  // Reset error when code changes
  useEffect(() => {
    setError(null);
  }, [sceneCode]);

  // Force remount of the preview when switching back to it
  useEffect(() => {
    if (activeTab === 'preview') {
      setMountKey(Date.now());
    }
  }, [activeTab]);

  if (!sceneCode) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-none z-10">
          <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        <div className="flex-grow relative overflow-hidden">
          <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-400">
            {activeTab === 'preview' ? 
              "Enter a prompt to generate a 3D scene" : 
              "No code generated yet. Enter a prompt to generate a scene."
            }
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none z-10">
        <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      
      <div className="flex-grow relative overflow-hidden">
        <SandpackProvider
          key={mountKey} // Force remount when switching back to preview
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
          theme={customTheme}
          className="sp-wrapper"
        >
          {isFixing && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-30">
              <div className="text-white text-center">
                <div className="mb-2 text-xl">Fixing with AI...</div>
                <div className="text-gray-400">Analyzing and correcting Three.js errors</div>
              </div>
            </div>
          )}
          
          {/* Error Message with Fix Button */}
          {error && !isFixing && (
            <div className="absolute top-0 left-0 right-0 bg-red-600 text-white p-3 z-20 flex justify-between items-center">
              <div>
                <p className="font-semibold">Error detected:</p>
                <p className="text-sm">{error.message}</p>
              </div>
              <button 
                className="bg-white text-red-600 px-4 py-2 rounded-md font-medium hover:bg-red-100 transition-colors"
                onClick={handleFixClick}
              >
                Fix with AI
              </button>
            </div>
          )}
          
          {activeTab === 'preview' ? (
            <SandpackLayout>
              <SandpackPreview 
                showNavigator={false}
                showRefreshButton={true}
                showOpenInCodeSandbox={false}
              />
              <ErrorListener onError={handleSandpackError} />
            </SandpackLayout>
          ) : (
            <SandpackCodeEditor
              showLineNumbers
              showInlineErrors
              readOnly
              wrapContent
            />
          )}
        </SandpackProvider>
      </div>
    </div>
  );
} 
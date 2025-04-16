'use client';

import { useState } from 'react';
import useStore from '../components/store';
import PromptPanel from '../components/PromptPanel';
import CanvasPanel from '../components/CanvasPanel';

export default function Page() {
  const { sceneCode, setSceneCode, isLoading, setIsLoading } = useStore();

  const handleGenerate = async (prompt: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate scene');
      }
      
      const data = await response.json();
      
      // Small delay to ensure smooth transition when loading the preview
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setSceneCode(data.code);
    } catch (error) {
      console.error('Error generating scene:', error);
    } finally {
      // Loading state is now handled by Sandpack internally
      setIsLoading(false);
    }
  };

  // Add debug mode toggle for development
  const [showDebug, setShowDebug] = useState(false);

  return (
    <main className="flex flex-col md:flex-row h-screen bg-zinc-950">
      {/* Left Panel: Prompt Input */}
      <div className="w-full md:w-1/3 overflow-auto border-r border-zinc-800">
        <PromptPanel onGenerate={handleGenerate} isLoading={isLoading} />
        
        {/* Debug toggle - only visible in development */}
        <div className="p-2 border-t border-zinc-800">
          <button 
            onClick={() => setShowDebug(!showDebug)} 
            className="text-xs text-zinc-500 hover:text-white"
          >
            {showDebug ? 'Hide' : 'Show'} Debug
          </button>
          
          {showDebug && sceneCode && (
            <div className="mt-2 p-2 bg-zinc-900 rounded text-xs text-zinc-300 overflow-auto max-h-40">
              <div className="font-bold mb-1">Raw Response:</div>
              <pre>{sceneCode}</pre>
            </div>
          )}
        </div>
      </div>
      
      {/* Right Panel: Canvas/Code Viewer */}
      <div className="w-full md:w-2/3 overflow-hidden">
        <CanvasPanel sceneCode={sceneCode} />
      </div>
    </main>
  );
} 
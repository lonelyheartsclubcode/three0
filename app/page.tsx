// 

'use client';

import { useState, useEffect } from 'react';
import useStore from '../components/store';
import PromptPanel from '../components/PromptPanel';
import CanvasPanel from '../components/CanvasPanel';

export default function Page() {
  const { 
    sceneCode, 
    setSceneCode, 
    isLoading, 
    setIsLoading, 
    isStreaming, 
    setIsStreaming, 
    addMessage,
    messages
  } = useStore();

  const handleGenerate = async (prompt: string) => {
    try {
      setIsLoading(true);
      
      // Start code streaming
      setIsStreaming(true);
      let accumulatedCode = "";

      // Use fetch with streaming response
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          messages: messages, // Send full conversation history
          currentCode: sceneCode // Send current scene code
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate scene');
      }
      
      // For streaming response, we need to handle the response as a reader
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        let done = false;
        
        // Set empty code immediately to trigger code panel visibility
        setSceneCode("");
        
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          
          if (value) {
            const decodedChunk = decoder.decode(value, { stream: !done });
            
            try {
              // Try to parse the chunk as JSON
              const jsonChunk = JSON.parse(decodedChunk);
              if (jsonChunk.code) {
                accumulatedCode = jsonChunk.code;
                setSceneCode(accumulatedCode);
              }
            } catch (e) {
              // If it's not valid JSON yet (partial chunk), accumulate it
              accumulatedCode += decodedChunk;
              setSceneCode(accumulatedCode);
            }
          }
        }
        
        // Add the AI response to the chat
        addMessage({ role: 'assistant', content: 'Here\'s your scene! You can continue to refine it by sending more messages.' });
      } else {
        // Fallback to regular JSON handling if streaming fails
        const data = await response.json();
        setSceneCode(data.code);
        
        // Add the AI response to the chat
        addMessage({ role: 'assistant', content: 'Here\'s your scene! You can continue to refine it by sending more messages.' });
      }
    } catch (error: any) {
      console.error('Error generating scene:', error);
      // Add error message to chat
      addMessage({ 
        role: 'assistant', 
        content: `Sorry, there was an error generating your scene: ${error?.message || 'Unknown error'}` 
      });
    } finally {
      // End both loading and streaming states
      setIsLoading(false);
      setIsStreaming(false);
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
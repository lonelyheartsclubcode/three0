// 

import { useState, useEffect, useRef } from 'react';
import useStore from './store';
import Logo3D from './Logo3D';

interface PromptPanelProps {
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
}

export default function PromptPanel({ onGenerate, isLoading }: PromptPanelProps) {
  const [prompt, setPrompt] = useState<string>('');
  const { 
    messages, 
    addMessage, 
    isFirstPrompt, 
    setIsFirstPrompt, 
    isStreaming, 
    isChatLoading,
    resetApp, 
    sendChatMessage,
    sceneCode
  } = useStore();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of chat when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading || isStreaming || isChatLoading) return;
    
    // If this is the first interaction, generate a scene
    if (isFirstPrompt) {
      // Add user message to chat
      addMessage({ role: 'user', content: prompt });
      setIsFirstPrompt(false);
      
      // Call the generation function
      onGenerate(prompt);
      
      // Clear the input
      setPrompt('');
    } else {
      // If we already have a scene, use the chat functionality instead
      handleChatSubmit();
    }
  };
  
  const handleChatSubmit = async () => {
    if (!prompt.trim() || isChatLoading) return;
    
    // Send the chat message
    await sendChatMessage(prompt);
    
    // Clear the input
    setPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter without Shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    // Allow default behavior (new line) for Shift+Enter
  };

  const handleReset = () => {
    resetApp();
  };

  const examplePrompts = [
    "Create a starfield with a rotating cube and a red point light.",
    "Make a forest scene with 5 trees and a moon in the sky.",
    "Generate a solar system with planets orbiting the sun.",
    "Create an animated abstract sculpture with morphing geometry and colorful materials.",
    "Make a scene with rotating torus knots that change color over time.",
    "Generate a particle system that simulates a galaxy with stars orbiting a center point."
  ];

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  // Chat messages component
  const ChatMessages = () => (
    <div className="flex-grow overflow-auto mb-4">
      {messages.map((message, index) => (
        <div 
          key={index} 
          className={`mb-3 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
        >
          <div 
            className={`inline-block rounded-lg px-4 py-2 max-w-[85%] ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-zinc-800 text-white'
            }`}
          >
            {message.content}
          </div>
        </div>
      ))}
      {(isLoading || isStreaming) && (
        <div className="mb-3 text-left">
          <div className="inline-block rounded-lg px-4 py-2 bg-zinc-800 text-white">
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isStreaming ? 'Generating code...' : 'Thinking...'}
            </div>
          </div>
        </div>
      )}
      {isChatLoading && (
        <div className="mb-3 text-left">
          <div className="inline-block rounded-lg px-4 py-2 bg-zinc-800 text-white">
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Responding...
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
  
  return (
    <div className="flex flex-col h-full p-4 pt-6 bg-zinc-900 text-white">
      <div className="flex items-center mb-6">
        <Logo3D onClick={handleReset} />
      </div>
      <p className="mb-4 text-zinc-400">Generate 3D scenes from text prompts using React Three Fiber</p>
      
      {isFirstPrompt ? (
        // First-time view with examples first, then input
        <>
          <div className="mb-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Try an example:</h3>
            <div className="space-y-2">
              {examplePrompts.map((example, i) => (
                <button
                  key={i}
                  onClick={() => handleExampleClick(example)}
                  className="w-full text-left p-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-md"
                  disabled={isLoading}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="mt-auto">
            <textarea
              className="w-full p-3 bg-zinc-800 text-white rounded-md border-zinc-700 border resize-none mb-4"
              placeholder="Describe a 3D scene you'd like to create..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={4}
            />
            
            <button 
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className={`w-full py-2 px-4 rounded-md font-medium ${
                isLoading || !prompt.trim() 
                  ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </div>
              ) : (
                'Generate Scene'
              )}
            </button>
          </form>
          
          <div className="mt-6 pt-4 border-t border-zinc-800 text-xs text-zinc-500">
            <p className="mb-2">💡 <span className="font-medium">Tips:</span></p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Be specific about colors, materials, and positioning</li>
              <li>Simpler scenes work better than very complex ones</li>
              <li>You can chat with the AI about your scene after it's generated</li>
            </ul>
          </div>
        </>
      ) : (
        // Chat interface for subsequent interactions
        <>
          <div className="flex flex-col h-full">
            <ChatMessages />
            
            <form onSubmit={handleSubmit} className="mt-auto">
              <div className="relative">
                <textarea
                  className="w-full p-3 pr-12 bg-zinc-800 text-white rounded-md border-zinc-700 border resize-none"
                  placeholder={
                    sceneCode 
                      ? "Ask about your scene or request changes..." 
                      : "Describe a 3D scene you'd like to create..."
                  }
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading || isStreaming || isChatLoading}
                  rows={3}
                />
                <button
                  type="submit"
                  disabled={isLoading || !prompt.trim() || isStreaming || isChatLoading}
                  className={`absolute right-2 bottom-2 p-2 rounded-md ${
                    isLoading || !prompt.trim() || isStreaming || isChatLoading
                      ? 'text-zinc-600 cursor-not-allowed'
                      : 'text-blue-500 hover:text-blue-400'
                  }`}
                >
                  {isLoading || isStreaming || isChatLoading ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2L11 13"></path>
                      <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
} 
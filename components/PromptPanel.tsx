import { useState } from 'react';

interface PromptPanelProps {
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
}

export default function PromptPanel({ onGenerate, isLoading }: PromptPanelProps) {
  const [prompt, setPrompt] = useState<string>('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onGenerate(prompt);
    }
  };

  const examplePrompts = [
    "Create a starfield with a rotating cube and a red point light.",
    "Make a forest scene with 5 trees and a moon in the sky.",
    "Generate a solar system with planets orbiting the sun."
  ];

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  return (
    <div className="flex flex-col h-full p-4 bg-zinc-900 text-white">
      <h1 className="text-2xl font-bold mb-4">Three0</h1>
      <p className="mb-4 text-zinc-400">Generate 3D scenes from text prompts using React Three Fiber</p>
      
      <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
        <textarea
          className="flex-grow p-3 bg-zinc-800 text-white rounded-md border-zinc-700 border resize-none mb-4"
          placeholder="Describe a 3D scene you'd like to create..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
        />
        
        <button 
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className={`py-2 px-4 rounded-md font-medium ${
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
      
      <div className="mt-6">
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
      
      <div className="mt-6 pt-4 border-t border-zinc-800 text-xs text-zinc-500">
        <p className="mb-2">💡 <span className="font-medium">Tips:</span></p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Be specific about colors, materials, and positioning</li>
          <li>Simpler scenes work better than very complex ones</li>
          <li>The AI will fix errors automatically if they occur</li>
        </ul>
      </div>
    </div>
  );
} 
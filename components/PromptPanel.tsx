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
          {isLoading ? 'Generating...' : 'Generate Scene'}
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
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 
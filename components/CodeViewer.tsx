import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface CodeViewerProps {
  code: string;
}

export default function CodeViewer({ code }: CodeViewerProps) {
  // Process code if it has markdown backticks
  const processedCode = code.startsWith('```') 
    ? code.replace(/^```(jsx|js|typescript|tsx)?\n/, '').replace(/```$/, '').trim()
    : code;
    
  return (
    <div className="h-full w-full bg-zinc-900">
      <SyntaxHighlighter
        language="jsx"
        style={vscDarkPlus}
        showLineNumbers
        customStyle={{
          margin: 0,
          height: '100%',
          fontSize: '14px',
          overflowY: 'auto',
          backgroundColor: '#1e1e1e',
        }}
      >
        {processedCode || '// No code generated yet. Enter a prompt and click "Generate Scene".'}
      </SyntaxHighlighter>
    </div>
  );
} 
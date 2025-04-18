<!-- -->


DEPLOYED AT: https://three0.vercel.app/

# Three0 - AI-Powered 3D Scene Generator

Three0 is an AI-powered tool that generates 3D scenes using natural language. The user types a prompt, and the system generates valid React Three Fiber code with a live-rendered preview.

## 🚀 Features

- Convert natural language prompts to 3D scenes
- Powered by OpenAI's GPT models (using gpt-4.1)
- Real-time 3D preview with React Three Fiber
- View the generated code with syntax highlighting
- Self-correcting AI that can fix broken scenes automatically
- Sandboxed code execution for safety and reliability
- Simple and intuitive UI
- **Advanced Material Rendering** for realistic water and glass using meshPhysicalMaterial
- **Particle Systems** using instancedMesh for efficient rendering of many objects
- **Animated Vertex Displacement** for realistic water surfaces

## 🔧 Tech Stack

- **Next.js** (App Router)
- **React Three Fiber** (@react-three/fiber)
- **Drei** for helpers (@react-three/drei)
- **Tailwind CSS** for styling
- **OpenAI API** for LLM scene generation
- **Zustand** for state management
- **Sandpack** from CodeSandbox for secure code previews
- **React-Syntax-Highlighter** for code display

## 🏃‍♀️ Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env.local` file with your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4.1-mini
```
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📝 Usage

1. Enter a natural language prompt describing the 3D scene you want to create
2. Click "Generate Scene"
3. View the 3D preview in the right panel
4. If the scene has errors, the AI will automatically attempt to fix them
5. Toggle between "Preview" and "Code" tabs to see the generated code
6. Copy the code to use in your own projects

## 🔒 Security and Safety

Three0 uses Sandpack to run generated code in an isolated iframe, ensuring:
- Complete isolation from the main application
- Protection from malicious code execution
- Reliable error handling and reporting
- Consistent preview rendering

## 🔨 Next Steps

- Add the ability to edit generated code and see changes live
- Implement export functionality for downloading scenes
- Add user authentication and saved scenes
- Create a gallery of example scenes
- Add more complex scene types and templates

## 📄 License

MIT

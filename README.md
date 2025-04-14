# Three0 - AI-Powered 3D Scene Generator

Three0 is an AI-powered tool that generates 3D scenes using natural language. The user types a prompt, and the system generates valid React Three Fiber code with a live-rendered preview.

## 🚀 Features

- Convert natural language prompts to 3D scenes
- Powered by OpenAI's GPT models (using gpt-4.1-mini)
- Real-time 3D preview with React Three Fiber
- View the generated code with syntax highlighting
- Simple and intuitive UI

## 🔧 Tech Stack

- **Next.js** (App Router)
- **React Three Fiber** (@react-three/fiber)
- **Drei** for helpers (@react-three/drei)
- **Tailwind CSS** for styling
- **OpenAI API** for LLM scene generation
- **Zustand** for state management

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
4. Toggle between "Preview" and "Code" tabs to see the generated code
5. Copy the code to use in your own projects

## 🔨 Next Steps

- Implement secure code execution for dynamic scene previews
- Add the ability to edit generated code and see changes live
- Implement export functionality for downloading scenes
- Add user authentication and saved scenes
- Create a gallery of example scenes

## 📄 License

MIT

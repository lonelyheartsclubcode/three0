import { useState } from 'react';
import TabSwitcher, { Tab } from './TabSwitcher';
import SceneRenderer from './SceneRenderer';
import CodeViewer from './CodeViewer';
import useStore from './store';

interface CanvasPanelProps {
  sceneCode: string;
}

export default function CanvasPanel({ sceneCode }: CanvasPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const { fixCode, isFixing } = useStore();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none z-10">
        <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      
      <div className="flex-grow relative overflow-hidden">
        {activeTab === 'preview' ? (
          <>
            {isFixing && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-20">
                <div className="text-white text-center">
                  <div className="mb-2 text-xl">Fixing with AI...</div>
                  <div className="text-gray-400">Analyzing and correcting Three.js errors</div>
                </div>
              </div>
            )}
            <SceneRenderer 
              sceneCode={sceneCode} 
              onFixRequest={fixCode}
            />
          </>
        ) : (
          <div className="absolute inset-0 overflow-auto">
            <CodeViewer code={sceneCode} />
          </div>
        )}
      </div>
    </div>
  );
} 
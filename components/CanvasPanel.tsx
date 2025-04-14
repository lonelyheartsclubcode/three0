import { useState } from 'react';
import TabSwitcher, { Tab } from './TabSwitcher';
import SceneRenderer from './SceneRenderer';
import CodeViewer from './CodeViewer';

interface CanvasPanelProps {
  sceneCode: string;
}

export default function CanvasPanel({ sceneCode }: CanvasPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('preview');

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none z-10">
        <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      
      <div className="flex-grow relative overflow-hidden">
        {activeTab === 'preview' ? (
          <SceneRenderer sceneCode={sceneCode} />
        ) : (
          <div className="absolute inset-0 overflow-auto">
            <CodeViewer code={sceneCode} />
          </div>
        )}
      </div>
    </div>
  );
} 
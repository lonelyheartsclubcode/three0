import { useState } from 'react';

export type Tab = 'preview' | 'code';

interface TabSwitcherProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'code', label: 'Code' },
  ];

  return (
    <div className="flex bg-zinc-800 rounded-t-md overflow-hidden">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === tab.id
              ? 'bg-zinc-700 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-750'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
} 
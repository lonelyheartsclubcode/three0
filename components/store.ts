import { create } from 'zustand';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AppState {
  sceneCode: string;
  setSceneCode: (code: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isFixing: boolean;
  lastError: string | null;
  activeTab: 'preview' | 'code';
  setActiveTab: (tab: 'preview' | 'code') => void;
  messages: Message[];
  addMessage: (message: Message) => void;
  isFirstPrompt: boolean;
  setIsFirstPrompt: (isFirst: boolean) => void;
  isStreaming: boolean;
  setIsStreaming: (isStreaming: boolean) => void;
  fixCode: (code: string, errorDetails: string) => Promise<void>;
  resetApp: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  sceneCode: '',
  setSceneCode: (code: string) => set({ sceneCode: code }),
  isLoading: false,
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  isFixing: false,
  lastError: null,
  activeTab: 'preview',
  setActiveTab: (tab) => set({ activeTab: tab }),
  messages: [],
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  isFirstPrompt: true,
  setIsFirstPrompt: (isFirst) => set({ isFirstPrompt: isFirst }),
  isStreaming: false,
  setIsStreaming: (isStreaming) => set({ isStreaming: isStreaming }),
  resetApp: () => set({
    sceneCode: '',
    messages: [],
    isFirstPrompt: true,
    activeTab: 'preview',
  }),
  fixCode: async (code: string, errorDetails: string) => {
    try {
      // Set the fixing state and store the error details
      set({ isFixing: true, lastError: errorDetails });
      
      // First clear the current scene code to force unmounting of any components
      set({ sceneCode: '' });
      
      // Small delay to ensure components fully unmount
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Get the current message history for context
      const messages = get().messages;
      
      // Send the code and error details to the fix API
      const response = await fetch('/api/fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code, 
          errorDetails,
          messages // Include conversation context
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fix scene');
      }
      
      const data = await response.json();
      
      // Another small delay before rendering the fixed code
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Update with the fixed code
      set({ sceneCode: data.code });
      
      // Add a message to the chat about the fix
      set((state) => ({ 
        messages: [
          ...state.messages, 
          { 
            role: 'assistant', 
            content: 'I found and fixed an error in your scene. The updated version should work correctly now.' 
          }
        ] 
      }));
    } catch (error) {
      console.error('Error fixing scene:', error);
      
      // Add error message to chat
      set((state) => ({ 
        messages: [
          ...state.messages, 
          { 
            role: 'assistant', 
            content: 'Sorry, I couldn\'t fix the error in your scene. Please try a different approach.' 
          }
        ] 
      }));
    } finally {
      // End the fixing state regardless of outcome
      set({ isFixing: false });
    }
  },
}));

export default useStore; 
import { create } from 'zustand';

interface AppState {
  sceneCode: string;
  setSceneCode: (code: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isFixing: boolean;
  lastError: string | null;
  fixCode: (code: string, errorDetails: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  sceneCode: '',
  setSceneCode: (code: string) => set({ sceneCode: code }),
  isLoading: false,
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  isFixing: false,
  lastError: null,
  fixCode: async (code: string, errorDetails: string) => {
    try {
      // Set the fixing state and store the error details
      set({ isFixing: true, lastError: errorDetails });
      
      // First clear the current scene code to force unmounting of any components
      set({ sceneCode: '' });
      
      // Small delay to ensure components fully unmount
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Send the code and error details to the fix API
      const response = await fetch('/api/fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, errorDetails }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fix scene');
      }
      
      const data = await response.json();
      
      // Another small delay before rendering the fixed code
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Update with the fixed code
      set({ sceneCode: data.code });
    } catch (error) {
      console.error('Error fixing scene:', error);
    } finally {
      // End the fixing state regardless of outcome
      set({ isFixing: false });
    }
  },
}));

export default useStore; 
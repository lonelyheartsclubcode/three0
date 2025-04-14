import create from 'zustand';

interface AppState {
  sceneCode: string;
  setSceneCode: (code: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isFixing: boolean;
  setIsFixing: (fixing: boolean) => void;
  fixCode: (code: string, errorDetails: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  sceneCode: '',
  setSceneCode: (code: string) => set({ sceneCode: code }),
  isLoading: false,
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  isFixing: false,
  setIsFixing: (fixing: boolean) => set({ isFixing: fixing }),
  fixCode: async (code: string, errorDetails: string) => {
    try {
      set({ isFixing: true });
      
      // First clear the current scene code to force unmounting
      set({ sceneCode: '' });
      
      // Small delay to ensure complete unmount
      await new Promise(resolve => setTimeout(resolve, 50));
      
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
      
      // Another small delay before setting new code
      await new Promise(resolve => setTimeout(resolve, 50));
      
      set({ sceneCode: data.code });
    } catch (error) {
      console.error('Error fixing scene:', error);
    } finally {
      set({ isFixing: false });
    }
  },
}));

export default useStore; 
import create from 'zustand';

interface AppState {
  sceneCode: string;
  setSceneCode: (code: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  sceneCode: '',
  setSceneCode: (code: string) => set({ sceneCode: code }),
  isLoading: false,
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
}));

export default useStore; 
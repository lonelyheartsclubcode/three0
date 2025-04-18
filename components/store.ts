// 

import { create } from 'zustand';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AppState {
  sceneCode: string;
  setSceneCode: (code: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isFixing: boolean;
  lastError: string | null;
  setLastError: (error: string | null) => void;
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
  isChatLoading: boolean;
  sendChatMessage: (content: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  sceneCode: '',
  setSceneCode: (code: string) => set({ 
    sceneCode: code,
    // Clear lastError when a new scene is set
    lastError: code ? get().lastError : null
  }),
  isLoading: false,
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  isFixing: false,
  lastError: null,
  setLastError: (error: string | null) => set({ lastError: error }),
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
  isChatLoading: false,
  resetApp: () => set({
    sceneCode: '',
    messages: [],
    isFirstPrompt: true,
    activeTab: 'preview',
    lastError: null,
  }),
  sendChatMessage: async (content: string) => {
    try {
      // Add user message to chat immediately
      const userMessage: Message = { role: 'user', content };
      set((state) => ({ 
        messages: [...state.messages, userMessage],
        isChatLoading: true 
      }));
      
      // Check if this is a fix request
      const isFixRequest = content.toLowerCase().includes("fix") || 
                           content.toLowerCase().includes("repair") ||
                           content.toLowerCase().includes("solve") ||
                           content.toLowerCase().includes("correct") ||
                           content.toLowerCase().includes("resolve") ||
                           content.toLowerCase().includes("debug") ||
                           content.toLowerCase().includes("update the scene");
      
      console.log("Fix request detected:", isFixRequest, "Content:", content);
      
      // Get current state for API call
      const { messages, sceneCode, lastError } = get();
      console.log("Current state:", { hasSceneCode: !!sceneCode, hasLastError: !!lastError });
      
      // If this is a fix request and we have code to fix, use the fix function
      if (isFixRequest && sceneCode) {
        // Call the chat API first to get a response about fixing
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            messages: messages,
            sceneCode: sceneCode 
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to get chat response');
        }
        
        const data = await response.json();
        
        // Add AI response to chat
        set((state) => ({ 
          messages: [...state.messages, { 
            role: 'assistant', 
            content: data.message 
          }] 
        }));

        // Now use the fixCode function with the current code and error details
        const errorDetails = lastError || 'User requested a fix: ' + content;
        const fixCode = get().fixCode;
        
        if (fixCode) {
          console.log("Scheduling fixCode call after chat response");
          // The fixCode function will add its own messages to the chat
          setTimeout(() => {
            console.log("Executing fixCode from setTimeout");
            fixCode(sceneCode, errorDetails);
          }, 1000); // Small delay to let the user read the message first
        } else {
          console.log("fixCode function not found in store");
        }
        
        // Return early to avoid the isChatLoading = false being set before fixCode completes
        return;
      } else {
        // Regular chat message - call the chat API
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            messages: messages,
            sceneCode: sceneCode 
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to get chat response');
        }
        
        const data = await response.json();
        
        // Add AI response to chat
        set((state) => ({ 
          messages: [...state.messages, { 
            role: 'assistant', 
            content: data.message 
          }] 
        }));
      }
    } catch (error) {
      console.error('Error in chat:', error);
      
      // Add error message to chat
      set((state) => ({ 
        messages: [
          ...state.messages, 
          { 
            role: 'assistant', 
            content: 'Sorry, I encountered an error while processing your message. Please try again.' 
          }
        ] 
      }));
    } finally {
      set({ isChatLoading: false });
    }
  },
  fixCode: async (code: string, errorDetails: string) => {
    console.log("fixCode called with:", { codeLength: code?.length, errorDetails });
    try {
      // Set the fixing state and store the error details
      set({ isFixing: true, lastError: errorDetails });
      
      // First clear the current scene code to force unmounting of any components
      set({ sceneCode: '' });
      
      // Small delay to ensure components fully unmount
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Get the current message history for context
      const messages = get().messages;
      
      // Add a system message about fixing
      set((state) => ({ 
        messages: [
          ...state.messages, 
          { 
            role: 'assistant', 
            content: 'I\'m analyzing the error and fixing your scene...' 
          }
        ] 
      }));
      
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
      
      // Clear the error since it's fixed
      set({ lastError: null });
      
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
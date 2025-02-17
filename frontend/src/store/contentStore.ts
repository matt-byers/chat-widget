import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ContentEntry {
  content?: string;
  status: 'generating' | 'generated' | 'error';
}

interface ContentStore {
  generatedContent: Record<string, ContentEntry>;
  setContent: (key: string, content: string) => void;
  setStatusGenerating: (key: string) => void;
  setStatusError: (key: string) => void;
  removeGeneratedContent: (key: string) => void;
}

export const useContentStore = create<ContentStore>()(
  persist(
    (set) => ({
      generatedContent: {},
      setContent: (key, content) => set((state) => ({
        generatedContent: { 
          ...state.generatedContent,
          [key]: { content, status: 'generated' }
        }
      })),
      setStatusGenerating: (key) => set((state) => ({
        generatedContent: {
          ...state.generatedContent,
          [key]: { status: 'generating' }
        }
      })),
      setStatusError: (key) => set((state) => ({
        generatedContent: {
          ...state.generatedContent,
          [key]: { status: 'error' }
        }
      })),
      removeGeneratedContent: (key) => set((state) => {
        console.log('[ContentStore] removeGeneratedContent');
        const newContent = { ...state.generatedContent };
        delete newContent[key];
        return { generatedContent: newContent };
      })
    }),
    { name: 'generated-content-store' }
  )
); 
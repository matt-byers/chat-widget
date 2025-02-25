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

/**
 * Manages generated content state with status tracking.
 * Content goes through three states:
 * - generating: Content generation in progress
 * - generated: Content successfully created
 * - error: Generation failed or requirements not met
 * 
 * Content is persisted across page refreshes and component remounts.
 */
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
        const newContent = { ...state.generatedContent };
        delete newContent[key];
        return { generatedContent: newContent };
      })
    }),
    { name: 'generated-content-store' }
  )
); 
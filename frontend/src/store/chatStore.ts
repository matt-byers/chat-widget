import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OpenAIMessage, SearchConfigSchema, hasAllRequiredFields } from '@chat-widget/utils';

interface ChatState {
  searchData: Record<string, any>;
  customerIntention: Record<string, any>;
  messages: OpenAIMessage[];
  isSearchDataUpdated: boolean;
  searchConfig: SearchConfigSchema | null;
  requireManualSearch: boolean;
  onSearchTrigger?: () => void;
  updateSearchData: (newData: Record<string, any>) => void;
  updateCustomerIntention: (newData: Record<string, any>) => void;
  addMessage: (message: { role: 'user' | 'assistant'; content: string }) => void;
  updateLastAssistantMessage: (content: string) => void;
  syncSearchState: (searchData: Record<string, any>) => void;
  setSearchDataUpdated: (updated: boolean) => void;
  setSearchConfig: (config: SearchConfigSchema) => void;
  setSearchTrigger: (callback: () => void) => void;
  triggerSearch: () => void;
  canTriggerSearch: () => boolean;
  resetChatState: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      searchData: {},
      customerIntention: {},
      messages: [],
      isSearchDataUpdated: false,
      searchConfig: null,
      requireManualSearch: false,
      onSearchTrigger: undefined,
      
      updateSearchData: (newData) => {
        const updatedData = { ...get().searchData };
        
        for (const key in newData) {
          if (newData[key] !== undefined && newData[key] !== null) {
            updatedData[key] = newData[key];
          }
        }
        
        set({ searchData: updatedData });
        
        const { searchConfig } = get();
        if (searchConfig && hasAllRequiredFields(updatedData, searchConfig)) {
          const { requireManualSearch, onSearchTrigger } = get();
          if (!requireManualSearch && onSearchTrigger) {
            onSearchTrigger();
          } else {
            set({ isSearchDataUpdated: true });
          }
        }
      },
      
      updateCustomerIntention: (newData) => {
        const updatedData = { ...get().customerIntention };
        
        for (const key in newData) {
          if (newData[key] !== undefined && newData[key] !== null) {
            updatedData[key] = newData[key];
          }
        }
        
        set({ customerIntention: updatedData });
      },
      
      addMessage: (message) => {
        set({ messages: [...get().messages, message] });
      },
      
      updateLastAssistantMessage: (content) => {
        const messages = [...get().messages];
        const lastIndex = messages.length - 1;
        
        // Replace the entire content with the accumulated message
        messages[lastIndex].content = content;
        set({ messages });
      },

      syncSearchState: (searchData) => {
        set({ 
          searchData,
          isSearchDataUpdated: false
        });
        
        set((state) => ({
          messages: [...state.messages, {
            role: 'assistant',
            content: formatSearchMessage(searchData)
          }]
        }));
      },

      setSearchDataUpdated: (updated) => {
        set({ isSearchDataUpdated: updated });
      },

      setSearchConfig: (config) => {
        set({ searchConfig: config });
      },

      setSearchTrigger: (callback) => {
        set({ onSearchTrigger: callback });
      },

      triggerSearch: () => {
        const { onSearchTrigger } = get();
        if (onSearchTrigger) {
          onSearchTrigger();
          set({ isSearchDataUpdated: false });
        }
      },

      canTriggerSearch: () => {
        const { searchData, searchConfig } = get();
        return searchConfig ? hasAllRequiredFields(searchData, searchConfig) : false;
      },

      resetChatState: () => set({ 
        searchData: {}, 
        customerIntention: {}, 
        messages: [], 
        isSearchDataUpdated: false,
        searchConfig: null,
        requireManualSearch: false,
        onSearchTrigger: undefined
      }),
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ 
        searchData: state.searchData,
        customerIntention: state.customerIntention,
        messages: state.messages,
        isSearchDataUpdated: state.isSearchDataUpdated,
        searchConfig: state.searchConfig,
        requireManualSearch: state.requireManualSearch
      })
    }
  )
);

function formatSearchMessage(searchData: Record<string, any>): string {
  const parts = [];
  if (searchData.location) parts.push(`location: ${searchData.location}`);
  if (searchData.dates) parts.push(`dates: ${searchData.dates}`);
  return `🔍 You searched for ${parts.join(', ')}`;
} 
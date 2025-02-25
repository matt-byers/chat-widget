import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OpenAIMessage, SearchConfigSchema, hasAllRequiredFields } from '@chat-widget/utils';

interface ChatState {
  searchData: Record<string, any>;
  requiredSearchData: Record<string, any>;
  customerIntention: Record<string, any>;
  messages: OpenAIMessage[];
  isSearchDataUpdated: boolean;
  searchConfig: SearchConfigSchema | null;
  requireManualSearch: boolean;
  updateSearchData: (newData: Record<string, any>) => void;
  updateCustomerIntention: (newData: Record<string, any>) => void;
  addMessage: (message: { role: 'user' | 'assistant'; content: string }) => void;
  updateLastAssistantMessage: (content: string) => void;
  syncSearchState: (searchData: Record<string, any>) => void;
  setSearchDataUpdated: (updated: boolean) => void;
  setSearchConfig: (config: SearchConfigSchema) => void;
  triggerSearch: () => void;
  canTriggerSearch: () => boolean;
  resetChatState: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      searchData: {},
      customerIntention: {},
      requiredSearchData: {},
      messages: [],
      isSearchDataUpdated: false,
      searchConfig: null,
      requireManualSearch: false,
      
      updateSearchData: (newData) => {
        const updatedData = { ...get().searchData };
        console.log('newData', newData);
        for (const key in newData) {
          if (newData[key] !== undefined && newData[key] !== null) {
            updatedData[key] = newData[key];
          }
        }
        
        set({ searchData: updatedData });
        console.log('updatedData', updatedData);
        const { searchConfig } = get();
        if (searchConfig && hasAllRequiredFields(updatedData, searchConfig)) {
          console.log('hasAllRequiredFields', hasAllRequiredFields(updatedData, searchConfig));
          const { requireManualSearch } = get();
          if (!requireManualSearch) {
            console.log('requireManualSearch is false');
            // Triggers search in customer's app assuming they're listening to requiredSearchData changes
            set({ requiredSearchData: updatedData });
          } else {
            console.log('requireManualSearch is true, setting isSearchDataUpdated to true to show button');
            set({ isSearchDataUpdated: true });
          }
        }
        console.log('requiredSearchData', get().requiredSearchData);
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

      triggerSearch: () => {
        const { searchData } = get();
        // Triggers search in customer's app assuming they're listening to requiredSearchData changes
        set({ requiredSearchData: searchData });
        set({ isSearchDataUpdated: false });
      },

      canTriggerSearch: () => {
        const { searchData, searchConfig } = get();
        return searchConfig ? hasAllRequiredFields(searchData, searchConfig) : false;
      },

      resetChatState: () => set({ 
        searchData: {}, 
        requiredSearchData: {},
        customerIntention: {}, 
        messages: [], 
        isSearchDataUpdated: false,
        searchConfig: null,
        requireManualSearch: false
      }),
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ 
        searchData: state.searchData,
        requiredSearchData: state.requiredSearchData,
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
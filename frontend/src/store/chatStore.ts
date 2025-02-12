import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OpenAIMessage } from '@chat-widget/utils';

interface ChatState {
  searchData: Record<string, any>;
  customerIntention: Record<string, any>;
  messages: OpenAIMessage[];
  updateSearchData: (newData: Record<string, any>) => void;
  updateCustomerIntention: (newData: Record<string, any>) => void;
  addMessage: (message: { role: 'user' | 'assistant'; content: string }) => void;
  updateLastAssistantMessage: (content: string) => void;
  isSearchInProgress: boolean;
  setSearchInProgress: (inProgress: boolean) => void;
  syncSearchState: (searchData: Record<string, any>) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      searchData: {},
      customerIntention: {},
      messages: [],
      
      updateSearchData: (newData) => {
        const updatedData = { ...get().searchData };
        
        for (const key in newData) {
          if (newData[key] !== undefined && newData[key] !== null) {
            updatedData[key] = newData[key];
          }
        }
        
        set({ searchData: updatedData });
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
      
      isSearchInProgress: false,
      
      setSearchInProgress: (inProgress) => {
        set({ isSearchInProgress: inProgress });
      },

      syncSearchState: (searchData) => {
        const currentState = get();
        
        set({ searchData });
        
        currentState.addMessage({
          role: 'assistant',
          content: formatSearchMessage(searchData)
        });
      },

      reset: () => set({ searchData: {}, customerIntention: {}, messages: [], isSearchInProgress: false}),
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ 
        searchData: state.searchData,
        customerIntention: state.customerIntention,
        messages: state.messages,
        isSearchInProgress: state.isSearchInProgress
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
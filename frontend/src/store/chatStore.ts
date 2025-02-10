import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatState {
  searchData: Record<string, any>;
  customerIntention: Record<string, any>;
  messages: OpenAIMessage[];
  updateSearchData: (newData: Record<string, any>) => void;
  updateCustomerIntention: (newData: Record<string, any>) => void;
  addMessage: (message: { role: 'user' | 'assistant'; content: string }) => void;
  updateLastAssistantMessage: (content: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      searchData: {},
      customerIntention: {},
      messages: [],
      
      updateSearchData: (newData) => {
        console.log('Updating search data with:', newData);
        const updatedData = { ...get().searchData };
        
        for (const key in newData) {
          if (newData[key] !== undefined && newData[key] !== null) {
            updatedData[key] = newData[key];
          }
        }
        
        console.log('Final search data:', updatedData);
        set({ searchData: updatedData });
      },
      
      updateCustomerIntention: (newData) => {
        console.log('Updating customer intention with:', newData);
        const updatedData = { ...get().customerIntention };
        
        for (const key in newData) {
          if (newData[key] !== undefined && newData[key] !== null) {
            updatedData[key] = newData[key];
          }
        }
        
        console.log('Final customer intention:', updatedData);
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
      }
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ 
        searchData: state.searchData,
        customerIntention: state.customerIntention,
        messages: state.messages
      })
    }
  )
); 
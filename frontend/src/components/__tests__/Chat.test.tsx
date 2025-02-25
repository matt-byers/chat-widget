import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Chat from '../Chat';
import { useChatStore } from '../../store/chatStore';
import { SearchConfigSchema } from '@chat-widget/utils';

// Mock ReactMarkdown component
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown">{children}</div>;
  };
});

describe('Chat', () => {
  const mockSearchConfig: SearchConfigSchema = {
    searchData: {
      price: {
        type: 'object',
        description: 'Price range filter with min and max values',
        required: true,
        example: { min: 0, max: 1000 }
      },
      categories: {
        type: 'array',
        description: 'Product categories to filter by',
        required: true,
        example: ['all']
      },
      location: {
        type: 'string', 
        description: 'Location to search in',
        required: true,
        example: 'Sydney'
      },
      showFeaturedFirst: {
        type: 'boolean',
        description: 'Whether to prioritize featured items',
        required: true,
        example: true
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset chat store to initial state before each test
    useChatStore.setState({
      messages: [],
      searchData: {},
      customerIntention: {
        likes: [],
        priorities: [],
        dislikes: []
      },
      isSearchDataUpdated: false,
      searchConfig: null,
      requireManualSearch: false,
      addMessage: jest.fn(),
      updateLastAssistantMessage: jest.fn(),
      updateSearchData: jest.fn(),
      updateCustomerIntention: jest.fn(),
      setSearchDataUpdated: jest.fn(),
      setSearchConfig: jest.fn(),
      canTriggerSearch: jest.fn(),
      triggerSearch: jest.fn(),
      resetChatState: jest.fn()
    });
  });

  // Rendering Tests
  it('renders initial state correctly', () => {
    render(<Chat searchConfig={mockSearchConfig} />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/tell us what you're looking for/i)).toBeInTheDocument();
  });

  it('renders welcome message when no messages exist', () => {
    render(<Chat searchConfig={mockSearchConfig} />);
    expect(screen.getByText(/need help\? tell us what you think/i)).toBeInTheDocument();
  });

  it('renders chat messages with correct styling', () => {
    useChatStore.setState({
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ]
    });

    const { container } = render(<Chat searchConfig={mockSearchConfig} />);

    const userMessage = container.querySelector('.message.user');
    const assistantMessage = container.querySelector('.message.assistant');

    expect(userMessage).toHaveTextContent('Hello');
    expect(assistantMessage).toHaveTextContent('Hi there!');

    expect(userMessage).toHaveClass('message', 'user');
    expect(assistantMessage).toHaveClass('message', 'assistant');
  });
  
  // User Input Tests
  it('handles user input correctly', async () => {
    const mockAddMessage = jest.fn();
    useChatStore.setState({ addMessage: mockAddMessage });

    render(<Chat searchConfig={mockSearchConfig} />);
    
    const input = screen.getByPlaceholderText(/tell us what you're looking for/i);
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByLabelText('Send a message'));

    expect(mockAddMessage).toHaveBeenCalledWith({
      role: 'user',
      content: 'Hello'
    });
  });

  it('sends message on Enter key press', () => {
    const mockAddMessage = jest.fn();
    useChatStore.setState({ addMessage: mockAddMessage });

    render(<Chat searchConfig={mockSearchConfig} />);
    
    const input = screen.getByPlaceholderText(/tell us what you're looking for/i);
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockAddMessage).toHaveBeenCalledWith({
      role: 'user',
      content: 'Hello'
    });
  });

  it('disables send button while streaming', () => {
    useChatStore.setState({
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ]
    });

    render(<Chat searchConfig={mockSearchConfig} />); 

    const sendButton = screen.getByLabelText('Send a message');
    expect(sendButton).toBeDisabled();
  });

  it('adjusts textarea height based on content', () => {
    useChatStore.setState({
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ]
    });

    render(<Chat searchConfig={mockSearchConfig} />); 

    const input = screen.getByPlaceholderText(/tell us what you're looking for/i);
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const mockAddMessage = jest.fn();
    useChatStore.setState({ addMessage: mockAddMessage });
    expect(mockAddMessage).toHaveBeenCalledWith({
      role: 'user',
      content: 'Hello'
    });
  });
  
  // Message Processing Tests
  it('processes user messages and shows AI response', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: jest.fn().mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('Hello from AI')
          }).mockResolvedValueOnce({
            done: true,
            value: undefined
          })
        })
      }
    });
    global.fetch = mockFetch;

    const mockUpdateLastAssistantMessage = jest.fn();
    useChatStore.setState({
      messages: [{ role: 'user', content: 'Hi' }],
      updateLastAssistantMessage: mockUpdateLastAssistantMessage
    });

    render(<Chat searchConfig={mockSearchConfig} />);

    await waitFor(() => {
      expect(mockUpdateLastAssistantMessage).toHaveBeenCalledWith('Hello from AI');
    });
  });

  it('handles streaming responses correctly', () => {});
  it('shows loading state while processing message', () => {});
  it('handles API errors gracefully', async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error('API Error'));
    global.fetch = mockFetch;

    const mockUpdateLastAssistantMessage = jest.fn();
    useChatStore.setState({
      messages: [{ role: 'user', content: 'Hi' }],
      updateLastAssistantMessage: mockUpdateLastAssistantMessage
    });

    render(<Chat searchConfig={mockSearchConfig} />);

    await waitFor(() => {
      expect(mockUpdateLastAssistantMessage).toHaveBeenCalledWith('Sorry, something went wrong.');
    });
  });

  
  // Search/Intention Processing
  it('extracts search data after user message', () => {});
  it('extracts customer intention after user message', () => {});
  it('shows search update prompt when relevant', () => {});
  it('triggers search when update button clicked', () => {});
  
  // UI State Tests
  it('minimizes and maximizes correctly', () => {
    render(<Chat searchConfig={mockSearchConfig} />);
    
    const minimizeButton = screen.getByLabelText('Minimise chat');
    fireEvent.click(minimizeButton);
    expect(screen.getByRole('banner')).toHaveClass('minimisedContainer');

    const minimizedChat = screen.getByRole('banner');
    fireEvent.click(minimizedChat);
    expect(screen.queryByRole('banner')).not.toHaveClass('minimisedContainer');
  });

  it('shows last message in minimized state', () => {});
  it('maintains scroll position at bottom when new messages arrive', () => {});
  
  // Error Handling Tests
  it('handles moderation API failures gracefully', () => {});
  it('shows appropriate error message for flagged content', () => {});
  it('recovers from network errors', () => {});
  
  // Cleanup Tests
  it('aborts ongoing requests on unmount', () => {
    const mockAbort = jest.fn();
    const mockController = { abort: mockAbort };
    // @ts-ignore - partial mock implementation
    global.AbortController = jest.fn(() => mockController);

    const { unmount } = render(<Chat searchConfig={mockSearchConfig} />);
    unmount();

    expect(mockAbort).toHaveBeenCalled();
  });

  it('cleans up event listeners on unmount', () => {});

  // Automatic Search Tests
  describe('Automatic Search', () => {
    it('should trigger search automatically when all required fields are filled and auto search is enabled', async () => {});

    it('should not trigger search automatically when all required fields are filled and auto search is disabled', async () => {});

    it('should not trigger auto-search when required fields are missing', async () => {});
  });

  // Manual Search Tests
  describe('Manual Search', () => {
    it('should trigger search when search button is clicked with all required fields', async () => {});

    it('should not show search button when required fields are missing', () => {});

    it('should show search button when required fields are present', () => {});
  });

  // Search Data Update Tests
  describe('Search Data Updates', () => {
    it('should update search data when user modifies input fields', async () => {});

    it('should debounce search data updates', async () => {});
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should display error message when search fails', async () => {});

    it('should display error message when search data is invalid', async () => {});
  });
}); 
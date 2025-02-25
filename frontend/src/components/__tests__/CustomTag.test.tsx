import { render, screen, waitFor } from '@testing-library/react';
import CustomTag from '../CustomTag';
import { ContentGenerationResult } from '@chat-widget/utils';
import { useChatStore } from '../../store/chatStore';
import { useContentStore } from '../../store/contentStore';

describe('CustomTag', () => {
  const mockDefaultProps = {
    itemInformation: { name: 'Paris, France', description: 'City of art and haute cuisine.' },
    name: 'testTag',
    instructions: 'Write something simple and direct.'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset stores to initial state
    useContentStore.setState({
      generatedContent: {},
      setContent: jest.fn(),
      setStatusGenerating: jest.fn(),
      setStatusError: jest.fn(),
      removeGeneratedContent: jest.fn()
    });

    useChatStore.setState({
      customerIntention: {
        likes: ['travel'],
        priorities: ['comfort'],
        dislikes: []
      }
    });
  });

  it('generates content on mount if none exists in store', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve<ContentGenerationResult>({
        scenario: 'noMatchRequired',
        content: 'Generated content',
        explanation: 'Test explanation',
        metadata: {
          name: mockDefaultProps.name,
          customerIntentionUsed: ['travel'],
          characterCount: 100
        }
      })
    });
    global.fetch = mockFetch;

    render(<CustomTag {...mockDefaultProps} />);
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5001/api/generate-custom-content',
        expect.any(Object)
      );
    });
  });

  it('skips text generation if content exists in store', async () => {
    const contentKey = JSON.stringify({
      itemInformation: mockDefaultProps.itemInformation,
      name: mockDefaultProps.name,
      instructions: mockDefaultProps.instructions
    });

    useContentStore.setState({
      generatedContent: {
        [contentKey]: {
          content: 'Existing content',
          status: 'generated'
        }
      }
    });

    render(<CustomTag {...mockDefaultProps} />);
    const { setContent } = useContentStore.getState();
    
    await waitFor(() => {
      expect(setContent).not.toHaveBeenCalled();
    });
  });

  it('refuses to generate content when no customer intention exists', async () => {
    useChatStore.setState({
      customerIntention: {
        likes: [],
        priorities: [],
        dislikes: []
      }
    });

    render(<CustomTag {...mockDefaultProps} />);
    const { setStatusError } = useContentStore.getState();

    await waitFor(() => {
      expect(setStatusError).toHaveBeenCalled();
    });
  });

  it('handles strongMatchFailure scenario correctly', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        scenario: 'strongMatchFailure',
        content: null
      })
    });
    global.fetch = mockFetch;

    render(<CustomTag {...mockDefaultProps} strongMatchOnly={true} />);
    const { setStatusError } = useContentStore.getState();

    await waitFor(() => {
      expect(setStatusError).toHaveBeenCalled();
    });
  });

  it('regenerates content when customer intention changes', async () => {
    const mockSetContent = jest.fn();
    useContentStore.setState({
      generatedContent: {},
      setContent: mockSetContent,
      setStatusGenerating: jest.fn(),
      setStatusError: jest.fn(),
      removeGeneratedContent: jest.fn()
    });

    // Mock successful API response
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        scenario: 'noMatchRequired',
        content: 'Generated content',
        metadata: {}
      })
    });
    global.fetch = mockFetch;

    const { rerender } = render(
      <CustomTag {...mockDefaultProps} updateOnIntentionChange={true} />
    );

    // Wait for initial content generation
    await waitFor(() => {
      expect(mockSetContent).toHaveBeenCalledTimes(1);
    });

    // Change customer intention
    useChatStore.setState({
      customerIntention: {
        likes: ['travel', 'sports'],
        priorities: ['budget', 'comfort'],
        dislikes: ['expensive']
      }
    });

    rerender(<CustomTag {...mockDefaultProps} updateOnIntentionChange={true} />);

    // Wait for second content generation
    await waitFor(() => {
      expect(mockSetContent).toHaveBeenCalledTimes(2);
    });
  });

  it('does not regenerate content when intention changes (if updateOnIntentionChange is false)', async () => {
    const mockSetContent = jest.fn();
    useContentStore.setState({
      generatedContent: {},
      setContent: mockSetContent,
      setStatusGenerating: jest.fn(),
      setStatusError: jest.fn(),
      removeGeneratedContent: jest.fn()
    });

    // Mock successful API response
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        scenario: 'noMatchRequired',
        content: 'Generated content',
        metadata: {}
      })
    });
    global.fetch = mockFetch;

    const { rerender } = render(
      <CustomTag {...mockDefaultProps} updateOnIntentionChange={false} />
    );

    // Wait for initial content generation
    await waitFor(() => {
      expect(mockSetContent).toHaveBeenCalledTimes(1);
    });

    // Change customer intention
    useChatStore.setState({
      customerIntention: {
        likes: ['travel', 'sports'],
        priorities: ['budget', 'comfort'],
        dislikes: ['expensive']
      }
    });

    rerender(<CustomTag {...mockDefaultProps} updateOnIntentionChange={false} />);

    // Verify no additional content generation occurred
    await waitFor(() => {
      expect(mockSetContent).toHaveBeenCalledTimes(1);
    });
  });

  // Simple render tests
  it('renders with default props correctly', () => {
    useContentStore.setState({
      generatedContent: {
        [JSON.stringify(mockDefaultProps)]: {
          content: 'Test content',
          status: 'generated'
        }
      }
    });

    render(<CustomTag {...mockDefaultProps} />);
    const tagElement = screen.getByTestId('custom-tag');
    expect(tagElement).toHaveClass('tag');
  });

  it('renders with custom colors', () => {
    useContentStore.setState({
      generatedContent: {
        [JSON.stringify(mockDefaultProps)]: {
          content: 'Test content',
          status: 'generated'
        }
      }
    });

    const customColors = {
      ...mockDefaultProps,
      backgroundColor: '#ff0000',
      borderColor: '#0000ff'
    };
    
    render(<CustomTag {...customColors} />);
    const tagElement = screen.getByTestId('custom-tag');
    
    expect(tagElement).toHaveStyle({
      backgroundColor: '#ff0000',
      borderColor: '#0000ff'
    });
  });

  // Restore these tests after 'generates content on mount'
  it('returns null while generating content', async () => {
    const mockFetch = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    global.fetch = mockFetch;

    useContentStore.setState({
      generatedContent: {},
      setContent: jest.fn(),
      setStatusGenerating: jest.fn(),
      setStatusError: jest.fn(),
      removeGeneratedContent: jest.fn()
    });

    const { container } = render(<CustomTag {...mockDefaultProps} />);
    expect(container.textContent).toBe('');
  });

  it('returns null when API fails', async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error('API Error'));
    global.fetch = mockFetch;

    useContentStore.setState({
      generatedContent: {},
      setContent: jest.fn(),
      setStatusGenerating: jest.fn(),
      setStatusError: jest.fn(),
      removeGeneratedContent: jest.fn()
    });

    const { container } = render(<CustomTag {...mockDefaultProps} />);
    
    await waitFor(() => {
      expect(container.textContent).toBe('');
    });
  });

  it('renders without crashing', () => {
    useContentStore.setState({
      generatedContent: {
        [JSON.stringify(mockDefaultProps)]: {
          content: 'Test content',
          status: 'generated'
        }
      }
    });

    render(<CustomTag {...mockDefaultProps} />);
    expect(screen.getByTestId('custom-tag')).toBeInTheDocument();
  });

  // Add error boundary test back
  it('catches and handles render errors gracefully', () => {
    // Suppress console.error for this test
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Set up store with a state that will cause an error
    useContentStore.setState({
      generatedContent: {
        [JSON.stringify(mockDefaultProps)]: {
          content: undefined, // This will cause a render error when trying to access content
          status: 'generated'
        }
      },
      setContent: jest.fn(),
      setStatusGenerating: jest.fn(),
      setStatusError: jest.fn(),
      removeGeneratedContent: jest.fn()
    });

    // Render should not throw and component should handle error gracefully
    const { container } = render(<CustomTag {...mockDefaultProps} />);
    
    // Component should render null when encountering an error
    expect(container.firstChild).toBeNull();

    // Cleanup
    jest.restoreAllMocks();
  });
}); 

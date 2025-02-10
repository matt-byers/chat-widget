import React, { useState, useRef, useEffect } from 'react';
import './Chat.scss';
import { useChatStore } from './store/chatStore';

const Chat: React.FC = () => {
  const { 
    messages, 
    addMessage, 
    updateLastAssistantMessage,
    updateSearchData,
    updateCustomerIntention
  } = useChatStore();

  // Chat content
  const [input, setInput] = useState('');

  // UI states
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isTransparent, setIsTransparent] = useState(false);
  const [isMinimised, setIsMinimised] = useState(false);

  // Refs
  const chatControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') return; // Only process user messages

    const handleMessage = async () => {
      setIsStreaming(true);
      chatControllerRef.current = new AbortController();
      const lastMessage = messages[messages.length - 1].content;

      await moderateUserMessage(lastMessage);
      processExtraction();

      addMessage({ role: 'assistant', content: '' });

      try {
        const response = await fetch('http://localhost:5001/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages }),
          signal: chatControllerRef.current.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error('Network response was not ok');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;
        let botMessage = '';

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          const chunkValue = decoder.decode(value, { stream: true });

          if (chunkValue) {
            botMessage += chunkValue;
            updateLastAssistantMessage(botMessage);
          }
        }
      } catch (error) {
        console.error('Error in handleMessage:', error);
        updateLastAssistantMessage('Sorry, something went wrong.');
      } finally {
        setIsStreaming(false);
        chatControllerRef.current = null;
      }
    };

    handleMessage();
  }, [messages]);

  const moderateUserMessage = async (message: string) => {
    console.log('Checking moderation for:', message);

    const moderationResponse = await fetch('http://localhost:5001/api/moderate-user-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });

    if (!moderationResponse.ok) {
      throw new Error('Moderation request failed');
    }

    const moderationResult = await moderationResponse.json();
    console.log('Moderation result:', moderationResult);

    if (moderationResult.flagged) {
      console.log('Content flagged by moderation');
      addMessage({ role: 'assistant', content: "I can't help with that." });
      return;
    }

    console.log('Content passed moderation, proceeding with chat');
  };

  const processExtraction = async () => {
    if (messages.length === 0) return;

    setIsExtracting(true);
    const { searchData: currentSearchData, customerIntention: currentIntention } = useChatStore.getState();

    try {
      const [searchResponse, intentionResponse] = await Promise.all([
        fetch('http://localhost:5001/api/search-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            messages,
            currentData: currentSearchData  // Pass current search data
          }),
        }),
        fetch('http://localhost:5001/api/customer-intention', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            messages,
            currentData: currentIntention  // Pass current intention data
          }),
        })
      ]);

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        updateSearchData(searchData);
      }

      if (intentionResponse.ok) {
        const intentionData = await intentionResponse.json();
        updateCustomerIntention(intentionData);
      }
    } catch (error) {
      console.error('Error during extraction:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const currentInput = input;

    addMessage({ role: 'user', content: currentInput });
    setInput('');
    textareaRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  // Adjust the height of the textarea to fit the content
  useEffect(() => {
    const adjustHeight = () => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    };
    adjustHeight();
  }, [input]);

  // Scroll to the bottom of the chat window when a new message is sent
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight; // Scroll to the bottom
    }
  }, [messages]);

  const handleMinimise = () => {
    setIsMinimised(prev => !prev);
  };

  // Abort the chat stream when the component unmounts to prevent memory leaks
  useEffect(() => {
    return () => {
      if (chatControllerRef.current) {
        chatControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className={`wrapper ${isTransparent ? 'transparent' : ''} ${isMinimised ? 'minimised' : ''}`}>
      {isMinimised ? (
        <div 
          className="minimisedContainer" 
          role="banner" 
          aria-label="minimised chat"
          onClick={() => setIsMinimised(false)}          
        >
          <div className="minimisedMessage" tabIndex={0}>
            {messages.length > 0 && messages[messages.length - 1].role === 'assistant' ? 
            messages[messages.length - 1].content : ''}
          </div>
        </div>
      ) : (
        <>
          <div className={`container ${isTransparent ? 'transparent' : ''}`}>
            <div className="headerContainer " role="banner" aria-label="Chat header">
              <button
                aria-label="Minimise chat"
                onClick={handleMinimise}
                className={`button ${isTransparent ? 'grey' : 'transparent'}`}
                type="button"
              >
                <i className="iconWrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" className="svgIcon" viewBox="0 0 16 16">
                    <path fill="currentColor" fillRule="evenodd" d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" clipRule="evenodd"></path>
                  </svg>
                </i>
              </button>
            </div>
            <div
              className={`chatWindow ${isTransparent ? 'transparent' : ''}`}
              ref={chatWindowRef}
              tabIndex={0}
              aria-live="polite"
              aria-label="Chat messages"
            >
              {!messages.length && (
                <div className="openMessage">
                  Need help? Tell us what you think of these results and we will help you find what you want!
                </div>
              )}
              {messages
                .filter(msg => msg.role !== 'system') // Exclude system messages
                .map((msg, idx) => (
                  <div
                    key={idx}
                    className={`
                      message 
                      ${isTransparent ? 'transparent' : ''} 
                      ${msg.role === 'user' ? 'user' : 'assistant'}
                    `}
                    role="article" // Role to indicate a message
                    aria-label={`Message from ${msg.role}: ${msg.content}`} // Label for screen readers
                  >
                    {msg.content}
                  </div>
                ))}
              {isStreaming && (
                <div className="loadingSpinner">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                    <path fill="currentColor" d="M8 16a8 8 0 110-16 8 8 0 010 16zm0-1a7 7 0 100-14 7 7 0 000 14zM8 0a.75.75 0 01.75.75v6.5a.75.75 0 11-1.5 0V.75A.75.75 0 018 0z"></path>
                  </svg>
                </div>
              )}
            </div>
            <div className="inputContainer">
              <div className="inputWrapper">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  className="input"
                  placeholder={'Tell us what you\'re looking for...'}
                  rows={1}
                  aria-label="Message input"
                  required
                />
                <button
                  aria-label="Send a message"
                  onClick={handleSend}
                  className="button"
                  disabled={isStreaming}
                  type="button"
                >
                  <i className="iconWrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" className="svgIcon sendArrowUp" viewBox="0 0 16 16">
                      <path fill="currentColor" fillRule="evenodd" d="M7.4 1.899a.85.85 0 011.201 0l4.5 4.5a.85.85 0 11-1.201 1.201L8.85 4.552V13.5a.85.85 0 01-1.7 0V4.552L4.101 7.601a.85.85 0 11-1.201-1.202z" clipRule="evenodd"></path>
                    </svg>
                  </i>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Chat;
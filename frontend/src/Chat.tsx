import React, { useState, useRef, useEffect } from 'react';
import './Chat.scss';
import chatConfig from './chatConfig.json';

interface ChatProps {
  onSearchUpdate: (data: Record<string, any>) => void;
  onIntentionUpdate: (data: Record<string, any>) => void;
}

const Chat: React.FC<ChatProps> = ({ onSearchUpdate, onIntentionUpdate }) => {
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant' | 'system'; content: string }[]
  >([]);
  const [input, setInput] = useState('');
  const [searchData, setSearchData] = useState<Record<string, any>>({});
  const [customerIntention, setCustomerIntention] = useState<Record<string, any>>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isTransparent, setIsTransparent] = useState(true);
  const [isMinimised, setIsMinimised] = useState(true);

  const controllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null); // textarea ref to adjust its height
  const chatWindowRef = useRef<HTMLDivElement>(null); // chatwindow ref to handle scroll on new message

  // On component mount, set the system message with chatConfig data
  useEffect(() => {
    const { businessContext, userContext, instructions } = chatConfig;

    if (!businessContext || !userContext || !instructions) {
      throw new Error('Missing required fields in chatConfig: businessContext, userContext, or instructions');
    }

    const systemMessage = `You are an assistant helping to extract search information for a customer. ` +
      `These are your instructions: ${instructions}. ` +
      `This is the context of the business you are assisting: ${businessContext}. ` +
      `This is the context of how users are interacting with you: ${userContext})` +
      `If the user's message is completely unrelated to the businessContext or userContext, or if the message contains harmful or obscene content,ignore it and respond with something very short and witty, then ask the user if they want help with the relevant context.`;

    setMessages([{ role: 'system', content: systemMessage }]);
  }, []);

  // Handle message send and stream response on message array updated
  useEffect(() => {
    console.log('In messages useEffect');
    // Only proceed if the last message is from the user
    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') return;

    const handleMessage = async () => {
      console.log('Starting handleMessage');

      try {
        const lastMessage = messages[messages.length - 1].content;
        console.log('Checking moderation for:', lastMessage);

        // Check moderation before proceeding
        const moderationResponse = await fetch('http://localhost:5001/api/moderate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: lastMessage }),
        });

        if (!moderationResponse.ok) {
          throw new Error('Moderation request failed');
        }

        const moderationResult = await moderationResponse.json();
        console.log('Moderation result:', moderationResult);

        if (moderationResult.flagged) {
          console.log('Content flagged by moderation');
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: "I can't help with that."
          }]);
          return;
        }

        console.log('Content passed moderation, proceeding with chat');
        // Add bot's message placeholder
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
        setIsStreaming(true);
        controllerRef.current = new AbortController();

        const response = await fetch('http://localhost:5001/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messages }),
          signal: controllerRef.current.signal,
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

            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: botMessage };
              return updated;
            });
          }
        }
      } catch (error) {
        console.error('Error in handleMessage:', error);
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: 'Sorry, something went wrong.' };
          return updated;
        });
      } finally {
        console.log('Finishing handleMessage');
        setIsStreaming(false);
        controllerRef.current = null;
      }
    };

    handleMessage();
  }, [messages]);

  useEffect(() => {
    if (Object.keys(searchData).length > 0) {
      onSearchUpdate(searchData);
    }
  }, [searchData]);

  useEffect(() => {
    if (Object.keys(customerIntention).length > 0) {
      onIntentionUpdate(customerIntention);
    }
  }, [customerIntention]);

  const updateSearchData = (newData: Record<string, any>) => {
    console.log('Updating search data with:', newData);
    setSearchData(prevState => {
      const updatedData = { ...prevState };
  
      for (const key in newData) {
        if (newData[key] !== undefined && newData[key] !== null) {
          updatedData[key] = newData[key];
        }
      }
  
      console.log('Final search data:', updatedData);
      return updatedData;
    });
  };
  
  const updateCustomerIntention = (newData: Record<string, any>) => {
    console.log('Updating customer intention with:', newData);
    setCustomerIntention(prevState => {
      const updatedData = { ...prevState };
  
      for (const key in newData) {
        if (newData[key] !== undefined && newData[key] !== null) {
          updatedData[key] = newData[key];
        }
      }
  
      console.log('Final customer intention:', updatedData);
      return updatedData;
    });
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const currentInput = input;
  
    setMessages(prev => [...prev, { role: 'user', content: currentInput }]);
    setInput('');
  
    try {
      setIsExtracting(true);
      controllerRef.current = new AbortController();
  
      const [searchResponse, intentionResponse] = await Promise.all([
        fetch('http://localhost:5001/api/search-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: currentInput,
            searchData: chatConfig.searchData
          }),
          signal: controllerRef.current.signal,
        }),
        fetch('http://localhost:5001/api/customer-intention', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: currentInput,
            customerIntention: chatConfig.customerIntention
          }),
          signal: controllerRef.current.signal,
        })
      ]);
  
      if (!searchResponse.ok || !intentionResponse.ok) {
        throw new Error('Network response was not ok');
      }
  
      const [searchData, customerIntentionData] = await Promise.all([
        searchResponse.json(),
        intentionResponse.json()
      ]);
  
      updateSearchData(searchData);
      updateCustomerIntention(customerIntentionData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsExtracting(false);
      controllerRef.current = null;
    }
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

  return (
    <div className={`wrapper ${isTransparent ? 'transparent' : ''}`}>
      {isTransparent && (
        <div className="transparentShadow"></div>
      )}
      <div className={`container ${isTransparent ? 'transparent' : ''}`}>
        {!isTransparent && (
          <div className="headerContainer" role="banner" aria-label="Chat header">
            <button
              aria-label="Minimise chat"
              onClick={handleMinimise} // Correct handler
              className="button grey square"
              type="button"
            >
              <i className="iconWrapper">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="svgIcon"
                  viewBox="0 0 16 16"
                >
                  <path
                    fill="currentColor"
                    fillRule="evenodd"
                    d="M7.4 1.899a.85.85 0 011.201 0l4.5 4.5a.85.85 0 11-1.201 1.201L8.85 4.552V13.5a.85.85 0 01-1.7 0V4.552L4.101 7.601a.85.85 0 11-1.201-1.202z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </i>
            </button>
          </div>
        )}
        <div
          className="chatWindow"
          ref={chatWindowRef}
          tabIndex={0} // Make the chat window focusable
          aria-live="polite" // Announce updates to screen readers
          aria-label="Chat messages" // Provide context for screen readers
        >
          {messages.length === 1 && messages[0].role === 'system' && (
            <div className="openMessage">
              {chatConfig.openMessage}
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
        </div>
        <div className="inputContainer">
          <div className="inputWrapper">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="input"
              placeholder={chatConfig.chatPlaceHolder}
              disabled={isStreaming}
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="svgIcon"
                  viewBox="0 0 16 16"
                >
                  <path
                    fill="currentColor"
                    fillRule="evenodd"
                    d="M7.4 1.899a.85.85 0 011.201 0l4.5 4.5a.85.85 0 11-1.201 1.201L8.85 4.552V13.5a.85.85 0 01-1.7 0V4.552L4.101 7.601a.85.85 0 11-1.201-1.202z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
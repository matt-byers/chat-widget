import React, { useState, useRef, useEffect } from 'react';
import './Chat.scss';
import chatConfig from './chatConfig.json';

// TODO:
// 1. (Core functionality (search and refinement - core value proposition))
// CALL SEARCH ENDPOINT.
// Call Get item details endpoint. This is then fed into the conversation so the AI can update the search query based on feedback.
// Persist widget state and UI refresh and across page routes
// Set up moderation endpoint check for each user message (this is free from openAI).

// 2. Frontend (Basic working funcitonality - do before initial deployment for working demo)
// Open widget with custom placeholder message
// Create minimise method and create a minimised UI mode
// Fade messages out at top of chat window, and at bottom when scrolling
// Mobile web view - handle not exceeding width of page, shorter conversation height based on height of page

// 3. Deploy working MVP
// TBC

// ^ At this point, I should have a working MVP installable either by script tag or NPM package,

// --------------- POST INITIAL DEPLOYMENT OF MVP

// 3. UI & UX (Do after initial deployment)
// Handle not exceeding vertical height of page
// Disable submit button until response starts coming through.
// I need to figure out how to handle multiple messages being sent - maybe i wait and check if 
// the user is still typing, then send the messages array? open ai should respond to all as it has a history


const Chat: React.FC = () => {
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant' | 'system'; content: string }[]
  >([]);
  const [input, setInput] = useState('');
  const [structuredData, setStructuredData] = useState<Record<string, any>>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isTransparent, setIsTransparent] = useState(true);
  const controllerRef = useRef<AbortController | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null); // textarea ref to adjust its height
  const chatWindowRef = useRef<HTMLDivElement>(null); // chatwindow ref to handle scroll on new message

  // Check if the system message exists and is valid
  useEffect(() => {
    // Destructure necessary fields from chatConfig
    const { businessContext, userContext, instructions } = chatConfig;

    // Check if required data points are present
    if (!businessContext || !userContext || !instructions) {
      throw new Error('Missing required fields in chatConfig: businessContext, userContext, or instructions');
    }

    // Construct the system message
    const systemMessage = `You are an assistant helping to extract search information for a customer. ` +
      `These are your instructions: ${instructions}. ` +
      `This is the context of the business you are assisting: ${businessContext}. ` +
      `This is the context of how users are interacting with you: ${userContext})`;

    // Set the system message as the first message in the state
    setMessages([{ role: 'system', content: systemMessage }]);
  }, []); // Run only once on component mount


  // Handle message send and stream response on message array updated
  useEffect(() => {
    // Check if there are new user messages to process
    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') return;

    // TODO: See if theres another way to handle this, doesn't need to appear right away
    // Add bot's message placeholder. Won't be added to state until api call is made
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    const handleMessage = async () => {
      setIsStreaming(true);

      controllerRef.current = new AbortController();

      try {
        const response = await fetch('http://localhost:5001/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messages }), // Use the updated messages array
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

            // Update the last message (placeholder bot's message) with the new chunk
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content: botMessage };
              return updated;
            });
          }
        }
      } catch (error) {
        console.error('Error:', error);
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: 'Sorry, something went wrong.' };
          return updated;
        });
      } finally {
        setIsStreaming(false); // Reset streaming status
        controllerRef.current = null;
      }
    };

    handleMessage(); // Call handleMessage when there is a new user message
  }, [messages]); // Depend on messages array

  const updateStructuredData = (newData: { [key: string]: any }) => {
    setStructuredData(prevState => {
      const updatedData = { ...prevState }; // Create a copy of the current state

      for (const key in newData) {
        if (newData[key]) {
          updatedData[key] = newData[key]; // Update the value
        }
      }

      return updatedData; // Return the updated state
    });
  };

  const handleDataCapture = async (currentInput: String) => {
    if (!input.trim() || isExtracting) return;

    controllerRef.current = new AbortController();

    setIsExtracting(true);

    try {
      const response = await fetch('http://localhost:5001/api/structured-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: currentInput, structuredData: chatConfig.structuredData }),
        signal: controllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      updateStructuredData(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsExtracting(false);
      controllerRef.current = null;
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return; // Prevent sending empty messages
    const currentInput = input;

    // Update messages state with user message and clear input
    setMessages(prev => [...prev, { role: 'user', content: currentInput }]);
    setInput('');

    handleDataCapture(currentInput); // You can pass currentInput if needed
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevents adding a new line
      handleSend(); // Call your send function
    }
  };

  const adjustHeight = () => {
    if (textareaRef.current) {
      // Reset the height to auto to measure scrollHeight correctly
      textareaRef.current.style.height = 'auto';
      // Set the height to scrollHeight to make all text visible
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight(); // Adjust height whenever the input changes
  }, [input]);

  useEffect(() => {
    // Scroll to the bottom of the chat window when a new message is sent
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight; // Scroll to the bottom
    }
  }, [messages]); // Depend on messages array

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
              onClick={handleSend}
              className="button grey square"
              type="button"
            >
              <i className="iconWrapper">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="svgIcon" // Changed to className
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
            <div className="welcomeMessage">
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
              className="input" // Changed to className
              placeholder="Tell us what you're looking for..."
              disabled={isStreaming}
              rows={1}
              aria-label="Message input" // Label for the textarea
              required // Indicate that the input is required
            />
            <button
              aria-label="Send a message" // Clear label for screen readers
              onClick={handleSend}
              className="button" // Changed to className
              disabled={isStreaming}
              type="button" // Button type
            >
              <i className="iconWrapper"> {/* Changed to className */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="svgIcon" // Changed to className
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
import React, { useState, useRef, useEffect } from 'react';
import './Chat.scss';
import chatConfig from './chatConfig.json';

// TODO:
// - Update api calls to include chat history and correctly set system messages
// - Disable submit button until response starts coming through.
// 2. Open widget with custom placeholder message
// 3. Update prompt to factor in business context, page context

// 4. Play around with chat to see what functionality can be added, for ecomm product use case.
// 5. Intent recognition

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);
  const [input, setInput] = useState('');
  const [structuredData, setStructuredData] = useState<Record<string, any>>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null); // textarea ref to adjust its height
  const chatWindowRef = useRef<HTMLDivElement>(null); // chatwindow ref to handle scroll on new message


  useEffect(() => {
    // Check if there are new user messages to process
    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') return;

    // See if theres another way to handle this, doesn't need to appear right away
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
        // Optionally, update the UI to show an error message
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'Sorry, something went wrong.' },
        ]);
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

  const handleDataCapture = async () => {
    if (!input.trim() || isExtracting) return;

    controllerRef.current = new AbortController();

    setIsExtracting(true);

    try {
      const response = await fetch('http://localhost:5001/api/structured-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: input, structuredData: chatConfig.structuredData }),
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

    // Update messages state immediately to show the user's message
    setMessages(prev => [...prev, { role: 'user', content: input }]);

    // Clear input immediately after sending the message
    setInput(''); // Clear input field

    // Call handleDataCapture
    await handleDataCapture();
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
    <div className="wrapper">
      <div className="container">
        <div className="headerContainer" role="banner" aria-label="Chat header"></div>
        <div 
          className="chatWindow" 
          ref={chatWindowRef} 
          tabIndex={0} // Make the chat window focusable
          aria-live="polite" // Announce updates to screen readers
          aria-label="Chat messages" // Provide context for screen readers
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message ${msg.role === 'user' ? 'user' : 'assistant'}`} // Using classes for styles
              role="article" // Role to indicate a message
              aria-label={`Message from ${msg.role}: ${msg.content}`} // Informative label for screen readers
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
              placeholder="Type your message..."
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
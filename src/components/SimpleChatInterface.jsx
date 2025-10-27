import { useState, useEffect, useRef } from 'react'

// Function to format bot response text
const formatBotResponse = (text) => {
  // Keep markdown formatting for bold text (venue names)
  let formatted = text.trim()

  // Logic for formatting numbered lists (Kept from original code)
  if (formatted.includes('1.') && formatted.includes('2.')) {
    const parts = formatted.split(/(\d+\.\s)/)
    let result = ''
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (/^\d+\.\s$/.test(part)) {
        result += '\n\n' + part
      } else if (i > 0 && /^\d+\.\s$/.test(parts[i - 1])) {
        result += part.trim()
      } else if (i === 0) {
        result += part
      } else {
        result += part
      }
    }
    return result.replace(/^\n+/, '').trim()
  }

  // Add proper line breaks
  formatted = formatted
    .replace(/\. ([A-Z])/g, '.\n$1')
    .replace(/: /g, ':\n')
    .replace(/\n\n+/g, '\n')
    .replace(/USA /g, 'USA\n')

  return formatted
}

// Function to render markdown text with bold formatting
const renderMarkdownText = (text) => {
  // Split text by ** markers and render bold parts
  const parts = text.split(/(\*\*.*?\*\*)/g)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Remove ** and make bold
      const boldText = part.slice(2, -2)
      return <strong key={index}>{boldText}</strong>
    }
    return part
  })
}

// Main App Component (Single File Mandate)
export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <SimpleChatInterface onMessageSent={() => {}} isAnalyzing={false} />
    </div>
  )
}

function SimpleChatInterface({ onMessageSent, isAnalyzing }) {
  const chatContainerRef = useRef(null)

  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "Yo! 🤘 What's the vibe today?\n\nFind out more about Austin rides",
      timestamp: new Date(),
      showSuggestions: false
    }
  ])

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Mock function for Firebase/Auth setup (not used, but good for context)
  // useEffect(() => {
  //   const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  //   const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
  //   console.log('Firebase initialized with App ID:', appId);
  // }, []);


  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim() || isAnalyzing) return

    const currentMessage = message

    // Clear input immediately and add user message
    setMessage('')
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: currentMessage,
      timestamp: new Date()
    }

    // Add user message
    setMessages(prev => [...prev, userMessage])

    // Add typing indicator immediately
    const typingIndicator = {
      id: Date.now() + 1,
      type: 'typing',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, typingIndicator])

    // Send to n8n chat webhook
    try {
      // Using a placeholder webhook URL for safety
      const webhookUrl = 'https://fetii.app.n8n.cloud/webhook/1203a737-5c17-4c8e-9730-37dc59e8f34e/chat';
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Instance-Id': 'ba73b045ac7d7333b3dfb3e503856b4f743c88298667ae3bf3ee07e668bc12',
        },
        body: JSON.stringify({
          chatInput: currentMessage,
          sessionId: 'web-session-' + Date.now(),
          action: 'sendMessage',
        })
      })

      if (response.ok) {
        const data = await response.json()

        // Remove typing indicator and add bot response
        setMessages(prev => {
          const withoutTyping = prev.filter(msg => msg.type !== 'typing')
          const cleanText = formatBotResponse(data.output || data.message || 'Response received successfully.')

          const botMessage = {
            id: Date.now() + 2,
            type: 'bot',
            text: cleanText,
            timestamp: new Date()
          }
          return [...withoutTyping, botMessage]
        })

        // Trigger map/chart updates
        if (onMessageSent && data.output) {
          onMessageSent(data.output)
        }
      } else {
        // --- FIX 1: Template literal must be enclosed in backticks (`) ---
        throw new Error(`HTTP ${response.status}`)
      }

    } catch (error) {
      console.error('Error sending message:', error)

      // Remove typing indicator and add error message
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => msg.type !== 'typing')
        const errorMessage = {
          id: Date.now() + 2,
          type: 'bot',
          text: 'Sorry, there was an error processing your request. Please try again.',
          timestamp: new Date()
        }
        return [...withoutTyping, errorMessage]
      })
    }
  }

  return (
    <>
      <style>{`
        /* Tailwind is assumed to be available */
        .chat-interface {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 420px;
          height: 90vh;
          max-height: 800px;
          border-radius: 1.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          background-color: #ffffff;
          overflow: hidden;
        }
        .chat-header {
          padding: 1rem;
          background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%); /* Purple Gradient */
          color: white;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .chat-logo {
          width: 80px;
          height: auto;
          filter: brightness(0) invert(1);
        }
        .chat-messages {
          flex-grow: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background-color: #f9fafb;
        }
        .message {
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.4;
          position: relative;
          max-width: 85%;
        }
        .message-content {
          white-space: pre-wrap;
        }
        .message.user {
          background-color: #8b5cf6; /* Main brand color */
          color: white;
          border-bottom-right-radius: 4px;
          align-self: flex-end;
          margin-left: auto;
        }
        .message.bot {
          background-color: #e5e7eb;
          color: #1f2937;
          border-bottom-left-radius: 4px;
          align-self: flex-start;
          margin-right: auto;
        }
        .message-time {
          font-size: 10px;
          opacity: 0.6;
          margin-top: 4px;
          text-align: right;
          color: inherit;
        }
        .message.bot .message-time {
          text-align: left;
        }
        
        /* Typing Indicator CSS */
        .loading-message {
          min-height: 24px;
          align-items: center;
          gap: 8px;
        }
        .typing-indicator span {
          display: inline-block;
          width: 8px;
          height: 8px;
          background-color: #8b5cf6;
          border-radius: 50%;
          margin: 0 2px;
          animation: bounce 1.2s infinite ease-in-out;
        }
        .typing-indicator span:nth-child(2) {
          animation-delay: -0.4s;
        }
        .typing-indicator span:nth-child(3) {
          animation-delay: -0.8s;
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }

        .chat-input-form {
          display: flex;
          padding: 1rem;
          border-top: 1px solid #e5e7eb;
          background-color: #ffffff;
        }
        .chat-input {
          flex-grow: 1;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 9999px;
          font-size: 16px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .chat-input:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
        }
        .send-btn {
          margin-left: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border: none;
          border-radius: 9999px;
          font-size: 18px;
          cursor: pointer;
          transition: transform 0.1s, opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .send-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .send-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: #d1d5db;
        }
      `}</style>
      <div className="chat-interface">
        {/* Header */}
        <div className="chat-header">
          {/* Using a placeholder image URL */}
          <img
            src="https://placehold.co/80x40/8b5cf6/ffffff?text=FETII+AI"
            alt="Fetii AI"
            className="chat-logo"
            // Adding a filter to make the text visible against the purple background
            style={{ filter: 'none', borderRadius: '4px' }}
          />
        </div>

        {/* Messages */}
        <div className="chat-messages" ref={chatContainerRef}>
          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                marginRight: msg.type === 'user' ? '0' : 'auto',
                marginLeft: msg.type === 'user' ? 'auto' : '0'
              }}
            >
              {msg.type === 'typing' ? (
                <div className="message bot">
                  <div className="message-content loading-message" style={{ minWidth: '120px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span style={{
                      fontSize: '12px',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      whiteSpace: 'nowrap',
                      fontWeight: '600'
                    }}>
                      Thinking...
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {/* --- FIX 2: Template literal must be enclosed in backticks (`) --- */}
                  <div className={`message ${msg.type}`}>
                    <div className="message-content">
                      {renderMarkdownText(msg.text)}
                    </div>
                    <div className="message-time">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>


                </>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="chat-input-form">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about Austin ride data..."
            disabled={isAnalyzing}
            className="chat-input"
          />

          <button
            type="submit"
            disabled={!message.trim() || isAnalyzing}
            className="send-btn"
          >
            ➤
          </button>
        </form>

      </div>


    </>
  )

}

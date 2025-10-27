import { useState, useEffect, useRef } from 'react'

// --- CONSTANTS ---
// The webhook path for the primary Webhook node (e75301a4-2613-46cf-8a43-d681659cdd0d)
// ElevenLabs Agent ID (Retained from your original code)


// Function to format bot response text (Kept for consistency)
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

function SimpleChatInterface({ onMessageSent, isAnalyzing }) {

  const chatContainerRef = useRef(null)

  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Yo! 🤘 What\'s the vibe today?\n\nI\'ve got the inside scoop on where Austin gets wild - from late-night taco runs to where the cool kids hang out! 🌮✨',
      timestamp: new Date(),
      showSuggestions: true
    }
  ])

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])




  const sampleQueries = [
    "What are the top 5 drop-off locations? 📍",
    "Show me the busiest pickup spots 🚗",
    "What are the peak hours for rides? ⏰",
    "Find popular entertainment destinations 🎵"
  ]

  const handleSuggestionClick = (query) => {
    setMessage(query)
    // Auto-submit the query
    setTimeout(() => {
      const form = document.querySelector('form')
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
      }
    }, 100)
  }


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

    // Hide suggestions after first user message and add message
    setMessages(prev => {
      const updated = prev.map(msg =>
        msg.showSuggestions ? { ...msg, showSuggestions: false } : msg
      )
      return [...updated, userMessage]
    })

    // Add typing indicator immediately
    const typingIndicator = {
      id: Date.now() + 1,
      type: 'typing',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, typingIndicator])

    // Send to n8n chat webhook
    try {
      const response = await fetch('/webhook/1203a737-5c17-4c8e-9730-37dc59e8f34e/chat', {
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
      <div className="chat-interface">
        {/* Header */}
        <div className="chat-header">
          <img
            src="/fetii-logo.png"
            alt="Fetii AI"
            className="chat-logo"
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
                  <div className={`message ${msg.type}`}>
                    <div className="message-content">
                      {renderMarkdownText(msg.text)}
                    </div>
                    <div className="message-time">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Show sample queries for the first bot message */}
                  {msg.showSuggestions && (
                    <div style={{
                      marginTop: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      {sampleQueries.map((query, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(query)}
                          style={{
                            padding: '12px 16px',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            border: 'none',
                            borderRadius: '20px',
                            fontSize: '13px',
                            color: 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                            fontWeight: '500'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)'
                            e.target.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)'
                            e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)'
                          }}
                        >
                          {query}
                        </button>
                      ))}
                    </div>
                  )}
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

          {/* REMOVED CUSTOM VOICE BUTTON */}

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

export default SimpleChatInterface
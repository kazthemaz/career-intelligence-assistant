import { useState, useRef, useEffect } from "react"
import axios from "axios"

interface Document {
  doc_id: string
  doc_type: string
  label: string
}

interface Message {
  role: "user" | "assistant"
  content: string
}

interface Props {
  documents: Document[]
}

export default function ChatInterface({ documents }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage: Message = { role: "user", content: input }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await axios.post("/api/chat", {
        question: input
      })
      const assistantMessage: Message = {
        role: "assistant",
        content: response.data.answer
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Something went wrong. Please try again."
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const hasDocuments = documents.length > 0

  return (
    <div className="chat-container">
      <div className="messages">
        {!hasDocuments && (
          <div className="empty-state">
            <p>Upload your CV and at least one job description to get started.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="message-content">
              <pre>{msg.content}</pre>
            </div>
          </div>
        ))}

        {loading && (
          <div className="message assistant">
            <div className="message-content">
              <p className="thinking">Analysing your documents...</p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <textarea
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            hasDocuments
              ? "Ask about your CV fit, skill gaps, or interview prep..."
              : "Upload documents first..."
          }
          disabled={!hasDocuments || loading}
          rows={3}
        />
        <button
          className="send-btn"
          onClick={sendMessage}
          disabled={!hasDocuments || loading || !input.trim()}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  )
}

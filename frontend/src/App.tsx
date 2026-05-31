import { useState, useEffect, useRef } from "react"
import DocumentUpload from "./components/DocumentUpload"
import ChatInterface from "./components/ChatInterface"
import "./App.css"

interface Document {
  doc_id: string
  doc_type: string
  label: string
}

function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const fontSize = 13
    const cols = Math.floor(canvas.width / fontSize)
    const drops = Array(cols).fill(1).map(() => Math.random() * -50)
    const chars = "0123456789ABCDEF01アイウエオカキクケコ".split("")

    const draw = () => {
      ctx.fillStyle = "rgba(18,18,18,0.06)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        const b = Math.random()
        ctx.fillStyle =
          b > 0.95
            ? "rgba(255,180,180,0.9)"
            : b > 0.7
            ? "rgba(226,75,74,0.55)"
            : "rgba(110,25,25,0.3)"
        ctx.font = fontSize + "px monospace"
        ctx.fillText(char, i * fontSize, drops[i] * fontSize)
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975)
          drops[i] = 0
        drops[i]++
      }
    }

    const interval = setInterval(draw, 45)
    return () => clearInterval(interval)
  }, [])

  return <canvas ref={canvasRef} className="matrix-canvas" />
}

function App() {
  const [documents, setDocuments] = useState<Document[]>([])

  return (
    <div className="app">
      <MatrixRain />

      <div className="app-inner">
        <header className="app-header">
          <div className="logo-dots">
            <span className="dot dot-1"></span>
            <span className="dot dot-2"></span>
            <span className="dot dot-3"></span>
          </div>
          <h1>Career Intelligence Assistant</h1>
          <p>Upload your CV and job descriptions, then ask anything.</p>
        </header>

        <div className="steps-bar">
          <div className="step">
            <span className="step-num">1</span>
            <span className="step-text"><strong>Upload your CV</strong> as a PDF</span>
          </div>
          <div className="step-sep"></div>
          <div className="step">
            <span className="step-num">2</span>
            <span className="step-text"><strong>Add job descriptions</strong> you are targeting</span>
          </div>
          <div className="step-sep"></div>
          <div className="step">
            <span className="step-num">3</span>
            <span className="step-text"><strong>Ask anything</strong> about your fit</span>
          </div>
        </div>

        <main className="app-main">
          <aside className="sidebar">
            <DocumentUpload documents={documents} setDocuments={setDocuments} />
          </aside>
          <section className="chat-section">
            <ChatInterface documents={documents} />
          </section>
        </main>
      </div>
    </div>
  )
}

export default App

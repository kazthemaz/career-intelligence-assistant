import { useState } from "react"
import DocumentUpload from "./components/DocumentUpload"
import ChatInterface from "./components/ChatInterface"
import "./App.css"

interface Document {
  doc_id: string
  doc_type: string
  label: string
}

function App() {
  const [documents, setDocuments] = useState<Document[]>([])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Career Intelligence Assistant</h1>
        <p>Upload your CV and job descriptions, then ask anything.</p>
      </header>

      <main className="app-main">
        <aside className="sidebar">
          <DocumentUpload
            documents={documents}
            setDocuments={setDocuments}
          />
        </aside>

        <section className="chat-section">
          <ChatInterface documents={documents} />
        </section>
      </main>
    </div>
  )
}

export default App

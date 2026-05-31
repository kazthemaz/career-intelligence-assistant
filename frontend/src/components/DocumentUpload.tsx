import { useState, useRef } from "react"
import axios from "axios"

interface Document {
  doc_id: string
  doc_type: string
  label: string
}

interface Props {
  documents: Document[]
  setDocuments: (docs: Document[]) => void
}

export default function DocumentUpload({ documents, setDocuments }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const resumeRef = useRef<HTMLInputElement>(null)
  const jdRef = useRef<HTMLInputElement>(null)

  const jobDescriptionCount = documents.filter(
    d => d.doc_type === "job_description"
  ).length

  async function uploadFile(file: File, docType: string) {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("doc_type", docType)
    formData.append("doc_index", String(jobDescriptionCount + 1))

    const response = await axios.post("/api/upload", formData)
    return response.data
  }

  async function handleUpload(file: File, docType: string) {
    setUploading(true)
    setError(null)
    try {
      const result = await uploadFile(file, docType)
      const newDoc: Document = {
        doc_id: result.doc_id,
        doc_type: result.doc_type,
        label: result.label
      }
      setDocuments([...documents, newDoc])
    } catch (err) {
      const axiosError = err as { response?: { data?: { detail?: string } } }
      setError(axiosError?.response?.data?.detail || "Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  async function deleteDocument(docId: string) {
    try {
      await axios.delete(`/api/documents/${docId}`)
      setDocuments(documents.filter(d => d.doc_id !== docId))
    } catch {
      setError("Failed to delete document.")
    }
  }

  return (
    <div className="upload-panel">
      <h2>Documents</h2>

      <div className="upload-section">
        <p className="upload-label">CV / Resume</p>
        <input
          ref={resumeRef}
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleUpload(file, "resume")
          }}
        />
        <button
          className="upload-btn"
          onClick={() => resumeRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload CV"}
        </button>
      </div>

      <div className="upload-section">
        <p className="upload-label">Job Descriptions</p>
        <input
          ref={jdRef}
          type="file"
          accept=".pdf"
          style={{ display: "none" }}
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleUpload(file, "job_description")
          }}
        />
        <button
          className="upload-btn"
          onClick={() => jdRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Add Job Description"}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

      {documents.length > 0 && (
        <div className="document-list">
          <p className="upload-label">Loaded documents</p>
          {documents.map(doc => (
            <div key={doc.doc_id} className="document-item">
              <div>
                <p className="doc-label">{doc.label}</p>
                <p className="doc-type">
                  {doc.doc_type === "resume" ? "CV" : "Job Description"}
                </p>
              </div>
              <button
                className="delete-btn"
                onClick={() => deleteDocument(doc.doc_id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

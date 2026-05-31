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

  const resume = documents.find(d => d.doc_type === "resume")
  const jobDescriptions = documents.filter(d => d.doc_type === "job_description")

  return (
    <div className="upload-panel">

      <div className="sidebar-section">
        <h2>Your CV</h2>

        {resume && (
          <div className="document-item">
            <div className="doc-icon">📄</div>
            <div>
              <p className="doc-label">{resume.label}</p>
              <p className="doc-type">Resume</p>
            </div>
            <button
              className="delete-btn"
              onClick={() => deleteDocument(resume.doc_id)}
            >
              ✕
            </button>
          </div>
        )}

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
          {resume ? (uploading ? "Uploading..." : "Replace CV") : (uploading ? "Uploading..." : "Upload CV")}
        </button>
      </div>

      <div className="sidebar-section">
        <h2>Job Descriptions</h2>

        {jobDescriptions.map(doc => (
          <div key={doc.doc_id} className="document-item">
            <div className="doc-icon">💼</div>
            <div>
              <p className="doc-label">{doc.label}</p>
              <p className="doc-type">Job Description</p>
            </div>
            <button
              className="delete-btn"
              onClick={() => deleteDocument(doc.doc_id)}
            >
              ✕
            </button>
          </div>
        ))}

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
          {uploading ? "Uploading..." : "Add job description"}
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}

    </div>
  )
}

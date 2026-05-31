import os
import uuid
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from rag import ingest_document, retrieve_relevant_chunks, list_documents
from chat import ask_claude, extract_document_label

load_dotenv()

app = FastAPI(title="Career Intelligence Assistant")

# Allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory conversation history per session
# In production this would be stored in a database
conversation_history = []


class ChatRequest(BaseModel):
    """Schema for incoming chat messages."""
    question: str


@app.get("/health")
def health_check():
    """Confirm the API is running."""
    return {"status": "ok"}


@app.get("/documents")

def get_documents():
    """Return all documents currently stored in ChromaDB."""
    try:
        documents = list_documents()
        return {"documents": documents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form(...),
    doc_index: int = Form(default=1)
):
    """
    Upload a PDF document and ingest it into ChromaDB.

    doc_type: 'resume' or 'job_description'
    doc_index: used to generate fallback label e.g. Job Description 1
    """
    # Validate file type
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported. Please convert your document to PDF first."
        )

    file_bytes = await file.read()

    # Generate a unique ID for this document
    doc_id = str(uuid.uuid4())

    # Build fallback label in case extraction fails
    if doc_type == "resume":
        fallback_label = "Resume"
    else:
        fallback_label = f"Job Description {doc_index}"

    # Attempt to extract a meaningful label from the document content
    from rag import extract_text_from_pdf, chunk_text
    text = extract_text_from_pdf(file_bytes)
    first_chunk = text[:1000] if text else ""
    label = extract_document_label(first_chunk, doc_type, fallback_label)

    # Ingest the document into ChromaDB
    chunk_count = ingest_document(file_bytes, doc_id, doc_type, label)

    return {
        "doc_id": doc_id,
        "label": label,
        "doc_type": doc_type,
        "chunks_stored": chunk_count
    }


@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Receive a question, retrieve relevant context, and return Claude's answer.
    Maintains conversation history for multi-turn dialogue.
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # Retrieve the most relevant document chunks for this question
    chunks = retrieve_relevant_chunks(request.question)

    # Ask Claude using the retrieved context and conversation history
    answer = ask_claude(request.question, chunks, conversation_history)

    return {"answer": answer}


@app.delete("/documents/{doc_id}")
def delete_document(doc_id: str):
    """Remove a document and all its chunks from ChromaDB."""
    try:
        from rag import collection
        # Delete all chunks belonging to this document
        results = collection.get(where={"doc_id": doc_id})
        if not results["ids"]:
            raise HTTPException(status_code=404, detail="Document not found.")
        collection.delete(ids=results["ids"])
        return {"message": f"Document {doc_id} deleted successfully."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

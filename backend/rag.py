import os
import fitz  # PyMuPDF - imported as fitz for historical reasons
import chromadb
from chromadb.utils import embedding_functions
from dotenv import load_dotenv

# Load environment variables from .env file into the application
load_dotenv()


# Initialise ChromaDB with persistent local storage
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# Use sentence-transformers for embeddings - free, runs locally, no API key needed
embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)

# Single collection for all documents, metadata distinguishes type
collection = chroma_client.get_or_create_collection(
    name="career_documents",
    embedding_function=embedding_fn
)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract plain text from a PDF file given its raw bytes."""
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """
    Split text into overlapping chunks.
    Overlap ensures context is not lost at chunk boundaries.
    """
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks


def ingest_document(file_bytes: bytes, doc_id: str, doc_type: str, label: str) -> int:
    """
    Process a document and store its chunks in ChromaDB.

    doc_type: 'resume' or 'job_description'
    label: human readable name e.g. 'My Resume' or 'Senior Engineer at Acme'
    Returns the number of chunks stored.
    """
    text = extract_text_from_pdf(file_bytes)
    chunks = chunk_text(text)

    # Build unique IDs and metadata for each chunk
    ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [
        {
            "doc_id": doc_id,
            "doc_type": doc_type,
            "label": label,
            "chunk_index": i
        }
        for i in range(len(chunks))
    ]

    collection.upsert(
        ids=ids,
        documents=chunks,
        metadatas=metadatas
    )

    return len(chunks)


def retrieve_relevant_chunks(query: str, n_results: int = 5) -> list[dict]:
    """
    Find the most semantically similar chunks to the query.
    Returns chunks with their metadata so Claude knows which document they came from.
    """
    results = collection.query(
        query_texts=[query],
        n_results=n_results
    )

    chunks = []
    for i, doc in enumerate(results["documents"][0]):
        chunks.append({
            "content": doc,
            "metadata": results["metadatas"][0][i]
        })

    return chunks


def list_documents() -> list[dict]:
    """Return a unique list of documents currently stored in the collection."""
    results = collection.get()
    seen = set()
    documents = []

    for metadata in results["metadatas"]:
        doc_id = metadata["doc_id"]
        if doc_id not in seen:
            seen.add(doc_id)
            documents.append({
                "doc_id": doc_id,
                "doc_type": metadata["doc_type"],
                "label": metadata["label"]
            })

    return documents

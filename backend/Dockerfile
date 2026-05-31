# Base Python image, slim keeps the container size small
FROM python:3.11-slim

# Set working directory inside the container
WORKDIR /app

# Copy and install dependencies first
# This layer is cached by Docker so rebuilds are faster
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Document the port this container listens on
EXPOSE 8000

# Start the FastAPI server with hot reload for development
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

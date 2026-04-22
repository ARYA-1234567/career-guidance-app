# Backend Production
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies for PostgreSQL
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend dependencies and install
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt
RUN pip install --no-cache-dir uvicorn

# Copy backend code
# Note: Render will have the root of the repo as the context
COPY backend/ ./backend/

# Set environment variables
ENV PYTHONPATH=/app/backend
ENV PORT=10000

# Expose port (Render uses $PORT, but we'll default to 10000)
EXPOSE 10000

# Start the application
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "10000"]

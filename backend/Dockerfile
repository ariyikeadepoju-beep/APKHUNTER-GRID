FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy all files from build context
COPY . .

# If built from repository root (where backend/ directory exists), move files into working directory
RUN if [ -d "backend" ]; then \
      cp -r backend/* . 2>/dev/null || true; \
    fi && \
    pip install --no-cache-dir -r requirements.txt email-validator

ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

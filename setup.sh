#!/bin/bash
set -e

echo "Starting Ollama..."
docker compose up -d

echo "Waiting for Ollama to be ready..."
until curl -s http://localhost:11434/api/tags > /dev/null 2>&1; do
  sleep 1
done

echo "Pulling model (this may take a minute on first run)..."
docker compose exec ollama ollama pull qwen2.5:3b

echo ""
echo "Ready! Ollama is running at http://localhost:11434"
echo "OpenAI-compatible endpoint: http://localhost:11434/v1/chat/completions"
echo "Model: qwen2.5:3b"

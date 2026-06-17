#!/bin/bash
set -e
cd "$(dirname "$0")/.."
docker compose up -d --build
echo "prelegal running at http://localhost:8000"

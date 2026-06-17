$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
docker compose up -d --build
Write-Host "prelegal running at http://localhost:8000"

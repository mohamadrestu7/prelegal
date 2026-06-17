from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

import database

STATIC_DIR = Path("static")


@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()
    yield


app = FastAPI(lifespan=lifespan)

# API routes must be declared before the static files mount
@app.get("/api/health")
def health():
    return {"status": "ok"}


# Serve static Next.js export — mount last so API routes take precedence
if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

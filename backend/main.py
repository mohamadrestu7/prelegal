import json
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from openai import AsyncOpenAI
from pydantic import BaseModel

import database

load_dotenv(Path(__file__).parent.parent / ".env")

STATIC_DIR = Path("static")

SYSTEM_PROMPT = """You are a legal assistant helping users complete a Mutual Non-Disclosure Agreement (MNDA).

Your job:
1. Converse naturally to collect the information needed to fill in all MNDA fields.
2. Ask for one or two pieces of information at a time — do not present a long list of questions.
3. After each exchange, return your conversational reply AND the complete updated state of all 18 MNDA fields.

Fields you are filling:
- purpose: How Confidential Information may be used
- effectiveDate: ISO date string YYYY-MM-DD, or empty string if unknown
- mndaTermType: "fixed" or "at-will"
- mndaTermYears: numeric string (e.g. "1"), relevant only when mndaTermType is "fixed"
- confidentialityTermType: "fixed" or "perpetual"
- confidentialityTermYears: numeric string, relevant only when confidentialityTermType is "fixed"
- governingLaw: state whose laws govern (e.g. "Delaware")
- jurisdiction: where disputes are resolved (e.g. "courts located in New Castle, DE")
- modifications: any modifications to standard terms, or empty string
- party1PrintName, party1Title, party1Company, party1Address
- party2PrintName, party2Title, party2Company, party2Address

Rules:
- Always return ALL 18 fields. Preserve current values for any fields not yet discussed.
- Never invent information the user has not provided.
- Dates must be YYYY-MM-DD or empty string. Year values must be digit strings like "1" or "2".
- Be concise, professional, and friendly."""


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    currentFields: dict


class MndaFields(BaseModel):
    purpose: str
    effectiveDate: str
    mndaTermType: Literal["fixed", "at-will"]
    mndaTermYears: str
    confidentialityTermType: Literal["fixed", "perpetual"]
    confidentialityTermYears: str
    governingLaw: str
    jurisdiction: str
    modifications: str
    party1PrintName: str
    party1Title: str
    party1Company: str
    party1Address: str
    party2PrintName: str
    party2Title: str
    party2Company: str
    party2Address: str


class MndaChatResponse(BaseModel):
    reply: str
    fields: MndaFields


@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()
    yield


openai_client = AsyncOpenAI()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# API routes must be declared before the static files mount
@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/chat/mnda")
async def chat_mnda(req: ChatRequest):
    system_content = (
        f"{SYSTEM_PROMPT}\n\n"
        f"Current MNDA field values (preserve unchanged fields):\n"
        f"{json.dumps(req.currentFields, indent=2)}"
    )
    messages: list[dict] = [{"role": "system", "content": system_content}]

    if req.messages:
        messages += [{"role": m.role, "content": m.content} for m in req.messages]
    else:
        # Opening call: seed with a start message so the AI generates a greeting
        messages.append({"role": "user", "content": "Hello, I need to create a Mutual NDA."})

    completion = await openai_client.chat.completions.parse(
        model="gpt-4.1-2025-04-14",
        messages=messages,
        response_format=MndaChatResponse,
    )

    result = completion.choices[0].message.parsed
    if result is None:
        raise HTTPException(status_code=500, detail="AI declined to respond")

    return result


# Serve static Next.js export — mount last so API routes take precedence
if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

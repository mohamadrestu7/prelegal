import json
import re
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from fastapi.staticfiles import StaticFiles
from openai import AsyncOpenAI
from pydantic import BaseModel

import database

load_dotenv(Path(__file__).parent.parent / ".env")

STATIC_DIR = Path("static")
TEMPLATES_DIR = Path(__file__).parent.parent / "templates"

# ── Template / catalog data loaded at startup ──────────────────────────────

CATALOG: list[dict] = []
TEMPLATE_CONTENTS: dict[str, str] = {}
DOCUMENT_FIELDS: dict[str, list[str]] = {}

FIELD_LINK_CLASSES = {
    "coverpage_link", "keyterms_link", "orderform_link",
    "businessterms_link", "sow_link",
}

# Fields not captured by span extraction but important for the document
EXTRA_FIELDS: dict[str, list[str]] = {
    "Mutual-NDA.md": [
        "Party 1 Name", "Party 1 Title", "Party 1 Company", "Party 1 Address",
        "Party 2 Name", "Party 2 Title", "Party 2 Company", "Party 2 Address",
        "Modifications",
    ],
}


_SMART_QUOTE_TABLE = str.maketrans("‘’′″", "''\"\"")


def _normalize_name(s: str) -> str:
    """Normalize smart quotes to ASCII equivalents in a field name."""
    return s.translate(_SMART_QUOTE_TABLE).strip()


def _extract_span_fields(content: str) -> list[str]:
    seen: set[str] = set()
    fields: list[str] = []
    for cls, name in re.findall(r'<span class="([^"]+)">([^<]+)</span>', content):
        name = _normalize_name(name)
        if cls in FIELD_LINK_CLASSES and name not in seen:
            seen.add(name)
            fields.append(name)
    return fields


def _load_catalog_and_templates() -> None:
    catalog_path = TEMPLATES_DIR.parent / "catalog.json"
    if catalog_path.exists():
        CATALOG.extend(json.loads(catalog_path.read_text())["templates"])

    for entry in CATALOG:
        filename = entry["filename"]
        path = TEMPLATES_DIR / filename
        if path.exists():
            content = path.read_text(encoding="utf-8")
            TEMPLATE_CONTENTS[filename] = content
            fields = _extract_span_fields(content)
            extras = [f for f in EXTRA_FIELDS.get(filename, []) if f not in fields]
            DOCUMENT_FIELDS[filename] = fields + extras


_load_catalog_and_templates()

# ── System prompts ─────────────────────────────────────────────────────────

MNDA_SYSTEM_PROMPT = """You are a legal assistant helping users complete a Mutual Non-Disclosure Agreement (MNDA).

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
- ALWAYS end your reply with a question if there are any unfilled fields remaining.
- Be concise, professional, and friendly."""


_ABBREVIATIONS: dict[str, str] = {
    "nda": "Mutual-NDA.md",
    "mnda": "Mutual-NDA.md",
    "mutual nda": "Mutual-NDA.md",
    "csa": "CSA.md",
    "sla": "sla.md",
    "psa": "psa.md",
    "dpa": "DPA.md",
    "baa": "BAA.md",
}

# Cover page is not a standalone selectable document
_SELECTABLE = [e for e in CATALOG if e["filename"] != "Mutual-NDA-coverpage.md"]


def _normalize_doc_type(doc_type: str | None) -> str | None:
    """Map AI docType responses to the canonical catalog filename."""
    if not doc_type:
        return None
    # Exact match
    for entry in _SELECTABLE:
        if entry["filename"] == doc_type:
            return doc_type
    lower = doc_type.lower()
    # Common abbreviations
    if lower in _ABBREVIATIONS:
        return _ABBREVIATIONS[lower]
    # Case-insensitive filename match (with or without .md)
    candidate = lower if lower.endswith(".md") else f"{lower}.md"
    for entry in _SELECTABLE:
        if entry["filename"].lower() == candidate:
            return entry["filename"]
    # Document name match
    for entry in _SELECTABLE:
        if entry["name"].lower() == lower or lower in entry["name"].lower():
            return entry["filename"]
    return None


def _build_discovery_prompt() -> str:
    docs = [e for e in CATALOG if e["filename"] != "Mutual-NDA-coverpage.md"]
    doc_list = "\n".join(
        f'- {e["name"]} → docType="{e["filename"]}"'
        for e in docs
    )
    return f"""You are a legal assistant that helps users create standard legal documents.

Supported document types (you MUST use the exact docType string shown):
{doc_list}

Your task:
1. Greet the user warmly and ask what legal document they need.
2. When the user describes their need, identify the closest match from the supported list above.
3. If they want a document type not on the list, acknowledge their request, explain it is not supported, and suggest the closest available alternative.
4. Once you have identified the document, confirm the choice with the user before proceeding.
5. ALWAYS end your reply with a question to keep the conversation moving.

IMPORTANT: docType must be one of the exact filename strings listed above (e.g. "CSA.md"), or null if not yet confirmed.

Respond with JSON only — no markdown, no explanation outside the JSON:
{{"reply": "...", "docType": null, "fields": {{}}}}"""


# Essential fields per document — only ask about these, leave everything else as placeholders
ESSENTIAL_FIELDS: dict[str, list[str]] = {
    "Mutual-NDA.md": ["Party 1 Name", "Party 2 Name", "Purpose", "Governing Law", "Jurisdiction"],
    "CSA.md": ["Customer", "Provider", "Effective Date", "Subscription Period", "Governing Law"],
    "design-partner-agreement.md": ["Partner", "Provider", "Effective Date", "Term", "Program"],
    "sla.md": ["Customer", "Provider", "Target Uptime", "Target Response Time", "Support Channel"],
    "psa.md": ["Customer", "Provider", "Effective Date", "Deliverables", "Fees"],
    "DPA.md": ["Customer", "Provider", "Categories of Personal Data", "Nature and Purpose of Processing"],
    "Software-License-Agreement.md": ["Customer", "Provider", "Effective Date", "Subscription Period", "Permitted Uses"],
    "Partnership-Agreement.md": ["Company", "Partner", "Effective Date", "Obligations", "Territory"],
    "Pilot-Agreement.md": ["Customer", "Provider", "Effective Date", "Pilot Period"],
    "BAA.md": ["Provider", "Company", "BAA Effective Date", "Breach Notification Period"],
    "AI-Addendum.md": ["Customer", "Provider", "Training Data", "Training Restrictions"],
}


def _build_filling_prompt(doc_filename: str, doc_name: str, current_fields: dict) -> str:
    essential = ESSENTIAL_FIELDS.get(doc_filename, DOCUMENT_FIELDS.get(doc_filename, [])[:5])
    unfilled = [f for f in essential if not current_fields.get(f, "").strip()]
    field_list = "\n".join(f"- {f}" for f in essential)
    return f"""You are a legal assistant helping a user complete a {doc_name}.

Collect ONLY these essential fields, then the document is ready:
{field_list}

Current values:
{json.dumps(current_fields, indent=2)}

Rules:
1. Ask for AT MOST 2 fields at a time. Keep replies SHORT.
2. Once all {len(essential)} essential fields above are filled, say the document is ready — do NOT ask for more information.
3. Do NOT ask about any fields not listed above; they will remain as placeholders.
4. Never invent values. Preserve all current values.
5. If the user seems to have provided the info naturally (e.g. "between Acme and TechCo"), extract both party names without asking again.
{"6. You still have " + str(len(unfilled)) + " unfilled field(s): " + ", ".join(unfilled) + ". Ask about those next." if unfilled else "6. All essential fields are filled. Confirm the document is ready."}

Respond with JSON only:
{{"reply": "...", "docType": "{doc_filename}", "fields": {{...all provided values...}}}}"""


# ── Pydantic models ────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class MndaRequest(BaseModel):
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


class MndaResponse(BaseModel):
    reply: str
    fields: MndaFields


class DocChatRequest(BaseModel):
    messages: list[ChatMessage]
    currentDocType: str | None
    currentFields: dict


# ── App setup ──────────────────────────────────────────────────────────────

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

# ── API routes (must be before static mount) ───────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/chat/mnda")
async def chat_mnda(req: MndaRequest):
    system_content = (
        f"{MNDA_SYSTEM_PROMPT}\n\n"
        f"Current MNDA field values (preserve unchanged fields):\n"
        f"{json.dumps(req.currentFields, indent=2)}"
    )
    messages: list[dict] = [{"role": "system", "content": system_content}]

    if req.messages:
        messages += [{"role": m.role, "content": m.content} for m in req.messages]
    else:
        messages.append({"role": "user", "content": "Hello, I need to create a Mutual NDA."})

    completion = await openai_client.chat.completions.parse(
        model="gpt-4.1-2025-04-14",
        messages=messages,
        response_format=MndaResponse,
    )

    result = completion.choices[0].message.parsed
    if result is None:
        raise HTTPException(status_code=500, detail="AI declined to respond")
    return result


@app.post("/api/chat/doc")
async def chat_doc(req: DocChatRequest):
    if req.currentDocType:
        doc_entry = next((e for e in CATALOG if e["filename"] == req.currentDocType), None)
        doc_name = doc_entry["name"] if doc_entry else req.currentDocType
        system_content = _build_filling_prompt(req.currentDocType, doc_name, req.currentFields)
    else:
        system_content = _build_discovery_prompt()

    messages: list[dict] = [{"role": "system", "content": system_content}]

    if req.messages:
        messages += [{"role": m.role, "content": m.content} for m in req.messages]
    else:
        messages.append({"role": "user", "content": "Hello!"})

    completion = await openai_client.chat.completions.create(
        model="gpt-4.1-2025-04-14",
        messages=messages,
        response_format={"type": "json_object"},
    )

    try:
        result = json.loads(completion.choices[0].message.content)
        if "reply" not in result:
            raise ValueError("missing reply")
        # Normalize docType to a valid catalog filename
        raw_doc_type = result.get("docType", req.currentDocType)
        result["docType"] = _normalize_doc_type(raw_doc_type) or req.currentDocType
        raw_fields = result.get("fields")
        if isinstance(raw_fields, dict):
            result["fields"] = {k: str(v) if v is not None else "" for k, v in raw_fields.items()}
        else:
            result["fields"] = req.currentFields
        return result
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {e}")


@app.get("/api/templates/{filename}")
async def get_template(filename: str):
    if not filename.endswith(".md"):
        raise HTTPException(status_code=400, detail="Invalid filename")
    try:
        path = (TEMPLATES_DIR / filename).resolve()
        path.relative_to(TEMPLATES_DIR.resolve())  # raises ValueError if outside dir
    except (ValueError, RuntimeError):
        raise HTTPException(status_code=400, detail="Invalid filename")
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Template not found: {filename}")
    return PlainTextResponse(path.read_text(encoding="utf-8"))


# ── Static frontend (must be last) ─────────────────────────────────────────

if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory. The user can use AI chat in order to establish what document they want and how to fill in the fields. The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

PL-5 through PL-9 are built. The app supports all 12 catalog document types via AI chat (PL-9). The user opens the app, the AI asks what document they need, identifies it from the catalog, then guides them through filling the fields. The live preview renders the markdown template with field values highlighted. Fake login/signup screens gate access (no real auth yet).

## Development process

When instructed to build a feature:

1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

Use OpenAI for AI calls. `OPENAI_API_KEY` is in `.env` at the project root. Use `gpt-4.1-2025-04-14` as the model. The `AsyncOpenAI` client is created once at module level. Do not add a second system message mid-conversation — inject field context into the first system message instead.

Two chat endpoints:
- `POST /api/chat/doc` — the main endpoint (PL-9). Two-phase: discovery (AI identifies document type from catalog) then filling (AI collects document-specific fields). Uses JSON mode (`response_format={"type": "json_object"}`) since field keys vary per document. Returns `{ reply, docType, fields }`. System prompts are built dynamically from catalog and template field extraction.
- `POST /api/chat/mnda` — legacy MNDA-specific endpoint using Structured Outputs (`chat.completions.parse(response_format=MndaResponse)`). Still wired but no longer the primary path.

Templates are served at `GET /api/templates/{filename}`. The path traversal guard uses `Path.resolve()` containment, not string matching. Field names are extracted from `<span class="X_link">` spans in the markdown templates at startup.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/.  
The database should use SQLite and be created from scratch each time the Docker container is brought up, allowing for users table with sign up and sign in.  
The frontend is statically built (`next build` with `output: 'export'`) and served by FastAPI via `StaticFiles`. All API routes must be declared in `main.py` before the static mount.  
There should be scripts in scripts/ for:

```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```

Backend available at http://localhost:8000

## Color Scheme

- Accent Yellow: `#ecad0a`
- Blue Primary: `#209d77`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

## Implementation status

| Ticket | Feature | Status |
|--------|---------|--------|
| PL-5 | V1 foundation: backend, frontend, Docker, scripts | Done (PR #3) |
| PL-6 | Legal document templates and catalog | Done (merged to main) |
| PL-7 | Mutual NDA Creator UI | Done (merged to main) |
| PL-8 | AI chat replaces form; populates MNDA fields via GPT-4.1 | Done (PR #4) |
| PL-9 | Expand to all 12 catalog document types; AI document discovery | Done (PR #5) |

**Stack decisions made:**
- Next.js 16.2.9, React 19, Tailwind CSS v4, TypeScript — `frontend/`
- FastAPI + uv, SQLite (fresh on startup) — `backend/`
- Single Docker container; frontend static files served by FastAPI at port 8000
- Auth is fake (localStorage) until a real auth feature is built
- OpenAI SDK v2; `uv.lock` committed for reproducible Docker builds (`uv sync --frozen`)
- Multi-doc preview: `react-markdown` + `rehype-raw` renders markdown templates with `<span class="X_link">` field refs substituted inline
- Main frontend components: `DocumentApp` → `DocumentChat` + `DocumentPreview` (replaces `MndaApp`)

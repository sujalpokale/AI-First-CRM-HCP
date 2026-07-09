# AI-First CRM HCP Module

Round 1 assignment implementation for an AI-first Healthcare Professional CRM interaction logger.

## What Is Included

- React UI with Redux state management for a structured "Log HCP Interaction" workflow.
- Conversational AI assistant that turns natural language notes into interaction fields.
- FastAPI backend with SQLAlchemy persistence.
- LangGraph agent workflow using sales tools:
  - `log_interaction`
  - `edit_interaction`
  - `hcp_profile_lookup`
  - `materials_recommendation`
  - `compliance_check`
  - `suggest_follow_up`
- Groq LLM integration using `gemma2-9b-it`.
- SQL database support through `DATABASE_URL`; SQLite is the local default, while Postgres/MySQL URLs can be used for production-style runs.

## Run Backend

```powershell
cd backend
copy .env.example .env
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Set `GROQ_API_KEY` in `backend/.env` to enable Groq. Without a key, the agent uses a deterministic local extractor so the demo remains usable.

Postgres example:

```text
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/hcp_crm
```

MySQL example:

```text
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/hcp_crm
```

## Run Frontend

```powershell
cd frontend
npm install
npm run dev
```

The app runs at `http://127.0.0.1:5173` and calls the backend at `http://127.0.0.1:8000`.

## Suggested Demo Prompt

```text
Today I met with Dr. Smith and discussed product X efficiency. The sentiment was positive, and I shared the brochures.
```

The AI assistant will populate the HCP name, date/time, topics, materials, sentiment, compliance status, and follow-up actions. Use **Log Interaction** to save the record, then continue editing either in the form or through chat.

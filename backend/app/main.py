from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .agent import run_agent
from .config import settings
from .database import Base, engine, get_db
from .models import Interaction
from .schemas import AgentRequest, AgentResponse, InteractionCreate, InteractionRead, InteractionUpdate

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI-First CRM HCP Module")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "model": settings.groq_model}


@app.get("/api/interactions", response_model=list[InteractionRead])
def list_interactions(db: Session = Depends(get_db)):
    return db.query(Interaction).order_by(Interaction.updated_at.desc()).limit(50).all()


@app.post("/api/interactions", response_model=InteractionRead)
def create_interaction(payload: InteractionCreate, db: Session = Depends(get_db)):
    record = Interaction(**payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@app.put("/api/interactions/{interaction_id}", response_model=InteractionRead)
def update_interaction(interaction_id: int, payload: InteractionUpdate, db: Session = Depends(get_db)):
    record = db.get(Interaction, interaction_id)
    if not record:
        raise HTTPException(status_code=404, detail="Interaction not found")
    for key, value in payload.model_dump().items():
        setattr(record, key, value)
    db.commit()
    db.refresh(record)
    return record


@app.post("/api/agent/chat", response_model=AgentResponse)
def chat_with_agent(payload: AgentRequest, db: Session = Depends(get_db)):
    reply, draft, tools = run_agent(payload.message, payload.draft, db, payload.interaction_id)
    return AgentResponse(reply=reply, draft=draft, tool_calls=tools, interaction_id=payload.interaction_id)

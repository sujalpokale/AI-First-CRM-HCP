import json
import re
from datetime import date, datetime
from typing import Annotated, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import END, START, StateGraph
from sqlalchemy.orm import Session

from .config import settings
from .models import Interaction
from .schemas import InteractionBase


class AgentState(TypedDict):
    message: str
    draft: dict
    interaction_id: int | None
    db: Annotated[Session, "database session"]
    tool_calls: list[str]
    reply: str


def _split_items(value: str) -> list[str]:
    return [item.strip(" .") for item in re.split(r",| and ", value) if item.strip(" .")]


def _heuristic_extract(message: str, draft: dict) -> dict:
    text = message.strip()
    lower = text.lower()
    extracted = dict(draft)
    extracted["summary"] = text

    hcp_match = re.search(r"(?i:dr\.?|doctor)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)", text)
    if hcp_match:
        extracted["hcp_name"] = f"Dr. {hcp_match.group(1)}"

    if "positive" in lower:
        extracted["sentiment"] = "Positive"
    elif "negative" in lower or "concern" in lower:
        extracted["sentiment"] = "Negative"
    elif "neutral" in lower:
        extracted["sentiment"] = "Neutral"

    topic_match = re.search(r"discussed\s+(.+?)(?:\.|,|;| and i | and shared|$)", text, re.IGNORECASE)
    if topic_match:
        extracted["topics_discussed"] = topic_match.group(1).strip()

    if "brochure" in lower:
        extracted["materials_shared"] = "Brochures"
    elif "journal" in lower:
        extracted["materials_shared"] = "Journal reprint"

    if "sample" in lower:
        extracted["samples_distributed"] = ", ".join(_split_items(text.split("sample", 1)[-1]))[:240]

    if not extracted.get("interaction_date"):
        extracted["interaction_date"] = date.today().isoformat()
    if not extracted.get("interaction_time"):
        extracted["interaction_time"] = datetime.now().strftime("%H:%M")

    if "call" in lower:
        extracted["interaction_type"] = "Phone Call"
    elif "email" in lower:
        extracted["interaction_type"] = "Email"
    else:
        extracted["interaction_type"] = extracted.get("interaction_type") or "Meeting"

    return extracted


def _llm_extract(message: str, draft: dict) -> dict:
    if not settings.groq_api_key:
        return _heuristic_extract(message, draft)

    llm = ChatGroq(
        model=settings.groq_model,
        api_key=settings.groq_api_key,
        temperature=0,
    )
    system = (
        "Extract HCP CRM interaction fields as compact JSON only. "
        "Fields: hcp_name, interaction_type, interaction_date, interaction_time, attendees, "
        "topics_discussed, materials_shared, samples_distributed, sentiment, outcomes, "
        "follow_up_actions, summary, compliance_flags. Preserve existing draft values when unknown."
    )
    response = llm.invoke(
        [
            SystemMessage(content=system),
            HumanMessage(content=json.dumps({"draft": draft, "note": message})),
        ]
    )
    try:
        content = response.content.strip()
        if content.startswith("```"):
            content = re.sub(r"^```(?:json)?\n?", "", content)
            content = re.sub(r"\n?```$", "", content)
            content = content.strip()
        parsed = json.loads(content)
    except json.JSONDecodeError:
        return _heuristic_extract(message, draft)

    merged = dict(draft)
    for key, value in parsed.items():
        if key in merged and value not in (None, ""):
            merged[key] = str(value)
    return merged


def log_interaction(state: AgentState) -> AgentState:
    draft = _llm_extract(state["message"], state["draft"])
    state["draft"] = draft
    state["tool_calls"].append("log_interaction")
    return state


def edit_interaction(state: AgentState) -> AgentState:
    if state.get("interaction_id"):
        record = state["db"].get(Interaction, state["interaction_id"])
        if record:
            for key, value in state["draft"].items():
                if hasattr(record, key):
                    setattr(record, key, value)
            state["db"].commit()
            state["tool_calls"].append("edit_interaction")
    return state


def hcp_profile_lookup(state: AgentState) -> AgentState:
    hcp = state["draft"].get("hcp_name", "")
    if hcp and not state["draft"].get("attendees"):
        state["draft"]["attendees"] = hcp
    state["tool_calls"].append("hcp_profile_lookup")
    return state


def compliance_check(state: AgentState) -> AgentState:
    text = " ".join(str(v) for v in state["draft"].values()).lower()
    flags = []
    for phrase in ("guaranteed outcome", "off label", "cash", "gift"):
        if phrase in text:
            flags.append(f"Review mention of '{phrase}' before submission")
    state["draft"]["compliance_flags"] = "; ".join(flags) if flags else "No compliance concerns detected"
    state["tool_calls"].append("compliance_check")
    return state


def materials_recommendation(state: AgentState) -> AgentState:
    topics = state["draft"].get("topics_discussed", "").lower()
    if topics and not state["draft"].get("materials_shared"):
        state["draft"]["materials_shared"] = "Product monograph, efficacy leave-behind"
    state["tool_calls"].append("materials_recommendation")
    return state


def suggest_follow_up(state: AgentState) -> AgentState:
    sentiment = state["draft"].get("sentiment", "Neutral")
    if not state["draft"].get("follow_up_actions"):
        if sentiment == "Positive":
            state["draft"]["follow_up_actions"] = "Schedule follow-up meeting and share clinical evidence deck"
        elif sentiment == "Negative":
            state["draft"]["follow_up_actions"] = "Route concern to medical affairs and follow up with approved response"
        else:
            state["draft"]["follow_up_actions"] = "Send summary email and confirm next best action"
    state["tool_calls"].append("suggest_follow_up")
    return state


def final_reply(state: AgentState) -> AgentState:
    draft = InteractionBase(**state["draft"])
    state["reply"] = (
        "Interaction details have been extracted and checked. "
        f"Sentiment is {draft.sentiment.lower()}; suggested next step: {draft.follow_up_actions}."
    )
    return state


def build_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("log_interaction", log_interaction)
    workflow.add_node("hcp_profile_lookup", hcp_profile_lookup)
    workflow.add_node("materials_recommendation", materials_recommendation)
    workflow.add_node("compliance_check", compliance_check)
    workflow.add_node("suggest_follow_up", suggest_follow_up)
    workflow.add_node("edit_interaction", edit_interaction)
    workflow.add_node("final_reply", final_reply)

    workflow.add_edge(START, "log_interaction")
    workflow.add_edge("log_interaction", "hcp_profile_lookup")
    workflow.add_edge("hcp_profile_lookup", "materials_recommendation")
    workflow.add_edge("materials_recommendation", "compliance_check")
    workflow.add_edge("compliance_check", "suggest_follow_up")
    workflow.add_edge("suggest_follow_up", "edit_interaction")
    workflow.add_edge("edit_interaction", "final_reply")
    workflow.add_edge("final_reply", END)
    return workflow.compile()


agent_graph = build_graph()


def run_agent(message: str, draft: InteractionBase | None, db: Session, interaction_id: int | None = None):
    initial = {
        "message": message,
        "draft": (draft or InteractionBase()).model_dump(),
        "interaction_id": interaction_id,
        "db": db,
        "tool_calls": [],
        "reply": "",
    }
    result = agent_graph.invoke(initial)
    return result["reply"], InteractionBase(**result["draft"]), result["tool_calls"]

from pydantic import BaseModel, Field


class InteractionBase(BaseModel):
    hcp_name: str = Field(default="", max_length=160)
    interaction_type: str = "Meeting"
    interaction_date: str = ""
    interaction_time: str = ""
    attendees: str = ""
    topics_discussed: str = ""
    materials_shared: str = ""
    samples_distributed: str = ""
    sentiment: str = "Neutral"
    outcomes: str = ""
    follow_up_actions: str = ""
    summary: str = ""
    compliance_flags: str = ""


class InteractionCreate(InteractionBase):
    pass


class InteractionUpdate(InteractionBase):
    pass


class InteractionRead(InteractionBase):
    id: int

    class Config:
        from_attributes = True


class AgentRequest(BaseModel):
    message: str
    draft: InteractionBase | None = None
    interaction_id: int | None = None


class AgentResponse(BaseModel):
    reply: str
    draft: InteractionBase
    tool_calls: list[str]
    interaction_id: int | None = None

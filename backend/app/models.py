from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Interaction(Base):
    __tablename__ = "interactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    hcp_name: Mapped[str] = mapped_column(String(160), index=True)
    interaction_type: Mapped[str] = mapped_column(String(80), default="Meeting")
    interaction_date: Mapped[str] = mapped_column(String(20))
    interaction_time: Mapped[str] = mapped_column(String(20))
    attendees: Mapped[str] = mapped_column(Text, default="")
    topics_discussed: Mapped[str] = mapped_column(Text, default="")
    materials_shared: Mapped[str] = mapped_column(Text, default="")
    samples_distributed: Mapped[str] = mapped_column(Text, default="")
    sentiment: Mapped[str] = mapped_column(String(40), default="Neutral")
    outcomes: Mapped[str] = mapped_column(Text, default="")
    follow_up_actions: Mapped[str] = mapped_column(Text, default="")
    summary: Mapped[str] = mapped_column(Text, default="")
    compliance_flags: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

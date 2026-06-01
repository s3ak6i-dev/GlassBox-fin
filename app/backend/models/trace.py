import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.backend.db import Base


class StoredTrace(Base):
    __tablename__ = "stored_traces"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False)
    trace_id: Mapped[str] = mapped_column(String(36), unique=True, nullable=False)
    session_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    session_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    task_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    jurisdiction: Mapped[str | None] = mapped_column(String(10), nullable=True)
    halted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    halt_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    step_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    agent: Mapped["Agent"] = relationship("Agent", back_populates="traces")
    steps: Mapped[list["StoredStep"]] = relationship("StoredStep", back_populates="trace", lazy="select", order_by="StoredStep.timestamp")
    violations: Mapped[list["StoredViolation"]] = relationship("StoredViolation", back_populates="trace", lazy="select")


class StoredStep(Base):
    __tablename__ = "stored_steps"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trace_db_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("stored_traces.id", ondelete="CASCADE"), nullable=False)
    step_id: Mapped[str] = mapped_column(String(36), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    step_type: Mapped[str] = mapped_column(String(20), nullable=False)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tool_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    output: Mapped[str | None] = mapped_column(Text, nullable=True)
    prompt_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    output_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    tool_arguments: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    token_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    latency_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    step_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    prev_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)

    trace: Mapped["StoredTrace"] = relationship("StoredTrace", back_populates="steps")

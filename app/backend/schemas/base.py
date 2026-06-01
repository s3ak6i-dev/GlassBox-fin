import uuid

from pydantic import BaseModel, ConfigDict, field_validator


class ORMModel(BaseModel):
    """Base for response schemas read from SQLAlchemy ORM objects.

    Coerces UUID columns to strings so `id: str` fields validate cleanly.
    """
    model_config = ConfigDict(from_attributes=True)

    @field_validator("*", mode="before")
    @classmethod
    def _stringify_uuid(cls, v):
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

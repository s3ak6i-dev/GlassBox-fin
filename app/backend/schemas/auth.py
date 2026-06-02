from pydantic import BaseModel, EmailStr

from app.backend.schemas.base import ORMModel


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    org_name: str
    jurisdiction: str = "EU"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str   # the Google ID token from Google Identity Services


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(ORMModel):
    id: str
    email: str
    role: str
    org_id: str

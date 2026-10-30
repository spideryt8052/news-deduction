"""
TruthShield Authentication & Administration Pydantic Schemas
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr

class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full Name of User")
    email: str = Field(..., min_length=5, max_length=255, description="Valid Email Address")
    password: str = Field(..., min_length=6, max_length=100, description="Password (at least 6 characters)")
    role: Optional[str] = Field("user", description="Requested role (default: user)")

class UserLoginRequest(BaseModel):
    email: str = Field(..., description="Registered Email")
    password: str = Field(..., description="Account Password")

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UpdateUserRoleRequest(BaseModel):
    role: Optional[str] = Field(None, description="'user' or 'admin'")
    is_active: Optional[bool] = None

class AdminStatsResponse(BaseModel):
    total_users: int
    total_analyses: int
    total_claims: int
    total_sources: int
    total_feedback: int
    total_reported: int
    percentages: Dict[str, float]
    ai_provider: str
    database_status: str
    vector_store_status: Dict[str, Any]

class SendOtpRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255, description="Target email address")
    purpose: Optional[str] = Field("register", description="'register' or 'login'")

class SendOtpResponse(BaseModel):
    success: bool
    message: str
    email: str
    expires_in_seconds: int = 600
    preview_code: Optional[str] = None

class VerifyOtpRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full Name of User")
    email: str = Field(..., min_length=5, max_length=255, description="Valid Email Address")
    password: str = Field(..., min_length=6, max_length=100, description="Account Password")
    otp: str = Field(..., min_length=4, max_length=10, description="6-digit verification code")
    role: Optional[str] = Field("user", description="Requested role")

class VerifyOtpLoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255, description="Registered Email")
    otp: str = Field(..., min_length=4, max_length=10, description="6-digit verification code")

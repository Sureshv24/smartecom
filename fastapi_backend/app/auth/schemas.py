from pydantic import BaseModel, EmailStr, Field
from app.auth.roles import UserRole


# ============================================================
# REGISTER
# ============================================================

class RegisterRequest(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=100
    )

    email: EmailStr

    password: str = Field(
        ...,
        min_length=8,
        max_length=128
    )

    role: UserRole = UserRole.CUSTOMER


# ============================================================
# USER RESPONSE
# ============================================================

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True


# ============================================================
# LOGIN
# ============================================================

class LoginRequest(BaseModel):
    email: EmailStr

    password: str = Field(
        ...,
        min_length=8,
        max_length=128
    )


# ============================================================
# TOKEN RESPONSE
# ============================================================

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# ============================================================
# REFRESH TOKEN REQUEST
# ============================================================

class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ============================================================
# ACCESS TOKEN RESPONSE
# ============================================================

class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
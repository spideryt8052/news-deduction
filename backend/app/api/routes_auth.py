"""
Authentication Routes: Register, Login, Current User Profile
"""

import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import UserModel
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    AuthResponse
)
from app.core.security import hash_password, verify_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post(
    "/register",
    response_model=AuthResponse,
    summary="Register a new user account"
)
async def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    existing = db.query(UserModel).filter(UserModel.email == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Determine role (first registered user or email with admin can be admin)
    user_count = db.query(UserModel).count()
    assigned_role = "admin" if (user_count == 0 or "admin" in email_clean) else (payload.role or "user")

    user_id = str(uuid.uuid4())
    hashed_pwd = hash_password(payload.password)

    new_user = UserModel(
        id=user_id,
        name=payload.name.strip(),
        email=email_clean,
        password_hash=hashed_pwd,
        role=assigned_role,
        is_active=True,
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({
        "sub": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "role": new_user.role
    })

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=new_user.id,
            name=new_user.name,
            email=new_user.email,
            role=new_user.role,
            is_active=new_user.is_active,
            created_at=new_user.created_at.isoformat() if new_user.created_at else datetime.datetime.utcnow().isoformat()
        )
    )

@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Authenticate user and obtain JWT token"
)
async def login_user(payload: UserLoginRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    user = db.query(UserModel).filter(UserModel.email == email_clean).first()

    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated by an administrator."
        )

    token = create_access_token({
        "sub": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role
    })

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at.isoformat() if user.created_at else datetime.datetime.utcnow().isoformat()
        )
    )

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user profile"
)
async def get_me(current_user: UserModel = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat() if current_user.created_at else datetime.datetime.utcnow().isoformat()
    )

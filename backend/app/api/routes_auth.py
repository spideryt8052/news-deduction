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
    AuthResponse,
    SendOtpRequest,
    SendOtpResponse,
    VerifyOtpRegisterRequest,
    VerifyOtpLoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest
)
from app.services.otp_service import OtpService
from app.core.security import hash_password, verify_password, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post(
    "/send-otp",
    response_model=SendOtpResponse,
    summary="Dispatch email verification OTP code"
)
async def send_email_otp(payload: SendOtpRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    is_new = False
    
    if payload.purpose == "register":
        existing = db.query(UserModel).filter(UserModel.email == email_clean).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists. Please log in or reset your password."
            )
    elif payload.purpose in ["login", "signin"]:
        existing = db.query(UserModel).filter(UserModel.email == email_clean).first()
        if not existing:
            is_new = True
        elif not existing.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been deactivated by an administrator."
            )
    elif payload.purpose == "reset_password":
        existing = db.query(UserModel).filter(UserModel.email == email_clean).first()
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No registered account found with this email. Please check your email or create a new account."
            )
        if not existing.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been deactivated by an administrator."
            )

    result = OtpService.create_and_send_otp(email_clean, purpose=payload.purpose or "register")
    if not result.get("success", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message") or "Failed to send email verification code."
        )
    result["is_new_user"] = is_new
    return SendOtpResponse(**result)

@router.post(
    "/register-with-otp",
    response_model=AuthResponse,
    summary="Verify OTP and register new user account"
)
async def register_with_otp(payload: VerifyOtpRegisterRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()

    # 1. Verify OTP first
    valid, message = OtpService.verify_otp(email_clean, payload.otp, expected_purpose="register")
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    # 2. Check duplicate
    existing = db.query(UserModel).filter(UserModel.email == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # 3. Create account (Only first user bootstrap is admin; all subsequent registrations are strictly 'user')
    user_count = db.query(UserModel).count()
    assigned_role = "admin" if user_count == 0 else "user"

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
    "/login-with-otp",
    response_model=AuthResponse,
    summary="Authenticate user via email OTP (passwordless code)"
)
async def login_with_otp(payload: VerifyOtpLoginRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()

    # 1. Verify OTP (accept purpose="login" or generic)
    valid, message = OtpService.verify_otp(email_clean, payload.otp, expected_purpose="login")
    if not valid:
        valid2, _ = OtpService.verify_otp(email_clean, payload.otp, expected_purpose=None)
        if not valid2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )

    # 2. Check if user already exists
    user = db.query(UserModel).filter(UserModel.email == email_clean).first()
    if not user:
        # Seamless Passwordless Auto-Registration for new users!
        user_count = db.query(UserModel).count()
        assigned_role = "admin" if user_count == 0 else "user"
        username_part = email_clean.split("@")[0].replace(".", " ").replace("_", " ").title()

        user = UserModel(
            id=str(uuid.uuid4()),
            name=username_part if username_part else "TruthShield User",
            email=email_clean,
            password_hash=None,
            role=assigned_role,
            is_active=True,
            created_at=datetime.datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)

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

@router.post(
    "/forgot-password",
    response_model=SendOtpResponse,
    summary="Dispatch password reset OTP verification code"
)
async def forgot_password_request(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    user = db.query(UserModel).filter(UserModel.email == email_clean).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address. Please check your spelling or sign up."
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated by an administrator."
        )

    result = OtpService.create_and_send_otp(email_clean, purpose="reset_password")
    if not result.get("success", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message") or "Failed to dispatch password reset code."
        )
    result["is_new_user"] = False
    return SendOtpResponse(**result)

@router.post(
    "/reset-password",
    response_model=AuthResponse,
    summary="Verify OTP and reset account password"
)
async def reset_password_with_otp(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()

    if len(payload.new_password) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 4 characters long."
        )

    valid, message = OtpService.verify_otp(email_clean, payload.otp, expected_purpose="reset_password")
    if not valid:
        valid2, _ = OtpService.verify_otp(email_clean, payload.otp, expected_purpose=None)
        if not valid2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )

    user = db.query(UserModel).filter(UserModel.email == email_clean).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account associated with this email address."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated by an administrator."
        )

    # Securely hash and update password
    user.password_hash = hash_password(payload.new_password)
    db.add(user)
    db.commit()
    db.refresh(user)

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

    # Determine role (Only first bootstrap user is admin; all subsequent registrations are strictly 'user')
    user_count = db.query(UserModel).count()
    assigned_role = "admin" if user_count == 0 else "user"

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

    # Auto-upgrade plaintext or non-PBKDF2 hash to PBKDF2 on successful login
    if user.password_hash and not user.password_hash.startswith("pbkdf2:sha256:"):
        try:
            user.password_hash = hash_password(payload.password)
            db.add(user)
            db.commit()
            db.refresh(user)
        except Exception:
            pass

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

"""
FastAPI Security & Authentication Dependencies
"""

from typing import Optional
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.security import decode_access_token
from app.models.models import UserModel

def get_optional_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[UserModel]:
    """Extracts user if valid Bearer token provided, else None."""
    if not authorization:
        return None
    try:
        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None
        token = parts[1]
        payload = decode_access_token(token)
        if not payload or "sub" not in payload:
            return None
        user_id = payload["sub"]
        user = db.query(UserModel).filter(UserModel.id == user_id, UserModel.is_active == True).first()
        return user
    except Exception:
        return None

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> UserModel:
    """Requires a valid authenticated user."""
    user = get_optional_current_user(authorization, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in with valid credentials.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user

def get_current_admin(
    current_user: UserModel = Depends(get_current_user)
) -> UserModel:
    """Requires an authenticated administrator."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required to access this resource."
        )
    return current_user

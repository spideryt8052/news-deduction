"""
TruthShield Security & Cryptographic Authentication Module
Supports PBKDF2 password hashing and HMAC-SHA256 signed access tokens.
"""

import hashlib
import hmac
import secrets
import json
import base64
import time
from typing import Optional, Dict, Any
from app.core.config import settings

# Secret key for HMAC token signing
SECRET_KEY = getattr(settings, "SECRET_KEY", "truthshield_jwt_secret_key_ aktu_2026_super_secure")

def hash_password(password: str) -> str:
    """Hashes a password using PBKDF2-HMAC-SHA256 with 100,000 rounds and random salt."""
    salt = secrets.token_hex(16)
    iterations = 100000
    derived = hashlib.pbkdf2_hmac(
        "sha256", 
        password.encode("utf-8"), 
        salt.encode("utf-8"), 
        iterations
    )
    return f"pbkdf2:sha256:{iterations}${salt}${derived.hex()}"

def verify_password(password: str, hashed: str) -> bool:
    """Verifies a plain password against a stored PBKDF2 hash."""
    if not hashed or not password:
        return False
    try:
        parts = hashed.split("$")
        if len(parts) != 3:
            return False
        meta, salt, stored_hash = parts
        iterations = int(meta.split(":")[-1])
        derived = hashlib.pbkdf2_hmac(
            "sha256", 
            password.encode("utf-8"), 
            salt.encode("utf-8"), 
            iterations
        )
        return hmac.compare_digest(derived.hex(), stored_hash)
    except Exception:
        return False

def _b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")

def _b64_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding and padding < 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data.encode("utf-8"))

def create_access_token(payload: Dict[str, Any], expires_in_seconds: int = 86400 * 7) -> str:
    """Creates a signed JWT-compatible token valid for 7 days."""
    header = {"alg": "HS256", "typ": "JWT"}
    body = dict(payload)
    body["exp"] = int(time.time()) + expires_in_seconds
    body["iat"] = int(time.time())

    encoded_header = _b64_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    encoded_body = _b64_encode(json.dumps(body, separators=(',', ':')).encode('utf-8'))
    signing_input = f"{encoded_header}.{encoded_body}".encode('utf-8')

    signature = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
    encoded_signature = _b64_encode(signature)

    return f"{encoded_header}.{encoded_body}.{encoded_signature}"

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates token signature and expiration timestamp."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        encoded_header, encoded_body, encoded_signature = parts
        signing_input = f"{encoded_header}.{encoded_body}".encode('utf-8')

        expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
        provided_sig = _b64_decode(encoded_signature)

        if not hmac.compare_digest(expected_sig, provided_sig):
            return None

        body = json.loads(_b64_decode(encoded_body).decode('utf-8'))
        if body.get("exp", 0) < int(time.time()):
            return None  # Expired
        return body
    except Exception:
        return None

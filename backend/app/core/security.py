"""
TruthShield Security & Cryptographic Authentication Module
Supports PBKDF2 password hashing and HMAC-SHA256 signed access tokens.
"""

import os
import hashlib
import hmac
import secrets
import json
import base64
import time
from typing import Optional, Dict, Any
from app.core.config import settings

# Load cryptographic secret key from environment / config (fallback to a unique per-instance secret)
_env_secret = (getattr(settings, "SECRET_KEY", "") or os.environ.get("SECRET_KEY", "")).strip()
if not _env_secret or _env_secret == "truthshield_jwt_secret_key_ aktu_2026_super_secure":
    _env_secret = secrets.token_hex(32)

SECRET_KEY = _env_secret

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
    """
    Verifies a plain password against a stored hash with support for:
    - Standard PBKDF2-HMAC-SHA256 (pbkdf2:sha256:<iterations>$<salt>$<hex>)
    - Plaintext match (fallback for manually seeded or unhashed database records)
    - Bcrypt hashes ($2b$, $2a$, $2y$) if bcrypt is available
    - SHA256 hex digest
    - Leading/trailing whitespace tolerance
    """
    if not hashed or not password:
        return False

    pass_candidates = [password]
    if password.strip() != password:
        pass_candidates.append(password.strip())

    # 1. Direct plaintext match (prevents locking out accounts created without a hash)
    for pwd in pass_candidates:
        if hashed == pwd:
            return True

    # 2. Standard PBKDF2-HMAC-SHA256
    try:
        if hashed.startswith("pbkdf2:sha256:"):
            parts = hashed.split("$")
            if len(parts) == 3:
                meta, salt, stored_hash = parts
                iterations = int(meta.split(":")[-1])
                for pwd in pass_candidates:
                    derived = hashlib.pbkdf2_hmac(
                        "sha256", 
                        pwd.encode("utf-8"), 
                        salt.encode("utf-8"), 
                        iterations
                    )
                    if hmac.compare_digest(derived.hex(), stored_hash):
                        return True
    except Exception:
        pass

    # 3. Bcrypt match (if bcrypt module is installed)
    if hashed.startswith(("$2b$", "$2a$", "$2y$")):
        try:
            import bcrypt
            for pwd in pass_candidates:
                if bcrypt.checkpw(pwd.encode("utf-8"), hashed.encode("utf-8")):
                    return True
        except Exception:
            pass

    # 4. Standard SHA256 hex digest (64 chars)
    if len(hashed) == 64:
        for pwd in pass_candidates:
            if hashlib.sha256(pwd.encode("utf-8")).hexdigest().lower() == hashed.lower():
                return True

    # 5. Generic dollar-delimited PBKDF2 fallback
    try:
        parts = hashed.split("$")
        if len(parts) == 3:
            meta, salt, stored_hash = parts
            iterations = int(meta.split(":")[-1]) if ":" in meta else 100000
            for pwd in pass_candidates:
                derived = hashlib.pbkdf2_hmac(
                    "sha256", 
                    pwd.encode("utf-8"), 
                    salt.encode("utf-8"), 
                    iterations
                )
                if hmac.compare_digest(derived.hex(), stored_hash):
                    return True
    except Exception:
        pass

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

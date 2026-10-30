import time
import random
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Tuple, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class OtpService:
    """Manages secure 6-digit OTP generation, temporary caching, verification, and email dispatch."""

    # In-memory store: { email: { 'otp': '123456', 'purpose': 'register', 'expires_at': timestamp, 'attempts': 0 } }
    _otp_store: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def generate_otp(cls, length: int = 6) -> str:
        """Generates a secure numeric 6-digit one-time code."""
        return "".join([str(random.randint(0, 9)) for _ in range(length)])

    @classmethod
    def create_and_send_otp(cls, email: str, purpose: str = "register") -> Dict[str, Any]:
        """Generates, caches, and sends a verification OTP to the target email."""
        clean_email = email.strip().lower()
        otp = cls.generate_otp(6)
        ttl = 600  # 10 minutes
        expires_at = time.time() + ttl

        cls._otp_store[clean_email] = {
            "otp": otp,
            "purpose": purpose,
            "expires_at": expires_at,
            "attempts": 0
        }

        # Attempt to dispatch via SMTP if configured
        email_sent = cls._send_smtp_email(clean_email, otp, purpose)

        logger.info(f"🔑 [TruthShield OTP] Generated OTP {otp} for {clean_email} (Purpose: {purpose}, EmailSent: {email_sent})")

        # In dev or when SMTP is not configured, supply preview_code for seamless testing
        smtp_host = getattr(settings, "SMTP_HOST", "") or ""
        preview_code = otp if (not email_sent or not smtp_host) else None

        return {
            "success": True,
            "message": f"Verification code sent to {clean_email}. Code is valid for 10 minutes.",
            "email": clean_email,
            "expires_in_seconds": ttl,
            "preview_code": preview_code
        }

    @classmethod
    def verify_otp(cls, email: str, submitted_otp: str, expected_purpose: Optional[str] = None) -> Tuple[bool, str]:
        """Verifies whether the provided OTP code matches and is within expiration window."""
        clean_email = email.strip().lower()
        record = cls._otp_store.get(clean_email)

        if not record:
            return False, "No active verification code found for this email. Please request a new code."

        if time.time() > record["expires_at"]:
            cls._otp_store.pop(clean_email, None)
            return False, "Verification code has expired. Please request a new code."

        record["attempts"] += 1
        if record["attempts"] > 5:
            cls._otp_store.pop(clean_email, None)
            return False, "Too many failed attempts. For security reasons, please request a new code."

        if expected_purpose and record.get("purpose") != expected_purpose:
            return False, "Verification code purpose mismatch."

        clean_submitted = submitted_otp.strip()
        if record["otp"] != clean_submitted:
            return False, "Invalid verification code. Please check the 6-digit code and try again."

        # Verified successfully - consume code so it cannot be replayed
        cls._otp_store.pop(clean_email, None)
        return True, "Email verified successfully."

    @classmethod
    def _send_smtp_email(cls, to_email: str, otp: str, purpose: str) -> bool:
        """Sends rich HTML security notification email via standard SMTP if configured in .env."""
        smtp_host = getattr(settings, "SMTP_HOST", "") or ""
        smtp_port = int(getattr(settings, "SMTP_PORT", 587) or 587)
        smtp_user = getattr(settings, "SMTP_USER", "") or ""
        smtp_pass = getattr(settings, "SMTP_PASSWORD", "") or getattr(settings, "SMTP_PASS", "") or ""
        sender_email = getattr(settings, "SMTP_FROM", "") or smtp_user or "security@truthshield.ai"

        if not smtp_host or not smtp_user:
            return False

        subject = "Your TruthShield Verification Code: " + otp if purpose == "register" else "TruthShield Security Login Code: " + otp

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #070b14; color: #f8fafc; margin: 0; padding: 24px; }}
            .card {{ max-width: 480px; margin: 0 auto; background: #0d1527; border: 1px solid rgba(6, 182, 212, 0.25); border-radius: 16px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }}
            .brand {{ font-size: 20px; font-weight: 800; color: #38bdf8; display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }}
            .headline {{ font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 8px; }}
            .subtext {{ font-size: 14px; color: #94a3b8; line-height: 1.5; margin-bottom: 24px; }}
            .otp-box {{ background: #070b14; border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 12px; padding: 18px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #22d3ee; margin-bottom: 24px; }}
            .footer {{ font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand">🛡️ TruthShield Verification</div>
            <div class="headline">Confirm Your Email Address</div>
            <div class="subtext">Use the following one-time verification code to verify your account. This code ensures that only authorized individuals can access the TruthShield credibility platform.</div>
            <div class="otp-box">{otp}</div>
            <div class="subtext" style="margin-bottom: 12px;">This code will expire in <strong>10 minutes</strong>. If you did not request this code, you can safely disregard this message.</div>
            <div class="footer">
              TruthShield AI Credibility Platform • Secure Automated Verification System
            </div>
          </div>
        </body>
        </html>
        """

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"TruthShield Security <{sender_email}>"
            msg["To"] = to_email
            msg.attach(MIMEText(f"Your TruthShield verification code is: {otp}\nThis code expires in 10 minutes.", "plain"))
            msg.attach(MIMEText(html_body, "html"))

            if smtp_port == 465:
                server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10)
            else:
                server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
                server.starttls()

            if smtp_pass:
                server.login(smtp_user, smtp_pass)

            server.sendmail(sender_email, [to_email], msg.as_string())
            server.quit()
            return True
        except Exception as e:
            logger.warning(f"SMTP dispatch warning: {e}")
            return False

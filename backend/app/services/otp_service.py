import time
import random
import logging
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Tuple, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class OtpService:
    """
    Manages secure 6-digit OTP generation, temporary caching, verification, 
    and direct delivery to real Gmail / email inboxes via SMTP.
    NEVER exposes or renders the OTP on the user's screen.
    """

    # In-memory store: { email: { 'otp': '123456', 'purpose': 'register', 'expires_at': timestamp, 'attempts': 0 } }
    _otp_store: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def generate_otp(cls, length: int = 6) -> str:
        """Generates a secure numeric 6-digit one-time code."""
        return "".join([str(random.randint(0, 9)) for _ in range(length)])

    @classmethod
    def create_and_send_otp(cls, email: str, purpose: str = "register") -> Dict[str, Any]:
        """
        Generates, caches, and sends a verification OTP directly to the target email inbox.
        NEVER sends preview_code back in the response.
        """
        clean_email = email.strip().lower()
        otp = cls.generate_otp(6)
        ttl = 600  # 10 minutes
        expires_at = time.time() + ttl

        # Temporarily store OTP
        cls._otp_store[clean_email] = {
            "otp": otp,
            "purpose": purpose,
            "expires_at": expires_at,
            "attempts": 0
        }

        # Attempt to dispatch email directly to Gmail/SMTP
        email_sent, error_msg = cls._send_smtp_email(clean_email, otp, purpose)

        if not email_sent:
            # Clean up the pending OTP if delivery failed
            cls._otp_store.pop(clean_email, None)
            logger.error(f"❌ [TruthShield OTP] Delivery failed to {clean_email}: {error_msg}")
            return {
                "success": False,
                "message": f"Verification email could not be sent to {clean_email}. {error_msg}",
                "email": clean_email,
                "expires_in_seconds": 0,
                "preview_code": None
            }

        logger.info(f"📧 [TruthShield OTP] Email successfully delivered to {clean_email} (Purpose: {purpose})")

        return {
            "success": True,
            "message": f"A 6-digit verification code has been dispatched directly to your Gmail inbox ({clean_email}). Please check your inbox or spam folder.",
            "email": clean_email,
            "expires_in_seconds": ttl,
            "preview_code": None
        }

    @classmethod
    def verify_otp(cls, email: str, submitted_otp: str, expected_purpose: Optional[str] = None) -> Tuple[bool, str]:
        """Verifies whether the provided OTP code matches and is within expiration window."""
        clean_email = email.strip().lower()
        record = cls._otp_store.get(clean_email)

        if not record:
            return False, "No active verification code found for this email. Please request a new code from the screen."

        if time.time() > record["expires_at"]:
            cls._otp_store.pop(clean_email, None)
            return False, "Verification code has expired (10 min limit). Please request a new code."

        record["attempts"] += 1
        if record["attempts"] > 5:
            cls._otp_store.pop(clean_email, None)
            return False, "Too many failed attempts. For security reasons, please request a fresh code."

        if expected_purpose and record.get("purpose") != expected_purpose:
            return False, "Verification code purpose mismatch."

        clean_submitted = submitted_otp.strip()
        if record["otp"] != clean_submitted:
            return False, "Incorrect verification code. Please check the 6-digit code received on your Gmail and try again."

        # Verified successfully - consume code so it cannot be replayed
        cls._otp_store.pop(clean_email, None)
        return True, "Email verified successfully."

    @classmethod
    def _send_smtp_email(cls, to_email: str, otp: str, purpose: str) -> Tuple[bool, str]:
        """
        Sends rich HTML verification email directly to user's Gmail/email.
        Supports standard Gmail App Passwords and TLS port 587 or SSL port 465.
        """
        smtp_host = (getattr(settings, "SMTP_HOST", "") or "smtp.gmail.com").strip()
        smtp_port = int(getattr(settings, "SMTP_PORT", 587) or 587)
        smtp_user = (getattr(settings, "SMTP_USER", "") or "").strip()
        smtp_pass = (getattr(settings, "SMTP_PASSWORD", "") or getattr(settings, "SMTP_PASS", "") or "").strip()

        if not smtp_user or not smtp_pass:
            return False, (
                "Gmail credentials are not configured on the server. "
                "Please configure SMTP_USER (your Gmail) and SMTP_PASSWORD (Google 16-character App Password) "
                "in backend/.env or your host environment."
            )

        sender_from = f"TruthShield Security <{smtp_user}>"

        if purpose == "register":
            subject = f"TruthShield - Your 6-Digit Email Verification Code: {otp}"
            headline = "Verify Your Email Address"
            intro_text = (
                "Welcome to TruthShield! To confirm that you are a valid authorized person, "
                "please enter the 6-digit verification code below in your browser window."
            )
        else:
            subject = f"TruthShield - Your 6-Digit Login Code: {otp}"
            headline = "One-Time Login Code"
            intro_text = (
                "You requested a passwordless login code for your TruthShield account. "
                "Enter this one-time code to securely sign in."
            )

        html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #070b14;
      color: #f8fafc;
      margin: 0;
      padding: 30px 15px;
    }}
    .card {{
      max-width: 500px;
      margin: 0 auto;
      background: #0d1527;
      border: 1px solid rgba(6, 182, 212, 0.35);
      border-radius: 18px;
      padding: 36px 28px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }}
    .brand {{
      font-size: 22px;
      font-weight: 800;
      color: #38bdf8;
      margin-bottom: 20px;
      letter-spacing: -0.5px;
    }}
    .headline {{
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 10px;
    }}
    .subtext {{
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 24px;
    }}
    .otp-wrapper {{
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
      border: 1.5px solid rgba(56, 189, 248, 0.45);
      border-radius: 14px;
      padding: 22px;
      text-align: center;
      margin-bottom: 24px;
    }}
    .otp-label {{
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #38bdf8;
      margin-bottom: 8px;
    }}
    .otp-code {{
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #22d3ee;
      margin: 0;
      text-shadow: 0 0 20px rgba(34, 211, 238, 0.4);
    }}
    .warning {{
      font-size: 12px;
      color: #cbd5e1;
      background: rgba(255, 255, 255, 0.04);
      padding: 12px 14px;
      border-radius: 10px;
      line-height: 1.5;
      margin-bottom: 24px;
    }}
    .footer {{
      font-size: 11px;
      color: #64748b;
      line-height: 1.5;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 18px;
    }}
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">🛡️ TruthShield Defense System</div>
    <div class="headline">{headline}</div>
    <div class="subtext">{intro_text}</div>
    
    <div class="otp-wrapper">
      <div class="otp-label">Your One-Time Security Code</div>
      <div class="otp-code">{otp}</div>
    </div>
    
    <div class="warning">
      ⏱️ This code is confidential and expires in <strong>10 minutes</strong>.<br>
      Do not share this code with anyone. TruthShield administrators will never ask for your code.
    </div>
    
    <div class="footer">
      TruthShield AI Fact-Checking & Deepfake Defense System<br>
      Automated verification notice sent to {to_email}.
    </div>
  </div>
</body>
</html>"""

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = sender_from
            msg["To"] = to_email
            msg.attach(MIMEText(f"Your TruthShield verification code is: {otp}\n\nThis code expires in 10 minutes.\nDo not share it with anyone.", "plain"))
            msg.attach(MIMEText(html_body, "html"))

            if smtp_port == 465:
                context = ssl.create_default_context()
                server = smtplib.SMTP_SSL(smtp_host, smtp_port, context=context, timeout=15)
                server.login(smtp_user, smtp_pass)
            else:
                server = smtplib.SMTP(smtp_host, smtp_port, timeout=15)
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(smtp_user, smtp_pass)

            server.sendmail(smtp_user, [to_email], msg.as_string())
            server.quit()
            return True, "Email sent successfully"

        except smtplib.SMTPAuthenticationError as auth_err:
            logger.error(f"Gmail SMTP Auth Error: {auth_err}")
            return False, (
                "Google Account Authentication Failed. "
                "Gmail requires an 'App Password' (16 characters) instead of your regular password. "
                "Generate one at Google Account -> Security -> 2-Step Verification -> App Passwords."
            )
        except Exception as e:
            logger.error(f"SMTP Dispatch Error: {e}")
            return False, f"Failed to connect to email server ({str(e)})."

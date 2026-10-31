import os
import time
import random
import logging
import smtplib
import ssl
import json
import urllib.request
import urllib.error
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Tuple, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class OtpService:
    """
    Manages secure 6-digit OTP generation, temporary caching, verification, 
    and direct delivery to real Gmail / email inboxes.
    
    Supports:
    1. Resend HTTPS API (Recommended for Render Free Tier - zero port blocking)
    2. Brevo HTTPS API (Sends to any email, 300 free emails/day)
    3. Direct Gmail SMTP (For localhost or VPS with open SMTP ports)
    
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

        # Attempt to dispatch email via Resend, Brevo, or SMTP
        email_sent, error_msg = cls._dispatch_email(clean_email, otp, purpose)

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
    def _dispatch_email(cls, to_email: str, otp: str, purpose: str) -> Tuple[bool, str]:
        """
        Smart multi-provider email dispatcher:
        1. Checks for RESEND_API_KEY (HTTPS - Works 100% on Render Free Tier)
        2. Checks for BREVO_API_KEY (HTTPS - Works 100% on Render Free Tier)
        3. Tries standard Gmail SMTP (Port 587/465) with descriptive error handling
        """
        html_body, text_body, subject = cls._build_email_templates(to_email, otp, purpose)

        # 1. RESEND HTTPS API (Zero port blocking, works on Render)
        resend_key = (getattr(settings, "RESEND_API_KEY", "") or os.environ.get("RESEND_API_KEY", "")).strip()
        if resend_key:
            success, msg = cls._send_via_resend(to_email, subject, html_body, text_body, resend_key)
            if success:
                return True, msg
            logger.warning(f"Resend HTTP dispatch failed: {msg}. Falling back to next provider...")

        # 2. BREVO HTTPS API (Zero port blocking, works on Render)
        brevo_key = (getattr(settings, "BREVO_API_KEY", "") or os.environ.get("BREVO_API_KEY", "")).strip()
        if brevo_key:
            success, msg = cls._send_via_brevo(to_email, subject, html_body, text_body, brevo_key)
            if success:
                return True, msg
            logger.warning(f"Brevo HTTP dispatch failed: {msg}. Falling back to next provider...")

        # 3. DIRECT SMTP (Works on Localhost or paid servers without SMTP port blocks)
        smtp_user = (getattr(settings, "SMTP_USER", "") or os.environ.get("SMTP_USER", "")).strip()
        smtp_pass = (getattr(settings, "SMTP_PASSWORD", "") or getattr(settings, "SMTP_PASS", "") or os.environ.get("SMTP_PASSWORD", "")).strip()

        if smtp_user and smtp_pass:
            success, msg = cls._send_smtp_email(to_email, subject, html_body, text_body, smtp_user, smtp_pass)
            if success:
                return True, msg
            
            # Detect Render / Cloud Port Block error
            if "101" in msg or "network is unreachable" in msg.lower() or "timed out" in msg.lower():
                return False, (
                    "Render Free Tier blocks outbound SMTP ports (587/465). "
                    "To send emails from Render without port blocking, please add a free RESEND_API_KEY or BREVO_API_KEY "
                    "in your Render Dashboard Environment Variables."
                )
            return False, msg

        return False, (
            "No email service is configured. "
            "For Render Free hosting, add RESEND_API_KEY or BREVO_API_KEY in Render Environment Variables. "
            "For local testing, configure SMTP_USER & SMTP_PASSWORD in backend/.env."
        )

    @classmethod
    def _send_via_resend(cls, to_email: str, subject: str, html_body: str, text_body: str, api_key: str) -> Tuple[bool, str]:
        """Dispatches email via Resend HTTPS REST API (Port 443)."""
        url = "https://api.resend.com/emails"
        sender_email = getattr(settings, "SMTP_FROM", "") or "TruthShield <onboarding@resend.dev>"
        if "<" not in sender_email and "@" not in sender_email:
            sender_email = "TruthShield <onboarding@resend.dev>"

        payload = {
            "from": sender_email,
            "to": [to_email],
            "subject": subject,
            "html": html_body,
            "text": text_body
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "TruthShield-Verification/1.0"
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=12) as response:
                if response.status in (200, 201):
                    return True, "Email dispatched via Resend API"
                return False, f"Resend API returned status code {response.status}"
        except urllib.error.HTTPError as e:
            err_data = e.read().decode("utf-8", errors="ignore")
            logger.error(f"Resend API Error ({e.code}): {err_data}")
            return False, f"Resend API Error: {err_data}"
        except Exception as e:
            logger.error(f"Resend Connection Error: {e}")
            return False, f"Resend Connection Error: {str(e)}"

    @classmethod
    def _send_via_brevo(cls, to_email: str, subject: str, html_body: str, text_body: str, api_key: str) -> Tuple[bool, str]:
        """Dispatches email via Brevo HTTPS REST API (Port 443)."""
        url = "https://api.brevo.com/v3/smtp/email"
        sender_email = getattr(settings, "SMTP_USER", "") or "security@truthshield.ai"

        payload = {
            "sender": {
                "name": "TruthShield Security",
                "email": sender_email if "@" in sender_email else "security@truthshield.ai"
            },
            "to": [{"email": to_email}],
            "subject": subject,
            "htmlContent": html_body,
            "textContent": text_body
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "api-key": api_key,
                "Content-Type": "application/json",
                "accept": "application/json",
                "User-Agent": "TruthShield-Verification/1.0"
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=12) as response:
                if response.status in (200, 201):
                    return True, "Email dispatched via Brevo API"
                return False, f"Brevo API returned status code {response.status}"
        except urllib.error.HTTPError as e:
            err_data = e.read().decode("utf-8", errors="ignore")
            logger.error(f"Brevo API Error ({e.code}): {err_data}")
            return False, f"Brevo API Error: {err_data}"
        except Exception as e:
            logger.error(f"Brevo Connection Error: {e}")
            return False, f"Brevo Connection Error: {str(e)}"

    @classmethod
    def _send_smtp_email(cls, to_email: str, subject: str, html_body: str, text_body: str, smtp_user: str, smtp_pass: str) -> Tuple[bool, str]:
        """Sends rich HTML verification email via standard SMTP socket."""
        smtp_host = (getattr(settings, "SMTP_HOST", "") or "smtp.gmail.com").strip()
        smtp_port = int(getattr(settings, "SMTP_PORT", 587) or 587)
        sender_from = f"TruthShield Security <{smtp_user}>"

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = sender_from
            msg["To"] = to_email
            msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            if smtp_port == 465:
                context = ssl.create_default_context()
                server = smtplib.SMTP_SSL(smtp_host, smtp_port, context=context, timeout=8)
                server.login(smtp_user, smtp_pass)
            else:
                server = smtplib.SMTP(smtp_host, smtp_port, timeout=8)
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(smtp_user, smtp_pass)

            server.sendmail(smtp_user, [to_email], msg.as_string())
            server.quit()
            return True, "Email sent successfully via SMTP"

        except smtplib.SMTPAuthenticationError as auth_err:
            logger.error(f"Gmail SMTP Auth Error: {auth_err}")
            return False, (
                "Google Account Authentication Failed. "
                "Gmail requires an 'App Password' (16 characters) instead of your regular password. "
                "Generate one at Google Account -> Security -> 2-Step Verification -> App Passwords."
            )
        except Exception as e:
            logger.error(f"SMTP Dispatch Error: {e}")
            return False, f"Failed to connect to email server ({str(e)})"

    @classmethod
    def _build_email_templates(cls, to_email: str, otp: str, purpose: str) -> Tuple[str, str, str]:
        """Constructs responsive HTML and plain text email content."""
        if purpose == "register":
            subject = f"TruthShield - Your 6-Digit Email Verification Code: {otp}"
            headline = "Verify Your Email Address"
            intro_text = (
                "Welcome to TruthShield! To confirm that you are an authorized person, "
                "please enter the 6-digit verification code below in your registration window."
            )
        else:
            subject = f"TruthShield - Your 6-Digit Login Code: {otp}"
            headline = "One-Time Login Code"
            intro_text = (
                "You requested a passwordless login code for your TruthShield account. "
                "Enter this one-time code to securely sign in."
            )

        text_body = f"Your TruthShield verification code is: {otp}\n\nThis code expires in 10 minutes.\nDo not share this code with anyone."

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
        return html_body, text_body, subject

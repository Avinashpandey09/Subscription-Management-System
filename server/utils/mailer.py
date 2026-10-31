"""Reset-link delivery: real SMTP when configured, console log otherwise."""

import os
import smtplib
from email.message import EmailMessage
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def reset_link(token: str) -> str:
    return f"{FRONTEND_URL}/reset-password?token={token}"


def send_password_reset(email: str, token: str) -> None:
    link = reset_link(token)
    host = os.getenv("SMTP_HOST")
    if not host:
        print(f"[dev] password reset link for {email}: {link}")
        return

    message = EmailMessage()
    message["Subject"] = "Reset your password"
    message["From"] = os.getenv("SMTP_FROM", "no-reply@example.com")
    message["To"] = email
    message.set_content(f"Open this link to set a new password (valid 60 minutes):\n\n{link}")

    port = int(os.getenv("SMTP_PORT", "587"))
    with smtplib.SMTP(host, port) as smtp:
        username = os.getenv("SMTP_USER")
        password = os.getenv("SMTP_PASSWORD")
        if username and password:
            smtp.starttls()
            smtp.login(username, password)
        smtp.send_message(message)

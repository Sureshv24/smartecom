import os

from dotenv import load_dotenv
from email.message import EmailMessage

import aiosmtplib


# ============================================================
# LOAD .ENV FILE
# ============================================================

load_dotenv()


# ============================================================
# SMTP CONFIGURATION
# ============================================================

SMTP_HOST = os.getenv(
    "SMTP_HOST",
    "smtp.gmail.com",
)

SMTP_PORT = int(
    os.getenv(
        "SMTP_PORT",
        "587",
    )
)

SMTP_USERNAME = os.getenv(
    "SMTP_USERNAME"
)

SMTP_PASSWORD = os.getenv(
    "SMTP_PASSWORD"
)

SMTP_FROM = os.getenv(
    "SMTP_FROM"
) or SMTP_USERNAME


# ============================================================
# SEND EMAIL
# ============================================================

async def send_email(
    to_email: str,
    subject: str,
    body: str,
):

    # --------------------------------------------------------
    # Validate SMTP configuration
    # --------------------------------------------------------

    if not SMTP_USERNAME:
        raise RuntimeError(
            "SMTP_USERNAME is not configured in .env"
        )

    if not SMTP_PASSWORD:
        raise RuntimeError(
            "SMTP_PASSWORD is not configured in .env"
        )

    if not SMTP_FROM:
        raise RuntimeError(
            "SMTP_FROM is not configured in .env"
        )


    # --------------------------------------------------------
    # Create email
    # --------------------------------------------------------

    message = EmailMessage()

    message["From"] = SMTP_FROM

    message["To"] = to_email

    message["Subject"] = subject

    message.set_content(body)


    # --------------------------------------------------------
    # Send through Gmail SMTP
    # --------------------------------------------------------

    await aiosmtplib.send(
        message,
        hostname=SMTP_HOST,
        port=SMTP_PORT,
        start_tls=True,
        username=SMTP_USERNAME,
        password=SMTP_PASSWORD,
    )


    print(
        f"Email sent successfully to {to_email}"
    )
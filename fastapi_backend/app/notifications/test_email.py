import asyncio

from app.notifications.email import (
    send_order_confirmation_email,
)


async def main():

    try:

        await send_order_confirmation_email(
            user_email="YOUR_RECEIVER_EMAIL@gmail.com",
            order_id=21,
            total="7998.00",
        )

        print(
            "Test email completed successfully."
        )

    except Exception as error:

        print(
            f"Email sending failed: {error}"
        )


if __name__ == "__main__":
    asyncio.run(main())
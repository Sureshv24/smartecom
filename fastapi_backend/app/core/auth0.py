from authlib.integrations.starlette_client import OAuth

from app.core.config import (
    AUTH0_DOMAIN,
    AUTH0_CLIENT_ID,
    AUTH0_CLIENT_SECRET,
)

oauth = OAuth()

oauth.register(
    name="auth0",
    client_id=AUTH0_CLIENT_ID,
    client_secret=AUTH0_CLIENT_SECRET,
    server_metadata_url=f"https://{AUTH0_DOMAIN}/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid profile email"
    },
)
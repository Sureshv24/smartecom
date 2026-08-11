from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Request,
)

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)

from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User

from app.auth.schemas import (
    RegisterRequest,
    UserResponse,
    LoginRequest,
    TokenResponse,
    RefreshTokenRequest,
    AccessTokenResponse,
)

from app.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
)

from app.auth.roles import UserRole

from app.core.auth0 import oauth

from app.core.config import (
    AUTH0_DOMAIN,
    AUTH0_CLIENT_ID,
    AUTH0_CALLBACK_URL,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ============================================================
# HTTP BEARER SECURITY
# ============================================================

security = HTTPBearer()


# ============================================================
# GET CURRENT USER ID FROM ACCESS TOKEN
# ============================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        payload = decode_access_token(token)

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

        return int(user_id)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error)
        )


# ============================================================
# GET CURRENT USER OBJECT
# ============================================================

def get_current_user_object(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


# ============================================================
# ROLE-BASED ACCESS CONTROL
# ============================================================

def require_role(*allowed_roles: UserRole):

    def role_checker(
        current_user=Depends(get_current_user_object)
    ):

        if current_user.role not in [
            role.value for role in allowed_roles
        ]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource"
            )

        return current_user

    return role_checker


# ============================================================
# REGISTER USER
# POST /auth/register
# ============================================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register_user(
    user_data: RegisterRequest,
    db: Session = Depends(get_db)
):

    existing_user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password = hash_password(
        user_data.password
    )

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password=hashed_password,
        role="customer"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# ============================================================
# LOGIN USER
# POST /auth/login
# ============================================================

@router.post(
    "/login",
    response_model=TokenResponse
)
def login_user(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(User.email == login_data.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(
        login_data.password,
        user.password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        user.id
    )

    refresh_token = create_refresh_token(
        user.id
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


# ============================================================
# REFRESH ACCESS TOKEN
# POST /auth/refresh
# ============================================================

@router.post(
    "/refresh",
    response_model=AccessTokenResponse
)
def refresh_access_token(
    refresh_data: RefreshTokenRequest
):

    try:

        payload = decode_refresh_token(
            refresh_data.refresh_token
        )

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )

        new_access_token = create_access_token(
            int(user_id)
        )

        return {
            "access_token": new_access_token,
            "token_type": "bearer"
        }

    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error)
        )


# ============================================================
# GET CURRENT LOGGED-IN USER
# GET /auth/me
# ============================================================

@router.get(
    "/me",
    response_model=UserResponse
)
def get_me(
    current_user=Depends(get_current_user_object)
):

    return current_user


# ============================================================
# ADMIN TEST
# GET /auth/admin-test
# ============================================================

@router.get(
    "/admin-test"
)
def admin_test(
    current_user=Depends(
        require_role(UserRole.ADMIN)
    )
):

    return {
        "message": "Welcome Admin",
        "user": current_user.name,
        "role": current_user.role
    }


# ============================================================
# STAFF TEST
# GET /auth/staff-test
# ============================================================

@router.get(
    "/staff-test"
)
def staff_test(
    current_user=Depends(
        require_role(UserRole.STAFF)
    )
):

    return {
        "message": "Welcome Staff",
        "user": current_user.name,
        "role": current_user.role
    }


# ============================================================
# CUSTOMER TEST
# GET /auth/customer-test
# ============================================================

@router.get(
    "/customer-test"
)
def customer_test(
    current_user=Depends(
        require_role(UserRole.CUSTOMER)
    )
):

    return {
        "message": "Welcome Customer",
        "user": current_user.name,
        "role": current_user.role
    }


# ============================================================
# ADMIN + STAFF TEST
# GET /auth/admin-staff-test
# ============================================================

@router.get(
    "/admin-staff-test"
)
def admin_staff_test(
    current_user=Depends(
        require_role(
            UserRole.ADMIN,
            UserRole.STAFF
        )
    )
):

    return {
        "message": "Welcome Admin or Staff",
        "user": current_user.name,
        "role": current_user.role
    }


# ============================================================
# AUTH0 SOCIAL LOGIN
# GET /auth/auth0/login
# ============================================================

@router.get(
    "/auth0/login"
)
async def auth0_login(
    request: Request
):

    print("AUTH0 DOMAIN:", AUTH0_DOMAIN)
    print("AUTH0 CLIENT ID:", AUTH0_CLIENT_ID)
    print("AUTH0 CALLBACK:", AUTH0_CALLBACK_URL)

    return await oauth.auth0.authorize_redirect(
        request,
        AUTH0_CALLBACK_URL
    )


# ============================================================
# AUTH0 CALLBACK
# GET /auth/auth0/callback
# ============================================================

@router.get(
    "/auth0/callback"
)
async def auth0_callback(
    request: Request
):

    try:

        # Get token from Auth0
        token = await oauth.auth0.authorize_access_token(
            request
        )

        # Get user information
        user_info = token.get("userinfo")

        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to get user information from Auth0"
            )

        return {
            "message": "Auth0 login successful",
            "user": user_info
        }

    except Exception as error:

        print("AUTH0 ERROR:", error)

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Auth0 authentication failed"
        )
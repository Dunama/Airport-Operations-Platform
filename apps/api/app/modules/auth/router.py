from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.crud import CrudService
from app.core.db import get_session
from app.modules.airlines.models import Airlines
from app.modules.auth.models import Role, User
from app.modules.auth.service import hash_password, verify_password, create_access_token, decode_token
from app.modules.auth.schemas import MeOut, UserCreate, UserOut, TokenOut
from app.modules.operations.schemas import UserRead, UserUpdate

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
user_admin_service = CrudService(User, entity="user")

@router.post("/register", response_model=UserOut, status_code=201)
async def register(body: UserCreate, db: AsyncSession = Depends(get_session)):
    existing = await db.scalar(select(User).where(User.email == body.email))
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    airline = await db.get(Airlines, body.airline_id)
    if airline is None:
        raise HTTPException(status_code=400, detail="Invalid airline_id")
    role = await db.scalar(select(Role).where(Role.name == "airline"))
    if role is None:
        raise HTTPException(
            status_code=503,
            detail="Default user role is not configured",
        )
    user = User(
        email=body.email,
        password=hash_password(body.password),
        role_id=role.id,
        airline_id=body.airline_id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/login", response_model=TokenOut)
async def login(form: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_session)):
    user = await db.scalar(
        select(User)
        .options(selectinload(User.role))
        .where(User.email == form.username)
    )
    if not user or not verify_password(form.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    role_name = user.role.name if user.role else "guest"
    token = create_access_token(user.id, role_name)
    return {
        "access_token": token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": role_name,
            "airline_id": user.airline_id,
            "is_active": user.is_active,            
        }
    }

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_session),
) -> User:
    try:
        payload = decode_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = await db.scalar(
        select(User)
        .options(selectinload(User.role))
        .where(User.id == int(payload["sub"]))
    )
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user

@router.get("/me", response_model=MeOut)
async def read_me(current_user: User = Depends(get_current_user)):
    return MeOut(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role.name if current_user.role else "guest",
        airline_id=current_user.airline_id,
        is_active=current_user.is_active,
    )

def require_role(*roles: str):
    async def checker(current_user: User = Depends(get_current_user)):
        role_name = current_user.role.name if current_user.role else "guest"
        if role_name != "admin" and role_name not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return checker


@router.get("/users", response_model=list[UserRead])
async def list_users(
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("admin")),
):
    return await user_admin_service.list(db, offset=0, limit=500)


@router.get("/users/{user_id}", response_model=UserRead)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("admin")),
):
    return await user_admin_service.get(db, user_id)


@router.put("/users/{user_id}", response_model=UserRead)
async def update_user(
    user_id: int,
    payload: UserUpdate,
    db: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_role("admin")),
):
    return await user_admin_service.update(
        db, user_id, payload.model_dump(exclude_unset=True)
    )
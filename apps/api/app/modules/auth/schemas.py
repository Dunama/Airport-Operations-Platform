from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    airline_id: int

class UserOut(BaseModel):
    id: int
    email: str
    airline_id: int
    is_active: bool

    model_config = {"from_attributes": True}

class MeOut(BaseModel):
    id: int
    email: str
    role: str
    airline_id: int
    is_active: bool


class TokenOut(BaseModel):
    access_token: str
    token_type: str
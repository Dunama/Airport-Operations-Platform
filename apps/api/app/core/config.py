from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str

    jwt_secret: str

    jwt_algorithm: str 

    access_token_minutes: int

    cors_origins: list[str] 
    
    refresh_token_minutes: int

settings = Settings()

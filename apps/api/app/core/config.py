from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str

    jwt_secret: str

    jwt_algorithm: str 

    access_token_minutes: int

    cors_origins: list[str] 
    
    refresh_token_minutes: int

    # OpenSky Network (inbound-flight ETA feed). Read strictly from the
    # environment — never hard-coded. The feed degrades to "unconfigured"
    # when these are absent so the rest of the API keeps working.
    open_sky_api_secrect: str | None = None
    open_sky_client_id: str | None = None

    # Home airport reference point used for distance / landing estimates.
    airport_icao: str = "DNAA"
    airport_lat: float = 9.0068
    airport_lon: float = 7.2632
    airport_bbox_radius_km: float = 150.0

settings = Settings()

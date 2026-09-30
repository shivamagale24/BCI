"""
Core Configuration for NeuroCare BCI Backend.

Reads settings from environment variables with safe defaults.
"""

import os
from typing import List


class Settings:
    PROJECT_NAME: str = "NeuroCare BCI Hospital Management"
    API_V1_STR: str = "/api/v1"
    
    # Security / JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "neurocare-super-secret-jwt-key-2026-development-only")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours
    
    # Database
    # Primary connects to local MySQL root:root if available; falls back smoothly to SQLite
    MYSQL_URL: str = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://root:root@127.0.0.1:3306/neurocare_bci?charset=utf8mb4"
    )
    SQLITE_URL: str = "sqlite:///./neurocare.db"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]


settings = Settings()

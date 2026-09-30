"""
Database Session Management for NeuroCare BCI.

Connects to MySQL with automatic SQLite fallback if MySQL is offline.
Provides dependency injection generator for FastAPI endpoints.
"""

import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger("neurocare.db")

engine = None
SessionLocal = None

# Attempt primary MySQL connection
try:
    mysql_engine = create_engine(
        settings.MYSQL_URL,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False
    )
    # Test connection
    with mysql_engine.connect() as conn:
        pass
    engine = mysql_engine
    logger.info("Successfully connected to MySQL database: %s", settings.MYSQL_URL)
    print("Database: Connected to MySQL database.")
except Exception as e:
    logger.warning("Could not connect to MySQL (%s). Falling back to SQLite local database.", e)
    print(f"Database: MySQL connection note ({e}). Falling back to SQLite (neurocare.db).")
    engine = create_engine(
        settings.SQLITE_URL,
        connect_args={"check_same_thread": False},
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a SQLAlchemy database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

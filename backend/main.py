"""
NeuroCare BCI - FastAPI Main Application.

Primary entrypoint for the hospital backend server.
Integrates database ORM, REST API endpoints, JWT auth, and BCI inference pipeline.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.router import api_router
from app.db.init_db import init_database, seed_demo_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle handler."""
    print("NeuroCare BCI Backend starting up...")
    try:
        init_database()
        seed_demo_data()
    except Exception as e:
        print(f"Database startup warning: {e}")
    yield
    print("NeuroCare BCI Backend shutting down...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "NeuroCare BCI: A Brain-Computer Interface Enabled Smart Hospital Management System. "
        "Final-year engineering prototype integrating EEG motor imagery classification "
        "with clinical inpatient workflows and alert monitoring."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local development and testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include central router under /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint for service monitoring."""
    return {
        "status": "healthy",
        "service": "NeuroCare BCI Backend",
        "version": "1.0.0",
        "environment": "prototype"
    }


@app.get("/", tags=["Root"])
def root():
    """Root redirect and API metadata."""
    return {
        "message": "Welcome to NeuroCare BCI API",
        "documentation": "/docs",
        "health": "/health",
        "api_v1": settings.API_V1_STR
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

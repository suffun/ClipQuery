import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import video, chat

app = FastAPI(
    title="ClipQuery AI Service",
    description="Microservice for YouTube transcript extraction, FAISS vector indexing, and Gemini-powered RAG.",
    version="1.0.0"
)

allow_all_origins = settings.ALLOWED_ORIGINS == ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=not allow_all_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(video.router)
app.include_router(chat.router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "ClipQuery AI Service",
        "status": "online",
        "model": settings.GEMINI_MODEL,
        "embedding_model": settings.EMBEDDING_MODEL
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=(settings.ENV.lower() == "development")
    )

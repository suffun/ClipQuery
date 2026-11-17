from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from app.services.vector_store import vector_store_service
from app.services.rag import rag_service

router = APIRouter(tags=["Q&A Chat"])

class SourceItem(BaseModel):
    timestamp: str
    start: float
    text: str

class AskQuestionRequest(BaseModel):
    video_id: str = Field(..., description="The YouTube video ID", example="TjPPIf-M6KE")
    question: str = Field(..., description="The question about the video", example="What is discussed about AI?")
    api_key: str = Field(..., description="User's personal Google Gemini API key")
    model: Optional[str] = Field(default=None, description="Gemini model name (defaults to GEMINI_MODEL)")

class AskQuestionResponse(BaseModel):
    video_id: str
    question: str
    answer: str
    sources: List[SourceItem] = []

@router.post(
    "/ask",
    response_model=AskQuestionResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask a question about a processed video"
)
async def ask_question(request: AskQuestionRequest):
    video_id = request.video_id.strip()
    question = request.question.strip()
    api_key = (request.api_key or "").strip()

    if not video_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="video_id cannot be empty."
        )

    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="question cannot be empty."
        )

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google Gemini API key is required. Please enter your API key in extension settings."
        )

    # Verify that the video has been processed and indexed
    if not vector_store_service.is_video_cached(video_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video '{video_id}' has not been processed yet. Please call /process-video first."
        )

    try:
        result = rag_service.answer_question(
            video_id=video_id,
            question=question,
            api_key=api_key,
            model=request.model
        )
        return AskQuestionResponse(**result)
    except Exception as e:
        err_str = str(e)
        if "RESOURCE_EXHAUSTED" in err_str or "429" in err_str or "quota" in err_str.lower():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Google Gemini API rate limit reached. Please wait a moment and try again."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating answer: {err_str}"
        )

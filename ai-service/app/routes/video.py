from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from app.services.transcript import transcript_service
from app.services.text_splitter import transcript_splitter
from app.services.vector_store import vector_store_service

router = APIRouter(tags=["Video Processing"])

class ProcessVideoRequest(BaseModel):
    video_id: str = Field(..., description="The YouTube video ID", example="TjPPIf-M6KE")
    api_key: str = Field(..., description="User's personal Google Gemini API key")

class ProcessVideoResponse(BaseModel):
    status: str
    message: str
    video_id: str
    total_chunks: int = 0
    cached: bool = False

@router.post(
    "/process-video",
    response_model=ProcessVideoResponse,
    status_code=status.HTTP_200_OK,
    summary="Process YouTube video transcript and build FAISS vector index"
)
async def process_video(request: ProcessVideoRequest):
    video_id = request.video_id.strip()
    api_key = (request.api_key or "").strip()

    if not video_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="video_id cannot be empty."
        )

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google Gemini API key is required. Please enter your API key in extension settings."
        )

    # 1. Check if video FAISS index is already cached
    if vector_store_service.is_video_cached(video_id):
        return ProcessVideoResponse(
            status="success",
            message="Video index is already cached and ready for questions.",
            video_id=video_id,
            cached=True
        )

    # 2. Extract transcript from YouTube
    try:
        snippets = transcript_service.fetch_transcript(video_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        err_msg = str(e)
        if "disabled" in err_msg.lower():
            detail = "Captions are disabled by the creator for this YouTube video. Please try a video with English captions."
        elif "notranscript" in err_msg.lower():
            detail = "No captions or transcript could be found for this video."
        else:
            detail = f"Could not extract transcript: {err_msg}"

        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail
        )

    # 3. Split transcript with timestamps
    try:
        documents = transcript_splitter.split_transcript_snippets(snippets, video_id=video_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to split transcript: {str(e)}"
        )

    # 4. Generate embeddings and create FAISS vector store using user's key
    try:
        vector_store_service.create_vector_store(video_id, documents, api_key=api_key)
    except ValueError as e:
        err_str = str(e)
        if "rate limit" in err_str.lower() or "429" in err_str or "quota" in err_str.lower():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=err_str
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_str
        )
    except Exception as e:
        err_str = str(e)
        if "RESOURCE_EXHAUSTED" in err_str or "429" in err_str or "quota" in err_str.lower():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Google Gemini API rate limit reached (Free Tier limit: 100 requests/min). Please wait about 30 seconds and click Try Again."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not generate AI embeddings: {err_str}"
        )

    return ProcessVideoResponse(
        status="success",
        message="Video processed and indexed successfully.",
        video_id=video_id,
        total_chunks=len(documents),
        cached=False
    )

@router.get(
    "/video-status/{video_id}",
    summary="Check if a video has already been indexed"
)
async def check_video_status(video_id: str):
    is_cached = vector_store_service.is_video_cached(video_id.strip())
    return {
        "video_id": video_id.strip(),
        "is_indexed": is_cached
    }

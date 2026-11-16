from typing import List, Dict, Any
from youtube_transcript_api import (
    YouTubeTranscriptApi,
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
    InvalidVideoId,
    YouTubeTranscriptApiException
)

def format_timestamp(seconds: float) -> str:
    """Format seconds into MM:SS or HH:MM:SS."""
    total_seconds = int(seconds)
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    secs = total_seconds % 60
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"

class TranscriptService:
    def __init__(self):
        self.api = YouTubeTranscriptApi()

    def fetch_transcript(self, video_id: str) -> List[Dict[str, Any]]:
        """
        Fetch transcript snippets for a YouTube video.
        Returns a list of dicts: [{'text': str, 'start': float, 'duration': float, 'timestamp': str}]
        """
        if not video_id or not isinstance(video_id, str):
            raise ValueError("A valid video_id string must be provided.")

        try:
            # First attempt: fetch in English
            snippets = self.api.fetch(video_id, languages=["en"])
        except (NoTranscriptFound, YouTubeTranscriptApiException):
            try:
                # Fallback: fetch whatever transcript is available (auto-generated or other language)
                snippets = self.api.fetch(video_id)
            except TranscriptsDisabled:
                raise ValueError("Transcripts are disabled for this YouTube video.")
            except NoTranscriptFound:
                raise ValueError("No transcript found for this video in any language.")
            except VideoUnavailable:
                raise ValueError("This YouTube video is unavailable or private.")
            except InvalidVideoId:
                raise ValueError(f"Invalid YouTube video ID: {video_id}")
            except Exception as e:
                raise ValueError(f"Could not retrieve transcript: {str(e)}")
        except TranscriptsDisabled:
            raise ValueError("Transcripts are disabled for this YouTube video.")
        except VideoUnavailable:
            raise ValueError("This YouTube video is unavailable or private.")
        except InvalidVideoId:
            raise ValueError(f"Invalid YouTube video ID: {video_id}")
        except Exception as e:
            raise ValueError(f"Transcript extraction failed: {str(e)}")

        formatted_snippets: List[Dict[str, Any]] = []
        for s in snippets:
            # Handle both dataclass snippet and dict (depending on library version)
            text = getattr(s, "text", None) if hasattr(s, "text") else s.get("text", "")
            start = getattr(s, "start", 0.0) if hasattr(s, "start") else s.get("start", 0.0)
            duration = getattr(s, "duration", 0.0) if hasattr(s, "duration") else s.get("duration", 0.0)

            clean_text = text.replace("\n", " ").strip()
            if clean_text:
                formatted_snippets.append({
                    "text": clean_text,
                    "start": float(start),
                    "duration": float(duration),
                    "timestamp": format_timestamp(float(start))
                })

        if not formatted_snippets:
            raise ValueError("Transcript was found but contained no readable text.")

        return formatted_snippets

transcript_service = TranscriptService()


from langchain_google_genai import GoogleGenerativeAIEmbeddings
from app.config import settings


class EmbeddingService:
    @staticmethod
    def get_embeddings(api_key: str):
        """
        Dynamically creates Google Gemini embeddings using the user's provided API key.
        No shared API key is used; user must provide their own key.
        """
        clean_key = (api_key or "").strip()
        if not clean_key:
            raise ValueError(
                "API key is required. Please enter your Google Gemini API key in the extension settings."
            )

        return GoogleGenerativeAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            google_api_key=clean_key
        )


embedding_service = EmbeddingService()

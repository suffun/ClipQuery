import shutil
import time
from pathlib import Path
from typing import Dict, List
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from app.config import settings
from app.services.embeddings import embedding_service


class VectorStoreService:
    def __init__(self):
        self._memory_cache: Dict[str, FAISS] = {}

    def get_storage_path(self, video_id: str) -> Path:
        return settings.STORAGE_DIR / video_id

    def is_video_cached(self, video_id: str) -> bool:
        if video_id in self._memory_cache:
            return True
        path = self.get_storage_path(video_id)
        faiss_file = path / "index.faiss"
        pkl_file = path / "index.pkl"
        return faiss_file.exists() and pkl_file.exists()

    def create_vector_store(self, video_id: str, documents: List[Document], api_key: str) -> FAISS:
        """
        Creates FAISS vector store from documents using user's API key.
        Includes automatic retry for temporary rate limits.
        """
        if not documents:
            raise ValueError(f"Cannot create vector store for {video_id}: documents list is empty.")

        embeddings = embedding_service.get_embeddings(api_key=api_key)

        max_retries = 3
        last_error = None

        for attempt in range(max_retries):
            try:
                vector_store = FAISS.from_documents(documents, embeddings)

                # Persist to disk
                save_path = self.get_storage_path(video_id)
                save_path.mkdir(parents=True, exist_ok=True)
                vector_store.save_local(str(save_path))

                # Cache index/docstore in memory
                self._memory_cache[video_id] = vector_store
                return vector_store

            except Exception as e:
                err_str = str(e)
                last_error = e

                if "RESOURCE_EXHAUSTED" in err_str or "429" in err_str or "quota" in err_str.lower():
                    if attempt < max_retries - 1:
                        sleep_time = (attempt + 1) * 3
                        time.sleep(sleep_time)
                        continue
                    else:
                        raise ValueError(
                            "Google Gemini API rate limit reached (Free Tier limit: 100 requests/min). "
                            "Please wait about 30 seconds and click Try Again."
                        )
                else:
                    raise e

        raise last_error

    def get_vector_store(self, video_id: str, api_key: str) -> FAISS:
        """
        Retrieves FAISS vector store from memory or disk, binding the
        caller's own embeddings instance so no user API key is shared.
        """
        embeddings = embedding_service.get_embeddings(api_key=api_key)

        if video_id in self._memory_cache:
            cached = self._memory_cache[video_id]
            return FAISS(
                embedding_function=embeddings,
                index=cached.index,
                docstore=cached.docstore,
                index_to_docstore_id=cached.index_to_docstore_id,
                relevance_score_fn=cached.override_relevance_score_fn,
                normalize_L2=cached._normalize_L2,
                distance_strategy=cached.distance_strategy,
            )

        save_path = self.get_storage_path(video_id)
        if not self.is_video_cached(video_id):
            raise FileNotFoundError(f"No vector index found for video_id: {video_id}. Process video first.")

        vector_store = FAISS.load_local(
            str(save_path),
            embeddings,
            allow_dangerous_deserialization=True
        )
        self._memory_cache[video_id] = vector_store
        return vector_store

    def get_retriever(self, video_id: str, k: int = 4, api_key: str = ""):
        """Returns similarity retriever matching rag.ipynb search_kwargs={'k': 4}."""
        vs = self.get_vector_store(video_id, api_key=api_key)
        return vs.as_retriever(search_type="similarity", search_kwargs={"k": k})

    def delete_vector_store(self, video_id: str) -> bool:
        """Deletes vector store from memory and disk."""
        if video_id in self._memory_cache:
            del self._memory_cache[video_id]

        save_path = self.get_storage_path(video_id)
        if save_path.exists():
            shutil.rmtree(save_path)
            return True
        return False


vector_store_service = VectorStoreService()

from typing import List, Dict, Any
from langchain_core.documents import Document


class TranscriptSplitter:
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def split_transcript_snippets(self, snippets: List[Dict[str, Any]], video_id: str = "") -> List[Document]:
        """
        Groups transcript snippets into semantic chunks of approx `chunk_size` characters
        with `chunk_overlap`, while attaching the start timestamp and video_id to the chunk metadata.
        """
        if not snippets:
            return []

        documents: List[Document] = []
        current_snippets: List[Dict[str, Any]] = []
        current_length = 0

        for snippet in snippets:
            current_snippets.append(snippet)
            current_length += len(snippet.get("text", "")) + 1

            if current_length >= self.chunk_size:
                first_snippet = current_snippets[0]
                chunk_text = " ".join(s.get("text", "") for s in current_snippets)

                doc = Document(
                    page_content=chunk_text,
                    metadata={
                        "video_id": video_id,
                        "start": first_snippet.get("start", 0.0),
                        "timestamp": first_snippet.get("timestamp", "00:00")
                    }
                )
                documents.append(doc)

                # Keep overlap for the next chunk
                overlap_length = 0
                overlap_snippets = []
                for s in reversed(current_snippets):
                    overlap_snippets.insert(0, s)
                    overlap_length += len(s.get("text", "")) + 1
                    if overlap_length >= self.chunk_overlap:
                        break
                current_snippets = overlap_snippets
                current_length = overlap_length

        if current_snippets:
            first_snippet = current_snippets[0]
            chunk_text = " ".join(s.get("text", "") for s in current_snippets)
            documents.append(
                Document(
                    page_content=chunk_text,
                    metadata={
                        "video_id": video_id,
                        "start": first_snippet.get("start", 0.0),
                        "timestamp": first_snippet.get("timestamp", "00:00")
                    }
                )
            )

        return documents


transcript_splitter = TranscriptSplitter()

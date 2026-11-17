from typing import Dict, Any, List, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.config import settings
from app.services.vector_store import vector_store_service

class RAGService:
    def __init__(self):
        # PromptTemplate preserving rag.ipynb template
        self.prompt = PromptTemplate(
            template="""
      You are a helpful assistant.
      Answer ONLY from the provided transcript context.
      If the context is insufficient, just say you don't know.

      {context}
      Question: {question}
    """,
            input_variables=["context", "question"]
        )
        self.parser = StrOutputParser()

    @staticmethod
    def format_docs(retrieved_docs) -> str:
        """Joins retrieved doc content, identical to format_docs in rag.ipynb."""
        return "\n\n".join(doc.page_content for doc in retrieved_docs)

    def answer_question(
        self,
        video_id: str,
        question: str,
        api_key: str,
        model: Optional[str] = None,
        k: int = 4
    ) -> Dict[str, Any]:
        """
        Executes similarity search on the video's FAISS index and
        invokes the LCEL chain with the user's personal API key.
        """
        clean_key = (api_key or "").strip()
        if not clean_key:
            raise ValueError("API key is required. Please provide your Google Gemini API key.")

        selected_model = (model or settings.GEMINI_MODEL).strip()

        # Initialize LLM strictly with user's personal API key
        llm = ChatGoogleGenerativeAI(
            model=selected_model,
            temperature=0.2,
            google_api_key=clean_key
        )

        retriever = vector_store_service.get_retriever(video_id=video_id, k=k, api_key=clean_key)

        # Retrieve relevant chunks
        retrieved_docs = retriever.invoke(question)

        # Format context
        context_text = self.format_docs(retrieved_docs)

        # Execute chain (prompt | llm | parser)
        chain = self.prompt | llm | self.parser
        raw_answer = chain.invoke({
            "context": context_text,
            "question": question
        })

        # Extract timestamps and source snippets
        sources: List[Dict[str, Any]] = []
        seen_timestamps = set()
        for doc in retrieved_docs:
            timestamp = doc.metadata.get("timestamp", "00:00")
            start = doc.metadata.get("start", 0.0)
            if timestamp not in seen_timestamps:
                seen_timestamps.add(timestamp)
                sources.append({
                    "timestamp": timestamp,
                    "start": start,
                    "text": doc.page_content[:180] + ("..." if len(doc.page_content) > 180 else "")
                })

        sources.sort(key=lambda s: s["start"])

        return {
            "video_id": video_id,
            "question": question,
            "answer": raw_answer.strip(),
            "sources": sources
        }

rag_service = RAGService()

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Header, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import UserModel
from app.api.deps import get_optional_current_user
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.llm_service import LLMService

router = APIRouter(prefix="/api", tags=["Conversational AI"])

@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Human-like conversational AI assistance and open question answering",
    description="Ask any question, fact-check rumors, or converse naturally with TruthShield AI (powered by Google Gemini / Groq / OpenAI / hybrid engine)."
)
async def chat_with_ai(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: Optional[UserModel] = Depends(get_optional_current_user),
    x_ai_provider: Optional[str] = Header(None, alias="X-AI-Provider"),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    try:
        effective_provider = payload.ai_provider or x_ai_provider
        effective_key = payload.api_key or x_api_key

        history_dicts = []
        if payload.conversation_history:
            history_dicts = [{"role": msg.role, "content": msg.content} for msg in payload.conversation_history]

        result = LLMService.chat(
            message=payload.message,
            conversation_history=history_dicts,
            ai_provider=effective_provider,
            api_key=effective_key,
            temperature=payload.temperature or 0.7,
            language=payload.language or "en"
        )

        return ChatResponse(
            response=result["response"],
            provider=result.get("provider", "truthshield-engine"),
            model=result.get("model", "hybrid"),
            suggested_questions=result.get("suggested_questions", [])
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Conversational AI error: {str(e)}"
        )

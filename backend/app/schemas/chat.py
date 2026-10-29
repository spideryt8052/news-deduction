from typing import List, Optional
from pydantic import BaseModel, Field

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user', 'assistant', or 'system'")
    content: str = Field(..., description="The message content")

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="The user query or statement")
    conversation_history: Optional[List[ChatMessage]] = Field(
        default=None, 
        description="Previous turns of conversation for multi-turn context"
    )
    ai_provider: Optional[str] = Field(None, description="Explicit provider override: 'gemini', 'groq', 'openai'")
    api_key: Optional[str] = Field(None, description="Client-supplied runtime API key")
    temperature: Optional[float] = Field(0.7, ge=0.0, le=1.0, description="Sampling creativity")
    language: Optional[str] = Field("en", description="Target language code for the response (e.g. 'hi', 'en', 'ur', 'bn', etc.)")

class ChatResponse(BaseModel):
    response: str = Field(..., description="AI response text formatted in clean markdown")
    provider: str = Field(..., description="The AI provider that fulfilled the response")
    model: str = Field(..., description="The model name utilized")
    suggested_questions: List[str] = Field(
        default_factory=list, 
        description="Suggested follow-up questions for interactive dialogue"
    )

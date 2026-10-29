from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class OmniVoiceStatusResponse(BaseModel):
    engine: str
    repository: str
    repo_installed: bool
    venv_installed: bool
    total_supported_languages: int
    training_hours: str
    architecture: str
    sample_rate_hz: int
    inference_speed: str
    supported_modes: List[str]
    device: str

class OmniVoiceLanguage(BaseModel):
    id: str
    name: str
    native: str
    flag: str
    duration_hours: float

class OmniVoiceSynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text to synthesize")
    lang_id: str = Field(default="en", description="Language ID (e.g. en, hi, ur, bn, etc.)")
    voice_gender: str = Field(default="female", description="Voice gender: female or male")
    pitch: float = Field(default=1.0, ge=0.5, le=2.0)
    rate: float = Field(default=1.0, ge=0.5, le=2.0)

class OmniVoiceSynthesizeResponse(BaseModel):
    status: str
    mode: str
    language: Dict[str, Any]
    bcp47_code: str
    voice_gender: str
    pitch: float
    rate: float
    text: str
    engine: str
    audio_base64: Optional[str] = None

class OmniVoiceReportRequest(BaseModel):
    claim: Optional[str] = None
    classification: str
    confidence: Optional[float] = 0.75
    reasons: Optional[List[str]] = []
    recommendation: Optional[str] = None
    lang_id: str = "en"

class OmniVoiceReportResponse(BaseModel):
    status: str
    script: str
    synthesis: Dict[str, Any]

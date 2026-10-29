from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File

from app.services.omnivoice_service import OmniVoiceService
from app.schemas.omnivoice import (
    OmniVoiceStatusResponse,
    OmniVoiceLanguage,
    OmniVoiceSynthesizeRequest,
    OmniVoiceSynthesizeResponse,
    OmniVoiceReportRequest,
    OmniVoiceReportResponse
)

router = APIRouter(prefix="/api/omnivoice", tags=["OmniVoice Multilingual Speech"])

@router.get("/status", response_model=OmniVoiceStatusResponse, summary="Get OmniVoice engine status")
async def get_omnivoice_status():
    """Returns local OmniVoice model, environment, and multilingual engine readiness."""
    status_data = OmniVoiceService.get_engine_status()
    return OmniVoiceStatusResponse(**status_data)

@router.get("/languages", response_model=List[OmniVoiceLanguage], summary="List supported multilingual languages")
async def get_omnivoice_languages():
    """Returns list of curated featured languages with country flags and native scripts."""
    return OmniVoiceService.get_supported_languages()

@router.post("/synthesize", response_model=OmniVoiceSynthesizeResponse, summary="Synthesize speech audio")
async def synthesize_speech(payload: OmniVoiceSynthesizeRequest):
    """Synthesizes text into speech using OmniVoice DLM engine with client fallback."""
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    
    result = OmniVoiceService.synthesize_speech(
        text=payload.text,
        lang_id=payload.lang_id,
        voice_gender=payload.voice_gender,
        pitch=payload.pitch,
        rate=payload.rate
    )
    return OmniVoiceSynthesizeResponse(**result)

@router.post("/report-audio", response_model=OmniVoiceReportResponse, summary="Generate full voice narration for a credibility report")
async def generate_report_audio(payload: OmniVoiceReportRequest):
    """Builds a localized narration script and synthesizes verdict speech."""
    script = OmniVoiceService.generate_report_script(
        claim=payload.claim,
        classification=payload.classification,
        confidence=payload.confidence,
        reasons=payload.reasons,
        recommendation=payload.recommendation,
        lang_id=payload.lang_id
    )

    synthesis = OmniVoiceService.synthesize_speech(
        text=script,
        lang_id=payload.lang_id,
        voice_gender="female"
    )

    return OmniVoiceReportResponse(
        status="success",
        script=script,
        synthesis=synthesis
    )

@router.get("/audio", summary="Stream synthesized speech audio MP3")
async def stream_speech_audio(text: str, lang: str = "hi"):
    """Streams synthesized speech audio MP3 directly for any human language."""
    from fastapi.responses import Response
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    
    audio_bytes = await OmniVoiceService.get_audio_bytes(text=text, lang_id=lang)
    if not audio_bytes:
        raise HTTPException(status_code=500, detail="Failed to synthesize speech audio.")
    
    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": 'inline; filename="speech.mp3"',
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=86400"
        }
    )

@router.post("/audio", summary="Synthesize speech audio from JSON payload")
async def generate_speech_audio_post(payload: OmniVoiceSynthesizeRequest):
    """Streams synthesized speech audio MP3 from JSON body."""
    from fastapi.responses import Response
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    
    audio_bytes = await OmniVoiceService.get_audio_bytes(text=payload.text, lang_id=payload.lang_id)
    if not audio_bytes:
        raise HTTPException(status_code=500, detail="Failed to synthesize speech audio.")
    
    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": 'inline; filename="speech.mp3"',
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=86400"
        }
    )

@router.post("/transcribe", summary="Transcribe speech audio into text (Multilingual STT)")
async def transcribe_speech_audio(
    file: Optional[Any] = None,
    lang: str = "en"
):
    """Transcribes user recorded speech audio into text across 27+ languages."""
    from fastapi import UploadFile, File, Form, Body
    audio_bytes = None
    mime_type = "audio/webm"

    if hasattr(file, "read"):
        audio_bytes = await file.read()
        mime_type = getattr(file, "content_type", "audio/webm") or "audio/webm"

    if not audio_bytes:
        return {"status": "empty", "text": "", "language": lang}

    text = await OmniVoiceService.transcribe_audio(audio_bytes=audio_bytes, mime_type=mime_type, lang_id=lang)
    return {
        "status": "success" if text else "empty",
        "text": text,
        "language": lang
    }



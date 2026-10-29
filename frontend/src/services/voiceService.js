// TruthShield Voice Assistance Service
// Provides Speech-to-Text (SpeechRecognition) and Text-to-Speech (SpeechSynthesis)

import api from './api';

const SpeechRecognition = 
  typeof window !== 'undefined' 
    ? (window.SpeechRecognition || window.webkitSpeechRecognition || null) 
    : null;

export const OMNIVOICE_LANGUAGES = [
  { id: 'en', code: 'en-US', name: 'English (US)', native: 'English', flag: '🌐' },
  { id: 'en-IN', code: 'en-IN', name: 'English (India)', native: 'Indian English', flag: '🇮🇳' },
  { id: 'hi', code: 'hi-IN', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { id: 'ur', code: 'ur-PK', name: 'Urdu', native: 'اردو', flag: '🇵🇰' },
  { id: 'bn', code: 'bn-IN', name: 'Bengali', native: 'বাংলা', flag: '🇧🇩' },
  { id: 'pa', code: 'pa-IN', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { id: 'mr', code: 'mr-IN', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { id: 'ta', code: 'ta-IN', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { id: 'te', code: 'te-IN', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { id: 'gu', code: 'gu-IN', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { id: 'kn', code: 'kn-IN', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { id: 'ml', code: 'ml-IN', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
  { id: 'as', code: 'as-IN', name: 'Assamese', native: 'অসমীয়া', flag: '🇮🇳' },
  { id: 'bho', code: 'bho-IN', name: 'Bhojpuri', native: 'भोजपुरी', flag: '🇮🇳' },
  { id: 'mai', code: 'mai-IN', name: 'Maithili', native: 'मैथिली', flag: '🇮🇳' },
  { id: 'ar', code: 'ar-SA', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { id: 'es', code: 'es-ES', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { id: 'fr', code: 'fr-FR', name: 'French', native: 'Français', flag: '🇫🇷' },
  { id: 'de', code: 'de-DE', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { id: 'ru', code: 'ru-RU', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
  { id: 'zh', code: 'zh-CN', name: 'Chinese (Mandarin)', native: '中文', flag: '🇨🇳' },
  { id: 'ja', code: 'ja-JP', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { id: 'ko', code: 'ko-KR', name: 'Korean', native: '한국어', flag: '🇰🇷' },
  { id: 'id', code: 'id-ID', name: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩' },
  { id: 'tr', code: 'tr-TR', name: 'Turkish', native: 'Türkçe', flag: '🇹🇷' },
  { id: 'vi', code: 'vi-VN', name: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳' },
  { id: 'fa', code: 'fa-IR', name: 'Persian (Farsi)', native: 'فارسی', flag: '🇮🇷' }
];

/**
 * Transforms raw text (markdown, emojis, URLs, technical symbols, code)
 * into natural, human-like spoken language.
 * Humans don't read every punctuation mark, URL, or emoji name.
 * They summarize conversationally and speak key points cleanly.
 */
export function toHumanSpeechText(rawText, { maxSentences = null, conversational = false, lang = 'en' } = {}) {
  if (!rawText || typeof rawText !== 'string') return '';
  let text = rawText;

  // 1. Remove code blocks & inline code
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`([^`]+)`/g, '$1');

  // 2. Remove markdown images & convert links to display text
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '');
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  // 3. Remove URLs completely (so TTS never spells out "h-t-t-p-s-colon-slash-slash")
  text = text.replace(/https?:\/\/\S+/gi, '');
  text = text.replace(/www\.\S+/gi, '');

  // 4. Remove Markdown headers, bold, italics, strikethrough, blockquotes
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');
  text = text.replace(/~~(.*?)~~/g, '$1');
  text = text.replace(/^>\s+/gm, '');
  text = text.replace(/^[-*_=\s]{3,}$/gm, '');

  // 5. Remove bullet list markers & numbering
  text = text.replace(/^\s*[-*+•►▶▪▫]\s+/gm, '');
  text = text.replace(/^\s*\d+[\.\)]\s+/gm, '');

  // 6. Strip all emojis, pictographs, variation selectors & UI symbols
  text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{FE00}-\u{FE0F}\u{200D}\u{1F1E6}-\u{1F1FF}]/gu, '');
  text = text.replace(/[🛡️✓✗⚡✦➜►▶★●■◆▼▲•❌✅⚠️🌐🤖]/g, '');

  // 7. Strip brackets, quotes, slashes, asterisks, and technical chars that TTS reads literally
  text = text.replace(/[\[\]\(\)\{\}<>|\\\/_~^#*"'`]/g, ' ');

  // 8. Convert % to natural spoken words per language
  const langKey = (lang || 'en').split('-')[0].toLowerCase();
  if (langKey === 'hi') {
    text = text.replace(/(\d+)\s*%/g, '$1 प्रतिशत');
  } else if (langKey === 'ur') {
    text = text.replace(/(\d+)\s*%/g, '$1 فیصد');
  } else if (langKey === 'bn') {
    text = text.replace(/(\d+)\s*%/g, '$1 শতাংশ');
  } else {
    text = text.replace(/(\d+)\s*%/g, '$1 percent');
  }

  // 9. Clean standalone symbols, isolated dots, dashes, or colons
  text = text.replace(/(^|\s+)[\.\,\-\:\;\|\/\\]+(\s+|$)/g, ' ');

  // 10. Clean repeated punctuation: "..." -> ".", "!!" -> "!", "??" -> "?"
  text = text.replace(/\.{2,}/g, '. ');
  text = text.replace(/!{2,}/g, '! ');
  text = text.replace(/\?{2,}/g, '? ');
  text = text.replace(/,\s*,/g, ',');

  // 11. Normalize newlines and extra spaces
  text = text.replace(/[\r\n]+/g, '. ');
  text = text.replace(/\s{2,}/g, ' ').trim();

  // 12. Conversational sentence selection (only if explicitly requested)
  if (conversational && maxSentences && maxSentences > 0) {
    const sentenceRegex = /[^.!?।]+[.!?।]+|[^.!?।]+$/g;
    const matches = text.match(sentenceRegex) || [text];
    const cleaned = matches
      .map(s => s.trim())
      .filter(s => s.length > 3 && /[a-zA-Z0-9\u0600-\u06FF\u0900-\u097F]/.test(s));
    text = (cleaned.length > maxSentences ? cleaned.slice(0, maxSentences) : cleaned).join(' ');
  }

  // 13. Final cleanup of edge punctuation
  text = text.replace(/^[.\s,;:-]+/, '').replace(/[\s,;:-]+$/, '');
  text = text.replace(/[।\.]+\s*\.+/g, '.').replace(/\.+$/, '.');
  if (text && !/[.!?।]$/.test(text)) {
    text += (langKey === 'hi' ? '।' : '.');
  }

  return text;
}

class VoiceService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.keepAliveTimer = null;
    this.chunks = [];
    this.chunkIndex = 0;

    // Strict monotonic generation token to invalidate stale callbacks & promises
    this._sessionToken = 0;

    // Singleton shared HTML5 Audio instance to prevent concurrent media decoders
    this._sharedAudio = null;
    if (typeof window !== 'undefined') {
      try {
        this._sharedAudio = new Audio();
      } catch (e) {
        this._sharedAudio = null;
      }
    }
  }

  // -------------------------------------------------------------
  // Internal Hard Reset: Guarantees zero overlapping audio streams
  // -------------------------------------------------------------
  _stopAllAudio() {
    // Increment session token: instantly invalidates all pending promises,
    // event callbacks (onplay, onended, onerror, onstart), and chunk recursions
    this._sessionToken++;
    const currentSession = this._sessionToken;

    this.isSpeaking = false;
    this.stopKeepAlive();
    this.chunks = [];
    this.chunkIndex = 0;

    // Detach and discard any active SpeechSynthesisUtterance
    if (this.currentUtterance) {
      try {
        this.currentUtterance.onstart = null;
        this.currentUtterance.onend = null;
        this.currentUtterance.onerror = null;
      } catch (e) {}
      this.currentUtterance = null;
    }

    // Cancel browser SpeechSynthesis pipeline
    if (this.isSpeechSynthesisSupported()) {
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          window.speechSynthesis.cancel();
        }
      } catch (e) {}
    }

    // Cleanly silence and reset HTML5 Audio element
    if (this._sharedAudio) {
      try {
        this._sharedAudio.onplay = null;
        this._sharedAudio.onplaying = null;
        this._sharedAudio.onended = null;
        this._sharedAudio.onerror = null;
        this._sharedAudio.oncanplay = null;
        this._sharedAudio.onpause = null;
        this._sharedAudio.onloadeddata = null;

        this._sharedAudio.pause();
        this._sharedAudio.currentTime = 0;
        this._sharedAudio.removeAttribute('src');
        this._sharedAudio.src = '';
        this._sharedAudio.load(); // Immediately aborts in-flight network requests & dumps media buffers
      } catch (e) {}
    }

    return currentSession;
  }

  // -------------------------------------------------------------
  // Direct Server Audio Stream (OmniVoice Hybrid Fallback)
  // -------------------------------------------------------------
  playAudioStream(text, lang = 'en', { onStart, onEnd, onError } = {}) {
    const session = this._stopAllAudio();
    if (!text || !text.trim()) return;

    const langKey = (lang || 'en').split('-')[0].toLowerCase();
    const cleanText = toHumanSpeechText(text, { conversational: false, lang: langKey });
    if (!cleanText) return;

    if (!this._sharedAudio && typeof window !== 'undefined') {
      try {
        this._sharedAudio = new Audio();
      } catch (e) {
        if (onError) onError('Audio playback is not supported in this browser.');
        return;
      }
    }
    if (!this._sharedAudio) return;

    try {
      this.isSpeaking = true;
      const audioUrl = `/api/omnivoice/audio?text=${encodeURIComponent(cleanText)}&lang=${encodeURIComponent(langKey)}`;
      const audio = this._sharedAudio;

      audio.onplay = () => {
        if (this._sessionToken !== session) return;
        this.isSpeaking = true;
        if (onStart) onStart();
      };

      audio.onended = () => {
        if (this._sessionToken !== session) return;
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };

      audio.onerror = (e) => {
        if (this._sessionToken !== session) return;
        console.warn('OmniVoice audio playback error:', e);
        this.isSpeaking = false;
        if (onError) onError('Speech audio playback error for selected language.');
      };

      audio.src = audioUrl;
      audio.load();

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Ignore interruption or aborted play when session changed or was stopped
          if (this._sessionToken !== session) return;
          if (err && (err.name === 'AbortError' || err.message?.includes('interrupted'))) return;
          console.warn('Audio play promise rejected:', err);
          this.isSpeaking = false;
          if (onError) onError(err.message || 'Audio autoplay was blocked.');
        });
      }
    } catch (err) {
      if (this._sessionToken !== session) return;
      console.warn('playAudioStream exception:', err);
      this.isSpeaking = false;
      if (onError) onError(err.message);
    }
  }

  // -------------------------------------------------------------
  // Speech-to-Text (Voice Input / Microphone)
  // -------------------------------------------------------------
  isSpeechRecognitionSupported() {
    return SpeechRecognition !== null;
  }

  normalizeSttLanguage(lang) {
    if (!lang) return 'en-US';
    const raw = lang.trim();
    const prefix = raw.split('-')[0].toLowerCase();
    const STT_MAP = {
      hi: 'hi-IN',
      ur: 'ur-PK',
      bn: 'bn-IN',
      pa: 'pa-IN',
      mr: 'mr-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      gu: 'gu-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      bho: 'hi-IN',
      mai: 'hi-IN',
      as: 'bn-IN',
      ar: 'ar-SA',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      ru: 'ru-RU',
      zh: 'zh-CN',
      ja: 'ja-JP',
      ko: 'ko-KR',
      id: 'id-ID',
      tr: 'tr-TR',
      vi: 'vi-VN',
      fa: 'fa-IR',
      en: raw.includes('IN') ? 'en-IN' : 'en-US'
    };
    return STT_MAP[prefix] || raw;
  }

  async ensureMicrophonePermission() {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch (err) {
        console.warn('Microphone permission prompt rejected:', err);
        return false;
      }
    }
    return true;
  }

  async startListening({
    onResult,
    onStart,
    onEnd,
    onError,
    lang = 'en-US'
  }) {
    // 1. Proactively ensure microphone permission is granted
    const hasPermission = await this.ensureMicrophonePermission();
    if (!hasPermission) {
      if (onError) onError('Microphone access was denied. Please click the lock or mic icon in your address bar and select "Allow".');
      return null;
    }

    // 2. Stop any existing voice or speech recognition
    this.stopListening();
    this.stopSpeaking();

    // 3. Fallback to MediaRecorder if Web Speech API is not supported (Firefox, Brave, HTTP tunnel)
    if (!this.isSpeechRecognitionSupported()) {
      return this.startMediaRecorderFallback({ onResult, onStart, onEnd, onError, lang });
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.normalizeSttLanguage(lang);

      let capturedFinal = '';
      let latestCombined = '';

      this.recognition.onstart = () => {
        this.isListening = true;
        if (onStart) onStart();
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            capturedFinal += (capturedFinal ? ' ' : '') + chunk.trim();
          } else {
            interimTranscript += chunk;
          }
        }

        latestCombined = (capturedFinal + (interimTranscript ? ' ' + interimTranscript : '')).trim();
        this._lastCapturedText = latestCombined;

        if (onResult) {
          onResult({
            final: capturedFinal,
            interim: interimTranscript.trim(),
            combined: latestCombined
          });
        }
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech recognition notice:', event.error);
        if (event.error === 'no-speech') {
          return;
        }
        if (event.error === 'language-not-supported') {
          console.warn('STT language not supported by browser, falling back to en-US');
          this.stopListening();
          this.startListening({ onResult, onStart, onEnd, onError, lang: 'en-US' });
          return;
        }
        if (onError) {
          let message = 'Speech recognition notice.';
          if (event.error === 'not-allowed') message = 'Microphone access was denied. Please allow microphone permissions.';
          else if (event.error === 'network') message = 'Network communication error during speech recognition.';
          onError(message);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (onEnd) onEnd(latestCombined || this._lastCapturedText || '');
      };

      this.recognition.start();
      return this.recognition;
    } catch (err) {
      console.warn('SpeechRecognition failed, falling back to MediaRecorder:', err);
      return this.startMediaRecorderFallback({ onResult, onStart, onEnd, onError, lang });
    }
  }

  async startMediaRecorderFallback({ onResult, onStart, onEnd, onError, lang = 'en' }) {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !window.MediaRecorder) {
      if (onError) onError('Voice recording is not supported in this browser.');
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this._mediaStream = stream;
      const mediaRecorder = new MediaRecorder(stream);
      this._mediaRecorder = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstart = () => {
        this.isListening = true;
        if (onStart) onStart();
      };

      mediaRecorder.onstop = async () => {
        this.isListening = false;
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
        
        try {
          const res = await api.transcribeAudio(blob, lang);
          const transcript = res?.text || '';
          if (onResult && transcript) {
            onResult({ final: transcript, interim: '', combined: transcript });
          }
          if (onEnd) onEnd(transcript);
        } catch (err) {
          console.warn('Server transcription error:', err);
          if (onEnd) onEnd('');
        }
      };

      mediaRecorder.start();
      return mediaRecorder;
    } catch (err) {
      if (onError) onError('Could not access microphone hardware: ' + err.message);
      return null;
    }
  }

  stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.recognition = null;
    }
    if (this._mediaRecorder && this._mediaRecorder.state !== 'inactive') {
      try {
        this._mediaRecorder.stop();
      } catch (e) {}
      this._mediaRecorder = null;
    }
    if (this._mediaStream) {
      try {
        this._mediaStream.getTracks().forEach(t => t.stop());
      } catch (e) {}
      this._mediaStream = null;
    }
    this.isListening = false;
  }

  // -------------------------------------------------------------
  // Text-to-Speech (Voice Output / Reader)
  // -------------------------------------------------------------
  isSpeechSynthesisSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  startKeepAlive() {
    this.stopKeepAlive();
    this.keepAliveTimer = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && this.isSpeaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 7000);
  }

  stopKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  speak(text, { 
    onStart, 
    onEnd, 
    onError, 
    rate = 1.0, 
    pitch = 1.0, 
    lang = 'en-US',
    cleanForHuman = true,
    maxSentences = null,
    conversational = false
  } = {}) {
    // Cancel any ongoing speech and obtain fresh session token
    const session = this._stopAllAudio();

    if (!text || !text.trim()) return;

    // Convert raw text into natural, clean human speech
    const speechText = cleanForHuman 
      ? toHumanSpeechText(text, { maxSentences, conversational, lang })
      : text.trim();

    if (!speechText || !speechText.trim()) return;

    const langCode = (lang || 'en-US').toLowerCase().replace('_', '-');
    const langPrefix = langCode.split('-')[0];
    const voices = (typeof window !== 'undefined' && window.speechSynthesis) 
      ? (window.speechSynthesis.getVoices() || []) 
      : [];

    let preferredVoice = null;
    if (voices.length > 0) {
      // 1. Exact match with neural/natural/Google quality
      preferredVoice = voices.find(v => {
        const vLang = v.lang.toLowerCase().replace('_', '-');
        return (vLang === langCode) &&
          (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Online'));
      });

      // 2. Exact match
      if (!preferredVoice) {
        preferredVoice = voices.find(v => v.lang.toLowerCase().replace('_', '-') === langCode);
      }

      // 3. Prefix match with neural/natural
      if (!preferredVoice) {
        preferredVoice = voices.find(v => 
          v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix) &&
          (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Online'))
        );
      }

      // 4. Any prefix match
      if (!preferredVoice) {
        preferredVoice = voices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix));
      }
    }

    // IF browser has NO matching voice installed for this language, stream directly from OmniVoice!
    // (Crucial for Urdu, Punjabi, Marathi, Tamil, Telugu, Kannada, Gujarati, Arabic, Russian, etc. on Windows)
    if (!preferredVoice || !this.isSpeechSynthesisSupported()) {
      return this.playAudioStream(speechText, lang, { onStart, onEnd, onError });
    }

    // Otherwise, break into chunks and use browser SpeechSynthesis with instant fallback
    const sentenceRegex = /[^.!?।\n]+[.!?।\n]+|[^.!?।\n]+$/g;
    const rawChunks = speechText.match(sentenceRegex) || [speechText];
    let chunks = [];

    for (let raw of rawChunks) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      if (trimmed.length > 160) {
        const subParts = trimmed.match(/[^,;]+[,;]+|[^,;]+$/g) || [trimmed];
        for (let sub of subParts) {
          const subTrimmed = sub.trim();
          if (subTrimmed) chunks.push(subTrimmed);
        }
      } else {
        chunks.push(trimmed);
      }
    }

    if (chunks.length === 0) chunks = [speechText];

    this.chunks = chunks;
    this.chunkIndex = 0;
    this.isSpeaking = true;

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const speakNextChunk = () => {
        // Enforce session isolation: if user switched language or stopped, abort immediately
        if (this._sessionToken !== session || !this.isSpeaking) return;

        if (this.chunkIndex >= this.chunks.length) {
          this.isSpeaking = false;
          this.currentUtterance = null;
          this.stopKeepAlive();
          if (onEnd) onEnd();
          return;
        }

        const chunkText = this.chunks[this.chunkIndex];
        const utterance = new SpeechSynthesisUtterance(chunkText);
        this.currentUtterance = utterance;
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.lang = lang;
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onstart = () => {
          if (this._sessionToken !== session) {
            try { window.speechSynthesis.cancel(); } catch (e) {}
            return;
          }
          if (this.chunkIndex === 0 && onStart) onStart();
          this.startKeepAlive();
        };

        utterance.onend = () => {
          if (this._sessionToken !== session) return;
          this.chunkIndex++;
          speakNextChunk();
        };

        utterance.onerror = (e) => {
          if (this._sessionToken !== session) return;
          // CRUCIAL FIX: If interrupted or canceled by rapid user action, DROP IT COMPLETELY!
          if (e.error === 'interrupted' || e.error === 'canceled') {
            return;
          }
          console.warn('Speech chunk warning:', e);
          // If browser TTS failed because voice/language unavailable, fallback to server stream!
          if (this.chunkIndex === 0 && (e.error === 'voice-unavailable' || e.error === 'language-unavailable' || e.error === 'network')) {
            this.stopSpeaking();
            this.playAudioStream(speechText, lang, { onStart, onEnd, onError });
            return;
          }
          if (this._sessionToken === session && this.isSpeaking) {
            this.chunkIndex++;
            speakNextChunk();
          }
        };

        window.speechSynthesis.speak(utterance);
      };

      speakNextChunk();
    } catch (err) {
      if (this._sessionToken !== session) return;
      console.warn('Browser SpeechSynthesis threw exception, falling back to audio stream:', err);
      this.playAudioStream(speechText, lang, { onStart, onEnd, onError });
    }
  }

  stopSpeaking() {
    this._stopAllAudio();
  }

  pauseSpeaking() {
    if (this._sharedAudio && !this._sharedAudio.paused) {
      try { this._sharedAudio.pause(); } catch (e) {}
    }
    if (this.isSpeechSynthesisSupported()) {
      try { window.speechSynthesis.pause(); } catch (e) {}
    }
  }

  resumeSpeaking() {
    if (this._sharedAudio && this._sharedAudio.src && this.isSpeaking) {
      try { this._sharedAudio.play().catch(() => {}); } catch (e) {}
    }
    if (this.isSpeechSynthesisSupported() && this.isSpeaking) {
      try { window.speechSynthesis.resume(); } catch (e) {}
    }
  }

  // -------------------------------------------------------------
  // Format Result into Verbal Script (OmniVoice Multilingual Human-like)
  // -------------------------------------------------------------
  formatReportScript(result, lang = 'en') {
    if (!result) return '';
    const { classification, confidence, claim, reasons = [], recommendation } = result;
    const confidencePercent = Math.round((confidence || 0.75) * 100);
    const langKey = (lang || 'en').split('-')[0].toLowerCase();

    // Clean claim, reason, recommendation of symbols, emojis, and noise
    const cleanClaim = claim 
      ? toHumanSpeechText(claim, { conversational: false, lang: langKey }).replace(/[.!?।]+$/, '') 
      : '';
    const cleanReason = (reasons && reasons.length > 0) 
      ? toHumanSpeechText(reasons[0], { conversational: false, lang: langKey }).replace(/[.!?।]+$/, '') 
      : '';
    const cleanRecommendation = recommendation 
      ? toHumanSpeechText(recommendation, { conversational: false, lang: langKey }).replace(/[.!?।]+$/, '') 
      : '';

    const LOCALIZED_TIER = {
      hi: { 'Likely Reliable': 'विश्वसनीय', 'Potentially Misleading': 'भ्रामक', 'Likely False': 'झूठा या असत्य', 'Needs Further Verification': 'अपुष्ट जानकारी' },
      ur: { 'Likely Reliable': 'قابلِ اعتماد', 'Potentially Misleading': 'گمراہ کن', 'Likely False': 'غلط اور غیر مستند', 'Needs Further Verification': 'مزید تصدیق طلب' },
      bn: { 'Likely Reliable': 'নির্ভরযোগ্য', 'Potentially Misleading': 'বিভ্রান্তিকর', 'Likely False': 'মিথ্যা বা ভুয়া', 'Needs Further Verification': 'অযাচাইকৃত' },
      pa: { 'Likely Reliable': 'ਭਰੋਸੇਯੋਗ', 'Potentially Misleading': 'ਭਰਮਾਊ', 'Likely False': 'ਝੂਠਾ', 'Needs Further Verification': 'ਪੜਤਾਲ ਅਧੀਨ' },
      ta: { 'Likely Reliable': 'நம்பகமானது', 'Potentially Misleading': 'தவறாக வழிநடத்துவது', 'Likely False': 'பொய்யானது', 'Needs Further Verification': 'சரிபார்க்கப்பட வேண்டும்' },
      te: { 'Likely Reliable': 'నమ్మదగినది', 'Potentially Misleading': 'తప్పుదారి పట్టించేది', 'Likely False': 'తప్పుడు సమాచారం', 'Needs Further Verification': 'ధృవీకరించబడాలి' },
      mr: { 'Likely Reliable': 'विश्वासार्ह', 'Potentially Misleading': 'दिशाभूल करणारे', 'Likely False': 'खोटे किंवा असत्य', 'Needs Further Verification': 'पडताळणी आवश्यक' },
      gu: { 'Likely Reliable': 'વિશ્વસનીય', 'Potentially Misleading': 'ગેરમાર્ગે દોરનારું', 'Likely False': 'ખોટું અથવા અસત્ય', 'Needs Further Verification': 'ચકાસણી જરૂરી' },
      kn: { 'Likely Reliable': 'ವಿಶ್ವಾಸಾರ್ಹ', 'Potentially Misleading': 'ದಾರಿತಪ್ಪಿಸುವ ಮಾಹಿತಿ', 'Likely False': 'ಸುಳ್ಳು', 'Needs Further Verification': 'ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ' },
      ml: { 'Likely Reliable': 'വിശ്വസനീയം', 'Potentially Misleading': 'തെറ്റിദ്ധരിപ്പിക്കുന്നത്', 'Likely False': 'വ്യാജം', 'Needs Further Verification': 'പരിശോധിക്കേണ്ടതുണ്ട്' },
      ar: { 'Likely Reliable': 'موثوق', 'Potentially Misleading': 'مضلل', 'Likely False': 'كاذب أو مزيف', 'Needs Further Verification': 'بحاجة للتحقق' },
      es: { 'Likely Reliable': 'Confiable', 'Potentially Misleading': 'Engañoso', 'Likely False': 'Falso', 'Needs Further Verification': 'Requiere verificación' },
      fr: { 'Likely Reliable': 'Fiable', 'Potentially Misleading': 'Trompeur', 'Likely False': 'Faux', 'Needs Further Verification': 'À vérifier' },
      de: { 'Likely Reliable': 'Glaubwürdig', 'Potentially Misleading': 'Irreführend', 'Likely False': 'Falsch', 'Needs Further Verification': 'Überprüfung erforderlich' },
      ru: { 'Likely Reliable': 'Достоверно', 'Potentially Misleading': 'Вводит в заблуждение', 'Likely False': 'Ложно', 'Needs Further Verification': 'Требует проверки' },
      zh: { 'Likely Reliable': '可信度高', 'Potentially Misleading': '存在误导', 'Likely False': '虚假信息', 'Needs Further Verification': '有待进一步核实' },
      ja: { 'Likely Reliable': '信頼できる情報', 'Potentially Misleading': '誤解を招く可能性', 'Likely False': '偽情報', 'Needs Further Verification': 'さらなる確認が必要' }
    };

    const tierName = (LOCALIZED_TIER[langKey] && LOCALIZED_TIER[langKey][classification]) 
      || classification;

    if (langKey === 'hi' || langKey === 'bho' || langKey === 'mai') {
      let script = `ट्रुथशील्ड सत्यापन रिपोर्ट: `;
      if (cleanClaim) script += `दावे "${cleanClaim}" की पड़ताल में, `;
      script += `यह जानकारी ${tierName} आंकी गई है, जिस पर एआई विश्वसनीयता ${confidencePercent} प्रतिशत है। `;
      if (cleanReason) script += `मुख्य कारण: ${cleanReason}। `;
      if (cleanRecommendation) script += `सलाह: ${cleanRecommendation}। `;
      else script += `कृपया साझा करने से पहले तथ्यों की पुष्टि करें।`;
      return toHumanSpeechText(script, { conversational: false, lang: 'hi' });
    }

    if (langKey === 'ur') {
      let script = `ٹروتھ شیلڈ تصدیقی رپورٹ: `;
      if (cleanClaim) script += `دعویٰ "${cleanClaim}" کی جانچ میں، `;
      script += `یہ مواد ${tierName} پایا گیا ہے، جس پر اعتماد ${confidencePercent} فیصد ہے۔ `;
      if (cleanReason) script += `بنیادی وجہ: ${cleanReason}۔ `;
      if (cleanRecommendation) script += `مشورہ: ${cleanRecommendation}। `;
      else script += `براہ کرم شیئر کرنے سے پہلے تصدیق ضرور کریں۔`;
      return toHumanSpeechText(script, { conversational: false, lang: 'ur' });
    }

    if (langKey === 'bn' || langKey === 'as') {
      let script = `ট্রুথশিল্ড যাচাই রিপোর্ট: `;
      if (cleanClaim) script += `দাবি "${cleanClaim}" সম্পর্কে, `;
      script += `এটি ${tierName} হিসেবে চিহ্নিত, আত্মবিশ্বাস ${confidencePercent} শতাংশ। `;
      if (cleanReason) script += `প্রধান কারণ: ${cleanReason}। `;
      if (cleanRecommendation) script += `পরামর্শ: ${cleanRecommendation}। `;
      else script += `শেয়ার করার আগে সত্যতা যাচাই করুন।`;
      return toHumanSpeechText(script, { conversational: false, lang: 'bn' });
    }

    if (langKey === 'pa') {
      let script = `ਟਰੂਥਸ਼ੀਲਡ ਪੜਤਾਲ ਰਿਪੋਰਟ: `;
      if (cleanClaim) script += `ਦਾਅਵੇ "${cleanClaim}" ਬਾਰੇ, `;
      script += `ਇਹ ${tierName} ਪਾਇਆ ਗਿਆ ਹੈ, ਭਰੋਸਾ ${confidencePercent} ਪ੍ਰਤੀਸ਼ਤ ਹੈ। `;
      if (cleanReason) script += `ਮੁੱਖ ਕਾਰਨ: ${cleanReason}। `;
      if (cleanRecommendation) script += `ਸਲਾਹ: ${cleanRecommendation}। `;
      else script += `ਸਾਂਝਾ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਜਾਂਚ ਜ਼ਰੂਰ ਕਰੋ।`;
      return toHumanSpeechText(script, { conversational: false, lang: 'pa' });
    }

    if (langKey === 'ta') {
      let script = `ட்ரூத்ஷீல்ட் சரிபார்ப்பு அறிக்கை: `;
      if (cleanClaim) script += `கூற்று "${cleanClaim}" குறித்து, `;
      script += `இது ${tierName} என மதிப்பிடப்பட்டுள்ளது, நம்பகத்தன்மை ${confidencePercent} சதவீதம். `;
      if (cleanReason) script += `முக்கிய காரணம்: ${cleanReason}. `;
      if (cleanRecommendation) script += `பரிந்துரை: ${cleanRecommendation}. `;
      else script += `பகிர்வதற்கு முன் சரிபார்க்கவும்.`;
      return toHumanSpeechText(script, { conversational: false, lang: 'ta' });
    }

    if (langKey === 'te') {
      let script = `ట్రూత్‌షీల్డ్ ధృవీకరణ నివేదిక: `;
      if (cleanClaim) script += `క్లెయిమ్ "${cleanClaim}" పై పరిశీలనలో, `;
      script += `ఈ సమాచారం ${tierName}గా అంచనా వేయబడింది, ఖచ్చితత్వం ${confidencePercent} శాతం. `;
      if (cleanReason) script += `ప్రధాన కారణం: ${cleanReason}. `;
      if (cleanRecommendation) script += `సలహా: ${cleanRecommendation}. `;
      else script += `షేర్ చేయడానికి ముందు ధృవీకరించండి.`;
      return toHumanSpeechText(script, { conversational: false, lang: 'te' });
    }

    if (langKey === 'mr') {
      let script = `ट्रुथशील्ड पडताळणी अहवाल: `;
      if (cleanClaim) script += `दावा "${cleanClaim}" संदर्भात, `;
      script += `ही माहिती ${tierName} ठरवण्यात आली आहे, विश्वासार्हता ${confidencePercent} टक्के आहे. `;
      if (cleanReason) script += `मुख्य कारण: ${cleanReason}. `;
      if (cleanRecommendation) script += `सल्ला: ${cleanRecommendation}. `;
      else script += `कृपया फॉरवर्ड करण्यापूर्वी खात्री करा.`;
      return toHumanSpeechText(script, { conversational: false, lang: 'mr' });
    }

    if (langKey === 'gu') {
      let script = `ટ્રુથશીલ્ડ ચકાસણી અહેવાલ: `;
      if (cleanClaim) script += `દાવા "${cleanClaim}" ની તપાસમાં, `;
      script += `આ માહિતી ${tierName} જણાયેલ છે, ચોકસાઈ ${confidencePercent} ટકા છે. `;
      if (cleanReason) script += `મુખ્ય કારણ: ${cleanReason}. `;
      if (cleanRecommendation) script += `સલાહ: ${cleanRecommendation}. `;
      else script += `શેર કરતા પહેલા ખાતરી કરો.`;
      return toHumanSpeechText(script, { conversational: false, lang: 'gu' });
    }

    if (langKey === 'ar') {
      let script = `تقرير التحقق من تروث شيلد: `;
      if (cleanClaim) script += `بخصوص الادعاء "${cleanClaim}"، `;
      script += `تم تقييم هذا المحتوى بأنه ${tierName}، بنسبة ثقة ${confidencePercent} بالمئة. `;
      if (cleanReason) script += `السبب الرئيسي: ${cleanReason}. `;
      if (cleanRecommendation) script += `التوجيه: ${cleanRecommendation}. `;
      else script += `يرجى التحقق من المصادر الرسمية قبل إعادة النشر.`;
      return toHumanSpeechText(script, { conversational: false, lang: 'ar' });
    }

    if (langKey === 'es') {
      let script = `Informe de verificación de TruthShield: `;
      if (cleanClaim) script += `En relación con la afirmación "${cleanClaim}", `;
      script += `esta información ha sido clasificada como ${tierName}, con una confianza del ${confidencePercent} por ciento. `;
      if (cleanReason) script += `Razón principal: ${cleanReason}. `;
      if (cleanRecommendation) script += `Recomendación: ${cleanRecommendation}. `;
      else script += `Verifique con fuentes oficiales antes de compartir.`;
      return toHumanSpeechText(script, { conversational: false, lang: 'es' });
    }

    // Default English - human-friendly conversational phrasing
    let script = `TruthShield Assessment: `;
    if (cleanClaim) {
      script += `Regarding the claim "${cleanClaim}", `;
    }
    script += `this is evaluated as ${classification.toLowerCase()}, with ${confidencePercent} percent confidence. `;
    if (cleanReason) {
      script += `Key reason: ${cleanReason}. `;
    }
    if (cleanRecommendation) {
      script += `Recommended action: ${cleanRecommendation}. `;
    } else {
      script += `Please think and verify before sharing.`;
    }
    return toHumanSpeechText(script, { conversational: false, lang: 'en' });
  }
}

export const voiceService = new VoiceService();
export default voiceService;


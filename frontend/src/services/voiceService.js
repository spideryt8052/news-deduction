// TruthShield Voice Assistance Service
// Provides Speech-to-Text (SpeechRecognition) and Text-to-Speech (SpeechSynthesis)

const SpeechRecognition = 
  typeof window !== 'undefined' 
    ? (window.SpeechRecognition || window.webkitSpeechRecognition || null) 
    : null;

class VoiceService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isSpeaking = false;
  }

  // -------------------------------------------------------------
  // Speech-to-Text (Voice Input)
  // -------------------------------------------------------------
  isSpeechRecognitionSupported() {
    return SpeechRecognition !== null;
  }

  startListening({
    onResult,
    onStart,
    onEnd,
    onError,
    lang = 'en-US'
  }) {
    if (!this.isSpeechRecognitionSupported()) {
      if (onError) onError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return null;
    }

    // Stop existing instance if any
    this.stopListening();

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = lang;

      this.recognition.onstart = () => {
        this.isListening = true;
        if (onStart) onStart();
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptChunk;
          } else {
            interimTranscript += transcriptChunk;
          }
        }

        if (onResult) {
          onResult({
            final: finalTranscript,
            interim: interimTranscript,
            combined: (finalTranscript || interimTranscript).trim()
          });
        }
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (onError) {
          let message = 'Speech recognition error.';
          if (event.error === 'not-allowed') message = 'Microphone access was denied. Please allow microphone permissions.';
          else if (event.error === 'no-speech') message = 'No speech detected. Please speak clearly into your microphone.';
          else if (event.error === 'network') message = 'Network communication error during speech recognition.';
          onError(message);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (onEnd) onEnd();
      };

      this.recognition.start();
      return this.recognition;
    } catch (err) {
      if (onError) onError(err.message || 'Failed to start microphone.');
      return null;
    }
  }

  stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignored
      }
      this.recognition = null;
      this.isListening = false;
    }
  }

  // -------------------------------------------------------------
  // Text-to-Speech (Voice Output / Reader)
  // -------------------------------------------------------------
  isSpeechSynthesisSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  speak(text, { onStart, onEnd, onError, rate = 1.0, pitch = 1.0, lang = 'en-US' } = {}) {
    if (!this.isSpeechSynthesisSupported()) {
      if (onError) onError('Text-to-speech is not supported in this browser.');
      return;
    }

    // Cancel any ongoing speech first
    this.stopSpeaking();

    if (!text || !text.trim()) return;

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text.trim());
      this.currentUtterance = utterance;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.lang = lang;

      // Select optimal English voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        // Prefer natural sounding English or Indian English voice
        const preferredVoice = voices.find(v => 
          (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural')) && 
          (v.lang.startsWith('en') || v.lang.startsWith('hi'))
        ) || voices.find(v => v.lang.startsWith('en'));

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        if (onStart) onStart();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        if (onError) onError(e.error || 'Speech synthesis error occurred.');
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (onError) onError(err.message || 'Speech synthesis failed.');
    }
  }

  stopSpeaking() {
    if (this.isSpeechSynthesisSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // Ignored
      }
      this.isSpeaking = false;
    }
  }

  pauseSpeaking() {
    if (this.isSpeechSynthesisSupported()) {
      window.speechSynthesis.pause();
    }
  }

  resumeSpeaking() {
    if (this.isSpeechSynthesisSupported()) {
      window.speechSynthesis.resume();
    }
  }

  // -------------------------------------------------------------
  // Format Result into Verbal Script
  // -------------------------------------------------------------
  formatReportScript(result) {
    if (!result) return '';
    const { classification, confidence, claim, reasons = [], recommendation } = result;
    const confidencePercent = Math.round((confidence || 0.75) * 100);

    let script = `TruthShield AI Verification Report. `;
    if (claim) {
      script += `For the claim: "${claim}". `;
    }
    script += `This content is evaluated as: ${classification}, with an AI assessment confidence of ${confidencePercent} percent. `;

    if (reasons && reasons.length > 0) {
      script += `Key reasons: ${reasons.slice(0, 2).join('. ')}. `;
    }

    if (recommendation) {
      script += `Recommended action: ${recommendation}. `;
    }

    script += `Remember: Think before you share.`;
    return script;
  }
}

export const voiceService = new VoiceService();
export default voiceService;

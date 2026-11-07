import React, { useState, useEffect, useRef } from 'react';
import { 
  Languages, 
  ArrowRightLeft, 
  Volume2, 
  VolumeX, 
  Download, 
  Copy, 
  Check, 
  Mic, 
  MicOff, 
  RotateCcw, 
  Sparkles, 
  Clipboard, 
  FileText, 
  Zap,
  Loader2,
  CheckCircle2,
  Upload,
  Music,
  Headphones,
  Radio,
  Film,
  Sliders,
  X,
  FileUp,
  Play,
  Pause,
  ExternalLink,
  FileCheck
} from 'lucide-react';
import api, { formatApiError } from '../services/api';
import voiceService, { OMNIVOICE_LANGUAGES } from '../services/voiceService';
import audioStudio, { BEAT_PRESETS } from '../services/audioStudioService';

const SAMPLE_TEXTS = [
  {
    label: 'लहसुन अफवाह (Hindi)',
    lang: 'hi',
    text: 'क्या उबला हुआ लहसुन का पानी पीने से सभी प्रकार के वायरस और संक्रमण ठीक हो जाते हैं?'
  },
  {
    label: '30-Sec Rule (English)',
    lang: 'en',
    text: 'The 30-second rule advises pausing before forwarding any sensational post to verify its original domain and publishing date.'
  },
  {
    label: 'सोशल मीडिया फेक न्यूज़ (Hindi)',
    lang: 'hi',
    text: 'सोशल मीडिया पर सनसनीखेज और भ्रामक खबरें प्रमाणित सच से 6 गुना तेजी से फॉरवर्ड होती हैं।'
  },
  {
    label: 'تصدیق کا اصول (Urdu)',
    lang: 'ur',
    text: 'واٹس ایپ پر موصول ہونے والی کسی بھی خبر کو آگے بھیجنے سے پہلے معتبر ذرائع سے تصدیق ضرور کریں۔'
  }
];

export default function TranslatePage() {
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('hi');
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [translationEngine, setTranslationEngine] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Audio Playback & Voice Settings
  const [voiceGender, setVoiceGender] = useState(() => voiceService.getGender());
  const [activePlayingSide, setActivePlayingSide] = useState(null); // 'input' | 'output' | null
  const [copiedInput, setCopiedInput] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);

  // Dictation / Speech Recognition
  const [isDictating, setIsDictating] = useState(false);

  // Document Upload (PDF, DOCX, TXT, MD)
  const [uploadedDoc, setUploadedDoc] = useState(null); // { filename, pages, words }
  const [isExtractingDoc, setIsExtractingDoc] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef(null);
  const customBeatInputRef = useRef(null);

  // Background Beats / Music Studio State
  const [selectedBeat, setSelectedBeat] = useState('none');
  const [beatVolume, setBeatVolume] = useState(0.22);
  const [isPlayingBeatSolo, setIsPlayingBeatSolo] = useState(false);
  const [customBeatName, setCustomBeatName] = useState('');
  const [isMixingDownload, setIsMixingDownload] = useState(false);

  // Suno AI Song Mode Modal / Panel
  const [showSunoModal, setShowSunoModal] = useState(false);
  const [sunoPromptText, setSunoPromptText] = useState('');
  const [copiedSuno, setCopiedSuno] = useState(false);

  const inputAreaRef = useRef(null);

  // Sync voice gender across tabs and components
  useEffect(() => {
    const handleGenderChange = (e) => {
      if (e.detail) setVoiceGender(e.detail);
    };
    window.addEventListener('truthshield-voice-gender-changed', handleGenderChange);
    return () => {
      voiceService.stopSpeaking();
      audioStudio.stopLiveBeat();
      window.removeEventListener('truthshield-voice-gender-changed', handleGenderChange);
    };
  }, []);

  const handleGenderSwitch = (gender) => {
    setVoiceGender(gender);
    voiceService.setGender(gender);
    if (activePlayingSide) {
      voiceService.stopSpeaking();
      audioStudio.stopLiveBeat();
      setActivePlayingSide(null);
    }
  };

  const handleTranslate = async () => {
    const textToTranslate = inputText.trim();
    if (!textToTranslate) return;

    voiceService.stopSpeaking();
    audioStudio.stopLiveBeat();
    setActivePlayingSide(null);
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.translateText(textToTranslate, targetLang, sourceLang);
      setTranslatedText(res.translated_text || '');
      setTranslationEngine(res.engine || 'hybrid');
    } catch (err) {
      console.error('Translation error:', err);
      setErrorMsg(formatApiError(err) || 'Translation service is temporarily busy.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') return;
    const oldSource = sourceLang;
    const oldTarget = targetLang;
    const oldInput = inputText;
    const oldOutput = translatedText;

    setSourceLang(oldTarget);
    setTargetLang(oldSource);
    setInputText(oldOutput);
    setTranslatedText(oldInput);
    voiceService.stopSpeaking();
    audioStudio.stopLiveBeat();
    setActivePlayingSide(null);
  };

  // -------------------------------------------------------------
  // Document Upload & Extraction Handler (PDF, DOCX, TXT, MD)
  // -------------------------------------------------------------
  const handleDocumentFile = async (file) => {
    if (!file) return;
    setIsExtractingDoc(true);
    setErrorMsg('');

    try {
      const data = await api.extractDocumentText(file);
      if (data && data.extracted_text) {
        setInputText(data.extracted_text);
        setUploadedDoc({
          filename: data.filename || file.name,
          pages: data.pages || 1,
          words: data.word_count || data.extracted_text.split(/\s+/).length,
          fileType: (data.file_type || file.name.split('.').pop()).toUpperCase(),
        });
      }
    } catch (err) {
      console.error('Failed to extract document text:', err);
      setErrorMsg(formatApiError(err) || 'Could not extract text from this document. Please ensure it contains selectable text.');
    } finally {
      setIsExtractingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearDocument = () => {
    setUploadedDoc(null);
    setInputText('');
  };

  // Drag & drop handlers for document upload
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };
  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };
  const handleDropFile = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleDocumentFile(e.dataTransfer.files[0]);
    }
  };

  // -------------------------------------------------------------
  // Beat Preview & Audio Playback Synchronization
  // -------------------------------------------------------------
  const handleToggleBeatSolo = async (beatId) => {
    if (isPlayingBeatSolo) {
      audioStudio.stopLiveBeat();
      setIsPlayingBeatSolo(false);
    } else {
      setIsPlayingBeatSolo(true);
      await audioStudio.playLiveBeat(beatId, beatVolume);
    }
  };

  const handleCustomBeatUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const info = await audioStudio.loadCustomBeatFile(file);
      setCustomBeatName(`${file.name} (${Math.round(info.duration)}s)`);
      setSelectedBeat('custom');
    } catch (err) {
      console.error('Custom beat load error:', err);
      alert('Could not decode audio file. Please upload a standard MP3 or WAV file.');
    }
  };

  // Audio Playback for Input or Output (with Beat Synchronized)
  const handleTogglePlay = async (side) => {
    if (activePlayingSide === side) {
      voiceService.stopSpeaking();
      audioStudio.stopLiveBeat();
      setActivePlayingSide(null);
      return;
    }

    voiceService.stopSpeaking();
    audioStudio.stopLiveBeat();
    setIsPlayingBeatSolo(false);

    const text = side === 'input' ? inputText : translatedText;
    const lang = side === 'input' ? (sourceLang === 'auto' ? 'hi' : sourceLang) : targetLang;

    if (!text || !text.trim()) return;

    setActivePlayingSide(side);

    // If beat is selected, start beat in background
    if (selectedBeat !== 'none') {
      audioStudio.playLiveBeat(selectedBeat, beatVolume);
    }

    voiceService.speak(text, {
      lang: lang,
      gender: voiceGender,
      readFull: true,
      onStart: () => setActivePlayingSide(side),
      onEnd: () => {
        setActivePlayingSide(null);
        audioStudio.stopLiveBeat();
      },
      onError: () => {
        setActivePlayingSide(null);
        audioStudio.stopLiveBeat();
      }
    });
  };

  // -------------------------------------------------------------
  // Audio Downloads (Voice Only MP3 & Mixed Beat WAV)
  // -------------------------------------------------------------
  const handleDownloadAudioOnly = (side) => {
    const text = side === 'input' ? inputText : translatedText;
    const lang = side === 'input' ? (sourceLang === 'auto' ? 'hi' : sourceLang) : targetLang;

    if (!text || !text.trim()) return;

    const safeName = `truthshield-${side}-${lang}-${voiceGender}.mp3`;
    voiceService.downloadAudio(text, lang, safeName, voiceGender);
  };

  const handleDownloadWithBeat = async (side) => {
    const text = side === 'input' ? inputText : translatedText;
    const lang = side === 'input' ? (sourceLang === 'auto' ? 'hi' : sourceLang) : targetLang;

    if (!text || !text.trim()) return;

    setIsMixingDownload(true);
    try {
      // 1. Fetch raw voice narration stream from backend
      const voiceArrayBuffer = await voiceService.getAudioArrayBuffer(text, lang, voiceGender);
      if (!voiceArrayBuffer) {
        throw new Error('Could not fetch speech narration audio.');
      }

      // 2. Mix with selected beat or fallback to lofi
      const activeBeat = selectedBeat === 'none' ? 'lofi' : selectedBeat;
      const mixedBlob = await audioStudio.mixVoiceAndBeatToWav({
        voiceArrayBuffer,
        beatId: activeBeat,
        beatVolume: beatVolume,
      });

      // 3. Trigger direct browser download
      const safeName = `truthshield-${side}-${lang}-${activeBeat}-beat.wav`;
      const url = URL.createObjectURL(mixedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 500);
    } catch (err) {
      console.error('Audio mixing download error:', err);
      // Fallback to voice only MP3 download if mixing failed
      handleDownloadAudioOnly(side);
    } finally {
      setIsMixingDownload(false);
    }
  };

  // -------------------------------------------------------------
  // Suno AI Song Mode Prompt Generator
  // -------------------------------------------------------------
  const handleOpenSunoModal = () => {
    const targetText = translatedText || inputText || 'सत्य और तथ्य की पहचान करें, भ्रामक खबरों से सावधान रहें।';
    const prompt = audioStudio.createSunoPrompt(targetText);
    setSunoPromptText(prompt);
    setShowSunoModal(true);
  };

  const handleCopySunoPrompt = () => {
    navigator.clipboard.writeText(sunoPromptText);
    setCopiedSuno(true);
    setTimeout(() => setCopiedSuno(false), 2000);
  };

  // Clipboard Helpers
  const handleCopy = (side) => {
    const text = side === 'input' ? inputText : translatedText;
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (side === 'input') {
      setCopiedInput(true);
      setTimeout(() => setCopiedInput(false), 2000);
    } else {
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 2000);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text);
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
  };

  // Microphone Dictation for Input
  const handleToggleDictation = () => {
    if (isDictating) {
      voiceService.stopListening();
      setIsDictating(false);
    } else {
      voiceService.stopSpeaking();
      audioStudio.stopLiveBeat();
      setActivePlayingSide(null);
      const dictateLang = sourceLang === 'auto' ? 'hi-IN' : sourceLang;

      voiceService.startListening({
        lang: dictateLang,
        onStart: () => setIsDictating(true),
        onEnd: (finalText) => {
          setIsDictating(false);
          if (finalText) {
            setInputText(prev => (prev ? `${prev} ${finalText}` : finalText));
          }
        },
        onError: (err) => {
          setIsDictating(false);
          console.warn('Dictation error:', err);
        },
        onResult: ({ combined }) => {
          if (combined) {
            setInputText(combined);
          }
        }
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in space-y-6">
      
      {/* Hidden File Input for PDF / DOCX */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md,.csv,.json"
        onChange={(e) => e.target.files && handleDocumentFile(e.target.files[0])}
        className="hidden"
      />

      {/* Hidden File Input for Custom Beat */}
      <input
        ref={customBeatInputRef}
        type="file"
        accept="audio/mp3,audio/wav,audio/mpeg,audio/*"
        onChange={handleCustomBeatUpload}
        className="hidden"
      />

      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 bg-dark-800/80 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Languages className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                AI Translator & Audio Studio (अनुवाद और वॉयस स्टूडियो)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              Translate text & documents (PDF/DOCX), listen in authentic Male or Female voice, add background beats (Suno-style), and download HD audio.
            </p>
          </div>

          {/* Action Header Tools */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Suno AI Song Mode Button */}
            <button
              type="button"
              onClick={handleOpenSunoModal}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-400 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Generate Suno AI Song Prompt & Lyrics"
            >
              <Music className="w-3.5 h-3.5 text-amber-400" />
              <span>Suno AI Song Mode</span>
            </button>

            {/* Global Voice Gender Switcher */}
            <div className="flex items-center gap-1.5 bg-dark-900/90 border border-slate-700/80 rounded-2xl p-1 shadow-lg">
              <button
                type="button"
                onClick={() => handleGenderSwitch('female')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  voiceGender === 'female'
                    ? 'bg-gradient-to-r from-pink-500/25 to-purple-500/25 text-pink-300 border border-pink-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>👩</span>
                <span>Female (महिला)</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenderSwitch('male')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  voiceGender === 'male'
                    ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>👨</span>
                <span>Male (पुरुष)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sample Prompt Pills */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0">Sample Texts:</span>
          {SAMPLE_TEXTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputText(sample.text);
                setSourceLang(sample.lang);
                if (sample.lang === 'hi') setTargetLang('en');
                else setTargetLang('hi');
              }}
              className="whitespace-nowrap px-3 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-[11px] font-medium text-slate-300 border border-white/5 transition-colors cursor-pointer"
            >
              ⚡ {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Translation & Audio Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Input Text, Document Upload & Audio */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDropFile}
          className={`glass-panel p-5 sm:p-6 rounded-3xl border transition-all duration-200 bg-dark-800/80 backdrop-blur-xl flex flex-col justify-between shadow-xl space-y-4 relative ${
            isDraggingFile ? 'border-cyan-400 bg-cyan-950/20 ring-2 ring-cyan-400/50' : 'border-white/10'
          }`}
        >
          {isDraggingFile && (
            <div className="absolute inset-0 bg-dark-900/90 backdrop-blur-sm rounded-3xl z-20 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-cyan-400 pointer-events-none">
              <FileUp className="w-12 h-12 text-cyan-400 animate-bounce mb-2" />
              <p className="text-white font-bold text-base">Drop your PDF or DOCX file here</p>
              <p className="text-slate-400 text-xs mt-1">Automatic text extraction for translation & audio synthesis</p>
            </div>
          )}

          {/* Header Bar: Source Language Selector & Document Upload Button */}
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-cyan-400">
                Source Text (लिखें या फ़ाइल अपलोड करें):
              </span>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="auto">🌐 Auto Detect (पहचानें)</option>
                {OMNIVOICE_LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Document Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                disabled={isExtractingDoc}
                className="px-2.5 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Upload PDF, DOCX, TXT or MD document"
              >
                {isExtractingDoc ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileUp className="w-3.5 h-3.5" />
                )}
                <span>{isExtractingDoc ? 'Reading...' : 'Upload PDF / DOCX'}</span>
              </button>

              <button
                type="button"
                onClick={handlePaste}
                className="p-1.5 rounded-lg bg-dark-900 hover:bg-white/5 text-slate-400 hover:text-white border border-white/5 text-xs transition-colors"
                title="Paste from clipboard"
              >
                <Clipboard className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputText('');
                  setUploadedDoc(null);
                }}
                className="p-1.5 rounded-lg bg-dark-900 hover:bg-white/5 text-slate-400 hover:text-white border border-white/5 text-xs transition-colors"
                title="Clear text"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Uploaded Document Status Badge */}
          {uploadedDoc && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-semibold truncate">{uploadedDoc.filename}</span>
                <span className="text-slate-400 shrink-0">
                  • {uploadedDoc.pages} {uploadedDoc.pages > 1 ? 'pages' : 'page'} • {uploadedDoc.words} words ({uploadedDoc.fileType})
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearDocument}
                className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                title="Remove attached document"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Input Textarea with Dictation Overlay */}
          <div className="relative flex-1 min-h-[200px]">
            <textarea
              ref={inputAreaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="यहाँ कोई भी टेक्स्ट, न्यूज़ या दावा लिखें, या ऊपर दिए बटन से PDF / DOCX फ़ाइल अपलोड करें... (Type or paste text, or drag & drop a PDF / Word document)..."
              className="w-full h-full min-h-[200px] bg-dark-900/90 border border-slate-700/80 rounded-2xl p-4 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed resize-none transition-colors"
            />
            {isDictating && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Listening... बोलें</span>
              </div>
            )}
          </div>

          {/* Footer Controls: Audio Listen, Download, Word Count, Dictate */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Listen to Input (With Beat if selected) */}
              <button
                type="button"
                onClick={() => handleTogglePlay('input')}
                disabled={!inputText.trim()}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  activePlayingSide === 'input'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm animate-pulse'
                    : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                }`}
                title="Listen to written text in selected voice"
              >
                {activePlayingSide === 'input' ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Listen ({voiceGender === 'female' ? '👩 Swara' : '👨 Madhur'}{selectedBeat !== 'none' ? ' + Beat' : ''})</span>
                  </>
                )}
              </button>

              {/* Download Voice Only */}
              <button
                type="button"
                onClick={() => handleDownloadAudioOnly('input')}
                disabled={!inputText.trim()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-dark-900 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Download clear speech MP3 without background music"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Voice MP3</span>
              </button>

              {/* Download Mixed with Beat */}
              <button
                type="button"
                onClick={() => handleDownloadWithBeat('input')}
                disabled={!inputText.trim() || isMixingDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 text-purple-300 border border-purple-500/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                title="Download speech mixed with selected background beat"
              >
                {isMixingDownload ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-300" />
                ) : (
                  <Music className="w-3.5 h-3.5 text-purple-400" />
                )}
                <span>{isMixingDownload ? 'Mixing...' : 'Download with Beat (WAV)'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">
                {inputText.length} chars
              </span>

              {/* Dictation Mic Button */}
              <button
                type="button"
                onClick={handleToggleDictation}
                className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isDictating
                    ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title={isDictating ? "Stop voice dictation" : "Dictate via microphone"}
              >
                {isDictating ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Translated Output & Audio */}
        <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 bg-dark-800/80 backdrop-blur-xl flex flex-col justify-between shadow-xl space-y-4">
          
          {/* Header Bar: Target Language Selector & Swap */}
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-400">
                Translation (अनुवाद):
              </span>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {OMNIVOICE_LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.flag} {l.name} ({l.native})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSwapLanguages}
                disabled={sourceLang === 'auto'}
                className="p-1.5 rounded-lg bg-dark-900 hover:bg-white/5 text-slate-400 hover:text-white border border-white/5 text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Swap source and target languages"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleCopy('output')}
                disabled={!translatedText}
                className="p-1.5 rounded-lg bg-dark-900 hover:bg-white/5 text-slate-400 hover:text-white border border-white/5 text-xs transition-colors disabled:opacity-30"
                title="Copy translated text"
              >
                {copiedOutput ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Output Display Box */}
          <div className="relative flex-1 min-h-[200px]">
            <div className="w-full h-full min-h-[200px] bg-dark-900/90 border border-slate-700/80 rounded-2xl p-4 text-sm sm:text-base text-white leading-relaxed overflow-y-auto whitespace-pre-wrap flex flex-col justify-between">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full my-auto space-y-3 py-12 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                  <p className="text-xs font-semibold text-slate-300">Translating text into {targetLang.toUpperCase()}...</p>
                </div>
              ) : translatedText ? (
                <div>
                  <p>{translatedText}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full my-auto text-center py-12 text-slate-500 space-y-2">
                  <Languages className="w-8 h-8 text-slate-600" />
                  <p className="text-xs">Your translation will appear here. Click "Translate Now" below.</p>
                </div>
              )}

              {errorMsg && (
                <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {errorMsg}
                </div>
              )}
            </div>
          </div>

          {/* Footer Controls: Audio Listen, Download, Engine Info */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Listen to Translation */}
              <button
                type="button"
                onClick={() => handleTogglePlay('output')}
                disabled={!translatedText.trim()}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  activePlayingSide === 'output'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm animate-pulse'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}
                title="Listen to translated output in selected voice"
              >
                {activePlayingSide === 'output' ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Listen ({voiceGender === 'female' ? '👩 Swara' : '👨 Madhur'}{selectedBeat !== 'none' ? ' + Beat' : ''})</span>
                  </>
                )}
              </button>

              {/* Download Voice Only */}
              <button
                type="button"
                onClick={() => handleDownloadAudioOnly('output')}
                disabled={!translatedText.trim()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-dark-900 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Download translated speech MP3 without background music"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Voice MP3</span>
              </button>

              {/* Download Mixed with Beat */}
              <button
                type="button"
                onClick={() => handleDownloadWithBeat('output')}
                disabled={!translatedText.trim() || isMixingDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                title="Download translated speech mixed with selected background beat"
              >
                {isMixingDownload ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-300" />
                ) : (
                  <Music className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>{isMixingDownload ? 'Mixing...' : 'Download with Beat (WAV)'}</span>
              </button>
            </div>

            {translationEngine && (
              <span className="text-[10px] text-cyan-400/80 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30 font-medium">
                Engine: {translationEngine.toUpperCase()}
              </span>
            )}
          </div>

        </div>

      </div>

      {/* Main Translate Action Bar */}
      <div className="flex items-center justify-center pt-2">
        <button
          type="button"
          onClick={handleTranslate}
          disabled={loading || !inputText.trim()}
          className="group relative px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2.5"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Translating Content...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Translate Now (अनुवाद करें)</span>
            </>
          )}
        </button>
      </div>

      {/* BACKGROUND BEAT & MUSIC STUDIO PANEL */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-dark-800/80 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Background Beat & Music Studio (बीट और बैकग्राउंड म्यूज़िक)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                  Suno-Style Audio
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose a rhythmic beat or ambient soundtrack to accompany your voice narration.
              </p>
            </div>
          </div>

          {/* Beat Volume Controller */}
          {selectedBeat !== 'none' && (
            <div className="flex items-center gap-2.5 bg-dark-900/90 border border-slate-700/80 px-3 py-1.5 rounded-2xl w-full sm:w-auto">
              <Sliders className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="text-xs text-slate-300 shrink-0 font-medium">
                Beat Volume: {Math.round(beatVolume * 100)}%
              </span>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.02"
                value={beatVolume}
                onChange={(e) => setBeatVolume(parseFloat(e.target.value))}
                className="w-24 accent-purple-500 cursor-pointer"
                title="Adjust background beat volume"
              />
            </div>
          )}
        </div>

        {/* Beat Selection Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {BEAT_PRESETS.map((beat) => {
            const isSelected = selectedBeat === beat.id;
            return (
              <div
                key={beat.id}
                onClick={() => {
                  setSelectedBeat(beat.id);
                  if (isPlayingBeatSolo) {
                    audioStudio.playLiveBeat(beat.id, beatVolume);
                  }
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between text-left ${
                  isSelected
                    ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500/50 shadow-lg shadow-purple-500/10'
                    : 'bg-dark-900/60 border-slate-700/60 hover:border-slate-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-base">
                      {beat.id === 'none' && '🚫'}
                      {beat.id === 'lofi' && '🎧'}
                      {beat.id === 'news' && '📢'}
                      {beat.id === 'cinematic' && '🎬'}
                      {beat.id === 'hiphop' && '🎤'}
                      {beat.id === 'meditation' && '🧘'}
                      {beat.id === 'custom' && '📁'}
                    </span>
                    {beat.bpm > 0 && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {beat.bpm} BPM
                      </span>
                    )}
                  </div>
                  <h3 className={`text-xs font-bold leading-tight ${isSelected ? 'text-purple-300' : 'text-white'}`}>
                    {beat.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                    {beat.id === 'custom' && customBeatName ? customBeatName : beat.desc}
                  </p>
                </div>

                {beat.id === 'custom' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      customBeatInputRef.current && customBeatInputRef.current.click();
                    }}
                    className="mt-2 text-[10px] text-purple-400 hover:text-purple-300 underline font-semibold"
                  >
                    {customBeatName ? 'Change File' : 'Browse MP3...'}
                  </button>
                )}

                {/* Solo Test Button for this Beat */}
                {beat.id !== 'none' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBeat(beat.id);
                      handleToggleBeatSolo(beat.id);
                    }}
                    className={`mt-2 py-1 px-2 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors ${
                      isSelected && isPlayingBeatSolo
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-dark-800 hover:bg-slate-700 text-slate-300 border border-white/5'
                    }`}
                  >
                    {isSelected && isPlayingBeatSolo ? (
                      <>
                        <Pause className="w-2.5 h-2.5" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-2.5 h-2.5" />
                        <span>Test Beat</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SUNO AI SONG MAKER MODAL */}
      {showSunoModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 bg-dark-900/95 max-w-2xl w-full shadow-2xl relative space-y-4">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Suno AI Song Creator (सुन्नो एआई सॉन्ग मेकर)</h3>
                  <p className="text-xs text-slate-400">Structured prompt & lyrics tailored for Suno AI Text-to-Music</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSunoModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
              💡 <strong>नोट:</strong> Suno AI एक कमर्शियल म्यूज़िक मॉडल है जिसका ऑफिशियल फ्री पब्लिक API नहीं है। हमने आपके टेक्स्ट और न्यूज़ को <strong>[Verse 1]</strong>, <strong>[Chorus]</strong>, और <strong>[Music Style]</strong> में कन्वर्ट कर दिया है। आप इसे 1-क्लिक में कॉपी करके सीधे <strong>Suno.com</strong> पर पेस्ट करके पूरा गाना बनवा सकते हैं!
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Generated Suno AI Prompt & Lyrics (सॉन्ग का पूरा स्ट्रक्चर):
              </label>
              <textarea
                value={sunoPromptText}
                onChange={(e) => setSunoPromptText(e.target.value)}
                rows={10}
                className="w-full bg-dark-950 border border-slate-700/80 rounded-2xl p-3.5 text-xs sm:text-sm text-amber-100 font-mono focus:outline-none focus:border-amber-400 leading-relaxed resize-none"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopySunoPrompt}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copiedSuno ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSuno ? 'Copied Prompt!' : 'Copy Suno Prompt'}</span>
              </button>

              <div className="flex items-center gap-2">
                <a
                  href="https://suno.com"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <span>Open Suno AI (suno.com)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => setShowSunoModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

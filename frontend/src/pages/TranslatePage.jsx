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
  CheckCircle2
} from 'lucide-react';
import api, { formatApiError } from '../services/api';
import voiceService, { OMNIVOICE_LANGUAGES } from '../services/voiceService';

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

  const inputAreaRef = useRef(null);

  // Sync voice gender across tabs and components
  useEffect(() => {
    const handleGenderChange = (e) => {
      if (e.detail) setVoiceGender(e.detail);
    };
    window.addEventListener('truthshield-voice-gender-changed', handleGenderChange);
    return () => {
      voiceService.stopSpeaking();
      window.removeEventListener('truthshield-voice-gender-changed', handleGenderChange);
    };
  }, []);

  const handleGenderSwitch = (gender) => {
    setVoiceGender(gender);
    voiceService.setGender(gender);
    if (activePlayingSide) {
      voiceService.stopSpeaking();
      setActivePlayingSide(null);
    }
  };

  const handleTranslate = async () => {
    const textToTranslate = inputText.trim();
    if (!textToTranslate) return;

    voiceService.stopSpeaking();
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
    setActivePlayingSide(null);
  };

  // Audio Playback for Input or Output
  const handleTogglePlay = (side) => {
    if (activePlayingSide === side) {
      voiceService.stopSpeaking();
      setActivePlayingSide(null);
      return;
    }

    voiceService.stopSpeaking();
    const text = side === 'input' ? inputText : translatedText;
    const lang = side === 'input' ? (sourceLang === 'auto' ? 'hi' : sourceLang) : targetLang;

    if (!text || !text.trim()) return;

    setActivePlayingSide(side);
    voiceService.speak(text, {
      lang: lang,
      gender: voiceGender,
      readFull: true,
      onStart: () => setActivePlayingSide(side),
      onEnd: () => setActivePlayingSide(null),
      onError: () => setActivePlayingSide(null)
    });
  };

  // Download Audio for Input or Output
  const handleDownloadAudio = (side) => {
    const text = side === 'input' ? inputText : translatedText;
    const lang = side === 'input' ? (sourceLang === 'auto' ? 'hi' : sourceLang) : targetLang;

    if (!text || !text.trim()) return;

    const safeName = `truthshield-${side}-${lang}-${voiceGender}.mp3`;
    voiceService.downloadAudio(text, lang, safeName, voiceGender);
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
              Translate any news claim or text into 27+ languages, listen in authentic Male or Female voice, and download clear MP3 audio.
            </p>
          </div>

          {/* Global Voice Gender Switcher */}
          <div className="flex items-center gap-2 bg-dark-900/90 border border-slate-700/80 rounded-2xl p-1.5 shadow-lg">
            <span className="text-xs text-slate-400 font-medium px-2">Voice (आवाज़):</span>
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
        
        {/* LEFT COLUMN: Input Text & Audio */}
        <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/10 bg-dark-800/80 backdrop-blur-xl flex flex-col justify-between shadow-xl space-y-4">
          
          {/* Header Bar: Source Language Selector & Actions */}
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-cyan-400">
                Source Text (लिखें या बोलें):
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

            <div className="flex items-center gap-1">
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
                onClick={() => setInputText('')}
                className="p-1.5 rounded-lg bg-dark-900 hover:bg-white/5 text-slate-400 hover:text-white border border-white/5 text-xs transition-colors"
                title="Clear text"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Input Textarea with Dictation Overlay */}
          <div className="relative flex-1 min-h-[220px]">
            <textarea
              ref={inputAreaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="यहाँ कोई भी टेक्स्ट, न्यूज़, दावा या मैसेज लिखें या पेस्ट करें... (Type or paste any text or claim here)..."
              className="w-full h-full min-h-[220px] bg-dark-900/90 border border-slate-700/80 rounded-2xl p-4 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed resize-none transition-colors"
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
            <div className="flex items-center gap-1.5">
              {/* Listen to Input */}
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
                    <span>Listen ({voiceGender === 'female' ? '👩 Swara' : '👨 Madhur'})</span>
                  </>
                )}
              </button>

              {/* Download Input Audio MP3 */}
              <button
                type="button"
                onClick={() => handleDownloadAudio('input')}
                disabled={!inputText.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Download MP3 of whatever you wrote"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Download MP3</span>
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
          <div className="relative flex-1 min-h-[220px]">
            <div className="w-full h-full min-h-[220px] bg-dark-900/90 border border-slate-700/80 rounded-2xl p-4 text-sm sm:text-base text-white leading-relaxed overflow-y-auto whitespace-pre-wrap flex flex-col justify-between">
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
            <div className="flex items-center gap-1.5">
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
                    <span>Listen ({voiceGender === 'female' ? '👩 Swara' : '👨 Madhur'})</span>
                  </>
                )}
              </button>

              {/* Download Translation Audio MP3 */}
              <button
                type="button"
                onClick={() => handleDownloadAudio('output')}
                disabled={!translatedText.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Download MP3 of translated audio"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download MP3</span>
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

    </div>
  );
}

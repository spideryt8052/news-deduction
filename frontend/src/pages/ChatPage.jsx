import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Copy, 
  Check, 
  Bot, 
  User, 
  ShieldCheck, 
  Zap, 
  Globe, 
  ArrowRight, 
  HelpCircle, 
  Compass,
  Image as ImageIcon,
  Link2,
  X,
  MapPin,
  Calendar,
  Layers,
  FileText,
  AlertOctagon,
  AlertTriangle,
  Search,
  ExternalLink
} from 'lucide-react';
import api, { formatApiError } from '../services/api';
import voiceService, { OMNIVOICE_LANGUAGES } from '../services/voiceService';
import { CLASSIFICATION_THEMES } from '../utils/constants';

const SUGGESTION_PROMPTS = [
  {
    icon: '🔍',
    title: 'Fact-Check a Viral Claim',
    prompt: 'Fact-check: Is it true that drinking boiled garlic water mixed with salt cures viral infections?',
  },
  {
    icon: '🇮🇳',
    title: 'WhatsApp Forwards (Hinglish)',
    prompt: 'Mujhe batao WhatsApp forward sach hai ya jhooth kaise pata kare?',
  },
  {
    icon: '🤖',
    title: 'Detecting Deepfakes & Recycled Media',
    prompt: 'How can I detect if an image or video on social media is recycled or a deepfake?',
  },
  {
    icon: '🧠',
    title: 'General Knowledge / Science',
    prompt: 'Explain quantum computing in simple terms for a student.',
  },
];

export default function ChatPage() {
  const location = useLocation();

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 
        "Hello! 👋 I'm **TruthShield AI**, your intelligent conversational assistant and truth investigator.\n\n" +
        "You can search and verify **ANYTHING** right here in one place:\n" +
        "- 🔍 **Fact-check any viral claim or statement**\n" +
        "- 🖼️ **Upload screenshots or images** to investigate their true origin\n" +
        "- 🔗 **Paste web links** to verify domain credibility & provenance\n" +
        "- 📚 **Ask any question** in science, coding, history, or daily life\n" +
        "- 💬 **Chat naturally** in English, Hindi, Urdu, or Hinglish\n\n" +
        "How can I assist your investigation today?",
      provider: 'gemini',
      model: 'gemini-flash-lite-latest',
      suggested_questions: [
        "How do fact-checkers verify where an image came from?",
        "What is the 30-second rule before forwarding news?",
        "Fact-check: Garlic water cures viral infections"
      ]
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('TruthShield AI is thinking...');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [voiceLang, setVoiceLang] = useState('en-US');
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [activeSpeakingIdx, setActiveSpeakingIdx] = useState(null);

  // Attached Image state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Quick mode toggle
  const [activeMode, setActiveMode] = useState('chat'); // 'chat' | 'factcheck' | 'url'

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const claimProcessedRef = useRef(false);

  // Scroll to bottom on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Clean up voice on unmount
  useEffect(() => {
    return () => {
      voiceService.stopListening();
      voiceService.stopSpeaking();
    };
  }, []);

  // Bridge from Analyze Claim page via react-router location.state
  useEffect(() => {
    if (location.state?.verifiedClaim && !claimProcessedRef.current) {
      claimProcessedRef.current = true;
      const vc = location.state.verifiedClaim;
      const bridgeMessage = {
        role: 'assistant',
        content: 
          `I've imported your claim from the Analyzer for detailed investigation:\n\n` +
          `**"${vc.claim || 'Analyzed Claim'}"**\n\n` +
          `You can now ask follow-up questions, investigate who started this narrative, or explore its evidence.`,
        provider: 'truthshield-analyzer',
        model: 'origin-investigator',
        analysisResult: vc,
        suggested_questions: [
          `Where did "${(vc.claim || 'this claim').slice(0, 32)}..." originate?`,
          "Is this an old or recycled photo/event?",
          "Who first circulated this viral narrative?",
          "What independent news sources corroborate or debunk this?"
        ]
      };
      setMessages(prev => [...prev, bridgeMessage]);
    }
  }, [location.state]);

  // Image Selection Handler
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Image file size must be less than 10MB.');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Main submission handler supporting Text, Image, URL, and Fact-Checking
  const handleSendMessage = async (textToSend = null) => {
    const rawQuery = (textToSend !== null ? textToSend : input).trim();
    const hasImage = !!selectedImage;

    if (!rawQuery && !hasImage) return;
    if (loading) return;

    voiceService.stopSpeaking();
    setIsSpeaking(false);
    setActiveSpeakingIdx(null);

    // Build user message display
    const userMsg = {
      role: 'user',
      content: rawQuery || (hasImage ? `Analyze image: ${selectedImage.name}` : ''),
      imagePreview: imagePreview || null,
      imageName: selectedImage ? selectedImage.name : null
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    const currentImg = selectedImage;
    handleClearImage();
    setLoading(true);

    try {
      // 1. IMAGE VERIFICATION FLOW
      if (hasImage && currentImg) {
        setLoadingStep('Extracting image text and investigating origin...');
        const formData = new FormData();
        formData.append('image', currentImg);
        if (rawQuery) formData.append('caption', rawQuery);

        const res = await api.analyzeImage(formData);
        const result = res.data;

        const aiMsg = {
          role: 'assistant',
          content: 
            `I've analyzed the image and investigated its provenance:\n\n` +
            `- **Verdict**: **${result.classification}** (${Math.round((result.confidence || 0.75) * 100)}% Confidence)\n` +
            `- **Origin (कहाँ का है)**: **${result.origin_info?.location || 'Global / Online'}**\n` +
            `- **First Circulated / Timeline**: **${result.origin_info?.first_seen_period || 'Recent'}** (${result.origin_info?.original_platform || 'Social Media'})\n\n` +
            (result.summary || ''),
          provider: 'truthshield-vision',
          model: 'multimodal-origin-detector',
          analysisResult: result,
          suggested_questions: [
            "Where was this image first captured?",
            "Is this image edited, generated, or taken out of context?",
            "What was the actual historical context?"
          ]
        };

        setMessages(prev => [...prev, aiMsg]);
        triggerVoiceIfEnabled(result);
        return;
      }

      // 2. URL VERIFICATION FLOW
      const isUrlInput = rawQuery.startsWith('http://') || rawQuery.startsWith('https://') || activeMode === 'url';
      if (isUrlInput && (rawQuery.startsWith('http://') || rawQuery.startsWith('https://'))) {
        setLoadingStep('Analyzing domain credibility and web provenance...');
        const res = await api.analyzeUrl(rawQuery);
        const result = res.data;

        const aiMsg = {
          role: 'assistant',
          content: 
            `I've investigated this URL and its publishing source:\n\n` +
            `- **Verdict**: **${result.classification}** (${Math.round((result.confidence || 0.75) * 100)}% Confidence)\n` +
            `- **Publisher Source**: **${result.source_assessment?.source || rawQuery}** (${result.source_assessment?.credibility || 'Evaluated'})\n` +
            `- **Geographic Origin**: **${result.origin_info?.location || 'Web / Global'}**\n\n` +
            (result.summary || ''),
          provider: 'truthshield-url',
          model: 'domain-origin-verifier',
          analysisResult: result,
          suggested_questions: [
            "Does this domain have a history of misinformation or satire?",
            "What do reputable news agencies report on this story?",
            "How can I verify the author credentials?"
          ]
        };

        setMessages(prev => [...prev, aiMsg]);
        triggerVoiceIfEnabled(result);
        return;
      }

      // 3. EXPLICIT FACT-CHECK CLAIM FLOW
      const isFactCheckCommand = activeMode === 'factcheck' || 
        rawQuery.toLowerCase().startsWith('verify:') || 
        rawQuery.toLowerCase().startsWith('fact-check:') || 
        rawQuery.toLowerCase().startsWith('fact check:');

      if (isFactCheckCommand) {
        setLoadingStep('Investigating claim veracity, sources, and origin...');
        const cleanClaim = rawQuery.replace(/^(verify:|fact-check:|fact check:)\s*/i, '').trim();
        const res = await api.analyzeText(cleanClaim || rawQuery);
        const result = res.data;

        const aiMsg = {
          role: 'assistant',
          content: 
            `I've investigated this claim and traced its origin:\n\n` +
            `- **Verdict**: **${result.classification}** (${Math.round((result.confidence || 0.75) * 100)}% Confidence)\n` +
            `- **Origin (कहाँ का है)**: **${result.origin_info?.location || 'Global / Online'}**\n` +
            `- **First Circulated / Timeline**: **${result.origin_info?.first_seen_period || 'Recent'}** (${result.origin_info?.original_platform || 'Social Media'})\n\n` +
            (result.summary || ''),
          provider: 'truthshield-engine',
          model: 'provenance-classifier',
          analysisResult: result,
          suggested_questions: [
            `Where did this rumor first start circulating?`,
            `Is this an old recycled video or photo?`,
            `What evidence directly refutes or supports this?`,
            `How should I reply to someone sharing this?`
          ]
        };

        setMessages(prev => [...prev, aiMsg]);
        triggerVoiceIfEnabled(result);
        return;
      }

      // 4. GENERAL CONVERSATIONAL AI FLOW (Gemini / TruthShield Engine)
      setLoadingStep('TruthShield AI is thinking...');
      const contextTurns = updatedHistory.slice(-6).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }));

      const langCode = (voiceLang || 'en-US').split('-')[0].toLowerCase();
      const res = await api.sendChatMessage(rawQuery, contextTurns, {}, langCode);

      const aiMsg = {
        role: 'assistant',
        content: res.response,
        provider: res.provider || 'gemini',
        model: res.model || 'gemini-flash-lite-latest',
        suggested_questions: res.suggested_questions || []
      };

      setMessages(prev => [...prev, aiMsg]);

      // If voice enabled, speak the answer
      if (!voiceMuted) {
        setIsSpeaking(true);
        setActiveSpeakingIdx(updatedHistory.length);
        voiceService.speak(res.response, {
          lang: voiceLang,
          readFull: true,
          onEnd: () => {
            setIsSpeaking(false);
            setActiveSpeakingIdx(null);
          }
        });
      }

    } catch (err) {
      console.error('Chat error:', err);
      const errMsg = {
        role: 'assistant',
        content: `I encountered an issue processing your request: ${formatApiError(err)}. Please try rephrasing or submitting again.`,
        provider: 'fallback',
        model: 'system',
        suggested_questions: ["How do I check source credibility?", "What is the 30-second rule before forwarding?"]
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setLoadingStep('TruthShield AI is thinking...');
    }
  };

  const triggerVoiceIfEnabled = (analysisResult) => {
    if (!voiceMuted && analysisResult) {
      const speechScript = voiceService.formatReportScript(analysisResult, voiceLang);
      setIsSpeaking(true);
      voiceService.speak(speechScript, {
        lang: voiceLang,
        readFull: true,
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false)
      });
    }
  };

  const toggleMic = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
    } else {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
      voiceService.startListening({
        lang: voiceLang,
        onStart: () => setIsListening(true),
        onEnd: (finalText) => {
          setIsListening(false);
          if (finalText) {
            setInput(finalText);
          }
        },
        onError: (err) => {
          setIsListening(false);
          console.warn('Speech recognition notice:', err);
        },
        onResult: ({ combined }) => {
          if (combined) setInput(combined);
        }
      });
    }
  };

  const handleSpeakMessage = (text, idx, analysisResult = null) => {
    if (isSpeaking && activeSpeakingIdx === idx) {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
      setActiveSpeakingIdx(null);
    } else {
      voiceService.stopSpeaking();
      setIsSpeaking(true);
      setActiveSpeakingIdx(idx);

      const textToSpeak = analysisResult 
        ? voiceService.formatReportScript(analysisResult, voiceLang) 
        : text;

      voiceService.speak(textToSpeak, {
        lang: voiceLang,
        readFull: true,
        onEnd: () => {
          setIsSpeaking(false);
          setActiveSpeakingIdx(null);
        }
      });
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleClear = () => {
    voiceService.stopSpeaking();
    claimProcessedRef.current = false;
    handleClearImage();
    setMessages([
      {
        role: 'assistant',
        content: "Chat cleared! What new topic, image, link, or viral claim would you like to investigate?",
        provider: 'gemini',
        model: 'gemini-flash-lite-latest',
        suggested_questions: [
          "Fact-check a viral WhatsApp forward",
          "Explain quantum physics",
          "How to spot synthetic AI deepfakes"
        ]
      }
    ]);
  };

  // Helper to render markdown formatting cleanly
  const renderFormattedContent = (content) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-base font-bold text-cyan-400 mt-3 mb-1.5">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-lg font-bold text-white mt-4 mb-2">{line.replace('## ', '')}</h2>;
      }
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const itemText = line.trim().substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-slate-200 my-1 leading-relaxed">
            {formatBold(itemText)}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line.trim())) {
        const itemText = line.trim().replace(/^\d+\.\s/, '');
        return (
          <div key={idx} className="flex gap-2 my-1.5 text-slate-200 leading-relaxed">
            <span className="font-semibold text-cyan-400 shrink-0">{line.trim().match(/^\d+\./)[0]}</span>
            <span>{formatBold(itemText)}</span>
          </div>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-slate-200 my-1 leading-relaxed">
          {formatBold(line)}
        </p>
      );
    });
  };

  const formatBold = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-5rem)]">
      
      {/* Top Header Card */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 bg-dark-800/80 backdrop-blur-md mb-4 flex items-center justify-between shrink-0 flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 ring-1 ring-white/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                TruthShield AI Assistant
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Gemini & Origin Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive Fact-Checking, Image & Link Origin Investigation, and Natural Dialogue
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* OmniVoice Language Selector */}
          <select
            value={voiceLang}
            onChange={(e) => {
              setVoiceLang(e.target.value);
              voiceService.stopSpeaking();
              setIsSpeaking(false);
              setActiveSpeakingIdx(null);
            }}
            className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500 max-w-[135px] truncate cursor-pointer"
            title="OmniVoice Speech Language"
          >
            {OMNIVOICE_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>

          {/* Mute/Unmute audio read-aloud */}
          <button
            type="button"
            onClick={() => {
              setVoiceMuted(!voiceMuted);
              if (!voiceMuted) voiceService.stopSpeaking();
            }}
            className={`p-2 rounded-xl border text-xs font-medium transition-all ${
              voiceMuted 
                ? 'bg-dark-900 border-slate-700 text-slate-500' 
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}
            title={voiceMuted ? "Enable Audio Voice Output" : "Mute Audio Voice Output"}
          >
            {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Clear Chat */}
          <button
            type="button"
            onClick={handleClear}
            className="p-2 rounded-xl bg-dark-900 hover:bg-white/5 border border-slate-700 text-slate-400 hover:text-white transition-all text-xs"
            title="Clear Chat Conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Conversation Flow Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
        
        {/* Suggestion Starter Cards if starting */}
        {messages.length === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
            {SUGGESTION_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(item.prompt)}
                className="glass-panel p-3.5 rounded-xl border border-white/5 hover:border-cyan-500/40 bg-dark-800/40 hover:bg-dark-800/80 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-colors">
                    {item.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  "{item.prompt}"
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Render Chat Messages */}
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const ar = msg.analysisResult;
          const theme = ar ? (CLASSIFICATION_THEMES[ar.classification] || CLASSIFICATION_THEMES['Needs Further Verification']) : null;

          return (
            <div
              key={idx}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  isUser 
                    ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white' 
                    : 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white ring-1 ring-white/20'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content Bubble */}
              <div className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 shadow-lg ${
                isUser
                  ? 'bg-gradient-to-r from-cyan-600/90 to-blue-600/90 text-white rounded-tr-none'
                  : 'glass-panel bg-dark-800/85 border border-white/10 rounded-tl-none space-y-3'
              }`}>
                
                {/* User Image Attachment Preview if provided */}
                {isUser && msg.imagePreview && (
                  <div className="mb-2">
                    <img 
                      src={msg.imagePreview} 
                      alt="Uploaded screenshot" 
                      className="max-h-48 rounded-xl border border-white/20 shadow-md object-contain bg-black/40"
                    />
                  </div>
                )}

                {/* Text Content */}
                <div className="text-sm">
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    renderFormattedContent(msg.content)
                  )}
                </div>

                {/* Structured Interactive Verdict & Origin Card if attached */}
                {ar && theme && (
                  <div className={`mt-3 p-4 rounded-2xl glass-panel border ${theme.border} bg-dark-900/90 space-y-3 shadow-lg`}>
                    
                    {/* Verdict Classification & Confidence Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${theme.badgeBg} ${theme.badgeText} ${theme.border}`}>
                          <span className={`w-2 h-2 rounded-full ${theme.dot} animate-pulse`} />
                          {ar.classification}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({Math.round((ar.confidence || 0.75) * 100)}% Confidence)
                        </span>
                      </div>

                      {/* OmniVoice Audio Read-Aloud for this verdict */}
                      <button
                        type="button"
                        onClick={() => handleSpeakMessage(msg.content, idx, ar)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          isSpeaking && activeSpeakingIdx === idx
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                            : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20'
                        }`}
                        title="Listen to full spoken verdict report"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{isSpeaking && activeSpeakingIdx === idx ? 'Playing Voice' : 'Listen'}</span>
                      </button>
                    </div>

                    {/* Origin & Provenance Section ("Kahan Ka Hai" / उत्पत्ति और स्रोत की पड़ताल) */}
                    {ar.origin_info && (
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 via-dark-800 to-indigo-950/40 border border-cyan-500/20 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs uppercase tracking-wider">
                          <Globe className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Origin & Provenance (कहाँ का है / स्रोत की पड़ताल):</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div className="bg-dark-900/80 p-2 rounded-lg border border-white/5 space-y-0.5">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-cyan-400" />
                              <span>Geographic Origin:</span>
                            </span>
                            <p className="font-semibold text-white">{ar.origin_info.location || "Global / Online"}</p>
                          </div>

                          <div className="bg-dark-900/80 p-2 rounded-lg border border-white/5 space-y-0.5">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Layers className="w-3 h-3 text-cyan-400" />
                              <span>First Circulated:</span>
                            </span>
                            <p className="font-semibold text-white">{ar.origin_info.original_platform || "Social Media Forward"}</p>
                          </div>

                          <div className="bg-dark-900/80 p-2 rounded-lg border border-white/5 space-y-0.5">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-cyan-400" />
                              <span>Timeline / Recycled:</span>
                            </span>
                            <p className="font-semibold text-white">{ar.origin_info.first_seen_period || "Recent"}</p>
                          </div>
                        </div>

                        {ar.origin_info.provenance_details && (
                          <div className="text-[11px] text-slate-300 bg-dark-900/90 p-2.5 rounded-lg border border-white/5 leading-relaxed">
                            <span className="font-semibold text-cyan-300 block mb-0.5">
                              🔍 Provenance Analysis:
                            </span>
                            {ar.origin_info.provenance_details}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Extracted Claim */}
                    {ar.claim && (
                      <div className="p-2.5 rounded-xl bg-dark-950/80 border border-white/5 text-xs">
                        <span className="font-semibold text-cyan-400 block mb-0.5">Analyzed Claim:</span>
                        <p className="italic text-slate-200 font-medium">"{ar.claim}"</p>
                      </div>
                    )}

                    {/* Reasons & Evidence */}
                    {ar.reasons && ar.reasons.length > 0 && (
                      <div className="space-y-1.5 text-xs">
                        <span className="font-semibold text-slate-300 block">Why this result:</span>
                        <ul className="space-y-1">
                          {ar.reasons.map((r, rIdx) => (
                            <li key={rIdx} className="flex items-start gap-1.5 text-slate-300 text-[11px]">
                              <span className="text-cyan-400">•</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actionable Guidance */}
                    {ar.recommendation && (
                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{ar.recommendation}</span>
                      </div>
                    )}

                  </div>
                )}

                {/* Assistant Message Footer: Provider & Copy */}
                {!isUser && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      <span>{msg.provider?.toUpperCase()} • {msg.model}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSpeakMessage(msg.content, idx, ar)}
                        className={`p-1 rounded hover:bg-white/10 transition-colors ${
                          activeSpeakingIdx === idx ? 'text-cyan-400 animate-pulse' : 'text-slate-400'
                        }`}
                        title="Listen to this answer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(msg.content, idx)}
                        className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="Copy text"
                      >
                        {copiedIdx === idx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Suggested Questions Pills */}
                {!isUser && msg.suggested_questions && msg.suggested_questions.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Suggested Next Questions:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggested_questions.map((q, qIdx) => (
                        <button
                          key={qIdx}
                          type="button"
                          onClick={() => handleSendMessage(q)}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-dark-900/80 hover:bg-cyan-500/10 border border-slate-700/80 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-300 transition-colors text-left flex items-center gap-1 cursor-pointer"
                        >
                          <span>{q}</span>
                          <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          );
        })}

        {/* Loading Spinner Indicator */}
        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div className="glass-panel px-4 py-3 rounded-2xl rounded-tl-none border border-white/10 bg-dark-800/80 flex items-center gap-2 text-xs text-slate-400">
              <div className="flex space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="ml-1 text-slate-300 font-medium">{loadingStep}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Interactive Query Dock */}
      <div className="shrink-0 mt-3 pt-1">
        
        {/* Quick Action Mode Pills */}
        <div className="flex items-center gap-1.5 mb-2 px-1 overflow-x-auto text-[11px]">
          <button
            type="button"
            onClick={() => setActiveMode('chat')}
            className={`px-3 py-1 rounded-lg border font-medium transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
              activeMode === 'chat'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                : 'bg-dark-900/80 text-slate-400 border-white/5 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Chat / Ask Anything</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('factcheck');
              if (!input.toLowerCase().startsWith('verify:')) {
                setInput('Fact-check: ' + input);
              }
            }}
            className={`px-3 py-1 rounded-lg border font-medium transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
              activeMode === 'factcheck'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-dark-900/80 text-slate-400 border-white/5 hover:text-white'
            }`}
          >
            <Search className="w-3 h-3" />
            <span>Fact-Check Claim</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('url');
              if (!input.startsWith('http')) {
                setInput('https://');
              }
            }}
            className={`px-3 py-1 rounded-lg border font-medium transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
              activeMode === 'url'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm'
                : 'bg-dark-900/80 text-slate-400 border-white/5 hover:text-white'
            }`}
          >
            <Link2 className="w-3 h-3" />
            <span>Verify Web URL</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`px-3 py-1 rounded-lg border font-medium transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
              selectedImage
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm'
                : 'bg-dark-900/80 text-slate-400 border-white/5 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>{selectedImage ? 'Image Attached' : 'Attach Image'}</span>
          </button>
        </div>

        {/* Selected Image Thumbnail preview if present */}
        {imagePreview && (
          <div className="flex items-center gap-3 p-2.5 mb-2 rounded-2xl bg-dark-900/95 border border-cyan-500/40 shadow-lg animate-fade-in">
            <img 
              src={imagePreview} 
              alt="Attached thumbnail" 
              className="w-12 h-12 object-cover rounded-xl border border-white/10 shrink-0 bg-black/40"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{selectedImage?.name}</p>
              <p className="text-[11px] text-cyan-400 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>Ready to trace image origin, text, and authenticity</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearImage}
              className="p-1.5 rounded-lg bg-dark-800 hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="glass-panel p-2 rounded-2xl border border-white/15 bg-dark-800/90 shadow-2xl flex items-center gap-2"
        >
          {/* Hidden Image File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />

          {/* Attach Image Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`p-3 rounded-xl transition-all cursor-pointer ${
              selectedImage
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 ring-1 ring-purple-400'
                : 'bg-dark-900 hover:bg-white/5 text-slate-400 hover:text-white border border-slate-700/80'
            }`}
            title="Upload screenshot or viral image to investigate origin"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Voice Input Microphone */}
          <button
            type="button"
            onClick={toggleMic}
            className={`p-3 rounded-xl transition-all cursor-pointer ${
              isListening
                ? 'bg-red-500 text-white animate-pulse ring-2 ring-red-400'
                : 'bg-dark-900 hover:bg-white/5 text-slate-400 hover:text-white border border-slate-700/80'
            }`}
            title={isListening ? "Listening... Click to stop" : "Speak your question (Voice Input)"}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Text Input Box */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListening 
                ? "Listening to your voice..." 
                : selectedImage 
                  ? "Add optional question or prompt for this image..." 
                  : activeMode === 'url'
                    ? "Paste news article URL to verify origin..."
                    : activeMode === 'factcheck'
                      ? "Enter viral statement or claim to fact-check..."
                      : "Ask anything, paste a URL, or fact-check news..."
            }
            className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />

          {/* Send Action */}
          <button
            type="submit"
            disabled={(!input.trim() && !selectedImage) || loading}
            className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition-all shadow-md shadow-cyan-500/25 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center shrink-0"
            title="Send Investigation Query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[11px] text-center text-slate-500 mt-2">
          TruthShield AI seamlessly checks Text, Images, and Web Links with deep Origin & Provenance tracking.
        </p>
      </div>

    </div>
  );
}

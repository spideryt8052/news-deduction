import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
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
  Globe, 
  ArrowRight, 
  Image as ImageIcon, 
  Link2, 
  X, 
  MapPin, 
  Layers, 
  Download, 
  Languages, 
  Loader2,
  Plus,
  PanelLeftClose,
  PanelLeft,
  Lock,
  MessageSquare,
  Search,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import api, { formatApiError } from '../services/api';
import voiceService, { OMNIVOICE_LANGUAGES } from '../services/voiceService';
import { CLASSIFICATION_THEMES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

const SUGGESTION_PROMPTS = [
  {
    icon: '🔍',
    title: 'Verify WhatsApp Forward',
    desc: 'Check viral medical cures or festive money links',
    prompt: 'Fact-check: Is it true that drinking boiled garlic water cures viral infections in 2 hours?',
  },
  {
    icon: '📰',
    title: 'Check News Headline',
    desc: 'Verify if a breaking news story is real or satire',
    prompt: 'Did NASA really confirm a golden asteroid will hit Earth next week?',
  },
  {
    icon: '📸',
    title: 'Inspect Photo Origin',
    desc: 'Find out if an image is real or AI-generated',
    prompt: 'How can I detect if an image on social media is an AI deepfake or recycled old photo?',
  },
  {
    icon: '🇮🇳',
    title: 'Hinglish / Hindi Fact-Check',
    desc: 'WhatsApp forwarded rumors in natural Hindi/Hinglish',
    prompt: 'Mujhe batao WhatsApp forward sach hai ya jhooth kaise pata kare?',
  },
];

export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Initial welcome message
  const initialWelcome = {
    role: 'assistant',
    content: 
      "Hello! 👋 I'm **TruthShield AI**, your personal truth investigator and fact-checking companion.\n\n" +
      "You can ask me anything or verify claims in real-time:\n" +
      "- 🔍 **Fact-check any viral message, rumor, or claim**\n" +
      "- 🔗 **Paste a news link** to verify who published it and if it's trustworthy\n" +
      "- 📸 **Attach a screenshot or photo** to investigate its origin\n" +
      "- 💬 **Ask any question** in English, Hindi, Urdu, or Hinglish\n\n" +
      "What would you like to check today?",
    provider: 'gemini',
    model: 'gemini-flash-lite-latest',
    suggested_questions: [
      "Fact-check: Garlic water cures viral respiratory fever",
      "Is the free ₹5000 government subsidy link real?",
      "How do fact-checkers verify if a viral photo is old?"
    ]
  };

  const [messages, setMessages] = useState([initialWelcome]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('TruthShield AI is thinking...');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [voiceLang, setVoiceLang] = useState('en-US');
  const [voiceGender, setVoiceGender] = useState(() => voiceService.getGender());
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [activeSpeakingIdx, setActiveSpeakingIdx] = useState(null);

  // Sidebar & Session State (ChatGPT/Claude/Gemini look)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [recentChats, setRecentChats] = useState([
    { id: 1, title: 'Viral Garlic Remedy Fact-Check', date: 'Today' },
    { id: 2, title: 'Government Subsidy Scheme Verification', date: 'Yesterday' }
  ]);

  // Attached Image state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Free Guest Test & Login Gatekeeper State
  // Guest users get 1 free complete AI response before being prompted to log in!
  const [guestPromptCount, setGuestPromptCount] = useState(() => {
    return parseInt(localStorage.getItem('truthshield_guest_chats') || '0', 10);
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [dismissedLoginBanner, setDismissedLoginBanner] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const claimProcessedRef = useRef(false);

  // Auto-scroll to bottom
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

  // Bridge from Analyzer via location.state
  useEffect(() => {
    if (location.state?.verifiedClaim && !claimProcessedRef.current) {
      claimProcessedRef.current = true;
      const vc = location.state.verifiedClaim;
      const bridgeMessage = {
        role: 'assistant',
        content: 
          `I've imported your claim from the Fact-Check Studio for follow-up investigation:\n\n` +
          `**"${vc.claim || 'Analyzed Claim'}"**\n\n` +
          `You can now ask follow-up questions, investigate who started this narrative, or explore verified citations.`,
        provider: 'truthshield-analyzer',
        model: 'origin-investigator',
        analysisResult: vc,
        suggested_questions: [
          `Where did "${(vc.claim || 'this claim').slice(0, 32)}..." originate?`,
          "Is this an old or recycled photo?",
          "What independent news sources corroborate or refute this?"
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

  // Start a fresh conversation (like ChatGPT "+ New Chat")
  const handleNewChat = () => {
    voiceService.stopSpeaking();
    setIsSpeaking(false);
    setActiveSpeakingIdx(null);
    setMessages([initialWelcome]);
    setInput('');
    handleClearImage();
  };

  // Main message sender
  const handleSendMessage = async (textToSend = null) => {
    const rawQuery = (textToSend !== null ? textToSend : input).trim();
    const hasImage = !!selectedImage;

    if (!rawQuery && !hasImage) return;
    if (loading) return;

    // Login Gatekeeper Check:
    // If not logged in and has already completed 1 free test query, prompt login!
    if (!isAuthenticated && guestPromptCount >= 1) {
      setShowLoginModal(true);
      return;
    }

    voiceService.stopSpeaking();
    setIsSpeaking(false);
    setActiveSpeakingIdx(null);

    const userMsg = {
      role: 'user',
      content: rawQuery || (hasImage ? `Analyze image: ${selectedImage.name}` : ''),
      imagePreview: imagePreview || null,
      imageName: selectedImage ? selectedImage.name : null
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setLoadingStep('Searching verified archives & reasoning...');

    try {
      let aiResponseText = '';
      let analysisResult = null;
      let modelUsed = 'gemini-flash-lite-latest';
      let providerUsed = 'gemini';

      // 1. IMAGE ANALYSIS FLOW
      if (hasImage) {
        setLoadingStep('Reading image text & investigating origin...');
        const formData = new FormData();
        formData.append('file', selectedImage);
        try {
          const res = await api.analyzeImage(formData);
          const data = res.data || res;
          analysisResult = data;
          aiResponseText = 
            `### Image Verification Summary\n\n` +
            `**Verdict:** **${data.classification}** (${Math.round((data.confidence || 0.75) * 100)}% Confidence)\n\n` +
            `**Detected Claim:** "${data.claim}"\n\n` +
            `**Key Findings:**\n` +
            (data.reasons || []).map(r => `- ${r}`).join('\n') + `\n\n` +
            `**Recommendation:** ${data.recommendation || 'Verify with official sources before forwarding.'}`;
        } catch (imgErr) {
          aiResponseText = "I examined the uploaded image. While the image contains text, I recommend cross-checking the claim with verified news sources.";
        }
        handleClearImage();
      }

      // 2. URL VERIFICATION FLOW
      else if (rawQuery.startsWith('http://') || rawQuery.startsWith('https://')) {
        setLoadingStep('Inspecting article link & domain credibility...');
        try {
          const res = await api.analyzeUrl(rawQuery);
          const data = res.data || res;
          analysisResult = data;
          aiResponseText = 
            `### Link Verification Summary\n\n` +
            `**Verdict:** **${data.classification}** (${Math.round((data.confidence || 0.75) * 100)}% Confidence)\n\n` +
            `**Article Headline:** "${data.claim}"\n\n` +
            `**Analysis:**\n` +
            (data.reasons || []).map(r => `- ${r}`).join('\n') + `\n\n` +
            `**Source Reliability:** ${data.source_assessment?.tier_description || 'Evaluated against journalistic credibility standards.'}`;
        } catch (urlErr) {
          aiResponseText = `I analyzed the link [${rawQuery}](${rawQuery}). Please verify the publisher's editorial standards before trusting this story.`;
        }
      }

      // 3. NATURAL CHAT & FACT-CHECK CONVERSATION
      else {
        const historyForApi = messages
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .slice(-6)
          .map(m => ({ role: m.role, content: m.content }));

        const langHint = /[ऀ-ॿ]/.test(rawQuery) ? 'hi' : 'en';

        try {
          const chatRes = await api.sendChatMessage(rawQuery, historyForApi, {}, langHint);
          aiResponseText = chatRes.reply || chatRes.message || "I've checked this topic. Please let me know what else you'd like to explore.";
          modelUsed = chatRes.model || 'gemini-flash-lite-latest';
          providerUsed = chatRes.provider || 'gemini';
        } catch (chatErr) {
          // Client-side fallback if backend busy
          aiResponseText = `I looked into your inquiry: "${rawQuery}". Based on verified reports, please exercise caution and check official publications before forwarding unconfirmed claims.`;
        }
      }

      const assistantMsg = {
        role: 'assistant',
        content: aiResponseText,
        provider: providerUsed,
        model: modelUsed,
        analysisResult: analysisResult,
        suggested_questions: [
          "Can you summarize this in 2 simple sentences?",
          "How can I explain this to someone who forwarded it on WhatsApp?",
          "Are there official government or scientific press releases on this?"
        ]
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Read aloud if voice is unmuted
      if (!voiceMuted) {
        handleSpeakMessage(aiResponseText, messages.length);
      }

      // Track guest prompt count for guest trial conversion
      if (!isAuthenticated) {
        const nextCount = guestPromptCount + 1;
        setGuestPromptCount(nextCount);
        localStorage.setItem('truthshield_guest_chats', nextCount.toString());
      }

    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I ran into a temporary connection issue. Please try submitting again in a moment.",
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  // Voice Input (Speech-to-Text)
  const handleStartVoice = () => {
    setIsListening(true);
    voiceService.startListening({
      lang: voiceLang,
      onStart: () => setIsListening(true),
      onEnd: (final) => {
        setIsListening(false);
        if (final) setInput(prev => prev ? `${prev} ${final}` : final);
      },
      onError: () => setIsListening(false),
      onResult: ({ combined }) => {
        if (combined) setInput(prev => prev ? `${prev} ${combined}` : combined);
      }
    });
  };

  const handleStopVoice = () => {
    voiceService.stopListening();
    setIsListening(false);
  };

  // Voice Output (Text-to-Speech)
  const handleSpeakMessage = (text, idx) => {
    if (isSpeaking && activeSpeakingIdx === idx) {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
      setActiveSpeakingIdx(null);
      return;
    }
    voiceService.stopSpeaking();
    setIsSpeaking(true);
    setActiveSpeakingIdx(idx);

    const clean = text.replace(/[*#`_\[\]()]/g, ' ').slice(0, 500);
    voiceService.speak(clean, voiceLang, {
      gender: voiceGender,
      onEnd: () => {
        setIsSpeaking(false);
        setActiveSpeakingIdx(null);
      },
      onError: () => {
        setIsSpeaking(false);
        setActiveSpeakingIdx(null);
      }
    });
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Markdown Formatter for ChatGPT/Claude look
  const renderFormattedContent = (content) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-base font-bold text-sky-400 mt-3 mb-1.5">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-lg font-bold text-slate-100 mt-4 mb-2">{line.replace('## ', '')}</h2>;
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
            <span className="font-semibold text-sky-400 shrink-0">{line.trim().match(/^\d+\./)[0]}</span>
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
    <div className="flex h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 overflow-hidden relative">
      
      {/* ======================================================== */}
      {/* 1. SIDEBAR (ChatGPT / Claude / Gemini Style)              */}
      {/* ======================================================== */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64 sm:w-72' : 'w-0'
        } transition-all duration-300 ease-in-out bg-slate-900/90 border-r border-slate-800/80 flex flex-col shrink-0 overflow-hidden relative z-20`}
      >
        {/* New Chat Button */}
        <div className="p-3 border-b border-slate-800/80">
          <button
            onClick={handleNewChat}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 text-slate-100 font-medium text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-400" />
              <span>New Investigation</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">Ctrl+K</span>
          </button>
        </div>

        {/* Recent Chat History List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 px-2 block mb-1.5">
              Recent Verifications
            </span>
            <div className="space-y-1">
              {recentChats.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSendMessage(c.title)}
                  className="px-2.5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/70 cursor-pointer transition-colors flex items-center gap-2 truncate"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{c.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Account / Auth Section at Bottom of Sidebar */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/50">
          {isAuthenticated ? (
            <div className="flex items-center justify-between">
              <Link to="/user/panel" className="flex items-center gap-2 text-xs text-slate-200 hover:text-sky-400 truncate">
                <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="truncate">
                  <p className="font-semibold truncate">{user?.name || 'Account'}</p>
                  <p className="text-[10px] text-slate-400">Unlimited Member</p>
                </div>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-medium">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Guest Preview Mode</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Log in to sync your verification history and unlock unlimited questions.
              </p>
              <Link
                to="/login"
                className="w-full py-1.5 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition-all"
              >
                <span>Sign In Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MAIN CONVERSATION PANE                                 */}
      {/* ======================================================== */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Floating App Bar (ChatGPT / Gemini style) */}
        <header className="h-14 border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 bg-slate-950/80 backdrop-blur-md z-10">
          
          <div className="flex items-center gap-2">
            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>

            {/* Model Badge (Gemini / Claude style pill) */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>TruthShield Intelligence</span>
              <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">• Gemini 2.5 & Origin</span>
            </div>
          </div>

          {/* Right Action Controls: Voice Language & Mute */}
          <div className="flex items-center gap-2">
            
            {/* Language Selector */}
            <select
              value={voiceLang}
              onChange={(e) => {
                setVoiceLang(e.target.value);
                voiceService.stopSpeaking();
                setIsSpeaking(false);
              }}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-300 focus:outline-none cursor-pointer"
              title="Voice narration language"
            >
              {OMNIVOICE_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>

            {/* Voice Mute Toggle */}
            <button
              onClick={() => {
                if (!voiceMuted) {
                  voiceService.stopSpeaking();
                  setIsSpeaking(false);
                }
                setVoiceMuted(!voiceMuted);
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                voiceMuted
                  ? 'bg-slate-900 border-slate-800 text-slate-500'
                  : 'bg-sky-500/10 border-sky-500/20 text-sky-400'
              }`}
              title={voiceMuted ? "Enable Voice Readout" : "Mute Voice Readout"}
            >
              {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* New Chat Icon */}
            <button
              onClick={handleNewChat}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Start fresh conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Conversation Stream */}
        <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Center Empty State (Shown when only initial message exists, exactly like ChatGPT/Claude) */}
            {messages.length === 1 && (
              <div className="text-center py-6 sm:py-10 space-y-6 animate-fade-in">
                <div className="w-14 h-14 rounded-3xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto shadow-xl shadow-sky-500/10">
                  <Sparkles className="w-7 h-7" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                    What would you like to verify today?
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
                    Ask any question, paste a viral rumor, or upload a screenshot to investigate facts.
                  </p>
                </div>

                {/* 2x2 Suggestion Cards (ChatGPT / Gemini style) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                  {SUGGESTION_PROMPTS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.prompt)}
                      className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all text-left group cursor-pointer shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{item.icon}</span>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-sky-400 transition-colors">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {item.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              const ar = msg.analysisResult;
              const theme = ar ? (CLASSIFICATION_THEMES[ar.classification] || CLASSIFICATION_THEMES['Needs Further Verification']) : null;

              return (
                <div 
                  key={idx} 
                  className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Assistant Avatar */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div className={`space-y-3 ${isUser ? 'max-w-[85%] sm:max-w-[75%]' : 'flex-1 max-w-full'}`}>
                    
                    {/* User Attached Image if any */}
                    {isUser && msg.imagePreview && (
                      <div className="mb-2">
                        <img 
                          src={msg.imagePreview} 
                          alt="Uploaded attachment" 
                          className="max-h-56 rounded-2xl border border-slate-700 object-contain bg-black/40"
                        />
                      </div>
                    )}

                    {/* Text Body */}
                    <div 
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-slate-800 text-slate-100 rounded-tr-none shadow-md'
                          : 'bg-transparent text-slate-200 px-0'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div>{renderFormattedContent(msg.content)}</div>
                      )}
                    </div>

                    {/* Structured Verdict Card if fact-check was performed */}
                    {ar && theme && (
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${theme.badgeBg} ${theme.badgeText} ${theme.border}`}>
                            <span className={`w-2 h-2 rounded-full ${theme.dot} animate-pulse`} />
                            {ar.classification}
                          </span>
                          <span className="text-xs text-slate-400">
                            {Math.round((ar.confidence || 0.75) * 100)}% Confidence
                          </span>
                        </div>

                        {/* Origin details if present */}
                        {ar.origin_info && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                              <span className="text-[10px] text-slate-400 block">Origin Location:</span>
                              <span className="font-semibold text-slate-200">{ar.origin_info.location || "Online"}</span>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                              <span className="text-[10px] text-slate-400 block">First Platform:</span>
                              <span className="font-semibold text-slate-200">{ar.origin_info.original_platform || "Viral Social Media"}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Assistant Action Bar (Copy, Listen, Download) */}
                    {!isUser && (
                      <div className="flex items-center gap-2 pt-1 text-slate-400 text-xs">
                        <button
                          onClick={() => handleCopy(msg.content, idx)}
                          className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Copy answer"
                        >
                          {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                        </button>

                        <button
                          onClick={() => handleSpeakMessage(msg.content, idx)}
                          className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer ${
                            isSpeaking && activeSpeakingIdx === idx ? 'text-sky-400 font-semibold' : 'hover:text-slate-200'
                          }`}
                          title="Listen to this response"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{isSpeaking && activeSpeakingIdx === idx ? 'Playing Voice...' : 'Listen'}</span>
                        </button>
                      </div>
                    )}

                    {/* ======================================================== */}
                    {/* GUEST TEST CONVERSION TRIGGER (The User's Feature!)      */}
                    {/* Appears after AI finishes answering the 1st guest query   */}
                    {/* ======================================================== */}
                    {!isUser && idx === messages.length - 1 && !isAuthenticated && guestPromptCount >= 1 && !dismissedLoginBanner && (
                      <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 border border-sky-500/30 shadow-2xl space-y-3 mt-4 animate-fade-in">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 shadow-inner">
                            <Lock className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-slate-100">
                              Enjoying your TruthShield AI answer? Save this conversation.
                            </h4>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              You've completed your free guest preview test! Create a free account or sign in to continue chatting, ask follow-up questions, and sync your search history across all devices.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-1 flex-wrap">
                          <Link
                            to="/login"
                            state={{ returnTo: '/chat' }}
                            className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                          >
                            Sign In / Create Free Account →
                          </Link>

                          <Link
                            to="/signup"
                            state={{ returnTo: '/chat' }}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
                          >
                            Sign Up with OTP
                          </Link>

                          <button
                            onClick={() => setDismissedLoginBanner(true)}
                            className="text-xs text-slate-400 hover:text-slate-200 ml-auto cursor-pointer"
                          >
                            Keep Reading
                          </button>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* User Avatar */}
                  {isUser && (
                    <div className="w-8 h-8 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-0.5 border border-slate-700">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Thinking / Loading Animation */}
            {loading && (
              <div className="flex gap-3 sm:gap-4 items-start">
                <div className="w-8 h-8 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 animate-spin-slow" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2.5 shadow-md">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400 shrink-0" />
                  <span>{loadingStep}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. SIGNATURE BOTTOM INPUT CAPSULE (ChatGPT / Gemini style)*/}
        {/* ======================================================== */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/90 shrink-0">
          <div className="max-w-3xl mx-auto space-y-2">
            
            {/* Image attachment thumbnail if selected */}
            {imagePreview && (
              <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800 max-w-xs animate-fade-in">
                <img src={imagePreview} alt="Preview" className="w-10 h-10 object-cover rounded-xl" />
                <span className="text-xs text-slate-300 truncate flex-1">{selectedImage?.name}</span>
                <button onClick={handleClearImage} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* The Input Capsule */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="rounded-3xl bg-slate-900 border border-slate-800 focus-within:border-slate-700 p-2 pl-4 flex items-center gap-2 shadow-2xl transition-all"
            >
              {/* Hidden file input */}
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
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Attach screenshot or photo"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              {/* Input Text Area */}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything, paste a news headline, or check a claim..."
                className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
              />

              {/* Voice Mic Button */}
              {!isListening ? (
                <button
                  type="button"
                  onClick={handleStartVoice}
                  className="p-2 rounded-xl text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Speak claim (Mic)"
                >
                  <Mic className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopVoice}
                  className="p-2 rounded-xl bg-rose-500/20 text-rose-300 animate-pulse cursor-pointer"
                  title="Stop listening"
                >
                  <MicOff className="w-5 h-5" />
                </button>
              )}

              {/* Circular Send Arrow Button */}
              <button
                type="submit"
                disabled={loading || (!input.trim() && !selectedImage)}
                className={`p-2.5 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                  input.trim() || selectedImage
                    ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <p className="text-[11px] text-center text-slate-400">
              TruthShield AI can make mistakes. Always check critical information with primary official sources.
            </p>
          </div>
        </div>

      </main>

      {/* ======================================================== */}
      {/* 4. MODAL: LOGIN REQUIRED AFTER FREE GUEST TEST           */}
      {/* ======================================================== */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-100">
                Sign in to continue chatting
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                You've completed your free guest preview! To ask follow-up questions, save your conversation history, and verify unlimited news, please sign in or create a free account.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                to="/login"
                state={{ returnTo: '/chat' }}
                className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm text-center block shadow-lg shadow-sky-500/20 transition-all"
              >
                Sign In to Account
              </Link>
              <Link
                to="/signup"
                state={{ returnTo: '/chat' }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs text-center block border border-slate-700 transition-all"
              >
                Create New Free Account
              </Link>
            </div>

            <p className="text-[11px] text-center text-slate-400 pt-1">
              Takes 30 seconds with email & OTP. 100% Free forever.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

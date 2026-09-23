import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  Bot,
  User,
  Radio,
  Play
} from 'lucide-react';
import voiceService from '../services/voiceService';

const KNOWLEDGE_RESPONSES = [
  {
    triggers: ['who built', 'team', 'creator', 'developer', 'gniot', 'aktu', 'students', 'members'],
    answer: "TruthShield was developed by Aarti Vishwakarma, Soni, Vandana, and Yaseen Jamshed under the academic guidance of Dr. Saumya Chaturvedi at Greater Noida Institute of Technology (GNIOT), affiliated with Dr. A.P.J. Abdul Kalam Technical University (AKTU), Lucknow.",
  },
  {
    triggers: ['30 second', 'rule', 'whatsapp', 'forwarding', 'nudge'],
    answer: "The 30-Second Rule advises you to pause before forwarding any sensational post. Check the publisher's domain, inspect the date of old disaster photos, and search for verification on an accredited news agency before pressing share.",
  },
  {
    triggers: ['how it works', 'pipeline', 'detection', 'stages', 'methodology'],
    answer: "TruthShield uses a 6-stage pipeline: input preprocessing, linguistic urgency extraction, atomic claim isolation, domain reputation verification with SSRF protection, multi-LLM synthesis, and explanation-first stance-tagged evidence presentation.",
  },
  {
    triggers: ['categories', 'tiers', 'classification', 'labels'],
    answer: "TruthShield avoids simplistic True or False labels. We use 4 calibrated categories: Likely Reliable, Potentially Misleading, Likely False, and Needs Further Verification.",
  },
  {
    triggers: ['confidence', 'accuracy', '94%'],
    answer: "TruthShield strictly avoids claiming unverified 90% or 94% accuracy. Instead, we present calibrated AI Assessment Confidence between 50% and 98%, reflecting the mathematical strength of available empirical evidence.",
  },
  {
    triggers: ['deepfake', 'image', 'photo', 'screenshot', 'video'],
    answer: "To spot synthetic images or deepfakes: inspect unnatural hand anatomy, irregular shadows, warped text on background signs, and reverse-image search using Google Images or TinEye.",
  },
  {
    triggers: ['garlic', 'cure', 'virus', 'boil'],
    answer: "Evaluation for Garlic Water: Categorized as Likely False with 92% confidence. The World Health Organization clarifies that while garlic is nutritious, there is zero empirical evidence supporting garlic water as an antiviral cure.",
  }
];

export default function VoiceAssistantWidget({ onAnalyzeRequested }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: "Hello! I am TruthShield's Voice Assistant. Speak a news claim to verify, or ask me questions about media literacy.",
      time: 'Just now'
    }
  ]);
  const [selectedLang, setSelectedLang] = useState('en-US'); // 'en-US' | 'en-IN' | 'hi-IN'

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Clean up speech when widget unmounts
  useEffect(() => {
    return () => {
      voiceService.stopListening();
      voiceService.stopSpeaking();
    };
  }, []);

  const handleStartListening = () => {
    voiceService.stopSpeaking();
    setIsSpeaking(false);
    setTranscript('');

    voiceService.startListening({
      lang: selectedLang,
      onStart: () => setIsListening(true),
      onEnd: () => setIsListening(false),
      onError: (err) => {
        setIsListening(false);
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: `Microphone notice: ${err}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      },
      onResult: ({ combined }) => {
        setTranscript(combined);
      }
    });
  };

  const handleStopListening = () => {
    voiceService.stopListening();
    setIsListening(false);
    if (transcript.trim()) {
      processUserQuery(transcript.trim());
    }
  };

  const processUserQuery = (queryText) => {
    const userMsg = {
      sender: 'user',
      text: queryText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setTranscript('');

    const lower = queryText.toLowerCase();

    // Check if query is an analysis command
    if (lower.startsWith('analyze ') || lower.startsWith('verify ') || lower.startsWith('check ')) {
      const claimToAnalyze = queryText.replace(/^(analyze|verify|check)\s+/i, '');
      const reply = `Analyzing statement: "${claimToAnalyze}". Loading assessment into Credibility Studio now.`;
      
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: { label: 'Open in Analyzer', claim: claimToAnalyze }
      }]);

      if (!voiceMuted) {
        speakResponse(reply);
      }

      if (onAnalyzeRequested) {
        onAnalyzeRequested(claimToAnalyze);
      }
      return;
    }

    // Check against knowledge base
    let matchedAnswer = null;
    for (const item of KNOWLEDGE_RESPONSES) {
      if (item.triggers.some(t => lower.includes(t))) {
        matchedAnswer = item.answer;
        break;
      }
    }

    if (!matchedAnswer) {
      // Default: treat as a claim to verify
      matchedAnswer = `I received your submission: "${queryText}". You can evaluate this claim in the Credibility Studio for complete source and evidence breakdown.`;
      
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: matchedAnswer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: { label: 'Analyze This Claim', claim: queryText }
      }]);
    } else {
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: matchedAnswer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }

    if (!voiceMuted) {
      speakResponse(matchedAnswer);
    }
  };

  const speakResponse = (text) => {
    voiceService.speak(text, {
      lang: selectedLang,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  };

  const handleStopSpeaking = () => {
    voiceService.stopSpeaking();
    setIsSpeaking(false);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white shadow-2xl shadow-cyan-500/30 hover:scale-105 transition-all duration-300 border border-cyan-400/30 cursor-pointer"
            title="Open TruthShield Voice Assistant"
          >
            <div className="relative">
              <Mic className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
            </div>
            <span className="text-xs font-bold tracking-wide hidden sm:inline">
              Voice Assistant
            </span>
          </button>
        )}
      </div>

      {/* Voice Assistant Drawer / Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 w-[94vw] sm:w-[420px] h-[560px] max-h-[85vh] z-50 rounded-3xl bg-slate-950 border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 flex flex-col overflow-hidden animate-fade-in backdrop-blur-xl">
          
          {/* Header */}
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Voice Assistant
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    AI Speech
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">GNIOT / AKTU Research Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setVoiceMuted(!voiceMuted)}
                className={`p-1.5 rounded-lg transition-colors ${
                  voiceMuted ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 hover:text-white'
                }`}
                title={voiceMuted ? "Unmute Voice" : "Mute Voice"}
              >
                {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  voiceService.stopListening();
                  voiceService.stopSpeaking();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-950/60">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0 text-xs">
                    🛡️
                  </div>
                )}
                <div
                  className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-cyan-600 text-white rounded-br-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p>{m.text}</p>
                  
                  {m.action && (
                    <button
                      onClick={() => {
                        if (onAnalyzeRequested) onAnalyzeRequested(m.action.claim);
                        setIsOpen(false);
                      }}
                      className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold text-[11px] border border-cyan-500/30 transition-colors"
                    >
                      <span>{m.action.label}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  <span className="block text-[9px] text-slate-400 mt-1 opacity-70">
                    {m.time}
                  </span>
                </div>
              </div>
            ))}

            {/* Interim live speech transcript preview */}
            {isListening && transcript && (
              <div className="flex gap-2.5 justify-end">
                <div className="max-w-[82%] p-3 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-200 text-xs italic animate-pulse">
                  "{transcript}..."
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions Chips */}
          <div className="px-3 py-2 bg-slate-900/60 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { label: 'Garlic Myth', q: 'Is boiled garlic water a virus cure?' },
              { label: '30-Sec Rule', q: 'What is the 30 second rule?' },
              { label: 'Team Roles', q: 'Who built this project?' },
              { label: '4 Tiers', q: 'What are the 4 classification tiers?' },
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => processUserQuery(chip.q)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-[10px] font-medium text-slate-300 border border-slate-700/60 transition-colors"
              >
                ⚡ {chip.label}
              </button>
            ))}
          </div>

          {/* Speech Control Footer */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
            
            {/* Language Selector */}
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none"
            >
              <option value="en-US">English (US)</option>
              <option value="en-IN">English (India)</option>
              <option value="hi-IN">Hindi (हिंदी)</option>
            </select>

            {/* Big Mic Control Button */}
            <div className="flex items-center gap-2">
              {isSpeaking && (
                <button
                  type="button"
                  onClick={handleStopSpeaking}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  Stop Voice
                </button>
              )}

              {!isListening ? (
                <button
                  type="button"
                  onClick={handleStartListening}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
                >
                  <Mic className="w-4 h-4" />
                  <span>Tap to Speak</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopListening}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 animate-pulse transition-all"
                >
                  <MicOff className="w-4 h-4" />
                  <span>Done Speaking</span>
                </button>
              )}
            </div>

          </div>

        </div>
      )}
    </>
  );
}

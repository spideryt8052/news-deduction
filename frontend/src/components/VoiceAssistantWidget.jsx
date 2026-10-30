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
import voiceService, { OMNIVOICE_LANGUAGES } from '../services/voiceService';
import api from '../services/api';

const KNOWLEDGE_RESPONSES = [
  {
    triggers: ['who built', 'team', 'creator', 'developer', 'students', 'members', 'किसने बनाया', 'टीम'],
    answers: {
      en: "TruthShield is an AI-powered misinformation detection platform built to help users evaluate viral claims and detect social media misleading information. You can review detailed team credits and project attributions on our About page.",
      hi: "ट्रुथशील्ड एक एआई-आधारित सत्यता जांच प्लेटफॉर्म है जो सोशल मीडिया पर फैलने वाली अफवाहों और भ्रामक खबरों की पुष्टि के लिए बनाया गया है। आप हमारे अबाउट पेज पर टीम की विस्तृत जानकारी देख सकते हैं।",
      ur: "ٹروتھ شیلڈ ایک جدید ترین مصنوعی ذہانت پر مبنی نظام ہے جو سوشل میڈیا پر وائرل افواہوں اور غلط معلومات کی جانچ کے لیے بنایا گیا ہے۔",
      bn: "ট্রুথশিল্ড একটি এআই-চালিত সত্যতা যাচাই প্ল্যাটফর্ম যা সোশ্যাল মিডিয়ার বিভ্রান্তিকর তথ্য শনাক্ত করতে সাহায্য করে।"
    }
  },
  {
    triggers: ['30 second', 'rule', 'whatsapp', 'forwarding', 'nudge', '30 सेकंड', 'नियम'],
    answers: {
      en: "The 30-Second Rule advises you to pause before forwarding any sensational post. Check the publisher's domain, inspect the date of old disaster photos, and search for verification on an accredited news agency before pressing share.",
      hi: "30-सेकंड का नियम यह सलाह देता है कि किसी भी सनसनीखेज पोस्ट को शेयर या फॉरवर्ड करने से पहले 30 सेकंड का विराम लें। प्रकाशक के डोमेन की जांच करें, तारीख देखें और किसी प्रमाणित समाचार एजेंसी पर खबर की पुष्टि अवश्य करें।",
      ur: "30 سیکنڈ کا اصول یہ ہے کہ کسی بھی سنسنی خیز خبر کو شیئر کرنے سے پہلے 30 سیکنڈ رک کر تصدیق کریں کہ آیا یہ مستند ہے یا نہیں۔",
      bn: "৩০-সেকেন্ড নিয়মটি আপনাকে কোনো পোস্ট শেয়ার করার আগে ৩০ সেকেন্ড অপেক্ষা করে নির্ভরযোগ্য সূত্র থেকে যাচাই করার পরামর্শ দেয়।"
    }
  },
  {
    triggers: ['how it works', 'steps', 'how to use', 'verification', 'process', 'कैसे काम करता'],
    answers: {
      en: "Verifying news is simple with TruthShield in 3 steps: 1) Paste any claim, link, or upload a screenshot. 2) Our AI cross-checks it against credible journalistic sources and facts. 3) You get a clear credibility verdict with evidence so you know what is true before sharing.",
      hi: "ट्रुथशील्ड से खबर जांचना बेहद आसान है: 1) कोई भी दावा, लिंक या स्क्रीनशॉट डालें। 2) हमारा एआई प्रमाणित समाचार स्रोतों से तथ्यों का मिलान करता है। 3) आपको स्पष्ट विश्वसनीयता रिपोर्ट मिलती है ताकि आप सच जान सकें।",
      ur: "خبروں کی جانچ کے 3 آسان مراحل ہیں: خبر درج کریں، اے آئی مصدقہ ذرائع سے جائزہ لے گا، اور آپ کو فوری رپورٹ فراہم کرے گا۔",
      bn: "সংবাদ যাচাইয়ের ৩টি সহজ ধাপ: দাবি বা লিঙ্ক জমা দিন, এআই নির্ভরযোগ্য সূত্র থেকে যাচাই করবে এবং ফলাফল দেখাবে।"
    }
  },
  {
    triggers: ['categories', 'tiers', 'classification', 'labels', 'श्रेणियां', 'वर्गीकरण'],
    answers: {
      en: "TruthShield avoids simplistic True or False labels. We use 4 calibrated categories: Likely Reliable, Potentially Misleading, Likely False, and Needs Further Verification.",
      hi: "ट्रुथशील्ड साधारण सही या गलत के बजाय 4 स्पष्ट श्रेणियां उपयोग करता है: 1. विश्वसनीय (Likely Reliable), 2. भ्रामक (Potentially Misleading), 3. झूठा (Likely False), और 4. अपुष्ट जानकारी (Needs Further Verification)।",
      ur: "ٹروتھ شیلڈ 4 زمرے استعمال کرتا ہے: قابلِ اعتماد، گمراہ کن، غلط، اور مزید تصدیق طلب۔",
      bn: "ট্রুथশিল্ড ৪টি বিভাগ ব্যবহার করে: নির্ভরযোগ্য, বিভ্রান্তিকর, মিথ্যা, এবং অযাচাইকৃত।"
    }
  },
  {
    triggers: ['garlic', 'cure', 'virus', 'boil', 'लहसुन'],
    answers: {
      en: "Evaluation for Garlic Water: Categorized as Likely False with 92% confidence. The World Health Organization clarifies that while garlic is nutritious, there is zero empirical evidence supporting garlic water as an antiviral cure.",
      hi: "उबले हुए लहसुन के पानी का दावा: यह 92% विश्वसनीयता के साथ झूठा (Likely False) पाया गया है। विश्व स्वास्थ्य संगठन (WHO) के अनुसार लहसुन पौष्टिक है, परंतु यह किसी भी वायरस का इलाज नहीं है।",
      ur: "ابلتے ہوئے لہسن کے پانی کا دعویٰ غلط ہے۔ ڈبلیو ایچ او کے مطابق لہسن وائرس کا علاج نہیں ہے۔",
      bn: "রসুন জলের দাবিটি মিথ্যা হিসেবে প্রমাণিত। বিশ্ব স্বাস্থ্য সংস্থার মতে রসুনের জল ভাইরাসের প্রতিষেধক নয়।"
    }
  },
  {
    triggers: ['deepfake', 'image', 'photo', 'screenshot', 'video', 'डीपफेक'],
    answers: {
      en: "To spot synthetic images or deepfakes: inspect unnatural hand anatomy, irregular shadows, warped text on background signs, and reverse-image search using Google Images or TinEye.",
      hi: "डीपफेक या नकली तस्वीरों को पहचानने के लिए: हाथों की उंगलियों की बनावट देखें, अप्राकृतिक परछाइयों पर ध्यान दें, बैकग्राउंड के अक्षरों की जांच करें और गूगल रिवर्स इमेज सर्च का उपयोग करें।",
      ur: "ڈیپ فیک تصاویر کی شناخت کے لیے ہاتھوں اور چہرے کی قدرتی ساخت کا معائنہ کریں اور ریورس امیج سرچ کا استعمال کریں۔",
      bn: "ডিপফেক বা কৃত্রিম ছবি শনাক্ত করতে মুখের বৈশিষ্ট্য, হাতের গঠন এবং ব্যাকগ্রাউন্ডের লেখা লক্ষ্য করুন।"
    }
  }
];

function getLocalizedKnowledgeAnswer(queryLower, langCode) {
  for (const item of KNOWLEDGE_RESPONSES) {
    if (item.triggers.some(t => queryLower.includes(t.toLowerCase()))) {
      return item.answers[langCode] || item.answers['en'];
    }
  }
  if (langCode === 'hi') {
    return "मैं ट्रुथशील्ड एआई सहायक हूँ। आप मुझसे किसी भी खबर की सत्यता जांचने के लिए कह सकते हैं या कोई भी प्रश्न पूछ सकते हैं।";
  }
  if (langCode === 'ur') {
    return "میں ٹروتھ شیلڈ اے آئی اسسٹنٹ ہوں۔ آپ مجھ سے کوئی بھی سوال پوچھ سکتے ہیں۔";
  }
  return "I am TruthShield AI. You can ask me any question or verify any news claim.";
}

function getLocalizedGreeting(langCode) {
  if (langCode === 'hi') {
    return "नमस्ते! 👋 मैं ट्रुथशील्ड का वॉयस असिस्टेंट हूँ। आप मुझसे कोई भी सवाल पूछ सकते हैं या किसी खबर की सच्चाई जांच सकते हैं।";
  }
  if (langCode === 'bho') {
    return "प्रणाम! 👋 हम ट्रुथशील्ड के वॉयस असिस्टेंट हईं। रउआ हमरा से कवनो भी सवाल पूछ सकीं ले भा खबर के सच्चाई जांच सकीं ले।";
  }
  if (langCode === 'ar') {
    return "مرحبًا بك! 👋 أنا المساعد الصوتي لتروث شيلد. يمكنك سؤالي عن أي شيء أو التحقق من صحة أي خبر.";
  }
  if (langCode === 'ur') {
    return "السلام علیکم! 👋 میں ٹروتھ شیلڈ کا وائس اسسٹنٹ ہوں۔ آپ مجھ سے کوئی بھی سوال پوچھ سکتے ہیں یا خبر کی تصدیق کر سکتے ہیں۔";
  }
  if (langCode === 'bn') {
    return "নমস্কার! 👋 আমি ট্রুथশিল্ডের ভয়েস অ্যাসিস্ট্যান্ট। যেকোনো প্রশ্ন করুন বা সংবাদের সত্যতা যাচাই করুন।";
  }
  if (langCode === 'pa') {
    return "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! 👋 ਮੈਂ ਟਰੂਥਸ਼ੀਲਡ ਦਾ ਵੌਇਸ ਅਸਿਸਟੈਂਟ ਹਾਂ। ਕੋਈ ਵੀ ਸਵਾਲ ਪੁੱਛੋ ਜਾਂ ਖ਼ਬਰ ਦੀ ਪੜਤਾਲ ਕਰੋ।";
  }
  if (langCode === 'es') {
    return "¡Hola! 👋 Soy el Asistente de Voz de TruthShield. Pregúntame cualquier duda o verifica cualquier noticia.";
  }
  return "Hello! 👋 I am TruthShield's Voice Assistant. Speak a news claim to verify, or ask me questions about media literacy.";
}

function getLocalizedChips(langCode) {
  if (langCode === 'hi') {
    return [
      { label: 'लहसुन मिथक', q: 'क्या उबला हुआ लहसुन पानी वायरस का इलाज है?' },
      { label: '30-सेकंड नियम', q: 'फॉरवर्ड करने से पहले 30 सेकंड का नियम क्या है?' },
      { label: 'टीम की जानकारी', q: 'ट्रुथशील्ड किसने बनाया है?' },
      { label: '4 श्रेणियां', q: 'सत्यापन के 4 लेबल्स कौन से हैं?' },
    ];
  }
  if (langCode === 'bho') {
    return [
      { label: 'लहसुन अफवाह', q: 'का खउलल लहसुन पानी से वायरस ठीक हो जाला?' },
      { label: '30-सेकंड नियम', q: 'शेयर करे से पहिले 30 सेकंड के नियम का ह?' },
      { label: 'टीम के जानकारी', q: 'ई प्रोजेक्ट के बनवले बा?' },
      { label: '4 श्रेणी', q: 'जांच के 4 गो लेबल का ह?' },
    ];
  }
  if (langCode === 'ar') {
    return [
      { label: 'شائعة الثوم', q: 'هل ماء الثوم المغلي يعالج الفيروسات؟' },
      { label: 'قاعدة 30 ثانية', q: 'ما هي قاعدة الـ 30 ثانية قبل إعادة النشر؟' },
      { label: 'فريق العمل', q: 'من قام بتطوير تروث شيلد؟' },
      { label: 'التصنيفات الـ 4', q: 'ما هي مستويات التحقق الأربعة؟' },
    ];
  }
  if (langCode === 'ur') {
    return [
      { label: 'لہسن کا علاج', q: 'کیا ابلے ہوئے لہسن کا پانی وائرس کا علاج ہے؟' },
      { label: '30 سیکنڈ اصول', q: 'شیئر کرنے سے پہلے 30 سیکنڈ کا اصول کیا ہے؟' },
      { label: '4 زمرے', q: 'تصدیق کے 4 درجے کون سے ہیں؟' },
    ];
  }
  return [
    { label: 'Garlic Myth', q: 'Is boiled garlic water a virus cure?' },
    { label: '30-Sec Rule', q: 'What is the 30 second rule?' },
    { label: 'Team Roles', q: 'Who built this project?' },
    { label: '4 Tiers', q: 'What are the 4 classification tiers?' },
  ];
}

export default function VoiceAssistantWidget({ onAnalyzeRequested }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedLang, setSelectedLang] = useState('en-US'); // 'en-US' | 'en-IN' | 'hi-IN'
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: getLocalizedGreeting('en'),
      time: 'Just now'
    }
  ]);

  const messagesEndRef = useRef(null);
  const langDebounceTimerRef = useRef(null);
  const transcriptRef = useRef('');
  const silenceTimerRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Clean up speech when widget unmounts
  useEffect(() => {
    return () => {
      if (langDebounceTimerRef.current) {
        clearTimeout(langDebounceTimerRef.current);
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      voiceService.stopListening();
      voiceService.stopSpeaking();
    };
  }, []);

  const submitSpeechQuery = (textToSubmit) => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    voiceService.stopListening();
    setIsListening(false);

    const finalSpeech = (textToSubmit || transcriptRef.current || transcript || '').trim();
    transcriptRef.current = '';
    setTranscript('');

    if (finalSpeech) {
      processUserQuery(finalSpeech);
    }
  };

  const handleStartListening = () => {
    if (langDebounceTimerRef.current) {
      clearTimeout(langDebounceTimerRef.current);
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    voiceService.stopSpeaking();
    setIsSpeaking(false);
    transcriptRef.current = '';
    setTranscript('');

    voiceService.startListening({
      lang: selectedLang,
      onStart: () => setIsListening(true),
      onEnd: (capturedText) => {
        setIsListening(false);
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        const text = (capturedText || transcriptRef.current || '').trim();
        if (text) {
          submitSpeechQuery(text);
        }
      },
      onError: (err) => {
        setIsListening(false);
        setMessages(prev => [...prev, {
          sender: 'assistant',
          text: `Microphone notice: ${err}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      },
      onResult: ({ combined }) => {
        transcriptRef.current = combined;
        setTranscript(combined);

        // Automatically submit 1.5s after user stops talking
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        if (combined.trim().length >= 3) {
          silenceTimerRef.current = setTimeout(() => {
            submitSpeechQuery(transcriptRef.current);
          }, 1500);
        }
      }
    });
  };

  const handleStopListening = () => {
    submitSpeechQuery(transcriptRef.current || transcript);
  };

  const processUserQuery = async (queryText) => {
    const userMsg = {
      sender: 'user',
      text: queryText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setTranscript('');

    const lower = queryText.toLowerCase();

    // Check if query is an explicit analysis command
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

    // Call live conversational AI (Google Gemini / Groq / Hybrid)
    const langCode = (selectedLang || 'en-US').split('-')[0].toLowerCase();
    const historyTurns = messages.slice(-4).map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    try {
      const res = await api.sendChatMessage(queryText, historyTurns, {}, langCode);
      const answer = res.response || (langCode === 'hi' ? "मैं आपके सवाल का उत्तर तैयार कर रहा हूँ।" : "I am analyzing your question.");
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      if (!voiceMuted) {
        speakResponse(answer);
      }
    } catch (err) {
      console.warn('Voice AI call failed, falling back to local engine:', err);
      let matchedAnswer = getLocalizedKnowledgeAnswer(lower, langCode);
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: matchedAnswer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      if (!voiceMuted) {
        speakResponse(matchedAnswer);
      }
    }
  };

  const speakResponse = (text) => {
    voiceService.speak(text, {
      lang: selectedLang,
      readFull: true,
      maxSentences: null,
      conversational: false,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  };

  const handleStopSpeaking = () => {
    voiceService.stopSpeaking();
    setIsSpeaking(false);
  };

  const handleLanguageChange = (newLang) => {
    setSelectedLang(newLang);
    voiceService.stopSpeaking();
    setIsSpeaking(false);

    if (langDebounceTimerRef.current) {
      clearTimeout(langDebounceTimerRef.current);
      langDebounceTimerRef.current = null;
    }

    const langCode = newLang.split('-')[0].toLowerCase();
    const newGreeting = getLocalizedGreeting(langCode);

    setMessages([
      {
        sender: 'assistant',
        text: newGreeting,
        time: 'Just now'
      }
    ]);

    if (!voiceMuted) {
      langDebounceTimerRef.current = setTimeout(() => {
        voiceService.speak(newGreeting, {
          lang: newLang,
          readFull: true,
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false)
        });
      }, 250);
    }
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
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    OmniVoice DLM
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">Multilingual AI Voice Assistant (600+ Langs)</p>
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
                  if (langDebounceTimerRef.current) {
                    clearTimeout(langDebounceTimerRef.current);
                  }
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

            {/* Live speech recording & transcript preview */}
            {isListening && (
              <div className="flex gap-2.5 justify-end">
                <div className="max-w-[85%] p-3.5 rounded-2xl bg-gradient-to-br from-cyan-950/80 to-slate-900 border border-cyan-500/40 text-cyan-100 text-xs shadow-xl shadow-cyan-500/10">
                  <div className="flex items-center justify-between gap-2 mb-2 text-[11px] font-semibold text-cyan-300">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      <span>Listening... speak now</span>
                    </span>
                    <span className="text-[10px] text-cyan-400/80 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-500/30">
                      {selectedLang}
                    </span>
                  </div>

                  {transcript ? (
                    <p className="italic text-white font-medium leading-relaxed bg-slate-950/60 p-2 rounded-xl border border-white/5">
                      "{transcript}..."
                    </p>
                  ) : (
                    <p className="text-slate-400 text-[11px] italic animate-pulse">
                      Speak your question or claim clearly...
                    </p>
                  )}

                  {transcript && (
                    <div className="mt-2.5 flex justify-end">
                      <button
                        type="button"
                        onClick={handleStopListening}
                        className="px-3 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1 shadow-md shadow-cyan-500/30"
                      >
                        <span>Send Now</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions Chips */}
          <div className="px-3 py-2 bg-slate-900/60 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {getLocalizedChips(selectedLang.split('-')[0].toLowerCase()).map((chip, idx) => (
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
            
            {/* OmniVoice Language Selector */}
            <select
              value={selectedLang}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500 max-w-[150px] truncate"
              title="Select OmniVoice Language"
            >
              {OMNIVOICE_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
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
                  title="Click to finish speaking and send immediately"
                >
                  <MicOff className="w-4 h-4" />
                  <span>Done Speaking (Send)</span>
                </button>
              )}
            </div>

          </div>

        </div>
      )}
    </>
  );
}

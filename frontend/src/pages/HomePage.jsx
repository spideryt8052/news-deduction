import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  ChevronDown, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Eye, 
  MessageSquare, 
  Newspaper, 
  Building2,
  FileSearch,
  Scale,
  Sparkles,
  Share2,
  Check
} from 'lucide-react';
import HeroSection from '../components/HeroSection';
import ResultCard from '../components/ResultCard';

const FAQ_ITEMS = [
  {
    q: 'How does TruthShield check if a news story or message is true?',
    a: 'When you paste a message or news link, TruthShield cross-checks the statement against verified reports from credible news agencies (like Reuters, PTI, AP, BBC) and official databases (like PIB Fact Check and the WHO). It looks for original context, verifies quotes, and provides you with the facts and direct proof links.'
  },
  {
    q: 'What do the 4 credibility results mean?',
    a: '1) Verified Real: Supported by factual reporting from credible and official sources. 2) Misleading: Contains fragments of truth, but key context is omitted or exaggerated. 3) False / Fake: Contradicted by facts or fabricated entirely. 4) Unverified: Insufficient evidence available right now to confirm or refute.'
  },
  {
    q: 'Can I check WhatsApp forwards and screenshots of social posts?',
    a: 'Yes. You can paste forwarded WhatsApp messages, tweets, Facebook posts, or upload screenshot images (.png, .jpg, .webp). The system extracts the text and checks if it is an old recirculated rumor or a newly emerging viral story.'
  },
  {
    q: 'What should I do if a story is marked as Fake or Misleading?',
    a: 'Pause and do not forward it. You can click the "Share Warning" button on the result card to copy a polite warning message and share it back to the WhatsApp group or person who sent it to help protect others.'
  },
  {
    q: 'Is my search data private and safe?',
    a: 'Yes, 100%. TruthShield is built to promote public truth and digital safety. Claims submitted for verification are analyzed securely, and your personal browsing identity is never tracked or shared with advertisers.'
  }
];

export default function HomePage() {
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const resultRef = useRef(null);

  const handleAnalysisComplete = (result) => {
    setActiveAnalysis(result);
    // Smooth scroll down to result card
    setTimeout(() => {
      if (resultRef.current) {
        resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="space-y-16 pb-16">
      
      {/* 1. Hero Section: Unified Headline, Search Bar & 3D Earth Globe */}
      <HeroSection onAnalysisComplete={handleAnalysisComplete} />

      {/* 2. Interactive Analysis Result Display (Reveals seamlessly upon check) */}
      {activeAnalysis && (
        <section ref={resultRef} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-sky-400 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20">
              Live Verification Result
            </span>
            <button
              onClick={() => setActiveAnalysis(null)}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Clear & Check Another
            </button>
          </div>
          <ResultCard result={activeAnalysis} onReset={() => setActiveAnalysis(null)} />
        </section>
      )}

      {/* 3. Everyday Situations Where TruthShield Helps (Human-Centered Stories) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs uppercase tracking-wider font-semibold text-sky-400 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20">
            Real Everyday Protection
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
            Stop Fake News in Its Tracks
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Three common places where misinformation spreads every day — and how you can stop it:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Family WhatsApp Groups */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">
              WhatsApp Family Groups
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              When relatives forward miracle home cures, fake festive recharge schemes, or panic warnings, verify them in 5 seconds before anyone gets scammed or alarmed.
            </p>
            <div className="pt-2 text-xs text-emerald-400 font-medium flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>Copy 1-click warning message to share</span>
            </div>
          </div>

          {/* Card 2: Breaking Social Media Stories */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Newspaper className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">
              Breaking News on Social Media
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Sensational headlines, doctored video clips, and recycled old accident footage often circulate during crises. Cross-check whether genuine reporters actually published it.
            </p>
            <div className="pt-2 text-xs text-sky-400 font-medium flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>Cross-checked against Reuters, PTI, PIB</span>
            </div>
          </div>

          {/* Card 3: Government Schemes & Job Scams */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">
              Government Schemes & Jobs
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Scammers frequently circulate fake recruitment notices, free laptop schemes, or bank subsidy links. Check official gazettes and registries before sharing personal data.
            </p>
            <div className="pt-2 text-xs text-purple-400 font-medium flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>Protects personal data & bank accounts</span>
            </div>
          </div>

        </div>
      </section>

      {/* 4. How It Works (Simple 3 Steps) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/50 border border-slate-800/80 space-y-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-sky-400 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20">
              Simple 3-Step Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
              How Fact-Checking Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              No technical expertise needed. Just paste, check, and see verified proof.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/60 border border-slate-800/60 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 text-sky-400 font-bold flex items-center justify-center text-sm">
                1
              </div>
              <h4 className="text-base font-bold text-slate-100">Paste What You Read</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Copy any message, type a headline, paste a web link, or upload a screenshot directly into the search bar.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/60 border border-slate-800/60 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 text-sky-400 font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h4 className="text-base font-bold text-slate-100">We Cross-Check the Evidence</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                We search credible news wire archives, official government portals, scientific databases, and verified fact-checkers.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/60 border border-slate-800/60 space-y-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 text-sky-400 font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h4 className="text-base font-bold text-slate-100">Get Truth & Share Proof</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Receive an immediate verdict with human-readable bullet points, direct source links, and an optional 1-click WhatsApp warning.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 5. 4 Clear Credibility Verdicts */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs uppercase tracking-wider font-semibold text-sky-400 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20">
            Clear Results
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
            Four Simple Verdicts You Can Trust
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Clear, honest answers instead of confusing percentages or complex graphs:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-emerald-500/20 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-emerald-400">Verified Real</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Supported by verified official reports, reputable news outlets, or primary records. Safe to believe and reference.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-amber-500/20 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-amber-400">Misleading / Partial</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Contains a grain of truth, but essential context was omitted, exaggerated, or twisted to create sensation or panic.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-rose-500/20 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-rose-400">False / Fake News</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Directly refuted by fact-checking organizations or fabricated entirely. Do not forward or believe.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-slate-700/60 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-300">Unverified / Rumor</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Not enough credible public evidence exists right now to confirm or refute. Wait for reliable journalists to confirm.
            </p>
          </div>

        </div>
      </section>

      {/* 6. Human FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs uppercase tracking-wider font-semibold text-sky-400 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20">
            Frequently Asked Questions
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
            Got Questions? We Have Answers.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Learn more about how fact verification works and how to protect yourself and your family:
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-sm sm:text-base font-semibold text-slate-100 hover:text-sky-400 transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Bottom Friendly CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
            Protect Yourself and Your Family Today
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Whenever a piece of news sounds too sensational, scary, or good to be true — take 10 seconds to verify it here before pressing Share.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              <span>Check a Story Right Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}

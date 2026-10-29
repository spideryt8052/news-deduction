import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  HelpCircle, 
  ChevronDown, 
  Globe2, 
  Scale, 
  Users, 
  Lock,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Eye
} from 'lucide-react';
import HeroSection from '../components/HeroSection';
import AnalyzeBox from '../components/AnalyzeBox';
import ResultCard from '../components/ResultCard';
import HowItWorks from '../components/HowItWorks';
import AwarenessSection from '../components/AwarenessSection';

const FAQ_ITEMS = [
  {
    q: 'How does TruthShield check if a news story or claim is genuine?',
    a: 'When you enter a claim or news link, TruthShield cross-checks the statement against verified reports from credible news organizations and official databases. It evaluates source credibility, checks if quotes are taken out of context, and provides a clear breakdown of why something is genuine or misleading.'
  },
  {
    q: 'What do the 4 credibility results mean?',
    a: '1) Likely Reliable: Supported by verified reporting from established and authoritative sources. 2) Potentially Misleading: Contains fragments of truth, but facts are distorted, exaggerated, or framed out of context. 3) Likely False: Contradicted by proven facts, official registries, or reliable fact-checking agencies. 4) Needs Further Verification: Insufficient corroborated evidence available at this time to verify or refute.'
  },
  {
    q: 'Can I verify WhatsApp forwards and screenshots of social posts?',
    a: 'Yes. You can paste forwarded WhatsApp messages, tweets, Facebook posts, or upload screenshot images (.png, .jpg, .webp). The system extracts the core claims and checks if the claim is an old recirculated rumor or a newly emerging story.'
  },
  {
    q: 'What should I do if a story is marked as Potentially Misleading or False?',
    a: 'Pause before forwarding or sharing it. Do not spread it in group chats or social channels. You can share the fact-check result with the person who sent it to help protect others from misinformation.'
  },
  {
    q: 'Is my data private and secure when checking news?',
    a: 'Yes. TruthShield is built to promote public truth and digital safety. Claims submitted for verification are analyzed securely, and your personal browsing identity is never tracked or shared with advertisers.'
  }
];

export default function HomePage() {
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="space-y-16 pb-12">
      
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Interactive Analysis Showcase in Home */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            Live Interactive Analysis
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Try It Now
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Paste a viral forward, enter a news URL, or pick a sample preset below:
          </p>
        </div>

        {!activeAnalysis ? (
          <AnalyzeBox onAnalysisComplete={(result) => setActiveAnalysis(result)} />
        ) : (
          <ResultCard result={activeAnalysis} onReset={() => setActiveAnalysis(null)} />
        )}
      </section>

      {/* 3. Detailed Detection Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            Categorization Framework
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Four Calibrated Credibility Tiers
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Replacing simplistic binary labels with actionable, nuance-aware assessments.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl glass-panel border border-emerald-500/20 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Likely Reliable</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Information is corroborated by verified official agencies, established journalistic institutions, or peer-reviewed literature with neutral, non-sensational phrasing.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-amber-500/20 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Potentially Misleading</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Contains grains of truth or genuine quotes, but places them in misleading contexts, omits critical caveats, or uses hyperbolic headlines to distort understanding.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-rose-500/20 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Likely False</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Directly refuted by fact-checking organizations, official documentation, or forensic verification. Often exhibits extreme emotional urgency and forward requests.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-blue-500/20 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Needs Verification</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Insufficient publicly available evidence exists to corroborate or refute the claim. Advises the user to suspend judgment and avoid sharing pending confirmation.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Why Verification Matters (Societal & Democratic Impact) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl glass-panel border border-white/10 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                The Digital Literacy Challenge
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Why Credibility Verification Matters
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Rapid unverified forwarding across WhatsApp, X, and Instagram directly distorts public health decisions, exacerbates social panic, and impacts community trust.
              </p>
              
              <div className="space-y-2 pt-2">
                <div className="flex items-start space-x-3 text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5"></span>
                  <span><strong>Public Health Safety:</strong> Counteracting bogus medical remedies and viral unscientific cures.</span>
                </div>
                <div className="flex items-start space-x-3 text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5"></span>
                  <span><strong>Democratic Integrity:</strong> Guarding against synthetic bot-driven election polarization.</span>
                </div>
                <div className="flex items-start space-x-3 text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5"></span>
                  <span><strong>Cognitive Resilience:</strong> Equipping regular social media users with critical verification reflexes.</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-dark-900/80 border border-white/5 space-y-1 text-center">
                <span className="text-3xl font-extrabold text-cyan-400">6x</span>
                <p className="text-xs text-slate-300 font-semibold">Faster Spread</p>
                <p className="text-[11px] text-slate-500">Misinformation diffuses significantly faster than verified news on social platforms.</p>
              </div>

              <div className="p-5 rounded-2xl bg-dark-900/80 border border-white/5 space-y-1 text-center">
                <span className="text-3xl font-extrabold text-blue-400">70%</span>
                <p className="text-xs text-slate-300 font-semibold">Unintentional Shares</p>
                <p className="text-[11px] text-slate-500">Most misleading content is shared innocently by friends and family without malicious intent.</p>
              </div>

              <div className="p-5 rounded-2xl bg-dark-900/80 border border-white/5 space-y-1 text-center">
                <span className="text-3xl font-extrabold text-purple-400">30s</span>
                <p className="text-xs text-slate-300 font-semibold">Verification Pause</p>
                <p className="text-[11px] text-slate-500">A brief 30-second verification check reduces accidental forwarding probability drastically.</p>
              </div>

              <div className="p-5 rounded-2xl bg-dark-900/80 border border-white/5 space-y-1 text-center">
                <span className="text-3xl font-extrabold text-emerald-400">100%</span>
                <p className="text-xs text-slate-300 font-semibold">Explainable</p>
                <p className="text-[11px] text-slate-500">Every verdict is backed by explicit citations, source analysis, and transparent reasons.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <HowItWorks />

      {/* 6. User Awareness Section */}
      <AwarenessSection />

      {/* 7. FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            Frequently Asked Questions
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Common questions about verifying claims, AI accuracy, and protecting your community from fake news.
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl glass-panel border border-white/10 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-sm sm:text-base font-semibold text-white hover:text-cyan-400 transition-colors"
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-3">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. Bottom CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-cyan-900/40 via-blue-900/30 to-purple-900/40 border border-cyan-500/30 text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Ready to Verify Information Before Sharing?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
            Test any social media post, headline, or screenshot with our AI-assisted credibility engine.
          </p>
          <div className="pt-2">
            <Link
              to="/analyze"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm hover:from-cyan-400 hover:to-blue-500 shadow-xl shadow-cyan-500/20 transition-all hover:scale-105"
            >
              <span>Open Analysis Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

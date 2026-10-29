import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Check
} from 'lucide-react';

const USER_STEPS = [
  {
    step: '1',
    title: 'Paste Text, URL, or Upload Image',
    icon: FileText,
    color: 'from-blue-500 to-cyan-500',
    summary: 'Paste any suspicious WhatsApp forward, social media post, news article link, or upload a screenshot directly into TruthShield.',
    highlights: [
      'Works with WhatsApp forwards & tweets',
      'Inspects article URLs for fake domains',
      'Supports screenshot image uploads (.png, .jpg)'
    ]
  },
  {
    step: '2',
    title: 'AI Cross-Checks Facts & Sources',
    icon: Sparkles,
    color: 'from-cyan-500 to-indigo-500',
    summary: 'Our AI instantly analyzes the claim against verified news databases, checks for sensational manipulation, and identifies original context.',
    highlights: [
      'Scans credible journalistic reports',
      'Detects clickbait and emotional panic phrasing',
      'Analyzes source reputation & domain safety'
    ]
  },
  {
    step: '3',
    title: 'Get Clear Verdict & Share Responsibly',
    icon: ShieldCheck,
    color: 'from-indigo-500 to-purple-500',
    summary: 'Receive an instant credibility rating, backed by explicit reasons and evidence citations. Know the truth before you press Share.',
    highlights: [
      '4 easy-to-understand credibility tiers',
      'Transparent evidence links & citations',
      'Actionable advice to prevent spreading rumors'
    ]
  }
];

export default function HowItWorks() {
  return (
    <section className="py-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            Simple 3-Step Verification
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How to Verify News in 3 Simple Steps
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Fast, easy, and completely free. Protect yourself and your family from viral rumors and deceptive headlines.
          </p>
        </div>

        {/* 3 Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {USER_STEPS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="p-6 sm:p-7 rounded-2xl glass-panel border border-white/10 hover:border-cyan-500/40 bg-dark-900/70 transition-all hover:scale-[1.02] shadow-xl flex flex-col justify-between group"
              >
                <div>
                  {/* Step badge & icon */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-dark-800 text-cyan-400 border border-cyan-500/20">
                      STEP 0{item.step}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2.5 group-hover:text-cyan-400 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                    {item.summary}
                  </p>
                </div>

                {/* Highlights List */}
                <ul className="border-t border-white/5 pt-4 space-y-2">
                  {item.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Bottom User Action Callout */}
        <div className="mt-10 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-dark-800 to-purple-950/40 border border-cyan-500/20 max-w-3xl mx-auto flex items-center justify-between flex-wrap gap-4 text-xs text-slate-300">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span>Have a suspicious WhatsApp forward or news story you want to check?</span>
          </div>
          <Link 
            to="/analyze" 
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-dark-900 font-bold transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
          >
            <span>Verify Claim Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </section>
  );
}

import React, { useState } from 'react';
import { 
  Globe, 
  Calendar, 
  BookOpen, 
  FileCheck, 
  Layers, 
  Camera, 
  AlertCircle, 
  Share2,
  ChevronDown
} from 'lucide-react';

const AWARENESS_RULES = [
  {
    id: 1,
    title: '1. Check the Source',
    icon: Globe,
    color: 'from-cyan-500 to-blue-500',
    short: 'Verify who published the information and inspect the domain suffix.',
    rule: 'Look at the web address carefully. Imposter sites often mimic real news outlets using odd extensions like .com.co or .xyz. Check the "About Us" page for clear contact details and editorial standards.',
    example: 'A blog mimicking BBC News at "bbc-news-breaking-24.cc" sharing unverified disaster rumors.'
  },
  {
    id: 2,
    title: '2. Check the Date',
    icon: Calendar,
    color: 'from-blue-500 to-indigo-500',
    short: 'Ensure an old event is not being recycled as breaking current news.',
    rule: 'Misinformation often re-circulates old stories, strikes, or past natural events during periods of political tension to provoke outrage. Always look for the primary publication date.',
    example: 'A 2017 flood video recirculated during a monsoon season 8 years later as "live footage from today".'
  },
  {
    id: 3,
    title: '3. Read Beyond the Headline',
    icon: BookOpen,
    color: 'from-indigo-500 to-purple-500',
    short: 'Clickbait headlines often contradict or exaggerate what the article actually states.',
    rule: 'Sensational headlines are engineered to trigger rage or astonishment to earn ad clicks. The body of the article may clarify that the claim was merely speculative or a satirical scenario.',
    example: '"SCIENTISTS SHOCKED!" headlines that summarize standard laboratory exploratory papers.'
  },
  {
    id: 4,
    title: '4. Look for Supporting Evidence',
    icon: FileCheck,
    color: 'from-purple-500 to-pink-500',
    short: 'Identify whether primary documents, clinical studies, or official citations exist.',
    rule: 'Extraordinary claims require extraordinary evidence. If a viral message quotes "unnamed scientists" or "insider sources" with zero verifiable citations, treat it with high skepticism.',
    example: 'Messages claiming "secret Japanese study proves tea cures everything" with no citation.'
  },
  {
    id: 5,
    title: '5. Compare Multiple Reliable Sources',
    icon: Layers,
    color: 'from-pink-500 to-rose-500',
    short: 'If a major story is genuine, credible international news outlets will cover it.',
    rule: 'If a monumental discovery or political declaration is reported exclusively by a single unknown Telegram channel, it is almost certainly fabricated or misconstrued.',
    example: 'A claim that a major nation has banned cash, but no major financial publication has reported it.'
  },
  {
    id: 6,
    title: '6. Be Careful with Edited Images / Videos',
    icon: Camera,
    color: 'from-rose-500 to-amber-500',
    short: 'Deepfakes and AI image generators create hyper-realistic yet false scenes.',
    rule: 'Inspect hands, lighting reflections, strange shadows, and blurred textures. Use reverse-image search tools (Google Lens, TinEye) to trace where an image originally appeared.',
    example: 'AI-generated images of historical figures wearing modern luxury streetwear passed off as real.'
  },
  {
    id: 7,
    title: '7. Watch for Emotional or Urgent Language',
    icon: AlertCircle,
    color: 'from-amber-500 to-teal-500',
    short: 'Urgent calls to action ("Forward immediately before deleted!") are deception markers.',
    rule: 'Disinformation exploits fear, anger, and moral outrage. High-arousal language lowers your critical cognitive defenses, encouraging impulsive sharing without reflection.',
    example: '"EMERGENCY ALERT: Share with 10 people right now or your account will be locked!"'
  },
  {
    id: 8,
    title: '8. Verify Before Forwarding',
    icon: Share2,
    color: 'from-teal-500 to-emerald-500',
    short: 'Take a 30-second pause to prevent accidental misinformation propagation.',
    rule: 'By pausing for 30 seconds to fact-check before hitting the forward arrow, you protect your friends, family, and public discourse from coordinated disinformation campaigns.',
    example: 'Submitting a dubious WhatsApp forward to TruthShield before forwarding to your family chat.'
  }
];

export default function AwarenessSection() {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section className="py-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            Media Literacy Guide
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Learn to Spot Misleading Information
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            8 essential principles derived from academic media literacy research (Rodríguez Castillo et al., 2026) to help you evaluate content before sharing.
          </p>
        </div>

        {/* 8 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {AWARENESS_RULES.map((rule) => {
            const Icon = rule.icon;
            const isExpanded = expandedId === rule.id;

            return (
              <div
                key={rule.id}
                onClick={() => toggleExpand(rule.id)}
                className={`p-5 rounded-2xl glass-panel border transition-all cursor-pointer flex flex-col justify-between ${
                  isExpanded
                    ? 'border-cyan-500/50 bg-dark-800/95 shadow-xl shadow-cyan-500/10'
                    : 'border-white/10 hover:border-cyan-500/30 bg-dark-900/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${rule.color} flex items-center justify-center text-white shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-dark-800 text-slate-400 border border-white/5">
                      RULE {rule.id}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2">
                    {rule.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {rule.short}
                  </p>

                  {isExpanded && (
                    <div className="border-t border-white/10 pt-3 space-y-2 text-xs animate-fade-in">
                      <p className="text-slate-300 leading-relaxed font-normal">
                        {rule.rule}
                      </p>
                      <div className="p-2.5 rounded-xl bg-dark-900 border border-white/5 text-[11px] text-amber-300/90 leading-tight">
                        <span className="font-semibold block text-amber-400 mb-0.5">Real-world flag:</span>
                        {rule.example}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-cyan-400 font-medium">
                  <span>{isExpanded ? 'Show less' : 'Read details'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

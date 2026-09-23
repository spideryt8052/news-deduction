import React, { useState } from 'react';
import { 
  UserCheck, 
  Filter, 
  Cpu, 
  SearchCheck, 
  AlertTriangle, 
  Users, 
  ArrowDown, 
  ArrowRight,
  ChevronRight
} from 'lucide-react';

const WORKFLOW_STEPS = [
  {
    step: '1',
    title: 'User Input & Data Collection',
    icon: UserCheck,
    color: 'from-blue-500 to-cyan-500',
    summary: 'Ingestion of viral headlines, forwarded text, web links, or screenshots from social media (WhatsApp, X, Facebook, Instagram).',
    detail: 'The platform normalizes disparate input channels into a standardized content payload. Raw metadata such as submission time, source hints, and platform cues are captured.'
  },
  {
    step: '2',
    title: 'Data Preprocessing',
    icon: Filter,
    color: 'from-cyan-500 to-teal-500',
    summary: 'Cleaning text noise, stripping tracking parameters from URLs, and executing optical character recognition (OCR) on screenshots.',
    detail: 'Removes duplicate punctuation, resolves shortened hyperlinks, filters out noise tokens, and formats clean text for downstream linguistic and semantic parsers.'
  },
  {
    step: '3',
    title: 'Content Analysis',
    icon: Cpu,
    color: 'from-teal-500 to-indigo-500',
    summary: 'Evaluating emotional tone, urgency markers, sensational headlines, and syntactic indicators of automated or bot-generated text.',
    detail: 'Applies NLP feature extraction to identify manipulative rhetoric (e.g., "forward to 10 friends immediately", exaggerated adjectives, unsupported causal assertions).'
  },
  {
    step: '4',
    title: 'Fact Verification & Credibility Analysis',
    icon: SearchCheck,
    color: 'from-indigo-500 to-purple-500',
    summary: 'Cross-referencing extracted atomic claims against trusted fact-checkers, institutional repositories, and domain reputation registries.',
    detail: 'Retrieves both corroborating and contradicting evidence items. Evaluates the domain authority of cited publishers to differentiate peer-reviewed sources from clickbait blogs.'
  },
  {
    step: '5',
    title: 'Misleading Information Detection',
    icon: AlertTriangle,
    color: 'from-purple-500 to-pink-500',
    summary: 'AI assessment categorizes content into Likely Reliable, Potentially Misleading, Likely False, or Needs Further Verification.',
    detail: 'Computes a calibrated AI Assessment Confidence score based on evidence consensus. Synthesizes an explanation-first rationale rather than an opaque binary label.'
  },
  {
    step: '6',
    title: 'Informed Decision-Making',
    icon: Users,
    color: 'from-pink-500 to-rose-500',
    summary: 'Delivers actionable guidance ("Think Before You Share") to prevent accidental amplification of deceptive viral media.',
    detail: 'Empowers users with media literacy education and explicit recommendations (e.g., consulting official health bulletins before adopting viral medical advice).'
  }
];

export default function HowItWorks({ compact = false }) {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="py-12 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
            Methodology & Pipeline
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How The Verification System Works
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Based directly on the 6-stage detection workflow defined in the MCA Project Synopsis (Fig. 1).
          </p>
        </div>

        {/* Workflow Diagram Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {WORKFLOW_STEPS.map((item, index) => {
            const Icon = item.icon;
            const isSelected = activeStep === index;
            return (
              <div
                key={index}
                onClick={() => setActiveStep(index)}
                className={`p-6 rounded-2xl glass-panel border transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'border-cyan-500/50 bg-dark-800/90 shadow-xl shadow-cyan-500/10 scale-[1.02]'
                    : 'border-white/10 hover:border-white/20 bg-dark-900/60'
                }`}
              >
                {/* Step badge & icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shadow-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-dark-800 text-slate-400 border border-white/5">
                    STAGE 0{item.step}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {item.summary}
                </p>

                {/* Expanded Detail */}
                <p className="text-[11px] text-slate-400 border-t border-white/5 pt-3 leading-normal">
                  {item.detail}
                </p>
              </div>
            );
          })}
        </div>

        {/* Synopsis Callout */}
        <div className="mt-10 p-5 rounded-2xl bg-dark-800/60 border border-white/5 max-w-3xl mx-auto flex items-center justify-between flex-wrap gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span>Workflow strictly follows Figure 1 of GNIOT/AKTU MCA Project Synopsis.</span>
          </div>
          <span className="text-cyan-400 font-medium">Supervisor: Dr. Saumya Chaturvedi</span>
        </div>

      </div>
    </section>
  );
}

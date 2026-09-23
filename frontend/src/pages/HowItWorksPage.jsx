import React from 'react';
import HowItWorks from '../components/HowItWorks';
import { Layers, ArrowRight, ShieldCheck, Database, Cpu, SearchCheck, CheckCircle2 } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
          Architecture & Flowchart
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          How TruthShield Evaluates Misinformation
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          An in-depth breakdown of the 6-stage methodology specified in the MCA Project Synopsis (Greater Noida Institute of Technology / AKTU).
        </p>
      </div>

      {/* Workflow Component */}
      <HowItWorks />

      {/* Detailed Technical Pipeline Breakdown */}
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-white/10 space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            The Multi-Stage Processing Pipeline (Fig. 1)
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            The detection engine operates as an asynchronous pipeline orchestrated via Python FastAPI. Each phase performs specialized syntactic, semantic, and corroborative checks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-dark-900/80 border border-white/5 space-y-2">
            <span className="text-xs font-mono text-cyan-400 uppercase font-bold">Phase A</span>
            <h3 className="text-base font-bold text-white">Linguistic & Syntactic Analysis</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detects high-arousal emotional language, excessive exclamation markers, urgent forwarding mandates, and synthetically repetitive sentence structures typical of automated social bot propaganda.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-dark-900/80 border border-white/5 space-y-2">
            <span className="text-xs font-mono text-cyan-400 uppercase font-bold">Phase B</span>
            <h3 className="text-base font-bold text-white">Claim Isolation & Decomposition</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Breaks multi-sentence narratives into atomic, verifiable propositions. Distinguishes subjective political commentary from falsifiable empirical assertions (e.g. death tolls, medical cures).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-dark-900/80 border border-white/5 space-y-2">
            <span className="text-xs font-mono text-cyan-400 uppercase font-bold">Phase C</span>
            <h3 className="text-base font-bold text-white">Corroboration & Stance Analysis</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Queries trusted domain databases and verified fact-checking articles. Determines whether credible sources support, refute, or provide missing critical context for the isolated claim.
            </p>
          </div>
        </div>
      </div>

      {/* Academic Differentiation / Literature Improvements */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">
          Overcoming Limitations in Existing Research
        </h2>
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto rounded-2xl border border-white/10 glass-panel">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-dark-800 text-slate-200 uppercase font-semibold text-[11px] border-b border-white/10">
              <tr>
                <th className="p-4">Prior Study</th>
                <th className="p-4">Identified Limitation</th>
                <th className="p-4">TruthShield Proposed Improvement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="p-4 font-medium text-white">Rodríguez Castillo et al. (2026)</td>
                <td className="p-4 text-slate-400">Passive educational interventions without real-time tech support</td>
                <td className="p-4 text-cyan-400 font-medium">Real-time AI literacy nudges + automated alerts before sharing</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Ozcelik et al. (2025)</td>
                <td className="p-4 text-slate-400">High dependency on large-scale labeled community data</td>
                <td className="p-4 text-cyan-400 font-medium">Dual-track contrastive embeddings + real-time source verification</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Tomassi et al. (2024)</td>
                <td className="p-4 text-slate-400">High dependency on basic NLP & topic modeling</td>
                <td className="p-4 text-cyan-400 font-medium">Generative LLM claim extraction + behavioral verification</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Aïmeur et al. (2023)</td>
                <td className="p-4 text-slate-400">High rate of unintentional spreading by real users</td>
                <td className="p-4 text-cyan-400 font-medium">Multi-factor intention analysis + contextual "Think Before You Share" alert</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards View */}
        <div className="sm:hidden space-y-3">
          {[
            {
              author: 'Rodríguez Castillo et al. (2026)',
              limitation: 'Passive educational interventions without real-time tech support',
              improvement: 'Real-time AI literacy nudges + automated alerts before sharing'
            },
            {
              author: 'Ozcelik et al. (2025)',
              limitation: 'High dependency on large-scale labeled community data',
              improvement: 'Dual-track contrastive embeddings + real-time source verification'
            },
            {
              author: 'Tomassi et al. (2024)',
              limitation: 'High dependency on basic NLP & topic modeling',
              improvement: 'Generative LLM claim extraction + behavioral verification'
            },
            {
              author: 'Aïmeur et al. (2023)',
              limitation: 'High rate of unintentional spreading by real users',
              improvement: 'Multi-factor intention analysis + contextual "Think Before You Share" alert'
            }
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-dark-800/80 border border-white/5 space-y-2 text-xs">
              <span className="font-bold text-white block">{item.author}</span>
              <div>
                <span className="text-[10px] uppercase font-semibold text-rose-400 block">Identified Limitation:</span>
                <p className="text-slate-400 text-[11px]">{item.limitation}</p>
              </div>
              <div className="border-t border-white/5 pt-1.5">
                <span className="text-[10px] uppercase font-semibold text-cyan-400 block">Proposed Improvement:</span>
                <p className="text-cyan-300 font-medium text-[11px]">{item.improvement}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

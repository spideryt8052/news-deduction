import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, History, ArrowLeft, RotateCcw } from 'lucide-react';
import AnalyzeBox from '../components/AnalyzeBox';
import ResultCard from '../components/ResultCard';

export default function AnalyzePage() {
  const [searchParams] = useSearchParams();
  const claimParam = searchParams.get('claim') || '';

  const [analysisResult, setAnalysisResult] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);

  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result);
    setSessionHistory(prev => [result, ...prev.slice(0, 4)]);
  };

  const handleReset = () => {
    setAnalysisResult(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Studio Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
          Credibility Analysis Studio
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Verify Social Media Information
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Enter text, speak your claim, supply a news article URL, or upload a screenshot to evaluate credibility markers.
        </p>
      </div>

      {/* Main Workspace */}
      <div className="space-y-8">
        {!analysisResult ? (
          <AnalyzeBox 
            onAnalysisComplete={handleAnalysisComplete} 
            initialText={claimParam}
          />
        ) : (
          <div className="space-y-6">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Input</span>
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-300 border border-white/5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Analysis</span>
              </button>
            </div>
            <ResultCard result={analysisResult} onReset={handleReset} />
          </div>
        )}
      </div>

      {/* Session History (Temporary In-Memory) */}
      {sessionHistory.length > 1 && !analysisResult && (
        <div className="max-w-3xl mx-auto pt-6 border-t border-white/10 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
            <History className="w-4 h-4 text-cyan-400" />
            <span>Recent Session Analyses</span>
          </div>

          <div className="space-y-2">
            {sessionHistory.map((item, idx) => (
              <div
                key={idx}
                onClick={() => setAnalysisResult(item)}
                className="p-3.5 rounded-xl bg-dark-800/60 border border-white/5 hover:border-cyan-500/30 flex items-center justify-between cursor-pointer transition-all hover:bg-dark-800"
              >
                <div className="truncate pr-4 space-y-1">
                  <div className="text-xs font-medium text-white truncate">
                    "{item.claim}"
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {item.summary}
                  </div>
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <span className="text-xs font-bold text-cyan-400">
                    {item.classification}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {Math.round(item.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

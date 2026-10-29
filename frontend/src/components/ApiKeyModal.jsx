import React, { useState, useEffect } from 'react';
import { 
  Key, 
  CheckCircle, 
  AlertCircle, 
  X, 
  ExternalLink, 
  Sparkles, 
  Zap, 
  Eye, 
  EyeOff, 
  Trash2,
  RefreshCw,
  Cpu
} from 'lucide-react';
import api, { getStoredAiConfig, setStoredAiConfig, clearStoredAiConfig, formatApiError } from '../services/api';

const PROVIDERS = [
  {
    id: 'groq',
    name: 'Groq (Llama-3.3 70B)',
    badge: 'Recommended & Free',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: 'Ultra-fast inference (500+ tok/s). Free tier available with high rate limits.',
    keyPrefix: 'gsk_',
    keyUrl: 'https://console.groq.com/keys',
    keyPlaceholder: 'gsk_...',
    model: 'llama-3.3-70b-versatile',
  },
  {
    id: 'gemini',
    name: 'Google Gemini (3.5 Flash)',
    badge: 'Free Tier',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    description: 'High-speed Google multimodal model with generous free request quotas.',
    keyPrefix: 'AIzaSy',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    keyPlaceholder: 'AIzaSy...',
    model: 'gemini-3.5-flash',
  },
  {
    id: 'openai',
    name: 'OpenAI (GPT-4o-mini)',
    badge: 'High Reasoning',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    description: 'Industry benchmark accuracy with strict JSON schema compliance.',
    keyPrefix: 'sk-',
    keyUrl: 'https://platform.openai.com/api-keys',
    keyPlaceholder: 'sk-...',
    model: 'gpt-4o-mini',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude (3.5 Haiku)',
    badge: 'Fast & Concise',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    description: 'Nuanced claim extraction and journalistic explanation generation.',
    keyPrefix: 'sk-ant-',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyPlaceholder: 'sk-ant-...',
    model: 'claude-3-5-haiku',
  },
  {
    id: 'mock',
    name: 'Local Heuristic Engine',
    badge: '100% Offline / Local Safe',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    description: 'Zero external API calls. Calibrated against our 5 factual archetypes.',
    keyPrefix: '',
    keyUrl: null,
    keyPlaceholder: 'No API key required',
    model: 'Heuristic Knowledge Base (Offline)',
  },
];

export default function ApiKeyModal({ isOpen, onClose, onConfigSaved }) {
  const [selectedProvider, setSelectedProvider] = useState('groq');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: bool, message: str }
  const [serverStatus, setServerStatus] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredAiConfig();
      if (stored.provider && stored.provider !== 'auto') {
        setSelectedProvider(stored.provider);
      } else {
        setSelectedProvider('groq');
      }
      setApiKey(stored.apiKey || '');
      setTestResult(null);

      // Fetch server-side status
      api.getAiStatus()
        .then(data => setServerStatus(data))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentProviderConfig = PROVIDERS.find(p => p.id === selectedProvider) || PROVIDERS[0];
  const isMock = selectedProvider === 'mock';

  const handleTestKey = async () => {
    if (isMock) {
      setTestResult({
        success: true,
        message: 'Local Heuristic Engine is always ready! No network or API key required.'
      });
      return;
    }

    if (!apiKey.trim()) {
      setTestResult({
        success: false,
        message: `Please enter a valid ${currentProviderConfig.name} API Key.`
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await api.testApiKey(selectedProvider, apiKey.trim());
      setTestResult({
        success: res.success,
        message: res.message
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: formatApiError(err)
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setStoredAiConfig(selectedProvider, isMock ? '' : apiKey.trim());
    if (onConfigSaved) {
      onConfigSaved({
        provider: selectedProvider,
        apiKey: isMock ? '' : apiKey.trim(),
        providerName: currentProviderConfig.name,
      });
    }
    onClose();
  };

  const handleClear = () => {
    clearStoredAiConfig();
    setApiKey('');
    setSelectedProvider('groq');
    setTestResult({
      success: true,
      message: 'Custom API Key cleared. System will use backend .env or fallback heuristic.'
    });
    if (onConfigSaved) {
      onConfigSaved({ provider: 'auto', apiKey: '', providerName: 'Automatic / Fallback' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                AI Engine & Live API Key Settings
              </h2>
              <p className="text-xs text-slate-400">
                Configure commercial or open-weight LLMs for live real-time analysis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Provider Selector Cards */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Select AI Engine Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PROVIDERS.map((p) => {
                const isSelected = selectedProvider === p.id;
                const serverHasKey = serverStatus?.server_keys?.[p.id];

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(p.id);
                      setTestResult(null);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500 shadow-sm shadow-cyan-500/10'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-sm font-semibold ${isSelected ? 'text-cyan-400' : 'text-white'}`}>
                        {p.name}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.badgeColor}`}>
                        {p.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-snug">
                      {p.description}
                    </p>
                    {serverHasKey && (
                      <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                        <CheckCircle className="w-3 h-3" /> Server .env key active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* API Key Input */}
          {!isMock ? (
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  Your {currentProviderConfig.name} API Key
                </label>
                {currentProviderConfig.keyUrl && (
                  <a
                    href={currentProviderConfig.keyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    Get Free Key <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder={`Paste your key (e.g. ${currentProviderConfig.keyPlaceholder})`}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 pr-20 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="p-1.5 text-slate-400 hover:text-white rounded"
                    title={showKey ? "Hide key" : "Show key"}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                🔒 Key is stored locally in your browser session or sent securely via encrypted HTTPS request headers.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-start gap-3">
              <Cpu className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white mb-1">
                  Offline Heuristic Knowledge Base Active
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Fast and fully self-contained. Evaluates viral claims against built-in linguistic markers and verified archetypes with zero internet or API quota dependence.
                </p>
              </div>
            </div>
          )}

          {/* Test Status Banner */}
          {testResult && (
            <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
              testResult.success 
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            }`}>
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <span className="text-xs leading-relaxed font-medium">
                {testResult.message}
              </span>
            </div>
          )}

          {/* Quick Setup Hint */}
          <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Tip: You can also put keys in <code className="text-cyan-300 px-1 py-0.5 bg-slate-900 rounded font-mono">backend/.env</code>
            </span>
            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Clear Key
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleTestKey}
            disabled={testing || (!isMock && !apiKey.trim())}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                Testing Key...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                Test Connection
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all"
            >
              Save & Activate
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

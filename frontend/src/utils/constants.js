export const CLASSIFICATIONS = {
  RELIABLE: 'Likely Reliable',
  MISLEADING: 'Potentially Misleading',
  FALSE: 'Likely False',
  UNVERIFIED: 'Needs Further Verification',
};

export const CLASSIFICATION_THEMES = {
  'Likely Reliable': {
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-400',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/10',
    dot: 'bg-emerald-400',
    iconColor: '#10b981',
    description: 'Information appears consistent with verified reporting and credible institutional records.',
  },
  'Potentially Misleading': {
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-400',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/10',
    dot: 'bg-amber-400',
    iconColor: '#f59e0b',
    description: 'Contains partial facts, out-of-context quotes, or exaggerated headlines that alter meaning.',
  },
  'Likely False': {
    badgeBg: 'bg-rose-500/10',
    badgeText: 'text-rose-400',
    border: 'border-rose-500/30',
    glow: 'shadow-rose-500/10',
    dot: 'bg-rose-400',
    iconColor: '#f43f5e',
    description: 'Directly contradicted by credible evidence, fact-checkers, or official documentation.',
  },
  'Needs Further Verification': {
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-400',
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/10',
    dot: 'bg-blue-400',
    iconColor: '#3b82f6',
    description: 'Insufficient public evidence or conflicting early reports; independent corroboration required.',
  },
};

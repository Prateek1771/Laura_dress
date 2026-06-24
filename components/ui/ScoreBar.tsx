import type { ScoreTier } from '@/lib/scoring/types';
import { MATCH_THRESHOLD_EXCELLENT, MATCH_THRESHOLD_STRONG } from '@/lib/constants';

interface ScoreBarProps {
  score: number;
  showLabel?: boolean;
  showTier?: boolean;
  className?: string;
}

function tierFromScore(score: number): ScoreTier {
  if (score >= MATCH_THRESHOLD_EXCELLENT) return 'excellent';
  if (score >= MATCH_THRESHOLD_STRONG) return 'strong';
  return 'good';
}

const TIER_CLASSES: Record<ScoreTier, { fill: string; text: string; label: string }> = {
  excellent: { fill: 'bg-score-excellent', text: 'text-score-excellent', label: 'Excellent Match' },
  strong: { fill: 'bg-score-strong', text: 'text-score-strong', label: 'Strong Match' },
  good: { fill: 'bg-score-good', text: 'text-score-good', label: 'Good Match' },
};

export function ScoreBar({ score, showLabel = true, showTier = true, className = '' }: ScoreBarProps) {
  const tier = tierFromScore(score);
  const { fill, text, label } = TIER_CLASSES[tier];

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center justify-between">
        {showTier && <span className="text-[11px] text-ink-muted">{label}</span>}
        {showLabel && (
          <span className={`text-sm font-bold ${text}`}>{score}%</span>
        )}
      </div>
      <div className="h-1.5 w-full rounded-full bg-score-track overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${fill}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

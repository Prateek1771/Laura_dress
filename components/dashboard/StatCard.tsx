import { Card } from '@/components/ui/Card';

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted">{label}</span>
      <span className="font-display text-2xl font-semibold text-ink">{value}</span>
      {hint && <span className="text-xs text-ink-muted">{hint}</span>}
    </Card>
  );
}

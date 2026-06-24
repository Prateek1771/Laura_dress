import type { HTMLAttributes } from 'react';

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'pay-cash'
  | 'pay-upi'
  | 'pay-card'
  | 'pay-netbanking'
  | 'dress-id';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-primary-soft text-primary',
  success: 'bg-[color-mix(in_srgb,var(--color-status-success)_10%,white)] text-status-success',
  warning: 'bg-[color-mix(in_srgb,var(--color-status-warning)_10%,white)] text-status-warning',
  danger: 'bg-[color-mix(in_srgb,var(--color-status-danger)_10%,white)] text-status-danger',
  info: 'bg-[color-mix(in_srgb,var(--color-status-info)_10%,white)] text-status-info',
  neutral: 'bg-surface-soft text-ink-muted',
  'pay-cash': 'bg-[color-mix(in_srgb,var(--color-pay-cash)_10%,white)] text-pay-cash',
  'pay-upi': 'bg-[color-mix(in_srgb,var(--color-pay-upi)_10%,white)] text-pay-upi',
  'pay-card': 'bg-[color-mix(in_srgb,var(--color-pay-card)_10%,white)] text-pay-card',
  'pay-netbanking': 'bg-[color-mix(in_srgb,var(--color-pay-netbanking)_10%,white)] text-pay-netbanking',
  'dress-id': 'bg-surface-soft text-ink-secondary font-mono',
};

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-[--radius-badge] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

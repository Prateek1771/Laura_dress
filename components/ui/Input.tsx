import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`bg-surface border rounded-[--radius-input] px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted outline-none transition-colors ${
          error
            ? 'border-status-danger focus:border-status-danger focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-status-danger)_20%,transparent)]'
            : 'border-border focus:border-primary focus:ring-2 focus:ring-primary-soft'
        } ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-[12px] text-ink-muted">{hint}</p>}
      {error && <p className="text-[12px] text-status-danger">{error}</p>}
    </div>
  );
}

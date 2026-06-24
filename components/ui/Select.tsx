import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, placeholder, options, className = '', id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`bg-surface border rounded-[--radius-input] px-3 py-2.5 text-sm text-ink outline-none transition-colors appearance-none cursor-pointer ${
          error
            ? 'border-status-danger focus:border-status-danger'
            : 'border-border focus:border-primary focus:ring-2 focus:ring-primary-soft'
        } ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-[12px] text-status-danger">{error}</p>}
    </div>
  );
}

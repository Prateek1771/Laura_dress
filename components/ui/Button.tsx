import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const BASE = 'inline-flex items-center justify-center font-sans text-sm font-semibold rounded-[--radius-button] transition-colors disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-hover min-h-[44px] px-5 py-3',
  secondary: 'bg-surface text-primary border border-border hover:bg-surface-soft min-h-[44px] px-5 py-3',
  ghost: 'text-ink-secondary hover:bg-surface-soft px-3 py-2',
};

const SIZES = {
  sm: 'text-xs px-3 py-2 min-h-[36px]',
  md: '',
  lg: 'text-base px-6 py-3.5 min-h-[52px]',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

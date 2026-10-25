import React from 'react';

const VARIANT_STYLES = {
  red: 'bg-red-50 text-red-700 border border-red-200',
  amber: 'bg-amber-50 text-amber-800 border border-amber-200',
  green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  slate: 'bg-slate-100 text-slate-700 border border-slate-200',
};

export default function Badge({ variant = 'slate', children, className = '' }) {
  const variantClass = VARIANT_STYLES[variant] || VARIANT_STYLES.slate;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide transition-all duration-200 ${variantClass} ${className}`}
    >
      {children}
    </span>
  );
}

import React from 'react';
import { Code2, Sigma } from 'lucide-react';

const subjects = [
  { id: 'frontend', label: 'Programming', Icon: Code2 },
  { id: 'mathematics', label: 'Maths', Icon: Sigma },
];

export default function SubjectSelection({ onSelect, disabled = false }) {
  return (
    <main className="min-h-screen bg-background dark:bg-[#1F1F1F] text-foreground flex items-center justify-center p-6">
      <div className="grid w-full max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
        {subjects.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            disabled={disabled}
            className="group flex min-h-64 flex-col items-center justify-center gap-5 rounded-xl border border-border bg-card p-8 text-center shadow-sm transition hover:border-primary/50 hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-70"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-foreground transition group-hover:bg-primary/10 group-hover:text-primary">
              <Icon className="h-8 w-8" strokeWidth={1.7} />
            </span>
            <span className="text-xl font-semibold tracking-tight">{label}</span>
          </button>
        ))}
      </div>
    </main>
  );
}

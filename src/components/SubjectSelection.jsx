import React from 'react';
import { Code2, Sigma, Cpu, Wand2, Sparkles, Layers } from 'lucide-react';

const subjects = [
  {
    id: 'reduzer-software-dev',
    label: 'Programming',
    subtitle: 'Software Development & Computing Foundations (Reduzer Curriculum)',
    Icon: Code2
  },
  {
    id: 'software-engineer',
    label: 'Software Engineer',
    subtitle: 'DSA, Concurrency Pools, Distributed Rate Limiting & Outbox Architecture',
    Icon: Layers
  },
  {
    id: 'fullstack-ai',
    label: 'AI Engineer',
    subtitle: 'Structured Outputs, Vector RAG, Tool Dispatchers, ReAct Loops & Evals',
    Icon: Sparkles
  },
  {
    id: 'mathematics',
    label: 'Maths',
    subtitle: 'From arithmetic & geometry to calculus, linear algebra, and multivariable optimization',
    Icon: Sigma
  },
  {
    id: 'caltech-embedded-iot',
    label: 'Circuits & Hardware',
    subtitle: 'Microcontrollers, Wokwi Simulation, GPIOs & Firmware',
    Icon: Cpu
  },
  {
    id: 'studio',
    label: 'Lab Studio',
    subtitle: '10-Minute Challenge & Socratic Rubric Builder for Creators',
    Icon: Wand2
  },
];

export default function SubjectSelection({ onSelect, disabled = false }) {
  return (
    <main className="min-h-screen bg-background dark:bg-[#1F1F1F] text-foreground flex items-center justify-center p-6">
      <div className="grid w-full max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map(({ id, label, subtitle, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            disabled={disabled}
            className="group flex min-h-60 flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-6 text-center shadow-xs transition hover:border-primary/50 hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-70"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-foreground transition group-hover:bg-primary/10 group-hover:text-primary">
              <Icon className="h-8 w-8" strokeWidth={1.7} />
            </span>
            <div className="space-y-1">
              <span className="text-xl font-semibold tracking-tight text-foreground block">
                {label}
              </span>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                {subtitle}
              </p>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}

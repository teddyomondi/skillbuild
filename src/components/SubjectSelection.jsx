import React from 'react';
import { Code2, Sigma, Cpu, Sparkles, Upload, ArrowRight, School } from 'lucide-react';

const subjects = [
  {
    id: 'frontend',
    label: 'Programming',
    subtitle: 'Code IDE with live browser preview',
    Icon: Code2,
    badge: 'Code IDE'
  },
  {
    id: 'mathematics',
    label: 'Maths & Physics',
    subtitle: 'Infinite Excalidraw digital whiteboard',
    Icon: Sigma,
    badge: 'Math Canvas'
  },
  {
    id: 'caltech-embedded-iot',
    label: 'Circuits & IoT',
    subtitle: 'Microcontroller hardware & Wokwi simulator',
    Icon: Cpu,
    badge: 'Wokwi Simulator'
  },
];

export default function SubjectSelection({ onSelect, disabled = false }) {
  return (
    <main className="min-h-screen bg-background dark:bg-[#151515] text-foreground flex flex-col items-center justify-center p-6 sm:p-10 font-sans">
      <div className="w-full max-w-4xl space-y-6">
        {/* Creator / School Syllabus Engine Hero Card */}
        <div className="rounded-2xl border-2 border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl relative overflow-hidden group">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
              <School className="w-3.5 h-3.5" />
              <span>For Schools, Bootcamps & STEM Creators</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Plug Your Syllabus into the Engine
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Upload any static PDF syllabus or outline. The engine automatically turns it into live, Socratic, cursor-guided workspaces (Code IDE, Excalidraw Math Canvas, or Embedded Wokwi / Circuit Canvas).
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelect('syllabus-engine')}
            disabled={disabled}
            className="shrink-0 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:bg-primary/90 transition hover:scale-[1.02] active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Plug Syllabus PDF</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* 3 Core STEM Pathways */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-3">
            Or Choose a Live STEM Workspace:
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {subjects.map(({ id, label, subtitle, Icon, badge }) => (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                disabled={disabled}
                className="group flex flex-col items-center justify-between min-h-[220px] rounded-xl border border-border bg-card p-6 text-center shadow-xs transition hover:border-primary/50 hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-70"
              >
                <div className="flex flex-col items-center gap-3">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-foreground transition group-hover:bg-primary/10 group-hover:text-primary group-hover:scale-105">
                    <Icon className="h-7 w-7" strokeWidth={1.8} />
                  </span>
                  <div>
                    <span className="text-lg font-semibold tracking-tight text-foreground block">{label}</span>
                    <span className="text-xs text-muted-foreground mt-1 block leading-snug">{subtitle}</span>
                  </div>
                </div>

                <span className="mt-4 px-2.5 py-0.5 rounded-full bg-secondary border border-border/80 text-[10px] font-medium text-muted-foreground group-hover:border-primary/40 group-hover:text-foreground transition">
                  {badge}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

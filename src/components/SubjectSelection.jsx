import React from 'react';
import { UserButton } from '@clerk/clerk-react';
import { Code2, Sigma, ArrowRight, Sparkles, Binary, Compass } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import Logo from './notion-marketing/Logo';

const subjects = [
  {
    id: 'frontend',
    label: 'Programming',
    badge: 'Web, Backend & AI',
    icon: Code2,
    accentColor: 'emerald',
    description:
      'Learn modern software engineering hands-on. Write real code in the in-browser IDE with live preview, runtime terminal, and real-time AI tutor feedback.',
    stats: '3 Tracks • 8+ Interactive Modules • Live Monaco IDE',
    actionText: 'Start Programming',
  },
  {
    id: 'mathematics',
    label: 'Mathematics',
    badge: 'Visual & Applied Maths',
    icon: Sigma,
    accentColor: 'indigo',
    description:
      'Explore coordinate geometry, vectors, calculus, trigonometry, and linear algebra through visual graphs and the digital mathematics board.',
    stats: '6 Visual Modules • Vector Math • Interactive Canvas',
    actionText: 'Start Mathematics',
  },
];

export default function SubjectSelection({ onSelect, disabled = false }) {
  return (
    <div className="min-h-screen bg-background dark:bg-[#191919] text-foreground flex flex-col font-sans transition-colors duration-200">
      {/* Top Navigation */}
      <header className="w-full border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-20 px-6 py-3.5 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <ModeToggle />
          <UserButton afterSignOutUrl="/welcome" />
        </div>
      </header>

      {/* Main Selection Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl space-y-10">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Select Your Path</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight font-serif text-foreground">
              What do you want to learn?
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Choose a subject below to open its guided curriculum roadmap and begin your interactive AI-powered lessons.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {subjects.map((subject) => {
              const Icon = subject.icon;
              return (
                <div
                  key={subject.id}
                  onClick={() => !disabled && onSelect(subject.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
                      e.preventDefault();
                      onSelect(subject.id);
                    }
                  }}
                  className={`group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card hover:bg-card/90 p-7 sm:p-8 shadow-sm transition-all duration-200 hover:shadow-xl hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    disabled ? 'opacity-60 cursor-wait' : 'cursor-pointer'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary group-hover:bg-primary/10 text-foreground group-hover:text-primary transition-colors">
                        <Icon className="h-7 w-7" strokeWidth={1.8} />
                      </span>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary text-muted-foreground border border-border/60">
                        {subject.badge}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                        {subject.label}
                      </h2>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {subject.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-border/60 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground truncate mr-2">
                      {subject.stats}
                    </span>
                    <span className="inline-flex items-center text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform">
                      {subject.actionText}
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

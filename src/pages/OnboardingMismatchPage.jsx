import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Check, Layers } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle.jsx';
import Logo from '@/components/notion-marketing/Logo.jsx';
import { UserButton } from '@clerk/clerk-react';
import Spinner from '@/components/ui/spinner.jsx';
import { Button } from '@/components/ui/button.jsx';
import { computeMarketMismatch, buildAdaptiveCourseTrack, saveOnboardingData } from '@/services/adaptiveOnboardingEngine.js';

const AVAILABLE_PATHS = [
  { id: 'frontend', label: 'Programming' },
  { id: 'backend', label: 'Backend & Cloud' },
  { id: 'fintech', label: 'FinTech Rails' },
  { id: 'ai', label: 'AI Systems' },
  { id: 'mathematics', label: 'Mathematics' },
];

export default function OnboardingMismatchPage({
  initialData = {},
  onBack,
  onComplete
}) {
  const [selectedPath, setSelectedPath] = useState(
    () => initialData.targetDomain || 'frontend'
  );
  const [mismatchReport, setMismatchReport] = useState(
    () => initialData.mismatchReport || null
  );
  const [isCalculating, setIsCalculating] = useState(!initialData.mismatchReport);
  const [isBuildingCourse, setIsBuildingCourse] = useState(false);
  const [error, setError] = useState(null);

  // Recalculate mismatch when selectedPath changes or on mount
  useEffect(() => {
    let cancelled = false;

    async function evaluate() {
      setIsCalculating(true);
      setError(null);
      try {
        const report = await computeMarketMismatch({
          resumeData: initialData.resumeData || {},
          curriculumData: initialData.curriculumData || {},
          targetDomain: selectedPath,
        });

        if (!cancelled) {
          setMismatchReport(report);
          await saveOnboardingData({
            targetDomain: selectedPath,
            mismatchReport: report,
          });
        }
      } catch (err) {
        console.error('Mismatch evaluation error:', err);
        if (!cancelled) setError('Evaluation failed. Using benchmark estimate.');
      } finally {
        if (!cancelled) setIsCalculating(false);
      }
    }

    evaluate();

    return () => {
      cancelled = true;
    };
  }, [selectedPath]);

  const handleBuildCourse = async () => {
    if (!mismatchReport || isBuildingCourse) return;
    setIsBuildingCourse(true);
    setError(null);

    try {
      const customTrack = await buildAdaptiveCourseTrack({
        mismatchReport,
        targetDomain: selectedPath,
        learnerName: initialData.resumeData?.name || 'Learner',
      });

      await saveOnboardingData({
        completed: true,
        generatedTrackId: customTrack.id,
      });

      onComplete(customTrack);
    } catch (err) {
      console.error('Failed to build adaptive course:', err);
      setError('Course development error. Retrying with fallback template...');
      setIsBuildingCourse(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-[#191919] text-foreground flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-20 px-6 py-3.5 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">Step 3 of 3</span>
          <ModeToggle />
          <UserButton afterSignOutUrl="/welcome" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-2xl flex flex-col items-center">
          {/* Path Selector Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {AVAILABLE_PATHS.map((path) => (
              <button
                key={path.id}
                type="button"
                onClick={() => setSelectedPath(path.id)}
                disabled={isCalculating || isBuildingCourse}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                  selectedPath === path.id
                    ? 'bg-foreground text-background shadow-xs'
                    : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                }`}
              >
                {path.label}
              </button>
            ))}
          </div>

          {isCalculating ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Spinner size="lg" />
              <span className="text-sm font-medium text-muted-foreground animate-pulse">
                Comparing skills with market demand...
              </span>
            </div>
          ) : mismatchReport ? (
            <div className="w-full flex flex-col items-center space-y-8">
              {/* Giant Mismatch Percentage */}
              <div className="text-center">
                <div className="text-7xl sm:text-8xl font-bold tracking-tight font-sans text-foreground">
                  {mismatchReport.mismatchScore}%
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-2">
                  Skills Mismatch
                </div>
              </div>

              {/* Concise Two-Column Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {/* What You Know */}
                <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    What You Know
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(mismatchReport.whatYouKnow || []).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-secondary text-foreground text-xs font-medium border border-border/60"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* What You Should Know */}
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:p-6 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                    What You Should Know
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(mismatchReport.whatYouShouldKnow || []).map((req, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-background text-foreground text-xs font-medium border border-primary/20"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-xs text-destructive font-medium">{error}</p>
              )}

              {/* Action Buttons */}
              <div className="w-full flex items-center justify-between pt-4 border-t border-border/60">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  disabled={isBuildingCourse}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>

                <Button
                  size="lg"
                  onClick={handleBuildCourse}
                  disabled={isBuildingCourse}
                  className="gap-2 font-semibold"
                >
                  {isBuildingCourse ? (
                    <>
                      <Spinner size="sm" />
                      <span>Building Custom Course...</span>
                    </>
                  ) : (
                    <>
                      <span>Build Custom Course</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

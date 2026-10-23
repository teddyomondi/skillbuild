// ============================================================================
// KENYAN INDUSTRY 4.0 vs EDUCATION 4.0: STUDENT ONBOARDING & SKILL GAP ENGINE
// ============================================================================
// Multi-step interactive onboarding experience that:
// 1. Diagnoses student's current baseline & educational background
// 2. Evaluates skills against Kenyan Industry 4.0 standards (Silicon Savannah)
// 3. Generates a personalized course track tailored to the diagnosed skill mismatch
// 4. Develops and launches interactive Scrimba-style lessons to teach the skills
// ============================================================================

import React, { useState } from 'react';
import { Button } from './ui/button.jsx';
import {
  Sparkles,
  Smartphone,
  Server,
  Code2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Cpu,
  GraduationCap,
  Briefcase,
  HelpCircle,
  Play,
  RotateCcw,
  Zap,
  Check
} from 'lucide-react';
import {
  KENYAN_INDUSTRY_DOMAINS,
  DIAGNOSTIC_QUESTIONS,
  evaluateSkillMismatch
} from '../services/industryEducationMatcher.js';
import { developCourseForSkillGap } from '../services/lessonDevelopmentEngine.js';

export default function KenyanIndustryOnboarding({
  initialLearnerName = '',
  onCompleteOnboarding,
  onCancel = null
}) {
  // Step 1: Profile | Step 2: Diagnostic Questions | Step 3: Mismatch Report | Step 4: AI Course Synthesis | Step 5: Ready to Teach
  const [currentStep, setCurrentStep] = useState(1);

  // Learner Profile State
  const [learnerProfile, setLearnerProfile] = useState({
    name: initialLearnerName || '',
    educationBackground: 'university-cs',
    targetDomain: 'fintech-rails',
    priorExperience: 'intermediate'
  });

  // Diagnostic Quiz Answers: { [questionId]: optionId }
  const [diagnosticAnswers, setDiagnosticAnswers] = useState({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Mismatch Analysis & Generated Course State
  const [mismatchReport, setMismatchReport] = useState(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesizedTrack, setSynthesizedTrack] = useState(null);
  const [generationStepProgress, setGenerationStepProgress] = useState(0);

  // Handle answering a diagnostic question
  const handleSelectOption = (questionId, optionId) => {
    setDiagnosticAnswers((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  // Run Mismatch Evaluation and move to Report
  const handleCompleteDiagnostic = () => {
    const report = evaluateSkillMismatch({
      learnerProfile,
      diagnosticAnswers
    });
    setMismatchReport(report);
    setCurrentStep(3);
  };

  // Trigger Autonomous Course Development
  const handleStartCourseDevelopment = async () => {
    setCurrentStep(4);
    setIsSynthesizing(true);
    setGenerationStepProgress(1);

    // Simulated progress indicators for real-time course development
    setTimeout(() => setGenerationStepProgress(2), 700);
    setTimeout(() => setGenerationStepProgress(3), 1500);

    try {
      const developedTrack = await developCourseForSkillGap({
        mismatchReport,
        learnerProfile
      });

      setTimeout(() => {
        setSynthesizedTrack(developedTrack);
        setIsSynthesizing(false);
        setCurrentStep(5);
      }, 2300);
    } catch (err) {
      console.error('Course development failed:', err);
      setIsSynthesizing(false);
    }
  };

  const currentDiagnosticQ = DIAGNOSTIC_QUESTIONS[activeQuestionIndex];
  const allQuestionsAnswered = DIAGNOSTIC_QUESTIONS.every((q) => Boolean(diagnosticAnswers[q.id]));

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-3xl bg-card border border-border text-foreground rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header / Progress Bar */}
        <div className="px-6 py-4 border-b border-border bg-secondary/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                  Kenya Industry 4.0
                </span>
                <span className="px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground text-[10px] font-semibold">
                  Education 4.0 Alignment
                </span>
              </div>
              <h2 className="text-sm font-semibold text-foreground">
                Autonomous Course & Skills Generator
              </h2>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={currentStep === 1 ? 'text-foreground font-semibold' : ''}>1. Profile</span>
            <span>→</span>
            <span className={currentStep === 2 ? 'text-foreground font-semibold' : ''}>2. Diagnostic</span>
            <span>→</span>
            <span className={currentStep === 3 ? 'text-foreground font-semibold' : ''}>3. Mismatch Delta</span>
            <span>→</span>
            <span className={currentStep >= 4 ? 'text-emerald-500 font-semibold' : ''}>4. Course Ready</span>
          </div>

          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground text-xs h-7 px-2"
            >
              Skip
            </Button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: LEARNER PROFILE & EDUCATION BACKGROUND                            */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-foreground mb-1">
                Tell Us About Your Learning Background
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Rather than forcing everyone into the same static track, Upskill analyzes your
                background against Kenya's Industry 4.0 market demands to synthesize a tailored course for your specific skill gap.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Your Full Name or Developer Alias
                </label>
                <input
                  type="text"
                  value={learnerProfile.name}
                  onChange={(e) => setLearnerProfile({ ...learnerProfile, name: e.target.value })}
                  placeholder="e.g., Brian Kiprotich or Amani Dev"
                  className="w-full bg-secondary/40 border border-border rounded-lg px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Current Educational / Training Background
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'university-cs', label: 'University Computer Science / Engineering', desc: 'Heavy on theory, algorithms, and OOP textbooks' },
                    { id: 'tvet-diploma', label: 'TVET / National Polytechnic Diploma', desc: 'Practical hands-on curriculum, bridging to industry' },
                    { id: 'self-taught', label: 'Self-Taught / Bootcamp Developer', desc: 'Tutorial-driven, seeking production-grade standards' },
                    { id: 'career-switcher', label: 'Career Switcher into Tech', desc: 'Transitioning from non-technical industry into software' }
                  ].map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setLearnerProfile({ ...learnerProfile, educationBackground: item.id })}
                      className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        learnerProfile.educationBackground === item.id
                          ? 'bg-secondary border-primary text-foreground shadow-xs'
                          : 'bg-card border-border text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground">{item.label}</span>
                        {learnerProfile.educationBackground === item.id && (
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground leading-snug">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                  Target Kenyan Industry 4.0 Sector
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {KENYAN_INDUSTRY_DOMAINS.map((domain) => (
                    <div
                      key={domain.id}
                      onClick={() => setLearnerProfile({ ...learnerProfile, targetDomain: domain.id })}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        learnerProfile.targetDomain === domain.id
                          ? 'bg-secondary border-amber-500 text-foreground shadow-xs'
                          : 'bg-card border-border text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground">{domain.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500">
                          {domain.marketDemandScore}% Demand
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">{domain.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-border">
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!learnerProfile.name.trim()}
                className="gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: INTERACTIVE SKILL BASELINE & INDUSTRY DIAGNOSTIC                  */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Scenario {activeQuestionIndex + 1} of {DIAGNOSTIC_QUESTIONS.length}
                </span>
                <h3 className="text-sm font-bold text-foreground mt-0.5">
                  {currentDiagnosticQ.title}
                </h3>
              </div>

              {/* Progress Dots */}
              <div className="flex items-center gap-1.5">
                {DIAGNOSTIC_QUESTIONS.map((q, idx) => (
                  <div
                    key={q.id}
                    onClick={() => setActiveQuestionIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full cursor-pointer transition ${
                      idx === activeQuestionIndex
                        ? 'bg-primary ring-2 ring-primary/30'
                        : diagnosticAnswers[q.id]
                        ? 'bg-emerald-500'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Scenario Callout */}
            <div className="p-3.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground/90 leading-relaxed">
              <span className="font-semibold text-amber-500 mr-1.5">Kenyan Production Scenario:</span>
              {currentDiagnosticQ.scenario}
            </div>

            {/* Question Prompt */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-3">
                {currentDiagnosticQ.question}
              </p>

              <div className="space-y-2">
                {currentDiagnosticQ.options.map((opt, optIdx) => {
                  const isSelected = diagnosticAnswers[currentDiagnosticQ.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(currentDiagnosticQ.id, opt.id)}
                      className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-3 ${
                        isSelected
                          ? 'bg-secondary border-primary text-foreground shadow-xs'
                          : 'bg-card border-border text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-secondary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 text-muted-foreground border border-border">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="text-xs leading-relaxed">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (activeQuestionIndex > 0) {
                    setActiveQuestionIndex(activeQuestionIndex - 1);
                  } else {
                    setCurrentStep(1);
                  }
                }}
                className="gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </Button>

              {activeQuestionIndex < DIAGNOSTIC_QUESTIONS.length - 1 ? (
                <Button
                  onClick={() => setActiveQuestionIndex(activeQuestionIndex + 1)}
                  disabled={!diagnosticAnswers[currentDiagnosticQ.id]}
                  className="gap-1.5"
                >
                  <span>Next Scenario</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button
                  onClick={handleCompleteDiagnostic}
                  disabled={!allQuestionsAnswered}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
                >
                  <span>Evaluate Skill Mismatch</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: INDUSTRY 4.0 vs EDUCATION 4.0 MISMATCH DIAGNOSTIC REPORT          */}
        {/* ========================================================================= */}
        {currentStep === 3 && mismatchReport && (
          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                  Diagnostic Result
                </span>
                <span className="text-xs text-muted-foreground">
                  Profile: {mismatchReport.learnerName}
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground">
                Industry 4.0 vs Education 4.0 Skill Mismatch Analysis
              </h3>
            </div>

            {/* Score Comparison Bars */}
            <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-3.5">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-foreground/90 font-medium">
                    Theoretical CS Grounding (Education 3.0 / University)
                  </span>
                  <span className="font-bold text-foreground">{mismatchReport.theoryScore}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-foreground/70 rounded-full transition-all duration-700"
                    style={{ width: `${mismatchReport.theoryScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-foreground/90 font-medium">
                    Production Industry 4.0 Readiness (Silicon Savannah / Kenya Tech)
                  </span>
                  <span className="font-bold text-emerald-500">{mismatchReport.appliedScore}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${mismatchReport.appliedScore}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Identified Mismatch Delta:</span>
                <span className="font-bold text-amber-500">
                  {mismatchReport.mismatchDelta}% Skill Delta to Bridge
                </span>
              </div>
            </div>

            {/* Mismatch Summary Card */}
            <div className="p-3.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground/90 leading-relaxed">
              <span className="font-semibold text-amber-500 mr-1.5">Diagnosis:</span>
              {mismatchReport.mismatchSummary}
            </div>

            {/* Identified Gaps to be bridged */}
            {mismatchReport.identifiedGaps.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Specific Competency Gaps Identified:
                </h4>
                <div className="space-y-2">
                  {mismatchReport.identifiedGaps.map((gap, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-secondary/30 border border-border flex items-start gap-2.5 text-xs"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-foreground">{gap.title}</div>
                        <div className="text-muted-foreground text-[11px] mt-0.5">{gap.explanation}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Custom Path */}
            <div className="p-4 rounded-xl bg-secondary/50 border border-border">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-1">
                Custom Education 4.0 Learning Path Blueprint
              </div>
              <div className="text-sm font-bold text-foreground mb-1">
                {mismatchReport.recommendedCourseTitle}
              </div>
              <p className="text-xs text-muted-foreground">{mismatchReport.recommendedSubtitle}</p>
            </div>

            {/* Action Button */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(2)}
                className="gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-take Diagnostic</span>
              </Button>

              <Button
                onClick={handleStartCourseDevelopment}
                className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                <span>Develop My Custom Course & Teach</span>
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: AUTONOMOUS COURSE & LESSON DEVELOPMENT IN PROGRESS                 */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center text-foreground animate-pulse">
                <Cpu className="w-8 h-8" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold">
                AI
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-foreground mb-1">
                Developing Your Custom Industry 4.0 Course...
              </h3>
              <p className="text-xs text-muted-foreground max-w-md">
                Our autonomous engine is generating production-grade starter code, multi-step typing timelines,
                AST evaluation specs, and conceptual checks tailored to your skill gap.
              </p>
            </div>

            {/* Synthesis Progress Items */}
            <div className="w-full max-w-md space-y-2.5 text-left text-xs">
              <div className="p-2.5 rounded-xl bg-secondary/40 border border-border flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-foreground/90">
                  Targeting skill gap: {mismatchReport?.primaryGapTag || 'FinTech Rails'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/40 border border-border flex items-center gap-2.5">
                {generationStepProgress >= 2 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                )}
                <span className="text-foreground/90">
                  Writing runnable M-Pesa / Cloud backend files & challenge evaluators...
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/40 border border-border flex items-center gap-2.5">
                {generationStepProgress >= 3 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin shrink-0" />
                )}
                <span className="text-foreground/90">
                  Synthesizing neural voice narration, on-screen cursor paths & subtitles...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: COURSE READY -> LAUNCH AND TEACH                                   */}
        {/* ========================================================================= */}
        {currentStep === 5 && synthesizedTrack && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                  Course Developed & Ready to Teach
                </span>
                <h3 className="text-base font-bold text-foreground mt-0.5">
                  {synthesizedTrack.title}
                </h3>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Your personalized curriculum has been synthesized based on your Education 4.0 baseline.
              Clicking below will launch the live interactive IDE where the AI instructor will immediately begin teaching the first module!
            </p>

            {/* Module Breakdown List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Generated Interactive Modules:
              </h4>
              {synthesizedTrack.nodes.map((node, index) => (
                <div
                  key={node.id}
                  className="p-3.5 rounded-xl bg-secondary/30 border border-border flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-secondary border border-border text-xs font-bold flex items-center justify-center shrink-0 text-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-foreground truncate">{node.title}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{node.description}</div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary border border-border text-foreground shrink-0">
                    {index === 0 ? 'Starts First' : 'Up Next'}
                  </span>
                </div>
              ))}
            </div>

            {/* Launch Action */}
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentStep(3)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ← Back to Mismatch Report
              </Button>

              <Button
                onClick={() => onCompleteOnboarding(synthesizedTrack)}
                className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Learning & Teach Me Now</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

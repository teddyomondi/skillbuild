import React, { useState, useRef } from 'react';
import {
  Upload,
  Sparkles,
  FileText,
  Cpu,
  Sigma,
  Code2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  School,
  Zap,
  Layers,
  ChevronDown,
  Info
} from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle.jsx';
import Logo from '@/components/notion-marketing/Logo.jsx';
import { UserButton } from '@clerk/clerk-react';
import Spinner from '@/components/ui/spinner.jsx';
import { Button } from '@/components/ui/button.jsx';
import { toast, Toaster } from 'sonner';
import {
  transformSyllabusToWorkspaceTrack,
  detectWorkspaceModality,
  PRELOADED_SYLLABUS_PRESETS
} from '@/services/syllabusEngine.js';
import { extractTextFromPdf } from '@/services/pdfParser.js';

export default function SyllabusEnginePage({
  onCourseGenerated,
  onBack
}) {
  const [institutionName, setInstitutionName] = useState('Stanford / Caltech STEM Creator');
  const [targetWorkspace, setTargetWorkspace] = useState('auto'); // 'auto' | 'code' | 'math' | 'circuit'
  const [experienceLevel, setExperienceLevel] = useState('intermediate');
  const [moduleCount, setModuleCount] = useState(3);
  const [syllabusText, setSyllabusText] = useState('');
  const [fileName, setFileName] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [extractedPreview, setExtractedPreview] = useState('');
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(null);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  const handlePdfUpload = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a PDF document.');
      return;
    }

    setPdfFile(file);
    setFileName(file.name);
    setIsProcessingPdf(true);
    setError(null);

    try {
      const text = await extractTextFromPdf(file);
      setExtractedPreview(text);
      if (!syllabusText) {
        setSyllabusText(text.slice(0, 3000));
      }
      toast.success(`Extracted syllabus from "${file.name}"`);
    } catch (err) {
      console.error('PDF text extraction error:', err);
      toast.error('Could not parse text from this PDF. You can paste the syllabus directly below.');
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const handleSelectPreset = (preset) => {
    setInstitutionName(preset.institution);
    setTargetWorkspace(preset.workspaceType);
    setSyllabusText(preset.syllabusSnippet);
    setFileName(`preset-${preset.id}.pdf`);
    setExtractedPreview(preset.syllabusSnippet);
    setPdfFile(null);
    toast.info(`Loaded sample syllabus: ${preset.title}`);
  };

  const handleTransformSyllabus = async () => {
    if (!syllabusText.trim() && !pdfFile) {
      toast.error('Please upload a syllabus PDF or paste syllabus text.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationStep({ step: 1, label: 'Initializing Autonomous Transformation Engine…' });

    try {
      const generatedTrack = await transformSyllabusToWorkspaceTrack({
        pdfFileOrBuffer: pdfFile,
        syllabusText,
        institutionName: institutionName.trim() || 'STEM Creator',
        targetWorkspace,
        experienceLevel,
        moduleCount,
        onProgress: (p) => setGenerationStep(p)
      });

      toast.success(`Workspace generated: "${generatedTrack.title}"!`);
      onCourseGenerated?.(generatedTrack);
    } catch (err) {
      console.error('Syllabus transformation failed:', err);
      setError(err.message || 'Transformation failed. Retrying with smart fallback…');
      toast.error('Syllabus generation encountered an issue.');
    } finally {
      setIsGenerating(false);
    }
  };

  const detectedType = detectWorkspaceModality(syllabusText || extractedPreview, targetWorkspace);

  return (
    <div className="min-h-screen bg-background dark:bg-[#151515] text-foreground flex flex-col font-sans transition-colors duration-200">
      <Toaster position="bottom-center" />

      {/* Top Header */}
      <header className="w-full border-b border-border/70 bg-background/80 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            Syllabus-to-Workspace Engine
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Button>
          <ModeToggle />
          <UserButton afterSignOutUrl="/welcome" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-10 flex flex-col gap-8">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary border border-border text-xs font-semibold text-foreground mb-1 shadow-xs">
            <School className="w-4 h-4 text-emerald-500" />
            <span>For Universities, Bootcamps, High Schools & STEM Creators</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Plug Your Syllabus into the Engine
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Automatically transform static curriculum PDFs into live, Socratic, cursor-guided workspaces:
            <span className="text-foreground font-semibold"> Code IDE</span>,
            <span className="text-foreground font-semibold"> Excalidraw Math Canvas</span>, or
            <span className="text-foreground font-semibold"> Embedded Wokwi / Circuit Canvas</span>.
          </p>
        </div>

        {/* Quick Sample Presets Strip */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            <span>Or Try an Instant Creator Syllabus Preset:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRELOADED_SYLLABUS_PRESETS.map((preset) => {
              const Icon = preset.workspaceType === 'circuit'
                ? Cpu
                : preset.workspaceType === 'math'
                ? Sigma
                : Code2;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  disabled={isGenerating}
                  className="p-3.5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-secondary/50 text-left transition shadow-xs flex flex-col justify-between group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-1.5 rounded-lg bg-secondary group-hover:bg-primary/10 text-foreground group-hover:text-primary transition">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground truncate">
                      {preset.domain}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-foreground line-clamp-1">
                    {preset.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    {preset.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Configuration Card */}
        <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          {/* 1. PDF Drag-and-Drop Zone */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              1. Upload Course / Lab Syllabus (PDF)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePdfUpload(f);
              }}
              className="hidden"
            />

            <div
              onClick={() => !isGenerating && !isProcessingPdf && fileInputRef.current?.click()}
              className={cn(
                "w-full py-8 px-6 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all",
                pdfFile
                  ? "border-emerald-500/60 bg-emerald-500/5"
                  : "border-border hover:border-primary/50 hover:bg-secondary/40 bg-secondary/20"
              )}
            >
              {isProcessingPdf ? (
                <div className="flex flex-col items-center gap-2">
                  <Spinner size="md" />
                  <span className="text-xs font-medium text-muted-foreground animate-pulse">
                    Parsing syllabus text and chapter headings from PDF…
                  </span>
                </div>
              ) : pdfFile ? (
                <div className="flex items-center gap-3">
                  <span className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-foreground">{fileName}</div>
                    <div className="text-xs text-muted-foreground">
                      {(pdfFile.size / 1024).toFixed(1)} KB • Click to choose a different PDF
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="h-10 w-10 rounded-xl bg-secondary text-muted-foreground flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </span>
                  <div className="text-sm font-semibold text-foreground">
                    Drop your syllabus PDF here, or click to browse
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Supports college syllabi, bootcamp roadmaps, lesson plans & lab guides
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Syllabus Outline Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                2. Syllabus Content & Learning Units
              </label>
              {extractedPreview && (
                <span className="text-[11px] text-muted-foreground font-mono">
                  {extractedPreview.split(/\s+/).length} words extracted
                </span>
              )}
            </div>
            <textarea
              rows={4}
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              placeholder="Paste units, chapters, learning goals, or lab tasks (e.g. Unit 1: GPIO & LED Blinking; Unit 2: Analog Sensors & PWM)..."
              className="w-full rounded-xl border border-border bg-secondary/40 p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono leading-relaxed"
            />
          </div>

          {/* 3. Institution, Domain & Target Workspace Selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Institution / Creator Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                School / Creator Name
              </label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="e.g. Caltech Robotics, Moringa School"
                className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            {/* Target Workspace Modality */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Target Workspace
              </label>
              <select
                value={targetWorkspace}
                onChange={(e) => setTargetWorkspace(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary/60 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="auto">✨ Auto-Detect with AI (Recommended)</option>
                <option value="code">💻 Code IDE (Software & Full-Stack)</option>
                <option value="math">📐 Excalidraw Math Canvas</option>
                <option value="circuit">⚡ Embedded Wokwi / Circuit Canvas</option>
              </select>
            </div>

            {/* Target Experience Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Learner Experience
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary/60 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="beginner">Beginner (Foundations & Gentle Hints)</option>
                <option value="intermediate">Intermediate (Standard Curriculum)</option>
                <option value="advanced">Advanced (Industry Rigor & Edge Cases)</option>
              </select>
            </div>
          </div>

          {/* Modality Badge Callout */}
          <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                {detectedType === 'circuit' ? (
                  <Cpu className="w-4 h-4" />
                ) : detectedType === 'math' ? (
                  <Sigma className="w-4 h-4" />
                ) : (
                  <Code2 className="w-4 h-4" />
                )}
              </span>
              <div>
                <span className="font-semibold text-foreground">
                  {detectedType === 'circuit'
                    ? 'Target Workspace: Embedded Wokwi / Circuit Canvas'
                    : detectedType === 'math'
                    ? 'Target Workspace: Excalidraw Math Whiteboard Canvas'
                    : 'Target Workspace: Live Socratic Code IDE'}
                </span>
                <span className="text-muted-foreground block text-[11px]">
                  {detectedType === 'circuit'
                    ? 'Includes interactive Arduino/ESP32 microcontroller, breadboard, virtual pins, LED/Servo, and live UART Serial Monitor.'
                    : detectedType === 'math'
                    ? 'Includes infinite Excalidraw digital whiteboard, vector arrow tools, coordinate geometry, and formula checkers.'
                    : 'Includes Monaco editor, virtual filesystem, live browser preview, and Scrimba code-typing timelines.'}
                </span>
              </div>
            </div>

            <span className="text-[11px] font-semibold uppercase px-2.5 py-1 rounded-md bg-secondary border border-border shrink-0">
              {detectedType}
            </span>
          </div>

          {/* Multi-step progress indicator when generating */}
          {isGenerating && generationStep && (
            <div className="p-4 rounded-xl border border-primary/40 bg-primary/5 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-primary flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>Step {generationStep.step} of 4: {generationStep.label}</span>
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {Math.round((generationStep.step / 4) * 100)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  style={{ width: `${(generationStep.step / 4) * 100}%` }}
                  className="h-full bg-primary transition-all duration-300"
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive font-medium">{error}</p>
          )}

          {/* Action Trigger */}
          <div className="pt-2 flex items-center justify-between border-t border-border/80">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              disabled={isGenerating}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>

            <Button
              size="lg"
              onClick={handleTransformSyllabus}
              disabled={isGenerating || isProcessingPdf || (!syllabusText.trim() && !pdfFile)}
              className="gap-2 font-semibold shadow-md px-6"
            >
              {isGenerating ? (
                <>
                  <Spinner size="sm" />
                  <span>Transforming Syllabus…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Convert Syllabus into Live Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

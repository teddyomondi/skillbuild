import React, { useState, useRef } from 'react';
import {
  Upload,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles
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
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fileName, setFileName] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [syllabusText, setSyllabusText] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [targetWorkspace, setTargetWorkspace] = useState('auto');
  const [institutionName, setInstitutionName] = useState('STEM Creator / School');
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const processPdfFile = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('PDF files only.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setFileName(file.name);
    setPdfFile(file);
    setSelectedPresetId(null);

    try {
      const extractedText = await extractTextFromPdf(file);
      setSyllabusText(extractedText);
    } catch (err) {
      console.error('Failed to parse syllabus PDF:', err);
      setError('Could not process this PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setFileName(`${preset.id}.pdf`);
    setPdfFile(null);
    setSyllabusText(preset.syllabusSnippet);
    setInstitutionName(preset.institution);
    setTargetWorkspace(preset.workspaceType);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!syllabusText.trim() && !pdfFile) {
      setError('Please upload a syllabus PDF or select a preset.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const generatedTrack = await transformSyllabusToWorkspaceTrack({
        pdfFileOrBuffer: pdfFile,
        syllabusText,
        institutionName: institutionName.trim() || 'STEM Creator',
        targetWorkspace,
        moduleCount: 3
      });

      toast.success(`Generated: ${generatedTrack.title}`);
      onCourseGenerated?.(generatedTrack);
    } catch (err) {
      console.error('Syllabus generation error:', err);
      setError('Generation failed. Retrying with fallback template...');
    } finally {
      setIsGenerating(false);
    }
  };

  const detectedType = detectWorkspaceModality(syllabusText, targetWorkspace);

  return (
    <div className="min-h-screen bg-background dark:bg-[#191919] text-foreground flex flex-col font-sans transition-colors duration-200">
      <Toaster position="bottom-center" />

      {/* Top Header */}
      <header className="w-full border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-20 px-6 py-3.5 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <ModeToggle />
          <UserButton afterSignOutUrl="/welcome" />
        </div>
      </header>

      {/* Main Upload Canvas */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-lg flex flex-col items-center">
          {/* Quick Presets Selector Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {PRELOADED_SYLLABUS_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                disabled={isGenerating}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                  selectedPresetId === preset.id
                    ? 'bg-foreground text-background shadow-xs'
                    : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                }`}
              >
                {preset.workspaceType === 'circuit' ? '⚡ ' : preset.workspaceType === 'math' ? '📐 ' : '💻 '}
                {preset.title.split(':')[0]}
              </button>
            ))}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => {
              const file = e.target?.files?.[0];
              if (file) processPdfFile(file);
            }}
            className="hidden"
          />

          {/* Dotted Upload Card */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer?.files?.[0];
              if (file) processPdfFile(file);
            }}
            onClick={() => !isProcessing && !isGenerating && fileInputRef.current?.click()}
            className={`w-full aspect-[4/3] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : fileName
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-border/80 hover:border-primary/50 hover:bg-card/60 bg-card/30'
            }`}
          >
            {isProcessing || isGenerating ? (
              <div className="flex flex-col items-center gap-3">
                <Spinner size="lg" />
                <span className="text-sm font-medium text-muted-foreground animate-pulse">
                  {isGenerating ? 'Transforming into live Socratic workspace...' : 'Analyzing syllabus PDF...'}
                </span>
              </div>
            ) : fileName ? (
              <div className="flex flex-col items-center gap-3">
                <span className="h-16 w-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8" strokeWidth={1.8} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">{fileName}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Target: <strong className="text-foreground capitalize">{detectedType}</strong> workspace • Click to change
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 group">
                <span className="h-16 w-16 rounded-2xl bg-secondary group-hover:bg-primary/10 text-foreground group-hover:text-primary flex items-center justify-center transition-colors">
                  <Upload className="h-7 w-7" strokeWidth={1.8} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Upload Syllabus</h2>
                  <p className="text-xs text-muted-foreground mt-1">PDF or select a preset</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-destructive mt-3 font-medium">{error}</p>
          )}

          {/* Action Buttons */}
          <div className="w-full mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              disabled={isGenerating}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>

            {fileName && !isProcessing && (
              <Button
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Spinner size="sm" />
                    <span>Building Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Build Live Workspace</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

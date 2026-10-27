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
  School,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import Spinner from '@/components/ui/spinner.jsx';
import { toast } from 'sonner';
import {
  transformSyllabusToWorkspaceTrack,
  detectWorkspaceModality,
  PRELOADED_SYLLABUS_PRESETS
} from '@/services/syllabusEngine.js';
import { extractTextFromPdf } from '@/services/pdfParser.js';

export default function SyllabusImportModal({
  isOpen,
  onClose,
  onCourseGenerated
}) {
  const [institutionName, setInstitutionName] = useState('STEM Creator / Academy');
  const [targetWorkspace, setTargetWorkspace] = useState('auto');
  const [syllabusText, setSyllabusText] = useState('');
  const [fileName, setFileName] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(null);

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

    try {
      const text = await extractTextFromPdf(file);
      if (!syllabusText) {
        setSyllabusText(text.slice(0, 3000));
      }
      toast.success(`Parsed syllabus from "${file.name}"`);
    } catch (err) {
      console.error('PDF extraction error:', err);
      toast.error('Could not parse PDF text.');
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const handleSelectPreset = (preset) => {
    setInstitutionName(preset.institution);
    setTargetWorkspace(preset.workspaceType);
    setSyllabusText(preset.syllabusSnippet);
    setFileName(`sample-${preset.id}.pdf`);
    toast.info(`Loaded preset: ${preset.title}`);
  };

  const handleTransform = async () => {
    if (!syllabusText.trim() && !pdfFile) {
      toast.error('Upload a syllabus PDF or enter syllabus text.');
      return;
    }

    setIsGenerating(true);
    try {
      const generatedTrack = await transformSyllabusToWorkspaceTrack({
        pdfFileOrBuffer: pdfFile,
        syllabusText,
        institutionName: institutionName.trim() || 'STEM Creator',
        targetWorkspace,
        moduleCount: 3,
        onProgress: (p) => setGenerationStep(p)
      });

      toast.success(`Generated workspace for "${generatedTrack.title}"!`);
      onCourseGenerated?.(generatedTrack);
      onClose();
    } catch (err) {
      console.error('Syllabus import error:', err);
      toast.error('Transformation error. Using fallback track.');
    } finally {
      setIsGenerating(false);
    }
  };

  const detectedType = detectWorkspaceModality(syllabusText, targetWorkspace);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border p-6 font-sans">
        <DialogHeader className="border-b border-border/70 pb-3">
          <div className="flex items-center gap-2 text-primary">
            <School className="w-5 h-5 text-emerald-500" />
            <DialogTitle className="text-lg font-bold">Plug Syllabus into Engine</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Turn static PDF syllabi from schools, bootcamps, and STEM creators into live, Socratic, cursor-guided workspaces (Code IDE, Excalidraw Math, or Embedded Wokwi Circuit Canvas).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Quick Preset Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {PRELOADED_SYLLABUS_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className="px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-foreground text-[11px] font-medium border border-border transition"
                >
                  {p.workspaceType === 'circuit' ? '⚡ ' : p.workspaceType === 'math' ? '📐 ' : '💻 '}
                  {p.title.split(':')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* PDF Drag / Drop Box */}
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
            className="w-full py-5 px-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-secondary/30 flex flex-col items-center justify-center text-center cursor-pointer transition"
          >
            {isProcessingPdf ? (
              <div className="flex items-center gap-2">
                <Spinner size="sm" />
                <span className="text-xs text-muted-foreground animate-pulse">Extracting text from PDF…</span>
              </div>
            ) : pdfFile ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold text-foreground">{fileName}</span>
                <span className="text-[10px] text-muted-foreground">• Click to replace</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Upload className="w-4 h-4" />
                <span className="text-xs font-medium">Upload syllabus PDF (or paste text below)</span>
              </div>
            )}
          </div>

          {/* Syllabus Outline Textarea */}
          <textarea
            rows={3}
            value={syllabusText}
            onChange={(e) => setSyllabusText(e.target.value)}
            placeholder="Paste syllabus text, units, or weekly topics..."
            className="w-full rounded-lg border border-border bg-secondary/40 p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-mono"
          />

          {/* Controls: Name & Target */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                School / Creator Name
              </label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full rounded-md border border-border bg-secondary/40 px-2.5 py-1.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Workspace Type
              </label>
              <select
                value={targetWorkspace}
                onChange={(e) => setTargetWorkspace(e.target.value)}
                className="w-full rounded-md border border-border bg-secondary/60 px-2.5 py-1.5 text-xs text-foreground"
              >
                <option value="auto">✨ Auto-Detect with AI</option>
                <option value="code">💻 Code IDE</option>
                <option value="math">📐 Excalidraw Math Canvas</option>
                <option value="circuit">⚡ Embedded Wokwi / Circuit Canvas</option>
              </select>
            </div>
          </div>

          {/* Target preview indicator */}
          <div className="p-2.5 rounded-lg bg-secondary/50 border border-border/80 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Detected Modality: <strong className="text-foreground capitalize">{detectedType}</strong>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
              {detectedType === 'circuit' ? 'Microcontroller + Breadboard' : detectedType === 'math' ? 'Excalidraw Whiteboard' : 'Monaco Code Editor'}
            </span>
          </div>

          {/* Progress */}
          {isGenerating && generationStep && (
            <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 flex items-center gap-2 text-xs text-primary">
              <Spinner size="sm" />
              <span>Step {generationStep.step} of 4: {generationStep.label}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleTransform} disabled={isGenerating || (!syllabusText.trim() && !pdfFile)} className="gap-1.5 font-semibold">
            {isGenerating ? (
              <>
                <Spinner size="sm" />
                <span>Transforming…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Convert to Live Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

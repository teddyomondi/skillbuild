import React, { useState, useRef } from 'react';
import { Upload, CheckCircle2, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Label } from '@/components/ui/label.jsx';
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
  const [syllabusText, setSyllabusText] = useState('');
  const [fileName, setFileName] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const fileInputRef = useRef(null);

  const handlePdfUpload = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('PDF files only.');
      return;
    }

    setPdfFile(file);
    setFileName(file.name);
    setSelectedPresetId(null);
    setIsProcessing(true);

    try {
      const text = await extractTextFromPdf(file);
      setSyllabusText(text);
    } catch (err) {
      console.error('PDF parse error:', err);
      toast.error('Could not parse PDF text.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setFileName(`${preset.id}.pdf`);
    setPdfFile(null);
    setSyllabusText(preset.syllabusSnippet);
  };

  const handleGenerate = async () => {
    if (!syllabusText.trim() && !pdfFile) {
      toast.error('Upload a syllabus PDF or select a preset.');
      return;
    }

    setIsGenerating(true);
    try {
      const track = await transformSyllabusToWorkspaceTrack({
        pdfFileOrBuffer: pdfFile,
        syllabusText,
        institutionName: 'STEM Creator',
        targetWorkspace: 'auto',
        moduleCount: 3
      });

      toast.success(`Generated: ${track.title}`);
      onCourseGenerated?.(track);
      onClose();
    } catch (err) {
      console.error('Syllabus import error:', err);
      toast.error('Transformation error. Using fallback track.');
    } finally {
      setIsGenerating(false);
    }
  };

  const detectedType = detectWorkspaceModality(syllabusText, 'auto');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="border-b pb-3">
          <h2 className="text-xl font-semibold">Plug Syllabus</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Turn static PDFs into live, Socratic, cursor-guided workspaces
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Presets */}
          <div className="flex flex-wrap items-center gap-2">
            {PRELOADED_SYLLABUS_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  selectedPresetId === preset.id
                    ? 'bg-foreground text-background shadow-xs'
                    : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                }`}
              >
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
              if (file) handlePdfUpload(file);
            }}
            className="hidden"
          />

          <div
            onClick={() => !isProcessing && !isGenerating && fileInputRef.current?.click()}
            className={`w-full py-8 px-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              fileName
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-border/80 hover:border-primary/50 hover:bg-card/60 bg-card/30'
            }`}
          >
            {isProcessing || isGenerating ? (
              <div className="flex flex-col items-center gap-2">
                <Spinner size="md" />
                <span className="text-xs text-muted-foreground animate-pulse">
                  {isGenerating ? 'Building live workspace...' : 'Analyzing PDF...'}
                </span>
              </div>
            ) : fileName ? (
              <div className="flex flex-col items-center gap-2">
                <span className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <span className="text-sm font-semibold">{fileName}</span>
                <span className="text-xs text-muted-foreground">Target: {detectedType} workspace</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="h-10 w-10 rounded-xl bg-secondary text-foreground flex items-center justify-center">
                  <Upload className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <span className="text-sm font-semibold">Upload Syllabus PDF</span>
                <span className="text-xs text-muted-foreground">PDF only</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>

          {fileName && !isProcessing && (
            <Button size="sm" onClick={handleGenerate} disabled={isGenerating} className="gap-1.5">
              {isGenerating ? (
                <>
                  <Spinner size="sm" />
                  <span>Building...</span>
                </>
              ) : (
                <>
                  <span>Build Live Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

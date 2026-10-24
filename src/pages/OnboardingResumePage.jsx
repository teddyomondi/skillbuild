import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle.jsx';
import Logo from '@/components/notion-marketing/Logo.jsx';
import { UserButton } from '@clerk/clerk-react';
import Spinner from '@/components/ui/spinner.jsx';
import { Button } from '@/components/ui/button.jsx';
import { extractTextFromPdf } from '@/services/pdfParser.js';
import { parseResumeWithAi, saveOnboardingData } from '@/services/adaptiveOnboardingEngine.js';

export default function OnboardingResumePage({ onNext, initialData = {} }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileData, setFileData] = useState(() => initialData.resumeData || null);
  const [fileName, setFileName] = useState(() => initialData.resumeFileName || '');
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

    try {
      const extractedText = await extractTextFromPdf(file);
      const parsedResume = await parseResumeWithAi(extractedText);

      setFileData(parsedResume);
      await saveOnboardingData({
        resumeData: parsedResume,
        resumeFileName: file.name,
        resumeTextSnippet: extractedText.slice(0, 500)
      });
    } catch (err) {
      console.error('Failed to process resume PDF:', err);
      setError('Could not process this PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      processPdfFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target?.files;
    if (files && files.length > 0) {
      processPdfFile(files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-[#191919] text-foreground flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full border-b border-border/60 bg-background/80 backdrop-blur-md sticky top-0 z-20 px-6 py-3.5 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">Step 1 of 3</span>
          <ModeToggle />
          <UserButton afterSignOutUrl="/welcome" />
        </div>
      </header>

      {/* Main Empty / Dotted Upload Canvas */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-lg flex flex-col items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`w-full aspect-[4/3] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : fileData
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-border/80 hover:border-primary/50 hover:bg-card/60 bg-card/30'
            }`}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3">
                <Spinner size="lg" />
                <span className="text-sm font-medium text-muted-foreground animate-pulse">
                  Analyzing resume with AI...
                </span>
              </div>
            ) : fileData ? (
              <div className="flex flex-col items-center gap-3">
                <span className="h-16 w-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8" strokeWidth={1.8} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">{fileName || 'Resume Uploaded'}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fileData.skills?.length || 0} skills detected • Click to change
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 group">
                <span className="h-16 w-16 rounded-2xl bg-secondary group-hover:bg-primary/10 text-foreground group-hover:text-primary flex items-center justify-center transition-colors">
                  <Upload className="h-7 w-7" strokeWidth={1.8} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Upload Resume</h2>
                  <p className="text-xs text-muted-foreground mt-1">PDF only</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-destructive mt-3 font-medium">{error}</p>
          )}

          {fileData && !isProcessing && (
            <div className="w-full mt-6 flex justify-end">
              <Button size="lg" onClick={onNext} className="gap-2">
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

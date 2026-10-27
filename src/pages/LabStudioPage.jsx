import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import {
  Mic,
  MicOff,
  Play,
  Square,
  Sparkles,
  Code2,
  Sigma,
  Cpu,
  Radio,
  Share2,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Terminal,
  BookmarkCheck,
  ArrowLeft,
  Eye,
  FileCode,
  Layers,
  Wand2,
  FastForward,
  RotateCcw,
  Volume2,
  Copy,
  Download
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import Spinner from '@/components/ui/spinner.jsx';
import AiScreenCursor from '@/components/AiScreenCursor.jsx';
import {
  STEM_DOMAINS,
  createRecordingSession,
  startStudioVoiceCapture,
  analyzeCodeAst,
  synthesizeLabFromRecording,
  compileStudioAstEvaluator
} from '@/services/labStudioEngine.js';
import { runCodeInWorkspace } from '@/services/runtimeEngine.js';
import { navigateToRoute, buildCourseTrackRoute } from '@/services/routeManager.js';

const Editor = lazy(() => import('@monaco-editor/react'));

export default function LabStudioPage({
  tracks = [],
  setTracks,
  onBackToCourses,
  onLaunchLesson
}) {
  // Domain selection (coding, mathematics, pcb, iot)
  const [domain, setDomain] = useState('coding');
  const activePreset = STEM_DOMAINS[domain] || STEM_DOMAINS.coding;

  // Lab metadata
  const [labTitle, setLabTitle] = useState(activePreset.sampleTitle);
  const [labCategory, setLabCategory] = useState(activePreset.label);
  const [labConcept, setLabConcept] = useState(activePreset.sampleConcept);
  const [activeFile, setActiveFile] = useState(activePreset.entryFile);

  // Active files in editor
  const [files, setFiles] = useState({
    [activePreset.entryFile]: activePreset.starterCode
  });

  // Keep track of solution code (can be toggled or typed)
  const [solutionCode, setSolutionCode] = useState(activePreset.solutionCode);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcripts, setTranscripts] = useState([]);
  const [liveInterimText, setLiveInterimText] = useState('');
  const [timelineSnapshots, setTimelineSnapshots] = useState([]);
  const [challengeStopOffset, setChallengeStopOffset] = useState(null);

  // Studio Mode: 'author' (editing & recording) | 'preview' (learner playback) | 'rubric' (AST & Socratic inspect)
  const [studioMode, setStudioMode] = useState('author');

  // AI Synthesis State
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisProgress, setSynthesisProgress] = useState(null);
  const [synthesizedLab, setSynthesizedLab] = useState(null);

  // Preview Playback State
  const [previewStepIndex, setPreviewStepIndex] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewHighlightLine, setPreviewHighlightLine] = useState(1);
  const [aiCursorState, setAiCursorState] = useState({
    visible: false,
    x: 420,
    y: 280,
    label: 'AI Instructor',
    sublabel: '',
    mode: 'glide',
    variant: 'teach'
  });

  // Terminal & Runtime
  const [terminalOutput, setTerminalOutput] = useState('');
  const [isRunningCode, setIsRunningCode] = useState(false);

  // Test Submission / Evaluator Sandbox
  const [testSubmissionCode, setTestSubmissionCode] = useState('');
  const [evaluationResult, setEvaluationResult] = useState(null);

  // Active Left Tab
  const [leftTab, setLeftTab] = useState('spec'); // 'spec' | 'transcript' | 'rubric' | 'ast'

  // Refs
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const speechRecognizerRef = useRef(null);
  const recordingStartTimeRef = useRef(0);
  const previewTimerRef = useRef(null);

  // Handle Domain Switch
  const handleDomainChange = (newDomain) => {
    if (isRecording) {
      toast.warning('Stop active recording before changing STEM domain.');
      return;
    }
    const preset = STEM_DOMAINS[newDomain] || STEM_DOMAINS.coding;
    setDomain(newDomain);
    setLabTitle(preset.sampleTitle);
    setLabCategory(preset.label);
    setLabConcept(preset.sampleConcept);
    setActiveFile(preset.entryFile);
    setFiles({ [preset.entryFile]: preset.starterCode });
    setSolutionCode(preset.solutionCode);
    setSynthesizedLab(null);
    setTranscripts([]);
    setTimelineSnapshots([]);
    setChallengeStopOffset(null);
    setTerminalOutput('');
    toast.info(`Switched to ${preset.label} Studio preset.`);
  };

  // Start / Stop Recording
  const handleStartRecording = () => {
    recordingStartTimeRef.current = Date.now();
    setIsRecording(true);
    setRecordingSeconds(0);
    setTranscripts([]);
    setTimelineSnapshots([
      {
        offsetMs: 0,
        file: activeFile,
        code: files[activeFile] || '',
        highlightLine: 1,
        note: 'Recording started'
      }
    ]);
    setChallengeStopOffset(null);

    // Recording timer
    clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    // Live speech capture
    speechRecognizerRef.current = startStudioVoiceCapture({
      onTranscript: ({ text, isFinal }) => {
        if (!text) return;
        if (isFinal) {
          const offsetMs = Date.now() - recordingStartTimeRef.current;
          setTranscripts((prev) => [...prev, { offsetMs, text }]);
          setLiveInterimText('');
        } else {
          setLiveInterimText(text);
        }
      },
      onError: (err) => {
        console.warn('Speech capture notice:', err);
      }
    });

    toast.success('🔴 Recording started! Speak out loud while solving on screen.');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    clearInterval(timerIntervalRef.current);
    try {
      speechRecognizerRef.current?.stop?.();
    } catch {
      // Ignore
    }

    // Add final snapshot
    const offsetMs = Date.now() - recordingStartTimeRef.current;
    setTimelineSnapshots((prev) => [
      ...prev,
      {
        offsetMs,
        file: activeFile,
        code: files[activeFile] || '',
        highlightLine: editorRef.current?.getPosition?.()?.lineNumber || 1,
        note: 'Recording finished'
      }
    ]);

    toast.info('Recording stopped. Ready to synthesize Socratic challenge!');
  };

  // Mark Challenge Stop (Handoff point where student takes over)
  const handleMarkChallengeStop = () => {
    const offsetMs = Date.now() - (recordingStartTimeRef.current || Date.now());
    setChallengeStopOffset(offsetMs);
    toast.success(`Handoff Challenge Stop set at ${Math.round(offsetMs / 1000)}s!`);
  };

  // Run Code in Workspace
  const handleRunCode = async (overrideCode = null) => {
    setIsRunningCode(true);
    setTerminalOutput('');
    const codeToRun = overrideCode !== null ? overrideCode : (files[activeFile] || '');
    const workspaceFiles = {
      ...files,
      [activeFile]: codeToRun
    };

    try {
      const output = await runCodeInWorkspace(workspaceFiles, activeFile, (chunk) => {
        setTerminalOutput((prev) => prev + chunk);
      });
      setIsRunningCode(false);
      return output;
    } catch (err) {
      setTerminalOutput((prev) => prev + `\nExecution Error: ${err.message}`);
      setIsRunningCode(false);
      return err.message;
    }
  };

  // Synthesize Socratic Lab with AI
  const handleSynthesizeLab = async () => {
    setIsSynthesizing(true);
    setSynthesisProgress({ step: 1, label: 'Compiling AST & Keystroke timeline...' });

    // Ensure we have run code at least once to capture runtime stdout
    let out = terminalOutput;
    if (!out) {
      out = await handleRunCode(files[activeFile] || solutionCode);
    }

    const session = {
      domain,
      title: labTitle,
      entryFile: activeFile,
      starterCode: activePreset.starterCode,
      finalCode: files[activeFile] || solutionCode,
      transcripts: transcripts.length > 0 ? transcripts : [
        { offsetMs: 0, text: `Let's solve ${labTitle}. We examine the starter problem and build the complete logic step by step.` }
      ],
      snapshots: timelineSnapshots,
      challengeStopOffset: challengeStopOffset || (recordingSeconds * 1000 * 0.8),
      lastTerminalOutput: out
    };

    try {
      const result = await synthesizeLabFromRecording({
        session,
        onProgress: (p) => setSynthesisProgress(p)
      });

      setSynthesizedLab(result);
      setTestSubmissionCode(result.initialFiles?.[activeFile] || activePreset.starterCode);
      setLeftTab('rubric');
      setIsSynthesizing(false);
      toast.success('⚡ Socratic Lab synthesized successfully with AST Validator!');
    } catch (err) {
      console.error('Synthesis error:', err);
      setIsSynthesizing(false);
      toast.error(`Synthesis failed: ${err.message}`);
    }
  };

  // Playback Preview Scrimba Timeline
  const startPreviewPlayback = () => {
    if (!synthesizedLab?.aiTimeline?.length) {
      toast.warning('Synthesize the lab first before previewing.');
      return;
    }

    setStudioMode('preview');
    setIsPlayingPreview(true);
    setPreviewStepIndex(0);

    const timeline = synthesizedLab.aiTimeline;
    let step = 0;

    const playNextStep = () => {
      if (step >= timeline.length) {
        setIsPlayingPreview(false);
        setAiCursorState((prev) => ({ ...prev, visible: false }));
        toast.info('Reached Challenge Stop! Handed off to learner.');
        return;
      }

      const currentStep = timeline[step];
      setPreviewStepIndex(step);
      setPreviewHighlightLine(currentStep.highlightLine || 1);

      // Glide AI Cursor to line
      if (editorRef.current) {
        const top = editorRef.current.getTopForLineNumber(currentStep.highlightLine || 1);
        const editorDom = editorRef.current.getDomNode();
        const rect = editorDom?.getBoundingClientRect() || { top: 220, left: 450 };

        setAiCursorState({
          visible: true,
          x: rect.left + 140,
          y: Math.max(160, rect.top + (top || 40) - 20),
          label: currentStep.isChallengeStop ? 'Your Turn (Challenge Stop)' : currentStep.narration.slice(0, 36) + '…',
          variant: currentStep.isChallengeStop ? 'handoff' : 'teach',
          mode: 'glide'
        });
      }

      // Update code snapshot
      if (currentStep.codeSnapshot) {
        setFiles((prev) => ({
          ...prev,
          [activeFile]: currentStep.codeSnapshot
        }));
      }

      // Speak narration if speech synthesis available
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && currentStep.narration) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(currentStep.narration);
          utterance.rate = 1.05;
          window.speechSynthesis.speak(utterance);
        } catch {
          // ignore audio failure
        }
      }

      step++;
      const nextDelay = currentStep.isChallengeStop ? 4500 : 3800;
      previewTimerRef.current = setTimeout(playNextStep, nextDelay);
    };

    playNextStep();
  };

  const stopPreviewPlayback = () => {
    setIsPlayingPreview(false);
    clearTimeout(previewTimerRef.current);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setAiCursorState((prev) => ({ ...prev, visible: false }));
  };

  // Test Student Submission against AST & Runtime Validator
  const handleTestEvaluation = async (codeToTest) => {
    if (!synthesizedLab?.challengeSpec) {
      toast.warning('Please synthesize the lab first to build the AST Validator.');
      return;
    }

    const testCode = codeToTest || testSubmissionCode || files[activeFile] || '';
    const runtimeOut = await handleRunCode(testCode);

    const evaluator = synthesizedLab.challengeSpec.evaluateSubmission ||
      compileStudioAstEvaluator(synthesizedLab.challengeSpec);

    const result = evaluator(testCode, runtimeOut);
    setEvaluationResult(result);

    if (result.passed) {
      toast.success('✅ Passed all AST and Runtime checks!');
    } else {
      toast.error(`❌ AST Check Failed: ${result.socraticHint || 'Check solution'}`);
    }
  };

  // Publish to Course Tracks
  const handlePublishToCourses = () => {
    const labToPublish = synthesizedLab || {
      id: `lab-${Date.now()}`,
      title: labTitle,
      category: labCategory,
      conceptTag: labConcept,
      domain,
      description: `Hands-on ${labCategory} lab built with Lab Studio.`,
      targetFile: activeFile,
      initialFiles: files,
      solutionFiles: { [activeFile]: solutionCode },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: `Welcome to this challenge on ${labTitle}!`,
          file: activeFile,
          highlightLine: 2,
          codeSnapshot: files[activeFile]
        },
        {
          timeOffset: 4000,
          narration: `Now solve the problem and test your submission!`,
          file: activeFile,
          highlightLine: 6,
          isChallengeStop: true,
          codeSnapshot: files[activeFile]
        }
      ],
      challengeSpec: {
        prompt: `Implement the required logic in ${activeFile}.`,
        targetFile: activeFile,
        conceptsTested: [labConcept],
        socraticHint: 'Review the function signature and required return value.',
        socraticPraise: 'Great job completing this lab!'
      }
    };

    // Attach to existing track or create a dedicated Custom STEM Labs track
    const targetTrackId = domain === 'mathematics' ? 'mathematics' : 'custom-stem-studio';
    let trackExists = tracks.some((t) => t.id === targetTrackId);

    let updatedTracks;
    if (trackExists) {
      updatedTracks = tracks.map((track) => {
        if (track.id === targetTrackId) {
          return {
            ...track,
            nodes: [...track.nodes.filter((n) => n.id !== labToPublish.id), labToPublish]
          };
        }
        return track;
      });
    } else {
      const newTrack = {
        id: targetTrackId,
        title: 'Creator Studio Labs (STEM Challenges)',
        subtitle: 'Community & Instructor Built Interactive Challenges',
        icon: 'Sparkles',
        nodes: [labToPublish]
      };
      updatedTracks = [newTrack, ...tracks];
    }

    setTracks?.(updatedTracks);
    toast.success(`🎉 Lab "${labTitle}" published to courses!`);

    // Prompt user to launch
    setTimeout(() => {
      onLaunchLesson?.(targetTrackId, labToPublish);
    }, 800);
  };

  // Export JSON
  const handleExportJson = () => {
    const exportData = synthesizedLab || {
      title: labTitle,
      domain,
      files,
      solutionCode,
      transcripts
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(jsonStr);
      toast.success('📋 Lab JSON copied to clipboard!');
    }
  };

  // Format seconds as mm:ss
  const formattedTime = useMemo(() => {
    const mins = Math.floor(recordingSeconds / 60);
    const secs = recordingSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [recordingSeconds]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerIntervalRef.current);
      clearTimeout(previewTimerRef.current);
      try {
        speechRecognizerRef.current?.stop?.();
      } catch {
        // ignore
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#121214] text-neutral-100 font-sans">
      <Toaster position="top-right" richColors />

      {/* Floating AI Cursor for Scrimba Playback Preview */}
      <AiScreenCursor
        cursorState={aiCursorState}
        isAiSpeaking={isPlayingPreview}
        interactionMode={isPlayingPreview ? 'AI_STREAMING' : 'STUDENT_CHALLENGE'}
      />

      {/* TOP STUDIO TOOLBAR */}
      <header className="h-14 border-b border-neutral-800 bg-[#16161a] px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToCourses}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/80 rounded-md transition"
            title="Return to LMS Courses"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Courses</span>
          </button>

          <div className="h-5 w-px bg-neutral-800" />

          {/* Studio Brand Pill */}
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-sm font-bold tracking-tight text-neutral-200">
              LAB STUDIO
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30">
              10-Min Creator Engine
            </span>
          </div>

          <div className="h-5 w-px bg-neutral-800" />

          {/* STEM Domain Selector Pills */}
          <div className="flex items-center gap-1 bg-[#101012] p-0.5 rounded-lg border border-neutral-800">
            {Object.values(STEM_DOMAINS).map((d) => {
              const isSelected = domain === d.id;
              const IconComp = d.id === 'coding' ? Code2 : d.id === 'mathematics' ? Sigma : d.id === 'pcb' ? Cpu : Radio;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleDomainChange(d.id)}
                  disabled={isRecording}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition ${
                    isSelected
                      ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{d.label.split('&')[0].trim()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Live Recording Controls */}
        <div className="flex items-center gap-2">
          {!isRecording ? (
            <button
              type="button"
              onClick={handleStartRecording}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40 transition"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Record Challenge (Voice + Keystrokes)</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-rose-950/40 border border-rose-500/40 px-3 py-1 rounded-md">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-mono font-bold text-rose-300">
                REC {formattedTime}
              </span>

              <button
                type="button"
                onClick={handleMarkChallengeStop}
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition ml-2"
                title="Mark the moment instructor stops and student begins"
              >
                <BookmarkCheck className="w-3 h-3" />
                <span>Mark Handoff Stop</span>
              </button>

              <button
                type="button"
                onClick={handleStopRecording}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded bg-neutral-800 text-neutral-100 hover:bg-neutral-700 transition ml-1"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Finish</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Actions: Synthesize, Preview, Publish */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSynthesizeLab}
            disabled={isSynthesizing || isRecording}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              isSynthesizing
                ? 'bg-amber-600/50 text-amber-200 cursor-wait'
                : 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-950/50'
            }`}
          >
            {isSynthesizing ? (
              <>
                <Spinner size="xs" />
                <span>Synthesizing Rubric…</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                <span>AI Socratic Synthesis</span>
              </>
            )}
          </button>

          {!isPlayingPreview ? (
            <button
              type="button"
              onClick={startPreviewPlayback}
              disabled={!synthesizedLab}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition ${
                synthesizedLab
                  ? 'border-sky-500/50 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20'
                  : 'border-neutral-800 text-neutral-600 cursor-not-allowed'
              }`}
              title="Preview with Scrimba player and AI Cursor"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview as Learner</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopPreviewPlayback}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-sky-600 text-white hover:bg-sky-500 transition"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Preview</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 rounded-md border border-neutral-800 transition"
            title="Export full Scrimba JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            type="button"
            onClick={handlePublishToCourses}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Publish Lab</span>
          </button>
        </div>
      </header>

      {/* MAIN 3-PANEL STUDIO WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* PANEL 1: SPEC, LIVE MIC TRANSCRIPT & SOCRATIC RUBRIC */}
        <section className="w-80 border-r border-neutral-800 bg-[#141417] flex flex-col shrink-0">
          {/* Tab Header */}
          <div className="flex items-center border-b border-neutral-800 bg-[#16161a] p-1 gap-1 text-xs">
            <button
              type="button"
              onClick={() => setLeftTab('spec')}
              className={`flex-1 py-1.5 px-2 rounded font-medium text-center transition ${
                leftTab === 'spec'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Problem Spec
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('transcript')}
              className={`flex-1 py-1.5 px-2 rounded font-medium text-center transition flex items-center justify-center gap-1 ${
                leftTab === 'transcript'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Mic className="w-3 h-3 text-rose-400" />
              <span>Mic Audio</span>
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('rubric')}
              className={`flex-1 py-1.5 px-2 rounded font-medium text-center transition flex items-center justify-center gap-1 ${
                leftTab === 'rubric'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Rubric</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {/* SPEC TAB */}
            {leftTab === 'spec' && (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                    Challenge Title
                  </label>
                  <input
                    type="text"
                    value={labTitle}
                    onChange={(e) => setLabTitle(e.target.value)}
                    className="w-full bg-[#1b1b1f] border border-neutral-700 rounded-md px-2.5 py-1.5 text-neutral-100 focus:outline-none focus:border-amber-400"
                    placeholder="e.g. Asynchronous Retry Queue with Jitter"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={labCategory}
                      onChange={(e) => setLabCategory(e.target.value)}
                      className="w-full bg-[#1b1b1f] border border-neutral-700 rounded-md px-2 py-1.5 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                      Concept Tag
                    </label>
                    <input
                      type="text"
                      value={labConcept}
                      onChange={(e) => setLabConcept(e.target.value)}
                      className="w-full bg-[#1b1b1f] border border-neutral-700 rounded-md px-2 py-1.5 text-neutral-100 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Quick 10-Minute Creator Guide */}
                <div className="p-3 rounded-lg border border-neutral-800 bg-[#16161a] space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>How to Build in 10 Minutes:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-neutral-400 text-[11px] leading-relaxed">
                    <li>Hit <strong className="text-rose-400">Record</strong> at top.</li>
                    <li>Solve the problem on screen while explaining your steps out loud.</li>
                    <li>Click <strong className="text-amber-400">Mark Handoff Stop</strong> where student starts.</li>
                    <li>Click <strong className="text-amber-400">AI Socratic Synthesis</strong> to compile the rubric!</li>
                  </ol>
                </div>

                {/* Starter Code vs Solution Toggle */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400">
                    <span>Active Editor View</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setFiles({ [activeFile]: activePreset.starterCode });
                        toast.info('Loaded clean starter code into editor.');
                      }}
                      className="flex-1 py-1 px-2 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-center font-medium transition"
                    >
                      Load Starter State
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFiles({ [activeFile]: solutionCode });
                        toast.success('Loaded working solution into editor.');
                      }}
                      className="flex-1 py-1 px-2 rounded bg-amber-950/40 border border-amber-500/40 text-amber-300 hover:bg-amber-950/60 text-center font-medium transition"
                    >
                      Load Solution State
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* LIVE AUDIO TRANSCRIPT TAB */}
            {leftTab === 'transcript' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-neutral-300">Spoken Voice Transcript</span>
                  {isRecording && (
                    <span className="flex items-center gap-1 text-[11px] text-rose-400 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                      Live
                    </span>
                  )}
                </div>

                {liveInterimText && (
                  <div className="p-2.5 rounded-md bg-neutral-800/80 border border-neutral-700 text-amber-200 text-xs italic">
                    "{liveInterimText}"
                  </div>
                )}

                {transcripts.length === 0 && !liveInterimText ? (
                  <div className="p-4 rounded-lg border border-neutral-800 bg-[#16161a] text-center text-neutral-500 text-xs">
                    <Mic className="w-5 h-5 mx-auto mb-1.5 opacity-40 text-rose-400" />
                    <p>No audio transcribed yet.</p>
                    <p className="text-[11px] mt-1 text-neutral-400">
                      Hit Record and speak into your microphone as you code.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transcripts.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded bg-[#18181c] border border-neutral-800 text-neutral-300 text-xs"
                      >
                        <span className="text-[10px] font-mono text-amber-400 mr-1.5">
                          [{Math.round(item.offsetMs / 1000)}s]
                        </span>
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SOCRATIC RUBRIC TAB */}
            {leftTab === 'rubric' && (
              <div className="space-y-3 text-xs">
                {synthesizedLab?.challengeSpec ? (
                  <>
                    <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-950/20 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Socratic Challenge Spec</span>
                      </div>
                      <p className="text-neutral-300 text-[11px]">
                        {synthesizedLab.challengeSpec.prompt}
                      </p>
                    </div>

                    {/* 3-Tier Socratic Guidance Rubric */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                        3-Tier Socratic Guidance Hints
                      </div>

                      <div className="p-2.5 rounded border border-neutral-800 bg-[#18181c] space-y-1">
                        <span className="text-[10px] uppercase font-bold text-sky-400">
                          Tier 1: Socratic Nudge
                        </span>
                        <p className="text-neutral-300 text-[11px]">
                          {synthesizedLab.challengeSpec.socraticTiers?.tier1_nudge ||
                            synthesizedLab.challengeSpec.socraticHint}
                        </p>
                      </div>

                      <div className="p-2.5 rounded border border-neutral-800 bg-[#18181c] space-y-1">
                        <span className="text-[10px] uppercase font-bold text-amber-400">
                          Tier 2: Structural Hint
                        </span>
                        <p className="text-neutral-300 text-[11px]">
                          {synthesizedLab.challengeSpec.socraticTiers?.tier2_structural ||
                            `Look closely at the required loops and return types.`}
                        </p>
                      </div>

                      <div className="p-2.5 rounded border border-neutral-800 bg-[#18181c] space-y-1">
                        <span className="text-[10px] uppercase font-bold text-emerald-400">
                          Tier 3: AST Diagnostic
                        </span>
                        <p className="text-neutral-300 text-[11px]">
                          {synthesizedLab.challengeSpec.socraticTiers?.tier3_ast ||
                            `Make sure you export the required functions and match the expected console output.`}
                        </p>
                      </div>
                    </div>

                    {/* AST Rules Card */}
                    <div className="p-3 rounded-lg border border-neutral-800 bg-[#16161a] space-y-2">
                      <div className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-sky-400" />
                        <span>AST Rules Verified</span>
                      </div>
                      <div className="space-y-1 text-[11px] text-neutral-400">
                        {synthesizedLab.challengeSpec.astRules?.requiredFunctions?.length > 0 && (
                          <div>
                            <strong className="text-neutral-300">Required Functions: </strong>
                            <code className="text-amber-300">
                              {synthesizedLab.challengeSpec.astRules.requiredFunctions.join(', ')}
                            </code>
                          </div>
                        )}
                        {synthesizedLab.challengeSpec.expectedOutputPatterns?.length > 0 && (
                          <div>
                            <strong className="text-neutral-300">Terminal Match: </strong>
                            <code className="text-emerald-300">
                              "{synthesizedLab.challengeSpec.expectedOutputPatterns[0]}"
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 rounded-lg border border-neutral-800 bg-[#16161a] text-center text-neutral-500 text-xs">
                    <Sparkles className="w-5 h-5 mx-auto mb-1.5 opacity-40 text-amber-400" />
                    <p>No rubric synthesized yet.</p>
                    <p className="text-[11px] mt-1 text-neutral-400">
                      Click "AI Socratic Synthesis" at the top to generate the rubric and AST validator.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* PANEL 2: MONACO CODE EDITOR & TERMINAL SANDBOX */}
        <section className="flex-1 flex flex-col min-w-0 bg-[#18181b]">
          {/* Editor Header Bar */}
          <div className="h-9 border-b border-neutral-800 bg-[#141417] px-3 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1e1e24] text-neutral-200 font-mono text-[11px] border border-neutral-700/60">
                <FileCode className="w-3 h-3 text-sky-400" />
                <span>{activeFile}</span>
              </span>

              {studioMode === 'preview' && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-950/60 border border-sky-500/40 text-sky-300 animate-pulse">
                  <Eye className="w-3 h-3" />
                  <span>Previewing Scrimba Playback Step {previewStepIndex + 1}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRunCode()}
                disabled={isRunningCode}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-semibold text-xs border border-neutral-700 transition"
              >
                {isRunningCode ? (
                  <Spinner size="xs" />
                ) : (
                  <Play className="w-3 h-3 text-emerald-400 fill-current" />
                )}
                <span>Run Code (Node.js)</span>
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 relative overflow-hidden">
            <Suspense
              fallback={
                <div className="h-full w-full flex items-center justify-center bg-[#18181b]">
                  <Spinner size="lg" />
                </div>
              }
            >
              <Editor
                height="100%"
                theme="notion-dark"
                path={activeFile}
                language="javascript"
                value={files[activeFile] || ''}
                onChange={(val) => {
                  const updated = val ?? '';
                  setFiles((prev) => ({ ...prev, [activeFile]: updated }));

                  // If recording, record keystroke snapshot periodically
                  if (isRecording) {
                    const offsetMs = Date.now() - recordingStartTimeRef.current;
                    setTimelineSnapshots((prev) => [
                      ...prev,
                      {
                        offsetMs,
                        file: activeFile,
                        code: updated,
                        highlightLine: editorRef.current?.getPosition?.()?.lineNumber || 1
                      }
                    ]);
                  }
                }}
                onMount={(editor, monaco) => {
                  editorRef.current = editor;
                  monacoRef.current = monaco;

                  monaco.editor.defineTheme('notion-dark', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [
                      { token: 'comment', foreground: '71717a', fontStyle: 'italic' },
                      { token: 'keyword', foreground: 'fafafa', fontStyle: 'bold' },
                      { token: 'string', foreground: 'a7f3d0' },
                      { token: 'number', foreground: 'fde68a' }
                    ],
                    colors: {
                      'editor.background': '#161619',
                      'editor.foreground': '#f4f4f5',
                      'editorLineNumber.foreground': '#52525b',
                      'editorLineNumber.activeForeground': '#fafafa',
                      'editor.lineHighlightBackground': '#27272a40',
                      'editor.selectionBackground': '#3f3f4660',
                      'editorCursor.foreground': '#fafafa'
                    }
                  });
                  monaco.editor.setTheme('notion-dark');
                }}
                options={{
                  fontSize: 13,
                  lineNumbers: 'on',
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  tabSize: 2,
                  automaticLayout: true
                }}
              />
            </Suspense>
          </div>

          {/* Integrated Terminal Panel */}
          <div className="h-44 border-t border-neutral-800 bg-[#121215] flex flex-col shrink-0">
            <div className="h-7 border-b border-neutral-800 bg-[#151518] px-3 flex items-center justify-between text-xs text-neutral-400">
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <Terminal className="w-3 h-3 text-neutral-400" />
                <span>Console Output</span>
              </div>
              <button
                type="button"
                onClick={() => setTerminalOutput('')}
                className="text-[10px] text-neutral-500 hover:text-neutral-300"
              >
                Clear
              </button>
            </div>
            <pre className="flex-1 p-3 font-mono text-xs text-neutral-300 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {terminalOutput || '$ node index.js\n// Click "Run Code" to verify stdout output'}
            </pre>
          </div>
        </section>

        {/* PANEL 3: SCRIMBA TIMELINE & INTERACTIVE TEST RUNNER */}
        <section className="w-84 border-l border-neutral-800 bg-[#141417] flex flex-col shrink-0">
          <div className="h-9 border-b border-neutral-800 bg-[#16161a] px-3 flex items-center justify-between text-xs shrink-0 font-semibold text-neutral-300">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Scrimba Timeline Steps</span>
            </div>
            {synthesizedLab?.aiTimeline && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 font-mono">
                {synthesizedLab.aiTimeline.length} Steps
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Visual Steps List */}
            {synthesizedLab?.aiTimeline?.length ? (
              <div className="space-y-2">
                {synthesizedLab.aiTimeline.map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-xs transition ${
                      step.isChallengeStop
                        ? 'border-amber-500/40 bg-amber-950/20'
                        : 'border-neutral-800 bg-[#18181c]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-neutral-200">
                        Step {idx + 1}: {step.isChallengeStop ? '👇 Handoff Stop' : 'Instructor Guide'}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">
                        {Math.round(step.timeOffset / 1000)}s
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      "{step.narration}"
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-neutral-500">
                      <span>Line {step.highlightLine}</span>
                      <span>•</span>
                      <span>Target: {step.file}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-neutral-800 bg-[#16161a] text-center text-neutral-500 text-xs">
                <Layers className="w-5 h-5 mx-auto mb-1.5 opacity-40 text-sky-400" />
                <p>No timeline steps synthesized yet.</p>
                <p className="text-[11px] mt-1 text-neutral-400">
                  Record your explanation and click "AI Socratic Synthesis".
                </p>
              </div>
            )}

            {/* INTERACTIVE TEST SUBMISSION & AST VALIDATION SANDBOX */}
            <div className="pt-2 border-t border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
                <span>Test AST Validator</span>
                <span className="text-[10px] text-neutral-500">Sandbox</span>
              </div>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => handleTestEvaluation(solutionCode)}
                  className="flex-1 py-1 px-2 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/60 text-[11px] font-medium transition"
                >
                  Test Passing Solution
                </button>
                <button
                  type="button"
                  onClick={() => handleTestEvaluation('function wrong() { return null; }')}
                  className="flex-1 py-1 px-2 rounded bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-950/60 text-[11px] font-medium transition"
                >
                  Test Faulty Solution
                </button>
              </div>

              {/* Live Evaluation Result Card */}
              {evaluationResult && (
                <div
                  className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                    evaluationResult.passed
                      ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                      : 'border-rose-500/40 bg-rose-950/20 text-rose-200'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1.5">
                    {evaluationResult.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    <span>{evaluationResult.passed ? 'AST & Runtime Passed' : 'Validation Failed'}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {evaluationResult.passed
                      ? evaluationResult.socraticPraise
                      : evaluationResult.socraticHint}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

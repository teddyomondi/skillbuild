import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { toast, Toaster } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Cpu,
  Terminal as TerminalIcon,
  Code2,
  Send,
  X,
  Play,
  RotateCcw,
  Mic,
  MicOff,
  Radio,
  Volume2,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import Spinner from '@/components/ui/spinner.jsx';
import { UserButton } from '@clerk/clerk-react';
import { cn } from '@/lib/utils.js';
import { buildIdeRoute, navigateToRoute } from '@/services/routeManager.js';
import {
  evaluateWithSocraticAI,
  speakNarration,
  stopNarration,
  onAiSpeakingStateChange,
  startMicrophoneRecognition,
  generateDynamicLessonStepNarration
} from '@/services/socraticAiTutor.js';
import { buildInterfaceContextSnapshot } from '@/services/interfaceTracker.js';
import AiScreenCursor from '@/components/AiScreenCursor.jsx';
import WokwiCircuitCanvas from '@/components/WokwiCircuitCanvas.jsx';

const Editor = lazy(() => import('@monaco-editor/react'));

export default function CircuitCanvasPage({
  tracks,
  setTracks,
  activeTrackId,
  setActiveTrackId,
  activeNodeId,
  setActiveNodeId,
  moduleWorkspaces,
  setModuleWorkspaces,
  onBackToCourses,
}) {
  const activeTrack = useMemo(() => {
    const candidate = tracks.find((track) => track.id === activeTrackId) || tracks[0];
    return candidate || { id: 'circuit-track', title: 'Circuit & Embedded Systems', nodes: [] };
  }, [tracks, activeTrackId]);

  const activeNode = useMemo(() => {
    const found = activeTrack.nodes.find((node) => node.id === activeNodeId);
    return found || activeTrack.nodes[0] || {
      id: 'circuit-mod-1',
      title: '1. Hardware GPIO & Microcontroller Setup',
      initialFiles: { 'sketch.ino': '// Arduino C++ Firmware\nvoid setup() {}\nvoid loop() {}\n' }
    };
  }, [activeTrack, activeNodeId]);

  const currentModuleIndex = useMemo(
    () => Math.max(0, activeTrack.nodes.findIndex((n) => n.id === activeNode.id)),
    [activeTrack, activeNode]
  );

  const nextModule = useMemo(() => {
    if (currentModuleIndex >= 0 && currentModuleIndex < activeTrack.nodes.length - 1) {
      return activeTrack.nodes[currentModuleIndex + 1];
    }
    return null;
  }, [activeTrack, currentModuleIndex]);

  // Virtual Files & Active Code
  const [files, setFiles] = useState(() => {
    const saved = moduleWorkspaces[activeNode.id]?.files;
    return saved && Object.keys(saved).length > 0 ? saved : activeNode.initialFiles || {
      'sketch.ino': '// Arduino C++ Firmware\nvoid setup() {}\nvoid loop() {}\n'
    };
  });

  const activeFile = 'sketch.ino';
  const firmwareCode = files[activeFile] || '';

  // Workspace View Tabs: 'circuit' (Canvas / Wokwi) vs 'code' (Monaco C++) vs 'split' (Both)
  const [activeMainTab, setActiveMainTab] = useState('split');
  const [isSimulating, setIsSimulating] = useState(false);
  const [showTopBar, setShowTopBar] = useState(true);
  const [showTutorPane, setShowTutorPane] = useState(true);
  const [tutorWidth, setTutorWidth] = useState(360);

  // Serial Monitor output logs
  const [serialLines, setSerialLines] = useState([
    '[UART] COM3 Serial Port connected at 115200 baud.',
    '[SYSTEM] Microcontroller ATmega328P clock ready.'
  ]);
  const [serialInput, setSerialInput] = useState('');

  // AI Instructor Pointer Cursor State
  const [aiCursor, setAiCursor] = useState({
    visible: true,
    x: 420,
    y: 220,
    label: 'Connecting virtual circuit...',
    sublabel: '',
    mode: 'glide',
    variant: 'teach',
    pulseKey: 1,
  });

  // Voice & Interaction Mode
  const [interactionMode, setInteractionMode] = useState('AI_STREAMING'); // 'AI_STREAMING' | 'STUDENT_CHALLENGE' | 'COMPLETED'
  const [timelineStepIndex, setTimelineStepIndex] = useState(0);
  const [highlightedLine, setHighlightedLine] = useState(1);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [interimVoiceTranscript, setInterimVoiceTranscript] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Tutor messages
  const [tutorMessages, setTutorMessages] = useState(() => {
    const raw = moduleWorkspaces[activeNode.id]?.tutorMessages || [];
    return raw.filter((m) => m.type !== 'narration');
  });
  const [studentInput, setStudentInput] = useState('');
  const [attemptCount, setAttemptCount] = useState(
    () => moduleWorkspaces[activeNode.id]?.attemptCount || 0
  );

  const editorRef = useRef(null);
  const editorContainerRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const typingTimerRef = useRef(null);
  const lessonSessionIdRef = useRef(0);
  const micRecognitionRef = useRef(null);

  // Smooth Cursor Targeting
  const moveAiCursorToUiElement = useCallback((uiId, { label = '', sublabel = '', variant = 'teach' } = {}) => {
    if (typeof document === 'undefined') return;
    const el = document.querySelector(`[data-ai-target="${uiId}"]`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const targetX = rect.left + Math.min(rect.width * 0.45, 160);
    const targetY = rect.top + Math.min(rect.height * 0.5, 50);

    setAiCursor((prev) => ({
      visible: true,
      x: targetX,
      y: targetY,
      label: label || prev.label,
      sublabel,
      mode: 'glide',
      variant,
      pulseKey: prev.pulseKey + 1,
    }));
  }, []);

  const moveAiCursorToEditorPosition = useCallback((line = 1, col = 1, { label = '', sublabel = '', variant = 'teach', mode = 'glide' } = {}) => {
    const editor = editorRef.current;
    const container = editorContainerRef.current;
    if (!editor || !container) return;

    try {
      editor.revealLineInCenterIfOutsideViewport?.(line);
      const pos = editor.getScrolledVisiblePosition({ lineNumber: Math.max(1, line), column: Math.max(1, col) });
      const rect = container.getBoundingClientRect();
      if (pos && rect) {
        setAiCursor((prev) => ({
          visible: true,
          x: Math.min(window.innerWidth - 60, Math.max(60, rect.left + pos.left + 14)),
          y: Math.min(window.innerHeight - 60, Math.max(55, rect.top + pos.top + 10)),
          label: label || prev.label,
          sublabel,
          mode,
          variant,
          pulseKey: mode === 'glide' ? prev.pulseKey + 1 : prev.pulseKey,
        }));
      }
    } catch {
      // ignore layout transition
    }
  }, []);

  // Sync speak narration state
  useEffect(() => {
    const unsubscribe = onAiSpeakingStateChange((speaking) => {
      setIsAiSpeaking(speaking);
    });
    return () => {
      unsubscribe();
      stopNarration();
      clearInterval(typingTimerRef.current);
    };
  }, []);

  // Monaco line highlight
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const monaco = monacoRef.current;
    if (!highlightedLine) {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
      return;
    }
    decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [
      {
        range: new monaco.Range(highlightedLine, 1, highlightedLine, 1),
        options: {
          isWholeLine: true,
          className: interactionMode === 'AI_STREAMING' ? 'ai-live-line-highlight' : 'student-challenge-line-highlight',
        },
      },
    ]);
  }, [highlightedLine, interactionMode]);

  // Start Scrimba live walkthrough
  const startAiLiveWalkthrough = useCallback((stepIdx = 0, nodeOverride = null) => {
    const targetNode = nodeOverride || activeNode;
    const timeline = targetNode.aiTimeline || [];
    if (!timeline.length) {
      setInteractionMode('STUDENT_CHALLENGE');
      return;
    }

    const step = timeline[stepIdx];
    if (!step) return;

    const sessionId = ++lessonSessionIdRef.current;
    clearInterval(typingTimerRef.current);
    stopNarration();
    setInteractionMode('AI_STREAMING');
    setTimelineStepIndex(stepIdx);

    const targetLine = step.highlightLine || 1;
    setHighlightedLine(targetLine);

    if (step.cursorTarget?.uiId) {
      moveAiCursorToUiElement(step.cursorTarget.uiId, {
        label: step.cursorTarget.label || targetNode.title,
        variant: step.isChallengeStop ? 'handoff' : 'teach',
      });
    } else {
      moveAiCursorToEditorPosition(targetLine, 4, {
        label: step.isChallengeStop ? `Your turn at Line ${targetLine}` : `Line ${targetLine}`,
        variant: step.isChallengeStop ? 'handoff' : 'teach',
      });
    }

    const targetCode = step.codeSnapshot || '';
    if (targetCode) {
      let charIdx = 0;
      typingTimerRef.current = setInterval(() => {
        if (sessionId !== lessonSessionIdRef.current) {
          clearInterval(typingTimerRef.current);
          return;
        }
        charIdx = Math.min(targetCode.length, charIdx + 4);
        const partial = targetCode.slice(0, charIdx);
        setFiles((prev) => ({ ...prev, [activeFile]: partial }));

        if (charIdx >= targetCode.length) {
          clearInterval(typingTimerRef.current);
          if (step.isChallengeStop) {
            setInteractionMode('STUDENT_CHALLENGE');
          }
        }
      }, 35);
    }

    speakNarration(step.narration, true, () => {
      if (sessionId !== lessonSessionIdRef.current) return;
      if (step.isChallengeStop || stepIdx === timeline.length - 1) {
        setInteractionMode('STUDENT_CHALLENGE');
      } else {
        setTimeout(() => {
          if (sessionId === lessonSessionIdRef.current) {
            startAiLiveWalkthrough(stepIdx + 1, targetNode);
          }
        }, 1000);
      }
    });
  }, [activeNode, moveAiCursorToEditorPosition, moveAiCursorToUiElement]);

  useEffect(() => {
    const timer = setTimeout(() => {
      startAiLiveWalkthrough(0);
    }, 200);
    return () => clearTimeout(timer);
  }, [activeNode.id]);

  // Run simulation & stream serial logs
  const handleToggleSimulation = () => {
    const nextState = !isSimulating;
    setIsSimulating(nextState);
    if (nextState) {
      setSerialLines((prev) => [
        ...prev,
        `[SIM] Simulation Started. Microcontroller executing firmware at ${new Date().toLocaleTimeString()}...`,
        '[SERIAL OUT] System Initialized: Arduino Uno GPIO Ready',
        '[SERIAL OUT] LED State: ON',
        '[SERIAL OUT] LED State: OFF'
      ]);
    } else {
      setSerialLines((prev) => [...prev, `[SIM] Simulation Paused.`]);
    }
  };

  const handleResetSimulation = () => {
    setIsSimulating(false);
    setSerialLines([
      '[RESET] Microcontroller reset line pulled LOW.',
      '[UART] Serial interface reconnected at 115200 baud.'
    ]);
  };

  const handleSendSerial = (e) => {
    e.preventDefault();
    if (!serialInput.trim()) return;
    setSerialLines((prev) => [...prev, `> ${serialInput.trim()}`]);
    setSerialInput('');
  };

  // Solution Verification
  const handleVerifySolution = async (customQuestion = null) => {
    setIsEvaluating(true);
    if (!showTutorPane) setShowTutorPane(true);

    const nextAttempt = attemptCount + 1;
    if (!customQuestion) setAttemptCount(nextAttempt);

    if (customQuestion) {
      setTutorMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, sender: 'student', text: customQuestion }
      ]);
    }

    const currentSerialOutput = serialLines.join('\n');
    const evaluator = activeNode.challengeSpec?.evaluateSubmission;
    let evalResult = null;

    if (evaluator && typeof evaluator === 'function' && !customQuestion) {
      evalResult = evaluator(firmwareCode, currentSerialOutput, {
        pins: { '13': isSimulating ? 'HIGH' : 'LOW' }
      });
    }

    if (evalResult && evalResult.passed) {
      // Completed lesson
      setTracks((prevTracks) =>
        prevTracks.map((track) => {
          if (track.id !== activeTrack.id) return track;
          const targetIndex = track.nodes.findIndex((n) => n.id === activeNode.id);
          const updatedNodes = track.nodes.map((node, idx) => {
            if (node.id === activeNode.id) return { ...node, status: 'completed' };
            if (idx === targetIndex + 1 && (node.status === 'locked' || !node.status)) {
              return { ...node, status: 'in-progress' };
            }
            return node;
          });
          return { ...track, nodes: updatedNodes };
        })
      );

      setTutorMessages((prev) => [
        ...prev,
        {
          id: `eval-${Date.now()}`,
          sender: 'ai',
          type: 'success',
          text: evalResult.socraticPraise || "Sensational! Your circuit and firmware passed all simulation checks."
        }
      ]);
      setInteractionMode('COMPLETED');
      setIsEvaluating(false);
      speakNarration(evalResult.socraticPraise, true);
      toast.success('Hardware challenge verified! Next lab unlocked.');
      return;
    }

    // Call Socratic AI for feedback
    const snapshot = buildInterfaceContextSnapshot({
      currentView: 'ide',
      activeTrack,
      activeNode,
      activeFile,
      openTabs: [activeFile],
      files,
      cursorPosition: { lineNumber: highlightedLine, column: 1 },
      lastRuntimeOutput: currentSerialOutput,
      terminalLines: serialLines,
      panels: { tutor: true },
      recentEvents: []
    });

    const aiRes = await evaluateWithSocraticAI({
      learnerCode: firmwareCode,
      runtimeOutput: currentSerialOutput,
      activeNode,
      learnerQuestion: customQuestion,
      attemptCount: nextAttempt,
      interfaceSnapshot: snapshot,
      chatHistory: tutorMessages
    });

    setTutorMessages((prev) => [
      ...prev,
      {
        id: `eval-${Date.now()}`,
        sender: 'ai',
        type: aiRes.passed ? 'success' : 'socratic-hint',
        text: evalResult?.socraticHint || aiRes.reply
      }
    ]);

    setIsEvaluating(false);
    speakNarration(evalResult?.socraticHint || aiRes.spokenText || aiRes.reply, true);
  };

  const toggleMicrophoneInput = () => {
    if (isListeningMic) {
      try { micRecognitionRef.current?.stop(); } catch {}
      setIsListeningMic(false);
      setInterimVoiceTranscript('');
      return;
    }

    stopNarration();
    setInterimVoiceTranscript('Listening...');
    setIsListeningMic(true);

    const rec = startMicrophoneRecognition({
      onInterimResult: (interim) => setInterimVoiceTranscript(interim),
      onFinalResult: (finalText) => {
        if (finalText) {
          setIsListeningMic(false);
          setInterimVoiceTranscript('');
          handleVerifySolution(finalText);
        }
      },
      onError: () => {
        setIsListeningMic(false);
        setInterimVoiceTranscript('');
      },
      onEnd: () => {
        setIsListeningMic(false);
        setInterimVoiceTranscript('');
      }
    });
    micRecognitionRef.current = rec;
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden font-sans relative">
      <Toaster position="bottom-center" />
      <AiScreenCursor cursorState={aiCursor} isAiSpeaking={isAiSpeaking} interactionMode={interactionMode} />

      {/* Top Header */}
      {showTopBar && (
        <header className="h-12 bg-neutral-900 border-b border-neutral-800 px-3.5 flex items-center justify-between gap-3 shrink-0 z-30">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTopBar(false)}
              className="h-8 w-8 text-neutral-400 hover:text-white shrink-0"
              title="Hide top bar"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onBackToCourses}
              className="h-8 gap-1.5 px-2.5 text-xs font-medium border-neutral-700 hover:bg-neutral-800 text-neutral-200 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Courses
            </Button>

            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-neutral-800/80 border border-neutral-700/60 text-xs min-w-0">
              <Cpu className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="text-white font-semibold shrink-0">
                Lab {currentModuleIndex + 1} of {activeTrack.nodes.length}
              </span>
              <span className="text-neutral-500">•</span>
              <span className="text-neutral-300 font-medium truncate max-w-[280px]">
                {activeNode.title.replace(/^\d+\.\s*/, '')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Switcher */}
            <div className="hidden sm:flex bg-neutral-800 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setActiveMainTab('split')}
                className={cn("px-2.5 py-1 rounded-md font-medium transition text-[11px]", activeMainTab === 'split' ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-neutral-200")}
              >
                Split View
              </button>
              <button
                onClick={() => setActiveMainTab('circuit')}
                className={cn("px-2.5 py-1 rounded-md font-medium transition text-[11px]", activeMainTab === 'circuit' ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-neutral-200")}
              >
                Circuit Only
              </button>
              <button
                onClick={() => setActiveMainTab('code')}
                className={cn("px-2.5 py-1 rounded-md font-medium transition text-[11px]", activeMainTab === 'code' ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-neutral-200")}
              >
                Code Only
              </button>
            </div>

            <Button
              size="sm"
              onClick={() => handleVerifySolution(null)}
              disabled={isEvaluating}
              className="h-8 gap-1.5 px-3.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isEvaluating ? 'Testing...' : 'Check Solution'}</span>
            </Button>

            {nextModule && (
              <Button
                size="sm"
                onClick={() => {
                  setActiveNodeId(nextModule.id);
                  navigateToRoute(buildIdeRoute(activeTrack.id, nextModule.id), {
                    title: nextModule.title.replace(/^\d+\.\s*/, '')
                  });
                }}
                className="h-8 gap-1.5 px-3 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <span>Next Lab</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}

            <div className="ml-1 flex items-center">
              <UserButton afterSignOutUrl="/welcome" />
            </div>
          </div>
        </header>
      )}

      {/* Floating Restore Bar Button */}
      {!showTopBar && (
        <div className="absolute top-2.5 left-2.5 z-40">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowTopBar(true)}
            className="h-8 px-2.5 gap-1.5 text-xs font-medium shadow-md border border-neutral-700 bg-neutral-900/90 backdrop-blur-md text-white"
          >
            <ChevronDown className="w-4 h-4 text-emerald-400" />
            <span>Menu</span>
          </Button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 w-full h-full flex min-h-0 relative overflow-hidden">
        {/* Left/Center Workspace (Circuit Canvas + Monaco Firmware Editor + Serial Monitor) */}
        <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden">
          {/* Main Content Area (Split between Circuit Canvas & Code Editor) */}
          <div className="flex-1 w-full flex min-h-0 overflow-hidden">
            {/* 1. Circuit Canvas / Wokwi Simulator */}
            {(activeMainTab === 'circuit' || activeMainTab === 'split') && (
              <div className={cn("h-full min-h-0 border-r border-neutral-800", activeMainTab === 'split' ? "w-1/2" : "w-full")}>
                <WokwiCircuitCanvas
                  microcontroller={activeNode.microcontroller || 'arduino-uno'}
                  firmwareCode={firmwareCode}
                  circuitComponents={activeNode.circuitComponents || []}
                  serialOutput={serialLines.join('\n')}
                  isSimulating={isSimulating}
                  onToggleSimulation={handleToggleSimulation}
                  onResetSimulation={handleResetSimulation}
                />
              </div>
            )}

            {/* 2. Monaco Firmware Editor */}
            {(activeMainTab === 'code' || activeMainTab === 'split') && (
              <div
                ref={editorContainerRef}
                className={cn("h-full flex flex-col min-h-0 bg-neutral-950", activeMainTab === 'split' ? "w-1/2" : "w-full")}
              >
                {/* Editor File Tab Header */}
                <div className="h-9 px-3 border-b border-neutral-800 bg-neutral-900/60 flex items-center justify-between text-xs shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-neutral-300 font-semibold flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-amber-400" />
                      {activeFile}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">Arduino C++ (16MHz)</span>
                  </div>
                  {interactionMode === 'STUDENT_CHALLENGE' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium animate-pulse">
                      Your Turn to Code
                    </span>
                  )}
                </div>

                {/* Monaco Editor */}
                <div className="flex-1 w-full min-h-0 relative">
                  <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Spinner size="lg" /></div>}>
                    <Editor
                      height="100%"
                      language="cpp"
                      theme="vs-dark"
                      value={firmwareCode}
                      onChange={(val) => {
                        setFiles((prev) => ({ ...prev, [activeFile]: val || '' }));
                      }}
                      onMount={(editor, monaco) => {
                        editorRef.current = editor;
                        monacoRef.current = monaco;
                      }}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        fontFamily: "'Fira Code', Menlo, Monaco, 'Courier New', monospace",
                        fontLigatures: true,
                        tabSize: 2,
                        wordWrap: 'on'
                      }}
                    />
                  </Suspense>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Hardware Serial Monitor */}
          <div className="h-44 border-t border-neutral-800 bg-neutral-950 flex flex-col shrink-0">
            <div className="h-8 px-3 border-b border-neutral-800 bg-neutral-900/80 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-neutral-200">Hardware Serial Monitor (UART)</span>
                <span className="text-[10px] text-neutral-500 font-mono">115200 baud</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSerialLines([])}
                className="h-6 px-2 text-[10px] text-neutral-400 hover:text-white"
              >
                Clear
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 font-mono text-xs text-neutral-300 space-y-1 select-text">
              {serialLines.map((line, idx) => (
                <div key={idx} className={cn("leading-relaxed", line.startsWith('>') ? "text-sky-400" : line.includes('[SERIAL OUT]') ? "text-emerald-400 font-bold" : "text-neutral-400")}>
                  {line}
                </div>
              ))}
            </div>

            {/* Serial Send Input Form */}
            <form onSubmit={handleSendSerial} className="h-8 px-2 border-t border-neutral-800 flex items-center gap-2 bg-neutral-900/50">
              <input
                type="text"
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                placeholder="Send serial command to MCU (e.g. AT+PING)..."
                className="flex-1 bg-transparent text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none font-mono"
              />
              <Button type="submit" size="sm" variant="ghost" className="h-6 px-2 text-xs text-emerald-400 hover:text-emerald-300">
                Send
              </Button>
            </form>
          </div>
        </div>

        {/* Right Socratic AI Hardware Tutor Panel */}
        {showTutorPane && (
          <aside
            style={{ width: `${tutorWidth}px` }}
            className="bg-neutral-900 flex flex-col shrink-0 min-w-[280px] max-w-[500px] border-l border-neutral-800 h-full z-20 shadow-2xl"
          >
            {/* Tutor Header */}
            <div className="h-11 px-3.5 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-900/80">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", isAiSpeaking ? "bg-amber-400 animate-ping" : "bg-emerald-400")} />
                <span className="text-xs font-semibold text-white">AI Circuit & Hardware Tutor</span>
                {isAiSpeaking && (
                  <span className="flex items-center gap-1 text-[11px] text-amber-400 ml-1">
                    <Radio className="w-3 h-3 animate-pulse" />
                    Speaking
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTutorPane(false)}
                className="h-6 w-6 p-0 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Chat Conversation */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 select-text">
              {tutorMessages.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center p-3">
                  <div className="w-10 h-10 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white mb-3 shadow-xs">
                    <HelpCircle className="w-5 h-5 text-neutral-400" />
                  </div>
                  <h3 className="text-xs font-semibold text-white mb-1">
                    Embedded AI Hardware Mentor
                  </h3>
                  <p className="text-[11px] text-neutral-400 leading-relaxed max-w-[280px]">
                    I observe your circuit wiring, firmware code, and serial telemetry. Ask me any question about GPIOs, PWM, or circuit debugging!
                  </p>
                </div>
              ) : (
                tutorMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "rounded-xl p-3 text-xs leading-relaxed border transition shadow-xs",
                      msg.sender === 'student'
                        ? "bg-neutral-800 text-white border-neutral-700 ml-6"
                        : msg.type === 'success'
                        ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                        : "bg-neutral-900 border-neutral-800 text-neutral-200"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5 text-[11px] font-medium text-neutral-400">
                      <span>{msg.sender === 'student' ? 'You' : 'AI Tutor'}</span>
                      {msg.sender === 'ai' && (
                        <button
                          onClick={() => speakNarration(msg.text, true)}
                          title="Listen again"
                          className="hover:text-white text-neutral-400 transition"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Socratic Hint Button */}
            <div className="px-3 pt-2 pb-1 bg-neutral-900 border-t border-neutral-800 flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => handleVerifySolution('Can you inspect my circuit and firmware and give me a gentle hint on how to connect and program this?')}
                disabled={isEvaluating}
                className="flex-1 h-7 text-xs font-medium border-neutral-700 hover:bg-neutral-800 text-neutral-300 hover:text-white gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Ask for a Hardware Hint</span>
              </Button>
            </div>

            {/* Input Form with Voice Microphone */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!studentInput.trim() || isEvaluating) return;
                const q = studentInput.trim();
                setStudentInput('');
                handleVerifySolution(q);
              }}
              className="p-3 bg-neutral-900 border-t border-neutral-800"
            >
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={toggleMicrophoneInput}
                  title={isListeningMic ? 'Stop microphone' : 'Ask with voice'}
                  className={cn(
                    "h-8 w-8 shrink-0 transition",
                    isListeningMic ? "bg-rose-500/25 border-rose-500 text-rose-400 animate-pulse" : "border-neutral-700 text-neutral-400 hover:text-white"
                  )}
                >
                  {isListeningMic ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </Button>
                <input
                  type="text"
                  value={studentInput}
                  onChange={(e) => setStudentInput(e.target.value)}
                  placeholder={isListeningMic ? interimVoiceTranscript || 'Listening...' : 'Ask about pins, voltage, or C++ code...'}
                  className="flex-1 bg-neutral-800/80 border border-neutral-700 rounded-md px-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <Button type="submit" size="icon" disabled={isEvaluating || !studentInput.trim()} className="h-8 w-8 shrink-0">
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}

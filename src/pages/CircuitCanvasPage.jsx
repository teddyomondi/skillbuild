import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { toast, Toaster } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Cpu,
  Terminal as TerminalIcon,
  Code2,
  Send,
  X,
  Mic,
  MicOff,
  Radio,
  Volume2,
  HelpCircle,
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

  const [files, setFiles] = useState(() => {
    const saved = moduleWorkspaces[activeNode.id]?.files;
    return saved && Object.keys(saved).length > 0 ? saved : activeNode.initialFiles || {
      'sketch.ino': '// Arduino C++ Firmware\nvoid setup() {}\nvoid loop() {}\n'
    };
  });

  const activeFile = 'sketch.ino';
  const firmwareCode = files[activeFile] || '';

  const [activeMainTab, setActiveMainTab] = useState('split');
  const [isSimulating, setIsSimulating] = useState(false);
  const [showTopBar, setShowTopBar] = useState(true);
  const [showTutor, setShowTutor] = useState(true);
  const [tutorWidth, setTutorWidth] = useState(360);

  const [serialLines, setSerialLines] = useState([
    '[UART] COM3 Serial Port connected at 115200 baud.',
    '[SYSTEM] Microcontroller ATmega328P clock ready.'
  ]);
  const [serialInput, setSerialInput] = useState('');

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

  const [interactionMode, setInteractionMode] = useState('AI_STREAMING');
  const [highlightedLine, setHighlightedLine] = useState(1);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [interimVoiceTranscript, setInterimVoiceTranscript] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);

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
      // ignore
    }
  }, []);

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

  const handleToggleSimulation = () => {
    const nextState = !isSimulating;
    setIsSimulating(nextState);
    if (nextState) {
      setSerialLines((prev) => [
        ...prev,
        `[SIM] Simulation Started at ${new Date().toLocaleTimeString()}...`,
        '[SERIAL OUT] System Initialized: Microcontroller Ready',
        '[SERIAL OUT] LED State: HIGH',
        '[SERIAL OUT] LED State: LOW'
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

  const handleVerifySolution = async (customQuestion = null) => {
    setIsEvaluating(true);
    if (!showTutor) setShowTutor(true);

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
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden font-sans relative">
      <Toaster position="bottom-center" />
      <AiScreenCursor cursorState={aiCursor} isAiSpeaking={isAiSpeaking} interactionMode={interactionMode} />

      {/* 1. PLATFORM TOP BAR */}
      {showTopBar && (
        <header className="h-12 bg-background dark:bg-[#18181b] border-b border-border px-3.5 flex items-center justify-between gap-3 shrink-0 z-30 transition-all duration-200">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTopBar(false)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
              title="Hide top bar"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onBackToCourses}
              className="h-8 gap-1.5 px-2.5 text-xs font-medium border-border hover:bg-secondary text-foreground shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
              Courses
            </Button>

            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-secondary/50 border border-border text-xs min-w-0">
              <Cpu className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-foreground font-semibold shrink-0">
                Lab {currentModuleIndex + 1} of {activeTrack.nodes.length}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground font-medium truncate max-w-[280px]">
                {activeNode.title.replace(/^\d+\.\s*/, '')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Switcher */}
            <div className="hidden sm:flex bg-secondary p-0.5 rounded-lg text-xs border border-border/60">
              <button
                onClick={() => setActiveMainTab('split')}
                className={cn("px-2.5 py-1 rounded-md font-medium transition text-[11px]", activeMainTab === 'split' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
              >
                Split
              </button>
              <button
                onClick={() => setActiveMainTab('circuit')}
                className={cn("px-2.5 py-1 rounded-md font-medium transition text-[11px]", activeMainTab === 'circuit' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
              >
                Circuit
              </button>
              <button
                onClick={() => setActiveMainTab('code')}
                className={cn("px-2.5 py-1 rounded-md font-medium transition text-[11px]", activeMainTab === 'code' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
              >
                Firmware
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

      {/* 2. FLOATING MENU RESTORE BUTTON */}
      {!showTopBar && (
        <div className="absolute top-2.5 left-2.5 z-40">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowTopBar(true)}
            className="h-8 px-2.5 gap-1.5 text-xs font-medium shadow-md border border-border/80 bg-background/90 backdrop-blur-md hover:bg-secondary text-foreground"
          >
            <ChevronDown className="w-4 h-4 text-emerald-500" />
            <span>Menu</span>
          </Button>
        </div>
      )}

      {/* 3. FLOATING AI TUTOR TOGGLE BUTTON */}
      <div
        className={cn(
          "absolute z-40 transition-all duration-200",
          showTopBar ? "top-14" : "top-2.5"
        )}
        style={{ right: showTutor ? `${tutorWidth + 12}px` : '12px' }}
      >
        <Button
          variant={showTutor ? "secondary" : "default"}
          size="sm"
          onClick={() => setShowTutor((prev) => !prev)}
          className={cn(
            "h-8 px-3 gap-1.5 text-xs font-medium shadow-md border backdrop-blur-md transition",
            showTutor
              ? "bg-secondary text-foreground border-border hover:bg-secondary/80"
              : "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/30"
          )}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{showTutor ? 'Hide Tutor' : 'AI Tutor'}</span>
        </Button>
      </div>

      {/* 4. MAIN WORKSPACE */}
      <div className="flex-1 w-full h-full flex min-h-0 relative overflow-hidden">
        {/* Left/Center Workspace */}
        <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 w-full flex min-h-0 overflow-hidden">
            {/* Circuit Canvas */}
            {(activeMainTab === 'circuit' || activeMainTab === 'split') && (
              <div className={cn("h-full min-h-0 border-r border-border", activeMainTab === 'split' ? "w-1/2" : "w-full")}>
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

            {/* Monaco Firmware Editor */}
            {(activeMainTab === 'code' || activeMainTab === 'split') && (
              <div
                ref={editorContainerRef}
                className={cn("h-full flex flex-col min-h-0 bg-card", activeMainTab === 'split' ? "w-1/2" : "w-full")}
              >
                <div className="h-9 px-3 border-b border-border bg-secondary/30 flex items-center justify-between text-xs shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-foreground font-semibold flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-primary" />
                      {activeFile}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">Arduino C++</span>
                  </div>
                  {interactionMode === 'STUDENT_CHALLENGE' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-medium">
                      Your Turn
                    </span>
                  )}
                </div>

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
          <div className="h-40 border-t border-border bg-card flex flex-col shrink-0">
            <div className="h-8 px-3 border-b border-border bg-secondary/30 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold text-foreground text-xs">Hardware Serial Monitor (UART)</span>
                <span className="text-[10px] text-muted-foreground font-mono">115200 baud</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSerialLines([])}
                className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 font-mono text-xs text-foreground space-y-1 select-text">
              {serialLines.map((line, idx) => (
                <div key={idx} className={cn("leading-relaxed", line.startsWith('>') ? "text-primary font-bold" : line.includes('[SERIAL OUT]') ? "text-emerald-500 font-medium" : "text-muted-foreground")}>
                  {line}
                </div>
              ))}
            </div>

            <form onSubmit={handleSendSerial} className="h-8 px-2 border-t border-border flex items-center gap-2 bg-secondary/20">
              <input
                type="text"
                value={serialInput}
                onChange={(e) => setSerialInput(e.target.value)}
                placeholder="Send serial command to MCU..."
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none font-mono"
              />
              <Button type="submit" size="sm" variant="ghost" className="h-6 px-2 text-xs text-primary hover:text-primary/80">
                Send
              </Button>
            </form>
          </div>
        </div>

        {/* Right Socratic AI Hardware Tutor Panel */}
        {showTutor && (
          <aside
            style={{ width: `${tutorWidth}px` }}
            className="bg-card dark:bg-[#1b1b1b] flex flex-col shrink-0 min-w-[280px] max-w-[500px] border-l border-border h-full z-30 shadow-2xl transition-all duration-200"
          >
            {/* Tutor Header */}
            <div className="h-11 px-3.5 border-b border-border flex items-center justify-between shrink-0 bg-secondary/30">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", isAiSpeaking ? "bg-primary animate-ping" : "bg-emerald-500")} />
                <span className="text-xs font-semibold text-foreground">AI Circuit Tutor</span>
                {isAiSpeaking && (
                  <span className="flex items-center gap-1 text-[11px] text-primary ml-1">
                    <Radio className="w-3 h-3 animate-pulse" />
                    Speaking
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTutor(false)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Conversation Stream */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 select-text">
              {tutorMessages.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center p-3">
                  <div className="w-10 h-10 rounded-2xl bg-secondary border border-border flex items-center justify-center text-foreground mb-3 shadow-xs">
                    <HelpCircle className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-xs font-semibold text-foreground mb-1">
                    Embedded AI Hardware Mentor
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[280px]">
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
                        ? "bg-secondary text-foreground border-border ml-6"
                        : msg.type === 'success'
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-card dark:bg-[#181818] border-border text-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5 text-[11px] font-medium text-muted-foreground">
                      <span className="text-foreground font-semibold">{msg.sender === 'student' ? 'You' : 'AI Tutor'}</span>
                      {msg.sender === 'ai' && (
                        <button
                          onClick={() => speakNarration(msg.text, true)}
                          title="Listen again"
                          className="hover:text-foreground text-muted-foreground transition"
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
            <div className="px-3 pt-2 pb-1 bg-card dark:bg-[#1b1b1b] border-t border-border flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => handleVerifySolution('Can you inspect my circuit and firmware and give me a gentle hint?')}
                disabled={isEvaluating}
                className="flex-1 h-7 text-xs font-medium border-border hover:bg-secondary text-muted-foreground hover:text-foreground gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
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
              className="p-3 bg-card dark:bg-[#1b1b1b] border-t border-border"
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
                    isListeningMic ? "bg-rose-500/25 border-rose-500 text-rose-400 animate-pulse" : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isListeningMic ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </Button>
                <input
                  type="text"
                  value={studentInput}
                  onChange={(e) => setStudentInput(e.target.value)}
                  placeholder={isListeningMic ? interimVoiceTranscript || 'Listening...' : 'Ask about pins, voltage, or C++ code...'}
                  className="flex-1 bg-secondary/60 border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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

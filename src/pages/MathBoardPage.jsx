import React, { useMemo, useState, useEffect, useRef, lazy, Suspense } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
  Send,
  Mic,
  MicOff,
  Radio,
  HelpCircle,
  Volume2
} from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button.jsx';
import Spinner from '@/components/ui/spinner.jsx';
import { cn } from '@/lib/utils.js';
import { ROADMAP_TRACKS } from '@/data/roadmapCurriculum.js';
import { buildIdeRoute, navigateToRoute } from '@/services/routeManager.js';
import { toast } from 'sonner';
import {
  evaluateWithSocraticAI,
  speakNarration,
  stopNarration,
  onAiSpeakingStateChange,
  startMicrophoneRecognition
} from '@/services/socraticAiTutor.js';
import { buildInterfaceContextSnapshot } from '@/services/interfaceTracker.js';

const ExcalidrawWhiteboard = lazy(() => import('@/components/ExcalidrawWhiteboard.jsx'));

export default function MathBoardPage({
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
    const candidate =
      tracks.find((track) => track.id === activeTrackId) ||
      tracks.find((t) => t.id === 'mathematics') ||
      tracks[0];
    const usableTrack = candidate?.nodes?.length ? candidate : ROADMAP_TRACKS[1] || ROADMAP_TRACKS[0];
    const nodes = usableTrack.nodes.filter((node) => node && typeof node.id === 'string');
    return {
      ...usableTrack,
      title: usableTrack.title || 'Mathematics',
      nodes: nodes.length ? nodes : [],
    };
  }, [tracks, activeTrackId]);

  const activeNode = useMemo(() => {
    const found = activeTrack.nodes.find((node) => node.id === activeNodeId);
    return found || activeTrack.nodes[0] || { id: 'math-intro', title: 'Mathematics Lesson' };
  }, [activeTrack, activeNodeId]);

  const currentModuleIndex = useMemo(
    () => activeTrack.nodes.findIndex((n) => n.id === activeNode.id),
    [activeTrack, activeNode]
  );

  const nextModule = useMemo(() => {
    if (currentModuleIndex >= 0 && currentModuleIndex < activeTrack.nodes.length - 1) {
      return activeTrack.nodes[currentModuleIndex + 1];
    }
    return null;
  }, [activeTrack, currentModuleIndex]);

  // Board Data Reference (stores live Excalidraw elements & state)
  const boardDataRef = useRef(moduleWorkspaces[activeNode.id]?.boardData || null);

  useEffect(() => {
    boardDataRef.current = moduleWorkspaces[activeNode.id]?.boardData || null;
  }, [activeNode.id, moduleWorkspaces]);

  // UI State: Top Bar Visibility & AI Tutor Panel Drawer
  const [showTopBar, setShowTopBar] = useState(true);
  const [showTutor, setShowTutor] = useState(true);
  const [tutorWidth, setTutorWidth] = useState(360);

  // AI Tutor & Socratic Dialogue State
  const [tutorMessages, setTutorMessages] = useState(() => {
    const raw = moduleWorkspaces[activeNode.id]?.tutorMessages || [];
    return raw.filter((m) => m.type !== 'narration');
  });
  const [studentInput, setStudentInput] = useState('');
  const [attemptCount, setAttemptCount] = useState(
    () => moduleWorkspaces[activeNode.id]?.attemptCount || 0
  );
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [interimVoiceTranscript, setInterimVoiceTranscript] = useState('');
  const micRecognitionRef = useRef(null);

  useEffect(() => {
    const unsubscribeSpeak = onAiSpeakingStateChange((speaking) => {
      setIsAiSpeaking(speaking);
    });
    return () => {
      unsubscribeSpeak();
      stopNarration();
    };
  }, []);

  const handleSelectNode = (node) => {
    setActiveNodeId(node.id);
    navigateToRoute(buildIdeRoute(activeTrack.id, node.id), {
      title: node.title.replace(/^\d+\.\s*/, ''),
    });
  };

  const handleCompleteLesson = () => {
    setTracks((prevTracks) =>
      prevTracks.map((track) => {
        if (track.id !== activeTrack.id) return track;
        const targetIndex = track.nodes.findIndex((n) => n.id === activeNode.id);
        const updatedNodes = track.nodes.map((node, idx) => {
          if (node.id === activeNode.id) {
            return { ...node, status: 'completed' };
          }
          if (idx === targetIndex + 1 && (node.status === 'locked' || !node.status)) {
            return { ...node, status: 'in-progress' };
          }
          return node;
        });
        return { ...track, nodes: updatedNodes };
      })
    );

    setModuleWorkspaces((prev) => ({
      ...prev,
      [activeNode.id]: {
        ...(prev[activeNode.id] || {}),
        boardData: boardDataRef.current,
        status: 'completed',
        updatedAt: new Date().toISOString(),
      },
    }));

    toast.success('Module completed! Next module unlocked.');
  };

  // AI Tutor Verification & Q&A
  const handleVerifyWithTutor = async (customQuestion = null) => {
    setIsEvaluating(true);
    if (!showTutor) setShowTutor(true);

    const nextAttempt = attemptCount + 1;
    if (!customQuestion) setAttemptCount(nextAttempt);

    if (customQuestion) {
      setTutorMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          sender: 'student',
          text: customQuestion,
        },
      ]);
    }

    const currentBoard = boardDataRef.current || {};
    const snapshot = buildInterfaceContextSnapshot({
      currentView: 'ide',
      activeTrack,
      activeNode,
      activeFile: 'MathBoard',
      openTabs: ['MathBoard'],
      files: {},
      boardData: currentBoard,
      cursorPosition: { lineNumber: 1, column: 1 },
      selectedText: '',
      editorMarkers: [],
      interactionMode: 'STUDENT_CHALLENGE',
      timelineStepIndex: 0,
      lastRuntimeOutput: `Active Elements: ${currentBoard.elements?.length || 0}`,
      terminalLines: [],
      panels: { tutor: true },
      recentEvents: [],
    });

    const result = await evaluateWithSocraticAI({
      learnerCode: '',
      runtimeOutput: `Canvas elements: ${currentBoard.elements?.length || 0}`,
      activeNode,
      learnerQuestion: customQuestion,
      attemptCount: nextAttempt,
      interfaceSnapshot: snapshot,
      chatHistory: tutorMessages,
    });

    if (result.passed && !customQuestion) {
      handleCompleteLesson();
    }

    setTutorMessages((prev) => [
      ...prev,
      {
        id: `ai-eval-${Date.now()}`,
        sender: 'ai',
        type: result.passed ? 'success' : 'socratic-hint',
        text: result.reply,
      },
    ]);

    setIsEvaluating(false);
    speakNarration(result.spokenText || result.reply, true);
  };

  // Toggle voice microphone input
  const toggleMicrophoneInput = () => {
    if (isListeningMic) {
      try {
        micRecognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsListeningMic(false);
      setInterimVoiceTranscript('');
      return;
    }

    stopNarration();
    setInterimVoiceTranscript('Listening...');
    setIsListeningMic(true);

    let handledTranscript = false;

    const rec = startMicrophoneRecognition({
      onInterimResult: (interim) => {
        setInterimVoiceTranscript(interim);
      },
      onFinalResult: (finalText) => {
        if (finalText && !handledTranscript) {
          handledTranscript = true;
          setIsListeningMic(false);
          setInterimVoiceTranscript('');
          handleVerifyWithTutor(finalText);
        }
      },
      onError: () => {
        setIsListeningMic(false);
        setInterimVoiceTranscript('');
      },
      onEnd: (finalText) => {
        setIsListeningMic(false);
        setInterimVoiceTranscript('');
        if (finalText && !handledTranscript) {
          handledTranscript = true;
          handleVerifyWithTutor(finalText);
        }
      },
    });

    micRecognitionRef.current = rec;
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden font-sans relative">
      {/* 1. PLATFORM TOP BAR (Collapsible with smooth animation) */}
      {showTopBar && (
        <header className="h-12 bg-background dark:bg-[#18181b] border-b border-border px-3.5 flex items-center justify-between gap-3 shrink-0 z-30 transition-all duration-200">
          <div className="flex items-center gap-2 min-w-0">
            {/* Collapse Top Bar Button (Up icon) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTopBar(false)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
              title="Hide top bar (Full canvas)"
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
              <span className="text-foreground font-semibold shrink-0">
                Module {currentModuleIndex + 1} of {activeTrack.nodes.length}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground font-medium truncate max-w-[280px]">
                {activeNode.title.replace(/^\d+\.\s*/, '')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => handleVerifyWithTutor(null)}
              disabled={isEvaluating}
              className="h-8 gap-1.5 px-3.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isEvaluating ? 'Checking...' : 'Check Solution'}</span>
            </Button>

            {nextModule && (
              <Button
                size="sm"
                onClick={() => handleSelectNode(nextModule)}
                className="h-8 gap-1.5 px-3 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
              >
                <span>Next Module</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}

            <div className="ml-1 flex items-center">
              <UserButton afterSignOutUrl="/welcome" />
            </div>
          </div>
        </header>
      )}

      {/* 2. FLOATING MENU RESTORE BUTTON (DOWN ICON) */}
      {/* Sits persistently at top-left even when drawing or when top bar is hidden */}
      {!showTopBar && (
        <div className="absolute top-2.5 left-2.5 z-40">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowTopBar(true)}
            className="h-8 px-2.5 gap-1.5 text-xs font-medium shadow-md border border-border/80 bg-background/90 backdrop-blur-md hover:bg-secondary text-foreground"
            title="Display platform top bar"
          >
            <ChevronDown className="w-4 h-4 text-emerald-500" />
            <span>Menu</span>
          </Button>
        </div>
      )}

      {/* 3. FLOATING AI TUTOR TOGGLE BUTTON */}
      {/* Sits persistently in the top-right replacing the old Library button */}
      <div className={cn(
        "absolute z-40 transition-all duration-200",
        showTopBar ? "top-14" : "top-2.5",
        showTutor ? `right-[${tutorWidth + 12}px]` : "right-3"
      )} style={{ right: showTutor ? `${tutorWidth + 12}px` : '12px' }}>
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
          title={showTutor ? "Close AI Tutor panel" : "Open AI Tutor panel"}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{showTutor ? 'Hide Tutor' : 'AI Tutor'}</span>
        </Button>
      </div>

      {/* 4. MAIN WORKSPACE: INFINITE EXCALIDRAW BOARD + SLIDE-OUT AI TUTOR PANEL */}
      <div className="flex-1 w-full h-full flex min-h-0 relative overflow-hidden">
        {/* Full-Screen Whiteboard */}
        <main className="flex-1 w-full h-full relative overflow-hidden">
          <Suspense
            fallback={
              <div className="h-full w-full flex items-center justify-center bg-background dark:bg-[#121212]">
                <Spinner size="lg" />
              </div>
            }
          >
            <ExcalidrawWhiteboard
              initialElements={activeNode.initialBoard?.elements || []}
              onBoardChange={(data) => {
                boardDataRef.current = data;
              }}
            />
          </Suspense>
        </main>

        {/* AI Tutor Panel Drawer (Replaces Library UI) */}
        {showTutor && (
          <aside
            style={{ width: `${tutorWidth}px` }}
            className="bg-card dark:bg-[#1b1b1b] flex flex-col shrink-0 min-w-[280px] max-w-[500px] border-l border-border h-full z-30 shadow-2xl transition-all duration-200"
          >
            {/* Tutor Header */}
            <div className="h-11 px-3.5 border-b border-border flex items-center justify-between shrink-0 bg-secondary/30">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    isAiSpeaking ? "bg-primary animate-ping" : "bg-emerald-500"
                  )}
                />
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-semibold text-foreground">AI Math Tutor</span>
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">
                    • Inspects Your Board
                  </span>
                </div>
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
                title="Close AI Tutor"
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
                    Interactive Maths Assistant
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[280px]">
                    Draw vectors, geometry, or equations on the board. The tutor can see your canvas and help guide your solutions.
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
                      <span className="flex items-center gap-1.5">
                        {msg.sender === 'student' ? (
                          <span className="text-foreground font-semibold">You</span>
                        ) : msg.type === 'success' ? (
                          <span className="text-emerald-500 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="text-foreground font-semibold">AI Tutor</span>
                        )}
                      </span>

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

            {/* Quick Action: Ask for Math Hint */}
            <div className="px-3 pt-2 pb-1 bg-card dark:bg-[#1b1b1b] border-t border-border flex items-center justify-between gap-1.5">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() =>
                  handleVerifyWithTutor(
                    'Can you inspect my board and give me a gentle hint on how to construct or solve this?'
                  )
                }
                disabled={isEvaluating}
                className="flex-1 h-7 text-xs font-medium border-border hover:bg-secondary text-muted-foreground hover:text-foreground gap-1.5"
                title="Ask for a guidance hint on your board drawing"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Ask for a Math Hint</span>
              </Button>
            </div>

            {/* Input Form with Voice Microphone & Send */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!studentInput.trim() || isEvaluating) return;
                const q = studentInput.trim();
                setStudentInput('');
                handleVerifyWithTutor(q);
              }}
              className="p-3 bg-card dark:bg-[#1b1b1b] border-t border-border"
            >
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={toggleMicrophoneInput}
                  title={isListeningMic ? 'Stop listening' : 'Ask with your voice'}
                  className={cn(
                    "h-8 w-8 shrink-0 transition",
                    isListeningMic
                      ? "bg-rose-500/25 border-rose-500 text-rose-400 animate-pulse"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isListeningMic ? (
                    <MicOff className="w-3.5 h-3.5" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                </Button>
                <input
                  type="text"
                  value={studentInput}
                  onChange={(e) => setStudentInput(e.target.value)}
                  placeholder={
                    isListeningMic
                      ? interimVoiceTranscript || 'Listening...'
                      : 'Ask about vectors, theorem, or formulas...'
                  }
                  className="flex-1 bg-secondary/60 border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isEvaluating || !studentInput.trim()}
                  className="h-8 w-8 shrink-0"
                >
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

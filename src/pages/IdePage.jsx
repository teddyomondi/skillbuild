import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { toast, Toaster } from 'sonner';
import {
  Terminal as TerminalIcon,
  FolderTree,
  Sparkles,
  CheckCircle2,
  Send,
  Code2,
  ChevronRight,
  Eye,
  X,
  PanelLeft,
  PanelRight,
  PanelBottom,
  Plus,
  ArrowLeft,
  ArrowRight,
  Mic,
  MicOff,
  Radio,
  HelpCircle,
  Volume2,
  Compass,
} from 'lucide-react';
import { ROADMAP_TRACKS } from '@/data/roadmapCurriculum.js';
import {
  evaluateWithSocraticAI,
  generateDynamicLessonStepNarration,
  generateMidLessonReflection,
  generateInterfaceAwareVoiceResponse,
  speakNarration,
  stopNarration,
  onAiSpeakingStateChange,
  startMicrophoneRecognition,
} from '@/services/socraticAiTutor.js';
import {
  appendInterfaceEvent,
  buildInterfaceContextSnapshot,
} from '@/services/interfaceTracker.js';
import {
  buildIdeRoute,
  buildCourseTrackRoute,
  navigateToRoute,
} from '@/services/routeManager.js';
import { getOrBootWebContainer, runCodeInWorkspace } from '@/services/runtimeEngine.js';
import { UserButton } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button.jsx';
import { cn } from '@/lib/utils.js';
import AiScreenCursor from '@/components/AiScreenCursor.jsx';
import ExcalidrawWhiteboard from '@/components/ExcalidrawWhiteboard.jsx';
import AppErrorBoundary from '@/components/AppErrorBoundary.jsx';

export default function IdePage({
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
  // Active Track, Current Module & Next Module
  const activeTrack = useMemo(() => {
    const candidate = tracks.find((track) => track.id === activeTrackId) || tracks[0];
    const usableTrack = candidate?.nodes?.length ? candidate : ROADMAP_TRACKS[0];
    const nodes = usableTrack.nodes.filter((node) => node && typeof node.id === 'string');
    return {
      ...usableTrack,
      title: usableTrack.title || 'Course',
      nodes: nodes.length ? nodes : ROADMAP_TRACKS[0].nodes,
    };
  }, [tracks, activeTrackId]);

  const activeNode = useMemo(() => {
    const candidate =
      activeTrack.nodes.find((node) => node.id === activeNodeId) ||
      activeTrack.nodes[0] ||
      ROADMAP_TRACKS[0].nodes[0];
    return {
      ...candidate,
      title: candidate.title || 'Lesson',
      description: candidate.description || '',
      initialFiles:
        candidate.initialFiles && typeof candidate.initialFiles === 'object'
          ? candidate.initialFiles
          : {},
      aiTimeline: Array.isArray(candidate.aiTimeline) ? candidate.aiTimeline : [],
      challengeSpec: candidate.challengeSpec || {},
    };
  }, [activeTrack, activeNodeId]);

  const currentModuleIndex = useMemo(
    () => Math.max(0, activeTrack.nodes.findIndex((n) => n.id === activeNode.id)),
    [activeTrack, activeNode]
  );
  const nextModule = useMemo(
    () => activeTrack.nodes[currentModuleIndex + 1] || null,
    [activeTrack, currentModuleIndex]
  );

  // Virtual File System & Open Tabs
  const [files, setFiles] = useState(
    () => moduleWorkspaces[activeNode.id]?.files || activeNode.initialFiles
  );
  const [mathBoardData, setMathBoardData] = useState({
    elements: [],
    vectors: [],
    pointsCount: 0,
    strokesCount: 0,
    texts: [],
  });
  const isMathLesson = activeTrack.id === 'mathematics' || activeNode.isMathBoard;
  const [openTabs, setOpenTabs] = useState(Object.keys(activeNode.initialFiles).slice(0, 2));
  const [activeFile, setActiveFile] = useState(
    Object.keys(activeNode.initialFiles)[0] || 'index.html'
  );

  useEffect(() => {
    const savedFiles = moduleWorkspaces[activeNode.id]?.files;
    const nextFiles =
      savedFiles && Object.keys(savedFiles).length > 0
        ? savedFiles
        : activeNode.initialFiles || {};
    const fileNames = Object.keys(nextFiles);
    const preferredFile = activeNode.challengeSpec?.targetFile;
    const nextActiveFile = fileNames.includes(preferredFile)
      ? preferredFile
      : fileNames.includes('index.html')
      ? 'index.html'
      : fileNames.includes('index.js')
      ? 'index.js'
      : fileNames[0] || null;

    setFiles(nextFiles);
    setActiveFile(nextActiveFile);
    setOpenTabs(fileNames.slice(0, 2));
  }, [activeTrack.id, activeNode.id]);

  const [activeMainWorkspaceTab, setActiveMainWorkspaceTab] = useState(() =>
    activeTrack?.id === 'mathematics' || activeNode?.isMathBoard ? 'board' : 'code'
  );

  useEffect(() => {
    if (activeNode?.isMathBoard || activeTrack?.id === 'mathematics') {
      setActiveMainWorkspaceTab('board');
      setShowPreviewPane(false);
      setShowTerminalPane(false);
    } else {
      setActiveMainWorkspaceTab('code');
    }
  }, [activeNode?.id, activeNode?.isMathBoard, activeTrack?.id]);

  // Clean Student Workspace Panel Visibility
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showPreviewPane, setShowPreviewPane] = useState(
    () =>
      activeNode.challengeSpec?.targetFile === 'index.html' ||
      !activeNode.initialFiles['index.js']
  );
  const [showTerminalPane, setShowTerminalPane] = useState(
    () =>
      activeNode.challengeSpec?.targetFile !== 'index.html' &&
      Boolean(activeNode.initialFiles['index.js'])
  );
  const [showTutorPane, setShowTutorPane] = useState(true);
  const [showChallengeBanner, setShowChallengeBanner] = useState(true);

  // Resizable Panel Dimensions
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(220);
  const [previewWidth, setPreviewWidth] = useState(320);
  const [tutorWidth, setTutorWidth] = useState(350);
  const [terminalHeight, setTerminalHeight] = useState(145);
  const [draggingSplitter, setDraggingSplitter] = useState(null);

  // Lesson Interaction Mode: 'AI_STREAMING' | 'LESSON_REFLECTION' | 'STUDENT_CHALLENGE' | 'COMPLETED'
  const [interactionMode, setInteractionMode] = useState('AI_STREAMING');
  const [timelineStepIndex, setTimelineStepIndex] = useState(0);
  const [typingProgress, setTypingProgress] = useState(0);
  const [highlightedLine, setHighlightedLine] = useState(1);

  // Smooth On-Screen AI Instructor Cursor State
  const [aiCursor, setAiCursor] = useState({
    visible: true,
    x: 340,
    y: 190,
    label: 'Starting lesson...',
    sublabel: '',
    mode: 'glide',
    variant: 'teach',
    pulseKey: 1,
  });

  // Live AI Voice, Single-Line Subtitle & Microphone State
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [activeSubtitleLine, setActiveSubtitleLine] = useState('');
  const [isHoveringSubtitle, setIsHoveringSubtitle] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [interimVoiceTranscript, setInterimVoiceTranscript] = useState('');

  // Silent Background Interface Telemetry
  const [cursorPosition, setCursorPosition] = useState({ lineNumber: 1, column: 1 });
  const [selectedText, setSelectedText] = useState('');
  const [editorMarkers, setEditorMarkers] = useState([]);
  const [interfaceEvents, setInterfaceEvents] = useState([]);

  // Console Output State
  const [terminalLines, setTerminalLines] = useState([
    'Ready. Click "Run Code" to test your program or "Check Solution" when finished.',
  ]);
  const [lastRuntimeOutput, setLastRuntimeOutput] = useState('');
  const [isRunningCode, setIsRunningCode] = useState(false);

  // Tutor Conversation State
  const [tutorMessages, setTutorMessages] = useState(() => {
    const raw = moduleWorkspaces[activeNode.id]?.tutorMessages || [];
    return raw.filter((m) => m.type !== 'narration' && m.type !== 'concept-question');
  });
  const [studentInput, setStudentInput] = useState('');
  const [attemptCount, setAttemptCount] = useState(
    () => moduleWorkspaces[activeNode.id]?.attemptCount || 0
  );
  const [isEvaluating, setIsEvaluating] = useState(false);
  const pendingLessonResumeRef = useRef(null);

  const editorRef = useRef(null);
  const editorContainerRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const typingTimerRef = useRef(null);
  const micRecognitionRef = useRef(null);
  const lastCursorLogTimeRef = useRef(0);
  const lastEditLogTimeRef = useRef(0);
  const hasAutoStartedInitialRef = useRef(false);
  const lessonSessionIdRef = useRef(0);
  const subtitleBoxRef = useRef(null);

  const recordEvent = useCallback((type, detail, meta = {}) => {
    setInterfaceEvents((prev) => appendInterfaceEvent(prev, type, detail, meta));
  }, []);

  // AI Cursor Movement
  const moveAiCursorToEditorPosition = useCallback(
    (lineNumber = 1, column = 1, { label = '', sublabel = '', mode = 'glide', variant = 'teach' } = {}) => {
      const editor = editorRef.current;
      const container = editorContainerRef.current;
      if (!editor || !container) return;

      try {
        editor.revealLineInCenterIfOutsideViewport?.(lineNumber);
        const pos = editor.getScrolledVisiblePosition({
          lineNumber: Math.max(1, lineNumber),
          column: Math.max(1, column),
        });
        const rect = container.getBoundingClientRect();

        if (pos && rect) {
          const targetX = Math.min(window.innerWidth - 60, Math.max(60, rect.left + pos.left + 14));
          const targetY = Math.min(window.innerHeight - 60, Math.max(55, rect.top + pos.top + 10));

          setAiCursor((prev) => ({
            visible: true,
            x: targetX,
            y: targetY,
            label: label || prev.label,
            sublabel: sublabel !== undefined ? sublabel : prev.sublabel,
            mode,
            variant,
            pulseKey: mode === 'glide' ? prev.pulseKey + 1 : prev.pulseKey,
          }));
        }
      } catch {
        // ignore layout transitions
      }
    },
    []
  );

  const moveAiCursorToUiElement = useCallback(
    (uiId, { label = '', sublabel = '', variant = 'teach' } = {}) => {
      if (typeof document === 'undefined') return;
      const el = document.querySelector(`[data-ai-target="${uiId}"]`);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const targetX = rect.left + Math.min(rect.width * 0.45, 140);
      const targetY = rect.top + Math.min(rect.height * 0.5, 45);

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
    },
    []
  );

  const applyAiCursorTarget = useCallback(
    (cursorTarget, variant = 'teach', sublabel = '') => {
      if (!cursorTarget) return;
      if (cursorTarget.type === 'ui' && cursorTarget.uiId) {
        moveAiCursorToUiElement(cursorTarget.uiId, {
          label: cursorTarget.label || '',
          sublabel,
          variant,
        });
      } else {
        moveAiCursorToEditorPosition(
          cursorTarget.line || cursorPosition.lineNumber || 1,
          cursorTarget.column || 12,
          {
            label: cursorTarget.label || `Line ${cursorTarget.line || 1}`,
            sublabel,
            mode: 'glide',
            variant,
          }
        );
      }
    },
    [moveAiCursorToEditorPosition, moveAiCursorToUiElement, cursorPosition.lineNumber]
  );

  // Interface Context Snapshot
  const interfaceSnapshot = useMemo(
    () =>
      buildInterfaceContextSnapshot({
        currentView: 'ide',
        activeTrack,
        activeNode,
        activeFile,
        openTabs,
        files,
        boardData: mathBoardData,
        cursorPosition,
        selectedText,
        editorMarkers,
        interactionMode,
        timelineStepIndex,
        lastRuntimeOutput,
        terminalLines,
        panels: {
          leftSidebar: showLeftSidebar,
          preview: showPreviewPane,
          terminal: showTerminalPane,
          tutor: showTutorPane,
        },
        recentEvents: interfaceEvents,
      }),
    [
      activeTrack,
      activeNode,
      activeFile,
      openTabs,
      files,
      mathBoardData,
      cursorPosition,
      selectedText,
      editorMarkers,
      interactionMode,
      timelineStepIndex,
      lastRuntimeOutput,
      terminalLines,
      showLeftSidebar,
      showPreviewPane,
      showTerminalPane,
      showTutorPane,
      interfaceEvents,
    ]
  );

  const snapshotRef = useRef(interfaceSnapshot);
  useEffect(() => {
    snapshotRef.current = interfaceSnapshot;
  }, [interfaceSnapshot]);

  // Speaking state & subtitle listener
  useEffect(() => {
    getOrBootWebContainer();
    const unsubscribeSpeak = onAiSpeakingStateChange((speaking, subtitleLine) => {
      setIsAiSpeaking(speaking);
      setActiveSubtitleLine(subtitleLine || '');
      if (!subtitleLine) {
        setIsHoveringSubtitle(false);
      }
    });

    const handleGlobalMouseMoveForSubtitle = (e) => {
      const box = subtitleBoxRef.current;
      if (!box) return;
      const rect = box.getBoundingClientRect();
      const pad = 8;
      const inside =
        e.clientX >= rect.left - pad &&
        e.clientX <= rect.right + pad &&
        e.clientY >= rect.top - pad &&
        e.clientY <= rect.bottom + pad;
      setIsHoveringSubtitle((prev) => (prev === inside ? prev : inside));
    };

    window.addEventListener('mousemove', handleGlobalMouseMoveForSubtitle, { passive: true });

    return () => {
      unsubscribeSpeak();
      window.removeEventListener('mousemove', handleGlobalMouseMoveForSubtitle);
      stopNarration();
    };
  }, []);

  // Save current workspace state back to parent moduleWorkspaces
  useEffect(() => {
    if (interactionMode === 'AI_STREAMING') return;
    const cleanTutorMsgs = tutorMessages.filter(
      (m) => m.type !== 'narration' && m.type !== 'concept-question'
    );
    setModuleWorkspaces((prev) => ({
      ...prev,
      [activeNode.id]: {
        files,
        attemptCount,
        tutorMessages: cleanTutorMsgs.slice(-25),
        status: activeNode.status,
        updatedAt: new Date().toISOString(),
      },
    }));
  }, [files, attemptCount, tutorMessages, interactionMode, activeNode.id, activeNode.status, setModuleWorkspaces]);

  // Drag resizing
  useEffect(() => {
    if (!draggingSplitter) return;

    const handleMouseMove = (e) => {
      if (draggingSplitter === 'left') {
        setLeftSidebarWidth(Math.max(170, Math.min(420, e.clientX)));
      } else if (draggingSplitter === 'tutor') {
        setTutorWidth(Math.max(260, Math.min(560, window.innerWidth - e.clientX)));
      } else if (draggingSplitter === 'preview') {
        const rightOffset = showTutorPane ? tutorWidth : 0;
        setPreviewWidth(Math.max(200, Math.min(520, window.innerWidth - rightOffset - e.clientX)));
      } else if (draggingSplitter === 'terminal') {
        setTerminalHeight(Math.max(80, Math.min(420, window.innerHeight - e.clientY)));
      }
    };

    const handleMouseUp = () => setDraggingSplitter(null);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingSplitter, showTutorPane, tutorWidth]);

  const openFileTab = (filename) => {
    if (!openTabs.includes(filename)) {
      setOpenTabs((prev) => [...prev, filename]);
    }
    setActiveFile(filename);
    recordEvent('file_switch', `Focused ${filename}`);
  };

  const closeFileTab = (e, filename) => {
    e.stopPropagation();
    const updated = openTabs.filter((f) => f !== filename);
    setOpenTabs(updated);
    if (activeFile === filename) {
      setActiveFile(updated[updated.length - 1] || null);
    }
  };

  // Highlight active teaching line in Monaco
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const monaco = monacoRef.current;
    if (!highlightedLine) {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
      return;
    }
    const className =
      interactionMode === 'AI_STREAMING'
        ? 'ai-live-line-highlight'
        : 'student-challenge-line-highlight';

    decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [
      {
        range: new monaco.Range(highlightedLine, 1, highlightedLine, 1),
        options: {
          isWholeLine: true,
          className,
        },
      },
    ]);
  }, [highlightedLine, interactionMode]);

  // AI Live Walkthrough Engine
  const startAiLiveLesson = useCallback(
    async (stepIdx = 0, nodeOverride = null) => {
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
      const targetFile = step.file || 'index.js';
      setActiveFile(targetFile);
      setOpenTabs((prev) => (prev.includes(targetFile) ? prev : [...prev, targetFile]));

      const isMath = Boolean(targetNode.isMathBoard || activeTrack?.id === 'mathematics');
      const focusLine = step.highlightLine || 1;
      setHighlightedLine(focusLine);

      if (step.cursorTarget) {
        applyAiCursorTarget(step.cursorTarget, step.isChallengeStop ? 'handoff' : 'teach');
      } else if (isMath && step.isChallengeStop) {
        moveAiCursorToUiElement('math-tool-vector', {
          label: 'Select Vector Tool',
          variant: 'handoff',
        });
      } else if (isMath) {
        moveAiCursorToUiElement('math-board-canvas', {
          label: targetNode.title.replace(/^\d+\.\s*/, '').split('(')[0].trim(),
          variant: 'teach',
        });
      } else {
        moveAiCursorToEditorPosition(focusLine, 4, {
          label:
            stepIdx === 0
              ? targetNode.title.replace(/^\d+\.\s*/, '').split('(')[0].trim()
              : step.isChallengeStop
              ? `Your turn at Line ${focusLine}`
              : `Line ${focusLine}`,
          sublabel: '',
          mode: 'glide',
          variant: step.isChallengeStop ? 'handoff' : 'teach',
        });
      }

      const targetCode = step.codeSnapshot || '';
      const prevCode = (stepIdx > 0 ? timeline[stepIdx - 1]?.codeSnapshot : '') || '';
      let charIndex =
        prevCode.length > 0 && targetCode.startsWith(prevCode.slice(0, 40))
          ? Math.min(prevCode.length, targetCode.length)
          : 0;

      let typingFinished = !targetCode;
      let speechFinished = false;

      const checkAdvanceStep = () => {
        if (sessionId !== lessonSessionIdRef.current) return;
        if (!typingFinished || !speechFinished) return;
        const isOnlyStepPractice = timeline.length === 1 && step.isChallengeStop;
        const isMidLessonStep =
          timeline.length > 1 &&
          stepIdx === Math.floor((timeline.length - 1) / 2) &&
          !step.isChallengeStop;

        if (isOnlyStepPractice || isMidLessonStep) {
          const continueWithLesson = stepIdx + 1 < timeline.length;
          pendingLessonResumeRef.current = {
            node: targetNode,
            stepIndex: stepIdx + 1,
            finishLesson: !continueWithLesson,
            focusLine,
          };
          setInteractionMode('LESSON_REFLECTION');
          setShowTutorPane(true);
          if (isMath) {
            moveAiCursorToUiElement('math-board-canvas', {
              label: 'Pause and think',
              sublabel: 'Reply to the tutor to continue',
              variant: 'handoff',
            });
          } else {
            moveAiCursorToEditorPosition(focusLine, 6, {
              label: 'Pause and think',
              sublabel: 'Reply to the tutor to continue',
              mode: 'glide',
              variant: 'handoff',
            });
          }
          generateMidLessonReflection({
            activeNode: targetNode,
            step,
            interfaceSnapshot: snapshotRef.current,
          }).then((reflection) => {
            if (sessionId !== lessonSessionIdRef.current) return;
            setTutorMessages((prev) => [
              ...prev,
              {
                id: `reflection-${Date.now()}`,
                sender: 'ai',
                type: 'lesson-reflection',
                text: reflection.question,
              },
            ]);
            speakNarration(reflection.question);
          });
        } else if (step.isChallengeStop || stepIdx === timeline.length - 1) {
          setInteractionMode('STUDENT_CHALLENGE');
          if (isMath) {
            moveAiCursorToUiElement('math-tool-vector', {
              label: 'Your turn on the Digital Board',
              variant: 'handoff',
            });
          } else {
            moveAiCursorToEditorPosition(focusLine, 6, {
              label: `Your turn at Line ${focusLine}`,
              sublabel: '',
              mode: 'glide',
              variant: 'handoff',
            });
          }
        } else {
          setTimeout(() => {
            if (sessionId === lessonSessionIdRef.current) {
              startAiLiveLesson(stepIdx + 1, targetNode);
            }
          }, 850);
        }
      };

      if (targetCode) {
        typingTimerRef.current = setInterval(() => {
          if (sessionId !== lessonSessionIdRef.current) {
            clearInterval(typingTimerRef.current);
            return;
          }
          charIndex = Math.min(targetCode.length, charIndex + 5);
          const partial = targetCode.slice(0, charIndex);
          setFiles((prev) => ({
            ...prev,
            [targetFile]: partial,
          }));
          setTypingProgress(Math.round((charIndex / targetCode.length) * 100));

          const typedLines = partial.split('\n');
          const activeTypingLine = typedLines.length;
          const activeTypingCol = (typedLines[typedLines.length - 1] || '').length + 1;

          moveAiCursorToEditorPosition(activeTypingLine, activeTypingCol, {
            mode: 'typing',
            variant: step.isChallengeStop ? 'handoff' : 'teach',
          });

          if (charIndex >= targetCode.length) {
            clearInterval(typingTimerRef.current);
            typingFinished = true;
            moveAiCursorToEditorPosition(focusLine, 10, {
              mode: 'glide',
              variant: step.isChallengeStop ? 'handoff' : 'teach',
            });
            checkAdvanceStep();
          }
        }, 35);
      } else {
        checkAdvanceStep();
      }

      const dynamicNarration = await generateDynamicLessonStepNarration({
        activeNode: targetNode,
        stepIndex: stepIdx,
        totalSteps: timeline.length,
        step,
        interfaceSnapshot: snapshotRef.current,
      });

      if (sessionId !== lessonSessionIdRef.current) return;

      if (dynamicNarration.cursorLabel) {
        setAiCursor((prev) => ({
          ...prev,
          label: dynamicNarration.cursorLabel,
          sublabel: '',
        }));
      }

      const spokenScript = dynamicNarration.spokenText || dynamicNarration.text;
      speakNarration(spokenScript, true, () => {
        speechFinished = true;
        checkAdvanceStep();
      });
    },
    [activeNode, activeTrack, applyAiCursorTarget, moveAiCursorToEditorPosition, moveAiCursorToUiElement]
  );

  // Switch Module
  const selectRoadmapNode = useCallback(
    (node, trackIdOverride = null, forceReset = false) => {
      const targetTrackId = trackIdOverride || activeTrackId;
      const targetTrack =
        tracks.find((track) => track.id === targetTrackId) ||
        (targetTrackId === activeTrackId ? activeTrack : null);
      const targetIndex = targetTrack?.nodes.findIndex((item) => item.id === node.id) ?? -1;
      const hasUnfinishedPrerequisite =
        targetIndex > 0 &&
        targetTrack.nodes.slice(0, targetIndex).some((item) => item.status !== 'completed');
      const isUnlistedNextModule = targetTrack && targetIndex === -1 && targetTrack.id === activeTrackId;
      const unfinishedPreviousModule =
        hasUnfinishedPrerequisite ||
        (isUnlistedNextModule && activeNode.status !== 'completed' && interactionMode !== 'COMPLETED');

      if (unfinishedPreviousModule) {
        toast.error('Complete the current module to unlock the next one.');
        return;
      }

      lessonSessionIdRef.current += 1;
      clearInterval(typingTimerRef.current);
      stopNarration();
      pendingLessonResumeRef.current = null;
      if (trackIdOverride) {
        setActiveTrackId(trackIdOverride);
      }
      setActiveNodeId(node.id);

      navigateToRoute(buildIdeRoute(targetTrackId, node.id), {
        title: node.title.replace(/^\d+\.\s*/, ''),
      });

      const savedForNode = !forceReset ? moduleWorkspaces[node.id] : null;
      const initialOrSavedFiles =
        savedForNode?.files && Object.keys(savedForNode.files).length > 0
          ? savedForNode.files
          : { ...node.initialFiles };

      setFiles(initialOrSavedFiles);
      setMathBoardData({ elements: [], vectors: [], pointsCount: 0, strokesCount: 0, texts: [] });
      const fileKeys = Object.keys(initialOrSavedFiles);
      const isHtmlPrimary =
        node.challengeSpec?.targetFile === 'index.html' ||
        (!fileKeys.includes('index.js') && fileKeys.includes('index.html'));
      const firstFile = isHtmlPrimary
        ? 'index.html'
        : fileKeys.includes('index.js')
        ? 'index.js'
        : fileKeys[0];

      setOpenTabs(fileKeys.slice(0, 2));
      setActiveFile(firstFile);
      const isMath = Boolean(node.isMathBoard || targetTrackId === 'mathematics');
      if (isMath) {
        setShowPreviewPane(false);
        setShowTerminalPane(false);
        setActiveMainWorkspaceTab('board');
      } else {
        setShowPreviewPane(isHtmlPrimary);
        setShowTerminalPane(!isHtmlPrimary);
        setActiveMainWorkspaceTab('code');
      }
      setTimelineStepIndex(0);
      setHighlightedLine(1);
      setAttemptCount(savedForNode?.attemptCount || 0);
      setShowChallengeBanner(true);
      const rawSavedMsgs = savedForNode?.tutorMessages || [];
      setTutorMessages(
        rawSavedMsgs.filter((m) => m.type !== 'narration' && m.type !== 'concept-question')
      );

      recordEvent('module_select', `Opened module "${node.title}"`);

      if (savedForNode?.files && !forceReset) {
        setInteractionMode(node.status === 'completed' ? 'COMPLETED' : 'STUDENT_CHALLENGE');
      } else {
        setTimeout(() => {
          startAiLiveLesson(0, node);
        }, 180);
      }
    },
    [
      activeTrackId,
      activeTrack,
      activeNode,
      interactionMode,
      tracks,
      moduleWorkspaces,
      recordEvent,
      startAiLiveLesson,
      setActiveTrackId,
      setActiveNodeId,
    ]
  );

  const handleStudentForkOrEdit = (newValue) => {
    if (!activeFile) return;
    if (interactionMode === 'AI_STREAMING') {
      lessonSessionIdRef.current += 1;
      clearInterval(typingTimerRef.current);
      stopNarration();
      setInteractionMode('STUDENT_CHALLENGE');
      recordEvent(
        'ai_stream_fork',
        `Student started coding in ${activeFile} at line ${cursorPosition.lineNumber}`
      );
      const timeline = activeNode.aiTimeline || [];
      const finalChallengeStep = timeline[timeline.length - 1];
      if (
        finalChallengeStep?.codeSnapshot &&
        newValue.length < finalChallengeStep.codeSnapshot.length - 15
      ) {
        setFiles((prev) => ({
          ...prev,
          [activeFile]: finalChallengeStep.codeSnapshot,
        }));
        return;
      }
    } else {
      const now = Date.now();
      if (now - lastEditLogTimeRef.current > 2500) {
        lastEditLogTimeRef.current = now;
        const lines = newValue.split('\n');
        const activeLineContent = (lines[cursorPosition.lineNumber - 1] || '').trim();
        recordEvent(
          'code_edit',
          `Edited ${activeFile} at Ln ${cursorPosition.lineNumber}${
            activeLineContent ? `: "${activeLineContent.slice(0, 45)}"` : ''
          }`
        );
      }
    }

    setFiles((prev) => ({
      ...prev,
      [activeFile]: newValue,
    }));
  };

  const handleExplainSelection = async () => {
    setIsEvaluating(true);
    if (!showTutorPane) setShowTutorPane(true);

    const obs = await generateInterfaceAwareVoiceResponse({
      triggerType: 'selection_explain',
      interfaceSnapshot: snapshotRef.current,
      activeNode,
      chatHistory: tutorMessages,
    });

    if (obs.cursorTarget) {
      applyAiCursorTarget(obs.cursorTarget, 'teach');
    }

    setTutorMessages((prev) => [
      ...prev,
      {
        id: `ai-obs-${Date.now()}`,
        sender: 'ai',
        type: 'socratic-hint',
        text: obs.reply,
      },
    ]);

    speakNarration(obs.spokenText || obs.reply);
    setIsEvaluating(false);
  };

  const handleRunCode = async () => {
    if (isMathLesson) {
      const summary = `Math board work: ${mathBoardData.vectors.length} vectors, ${mathBoardData.pointsCount} points, ${mathBoardData.strokesCount} drawings.`;
      setLastRuntimeOutput(summary);
      return summary;
    }
    const isHtmlLesson =
      activeNode.challengeSpec?.targetFile === 'index.html' || !files['index.js'];

    if (isHtmlLesson) {
      if (!showPreviewPane) setShowPreviewPane(true);
      const htmlContent = files['index.html'] || '';
      const plainSummary = htmlContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const summaryOut = `HTML Preview Rendered: ${plainSummary.slice(0, 120)}`;
      setLastRuntimeOutput(summaryOut);
      return summaryOut;
    }

    setIsRunningCode(true);
    if (!showTerminalPane) setShowTerminalPane(true);
    const out = await runCodeInWorkspace(files, 'index.js', (chunk) => {
      const cleaned = chunk.replace(/\r?\n$/, '');
      if (cleaned) {
        setTerminalLines((prev) => [...prev.slice(-60), cleaned]);
      }
    });
    setLastRuntimeOutput(out);
    setIsRunningCode(false);

    recordEvent(
      'code_execution',
      `Ran index.js -> ${out ? out.replace(/\n/g, ' | ').slice(0, 70) : 'No output'}`
    );

    return out;
  };

  const injectCustomNextModule = useCallback(
    (customModule) => {
      if (!customModule) return;
      setTracks((prevTracks) =>
        prevTracks.map((track) => {
          if (track.id !== activeTrack.id) return track;
          if (
            track.nodes.some(
              (n) => n.id === customModule.id || n.title === customModule.title
            )
          ) {
            return track;
          }
          const idx = track.nodes.findIndex((n) => n.id === activeNode.id);
          const updatedNodes = [...track.nodes];
          updatedNodes.splice(idx + 1, 0, customModule);
          return { ...track, nodes: updatedNodes };
        })
      );
    },
    [activeTrack.id, activeNode.id, setTracks]
  );

  const handleVerifyWithTutor = async (customQuestion = null) => {
    if (customQuestion && interactionMode === 'AI_STREAMING' && !pendingLessonResumeRef.current) {
      clearInterval(typingTimerRef.current);
      lessonSessionIdRef.current += 1;
      stopNarration();
      pendingLessonResumeRef.current = {
        node: activeNode,
        stepIndex: timelineStepIndex,
        finishLesson: false,
      };
      setInteractionMode('LESSON_REFLECTION');
    }
    setIsEvaluating(true);
    if (!showTutorPane) setShowTutorPane(true);
    const nextAttempt = attemptCount + 1;
    if (!customQuestion) setAttemptCount(nextAttempt);

    const targetFile = activeNode.challengeSpec?.targetFile || 'index.js';
    const currentCode = files[targetFile] || files[activeFile] || '';

    const freshOutput = customQuestion ? lastRuntimeOutput : await handleRunCode();

    if (customQuestion) {
      recordEvent('learner_question', `Asked: "${customQuestion.slice(0, 60)}"`);
      setTutorMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          sender: 'student',
          text: customQuestion,
        },
      ]);
    } else {
      recordEvent('verify_attempt', `Checked solution (Attempt #${nextAttempt})`);
    }

    const freshSnapshot = {
      ...snapshotRef.current,
      boardData: mathBoardData,
      lastRuntimeOutput: freshOutput,
    };

    const result = await evaluateWithSocraticAI({
      learnerCode: currentCode,
      runtimeOutput: freshOutput,
      activeNode,
      learnerQuestion: customQuestion,
      attemptCount: nextAttempt,
      interfaceSnapshot: freshSnapshot,
      chatHistory: tutorMessages,
    });

    if (!result.isAiGenerated) {
      toast.error('The AI tutor could not be reached. Check the server AI settings.');
    }

    if (result.cursorTarget) {
      if (result.cursorTarget.line) {
        setHighlightedLine(result.cursorTarget.line);
      }
      applyAiCursorTarget(result.cursorTarget, result.passed ? 'success' : 'handoff');
    }

    if (result.detourNode) {
      injectCustomNextModule(result.detourNode);
    }

    if (result.passed && !customQuestion) {
      setInteractionMode('COMPLETED');
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
    speakNarration(result.spokenText || result.reply, true, () => {
      if (!customQuestion || !pendingLessonResumeRef.current) return;
      const resume = pendingLessonResumeRef.current;
      pendingLessonResumeRef.current = null;
      setTimeout(() => {
        if (resume.finishLesson) {
          setInteractionMode('STUDENT_CHALLENGE');
          moveAiCursorToEditorPosition(resume.focusLine || 1, 6, {
            label: `Your turn at Line ${resume.focusLine || 1}`,
            sublabel: '',
            mode: 'glide',
            variant: 'handoff',
          });
        } else {
          startAiLiveLesson(resume.stepIndex, resume.node);
        }
      }, 300);
    });
  };

  const handleAnswerConceptQuestion = (opt) => {
    handleVerifyWithTutor(opt);
  };

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

  const livePreviewSrcDoc = useMemo(() => {
    const html =
      files['index.html'] ||
      '<div class="card"><h3>Live Preview</h3><p>Run your code to inspect output below.</p></div>';
    const css =
      files['styles.css'] ||
      'body { background: #18181b; color: #f4f4f5; font-family: "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 1rem; }';
    const hasJs = Boolean(files['index.js']);
    return `<!DOCTYPE html>
<html>
<head>
<style>${css}</style>
</head>
<body>
${html}
${
  hasJs
    ? `<div style="margin-top:14px;padding:12px;background:#18181b;border:1px solid #27272a;border-radius:8px;font-family:monospace;font-size:12px;color:#f4f4f5;">
  <div style="color:#a1a1aa;margin-bottom:4px;font-weight:600;">Console Output:</div>
  <pre style="margin:0;white-space:pre-wrap;">${
    lastRuntimeOutput || 'Click "Run Code" to execute index.js'
  }</pre>
</div>`
    : ''
}
</body>
</html>`;
  }, [files, lastRuntimeOutput]);

  const closedFiles = useMemo(
    () => Object.keys(files).filter((f) => !openTabs.includes(f)),
    [files, openTabs]
  );

  return (
    <div
      className={cn(
        "h-screen w-screen flex flex-col bg-background dark:bg-[#191919] text-foreground font-sans overflow-hidden select-none",
        draggingSplitter && "cursor-ew-resize"
      )}
    >
      <Toaster position="bottom-center" />
      <AiScreenCursor
        cursorState={aiCursor}
        isAiSpeaking={isAiSpeaking}
        interactionMode={interactionMode}
      />

      {activeSubtitleLine && (
        <div
          ref={subtitleBoxRef}
          style={{ opacity: isHoveringSubtitle ? 0.15 : 1 }}
          className="fixed bottom-16 sm:bottom-7 left-1/2 -translate-x-1/2 z-[70] pointer-events-none max-w-[94vw] transition-opacity duration-200 ease-out select-none px-2"
          aria-live="polite"
        >
          <div
            style={{
              letterSpacing: '0.012em',
              fontFamily: '"DM Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.9), 0 1px 3px rgba(0, 0, 0, 0.8)',
            }}
            className="bg-neutral-900/90 text-white px-3.5 sm:px-6 py-1.5 sm:py-2.5 rounded-xl text-center text-xs sm:text-2xl md:text-3xl max-h-16 sm:max-h-none overflow-hidden text-ellipsis font-medium border border-white/10 shadow-2xl backdrop-blur-md"
          >
            {activeSubtitleLine}
          </div>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <header className="h-12 bg-background dark:bg-[#1F1F1F] border-b border-border px-3.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearInterval(typingTimerRef.current);
              stopNarration();
              onBackToCourses?.();
            }}
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
            <span className="text-muted-foreground font-medium truncate max-w-[240px]">
              {activeNode.title.replace(/^\d+\.\s*/, '')}
            </span>
            {activeTrack.isCustomGenerated && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[10px] font-semibold shrink-0">
                Industry 4.0
              </span>
            )}
            {activeNode.isDetour && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 text-[10px] font-medium shrink-0">
                Personalized
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isMathLesson && (
            <Button
              variant="outline"
              size="sm"
              data-ai-target="run-button"
              onClick={() => handleRunCode(false)}
              disabled={isRunningCode || interactionMode === 'LESSON_REFLECTION'}
              className="hidden sm:inline-flex h-8 gap-1.5 px-3 text-xs font-medium border-border hover:bg-secondary text-foreground shadow-xs"
            >
              <TerminalIcon className="w-3.5 h-3.5 text-emerald-500" />
              {isRunningCode ? 'Running...' : 'Run Code'}
            </Button>
          )}

          <Button
            size="sm"
            data-ai-target="verify-button"
            onClick={() => handleVerifyWithTutor(null)}
            disabled={isEvaluating || interactionMode === 'LESSON_REFLECTION'}
            className="hidden sm:inline-flex h-8 gap-1.5 px-3.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isEvaluating ? 'Checking...' : 'Check Solution'}
          </Button>

          {nextModule && (
            <Button
              size="sm"
              onClick={() => selectRoadmapNode(nextModule)}
              disabled={interactionMode !== 'COMPLETED'}
              title={`Up Next: ${nextModule.title.replace(/^\d+\.\s*/, '')}`}
              className={cn(
                "hidden sm:inline-flex h-8 gap-1.5 px-3 text-xs font-semibold shadow-xs",
                interactionMode === 'COMPLETED'
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "opacity-40"
              )}
            >
              <span>Next Module</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}

          <div className="hidden sm:flex items-center gap-0.5 bg-secondary/50 border border-border p-0.5 rounded-md ml-1">
            {!isMathLesson && (
              <>
                <Button
                  variant={showLeftSidebar ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setShowLeftSidebar((v) => !v)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  title="Toggle Files"
                >
                  <PanelLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant={showTerminalPane ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setShowTerminalPane((v) => !v)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  title="Toggle Console"
                >
                  <PanelBottom className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant={showPreviewPane ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setShowPreviewPane((v) => !v)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  title="Toggle Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
            <Button
              variant={activeMainWorkspaceTab === 'board' ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setActiveMainWorkspaceTab((v) => (v === 'board' ? 'code' : 'board'))}
              className={cn(
                "h-7 w-7 p-0",
                activeMainWorkspaceTab === 'board'
                  ? "text-sky-400 bg-sky-500/15"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Toggle Digital Math & Diagram Board"
            >
              <Compass className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={showTutorPane ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setShowTutorPane((v) => !v)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              title="Toggle AI Tutor"
            >
              <PanelRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="ml-1 flex items-center">
            <UserButton afterSignOutUrl="/welcome" />
          </div>
        </div>
      </header>

      {/* MAIN WORKSPACE BODY */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        {draggingSplitter && <div className="fixed inset-0 z-50 cursor-ew-resize" />}

        {/* 1. COLLAPSIBLE FILE EXPLORER */}
        {!isMathLesson && showLeftSidebar && (
          <>
            <aside
              style={{ width: `${leftSidebarWidth}px` }}
              className="bg-secondary/30 dark:bg-[#1a1a1a] flex flex-col shrink-0 min-w-[170px] max-w-[420px] border-r border-border"
            >
              <div className="p-3 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FolderTree className="w-3.5 h-3.5" />
                    Lesson Files
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowLeftSidebar(false)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {Object.keys(files).map((filename) => (
                    <button
                      key={filename}
                      onClick={() => openFileTab(filename)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition",
                        activeFile === filename
                          ? "bg-secondary text-foreground font-medium shadow-xs"
                          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                      )}
                    >
                      <Code2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{filename}</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <div
              onMouseDown={() => setDraggingSplitter('left')}
              className="w-1 bg-border hover:bg-neutral-500 cursor-ew-resize transition-colors shrink-0 z-20"
            />
          </>
        )}

        {/* 2. CENTER CODE EDITOR / DIGITAL BOARD + CONSOLE */}
        <main className="flex-1 flex flex-col min-w-[240px] bg-background dark:bg-[#18181b]">
          {showChallengeBanner && (
            <div
              data-ai-target="challenge-banner"
              className="bg-secondary/30 border-b border-border px-4 py-2 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-foreground text-[11px] font-semibold shrink-0">
                  Your Goal
                </span>
                <p className="text-xs text-foreground/90 truncate">
                  {activeNode.challengeSpec?.prompt || activeNode.description}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowChallengeBanner(false)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          <div className="h-9 bg-secondary/50 border-b border-border flex items-center justify-between px-2 shrink-0 overflow-x-auto">
            <div className="flex items-center h-full gap-0.5">
              {(isMathLesson || activeMainWorkspaceTab === 'board') && (
                <div
                  data-ai-target="editor-tab-math-board"
                  onClick={() => setActiveMainWorkspaceTab('board')}
                  className={cn(
                    "group px-3 h-full flex items-center gap-2 text-xs border-t-2 cursor-pointer transition",
                    activeMainWorkspaceTab === 'board'
                      ? "bg-background dark:bg-[#18181b] text-foreground border-sky-400 font-medium shadow-xs"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/80"
                  )}
                >
                  <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Math Board</span>
                </div>
              )}

              {!isMathLesson && (
                <div
                  data-ai-target="editor-tab-preview"
                  onClick={() => {
                    setActiveMainWorkspaceTab('preview');
                  }}
                  className={cn(
                    "group px-3 h-full flex items-center gap-1.5 text-xs border-t-2 cursor-pointer transition",
                    activeMainWorkspaceTab === 'preview'
                      ? "bg-background dark:bg-[#18181b] text-foreground border-emerald-500 font-medium shadow-xs"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/80"
                  )}
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Preview</span>
                </div>
              )}

              {openTabs.map((filename) => (
                <div
                  key={filename}
                  data-ai-target={`editor-tab-${filename}`}
                  onClick={() => {
                    setActiveMainWorkspaceTab('code');
                    openFileTab(filename);
                  }}
                  className={cn(
                    "group px-3 h-full flex items-center gap-2 text-xs border-t-2 cursor-pointer transition",
                    activeMainWorkspaceTab === 'code' && activeFile === filename
                      ? "bg-background dark:bg-[#18181b] text-foreground border-foreground font-medium shadow-xs"
                      : "text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/80"
                  )}
                >
                  <Code2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>{filename}</span>
                  {openTabs.length > 1 && (
                    <button
                      onClick={(e) => closeFileTab(e, filename)}
                      className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}

              {closedFiles.length > 0 && (
                <div className="flex items-center gap-1 ml-2">
                  {closedFiles.map((cf) => (
                    <button
                      key={cf}
                      onClick={() => {
                        setActiveMainWorkspaceTab('code');
                        openFileTab(cf);
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground text-[11px] border border-border transition"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      {cf}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedText && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExplainSelection}
                  disabled={isEvaluating}
                  className="h-6 gap-1 px-2.5 rounded-full text-[11px] font-medium border-border hover:bg-secondary text-foreground"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Explain Highlighted Code
                </Button>
              )}

              {!showChallengeBanner && (
                <button
                  onClick={() => setShowChallengeBanner(true)}
                  className="text-[11px] text-muted-foreground hover:text-foreground px-2"
                >
                  Show Goal
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 flex min-h-0">
            {activeMainWorkspaceTab === 'board' ? (
              <div className="flex-1 min-w-0 min-h-0 relative">
                <AppErrorBoundary>
                  <DrawnixDigitalBoard
                    activeNode={activeNode}
                    initialElements={activeNode.initialBoard?.elements || []}
                    challengeSpec={activeNode.challengeSpec}
                    onBoardChange={setMathBoardData}
                    onVerify={() => handleVerifyWithTutor(null)}
                    isVerifying={isEvaluating}
                  />
                </AppErrorBoundary>
              </div>
            ) : activeMainWorkspaceTab === 'preview' ? (
              <div className="flex-1 min-w-0 h-full relative bg-background flex flex-col">
                <div className="h-8 px-3 border-b border-border bg-secondary/40 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Eye className="w-3.5 h-3.5 text-emerald-500" />
                    Live Preview
                  </span>
                  <span className="text-[10px] text-muted-foreground">Updates with your code</span>
                </div>
                <iframe
                  title="Preview"
                  srcDoc={livePreviewSrcDoc}
                  className="flex-1 w-full bg-background"
                  sandbox="allow-scripts"
                />
              </div>
            ) : (
              <>
                <div ref={editorContainerRef} className="flex-1 min-w-0 h-full relative bg-[#18181b]">
                  {activeFile ? (
                    <Editor
                      height="100%"
                      theme="notion-dark"
                      path={activeFile}
                      language={
                        activeFile.endsWith('.json')
                          ? 'json'
                          : activeFile.endsWith('.css')
                          ? 'css'
                          : activeFile.endsWith('.html')
                          ? 'html'
                          : 'javascript'
                      }
                      value={files[activeFile] || ''}
                      onChange={(val) => handleStudentForkOrEdit(val ?? '')}
                      onValidate={(markers) => setEditorMarkers(markers || [])}
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
                            { token: 'number', foreground: 'fde68a' },
                          ],
                          colors: {
                            'editor.background': '#18181b',
                            'editor.foreground': '#f4f4f5',
                            'editorLineNumber.foreground': '#52525b',
                            'editorLineNumber.activeForeground': '#fafafa',
                            'editor.lineHighlightBackground': '#27272a40',
                            'editor.selectionBackground': '#3f3f4660',
                            'editorCursor.foreground': '#fafafa',
                          },
                        });
                        monaco.editor.setTheme('notion-dark');

                        editor.onDidChangeCursorPosition((e) => {
                          const pos = {
                            lineNumber: e.position.lineNumber,
                            column: e.position.column,
                          };
                          setCursorPosition(pos);
                          const now = Date.now();
                          if (now - lastCursorLogTimeRef.current > 4000) {
                            lastCursorLogTimeRef.current = now;
                            const model = editor.getModel();
                            const lineContent = model
                              ? model.getLineContent(pos.lineNumber).trim()
                              : '';
                            recordEvent(
                              'cursor_move',
                              `Ln ${pos.lineNumber}, Col ${pos.column}${
                                lineContent ? ` ("${lineContent.slice(0, 40)}")` : ''
                              }`
                            );
                          }
                        });

                        editor.onDidChangeCursorSelection((e) => {
                          const model = editor.getModel();
                          if (!model) return;
                          const sel = model.getValueInRange(e.selection).trim();
                          setSelectedText(sel);
                        });

                        if (!hasAutoStartedInitialRef.current) {
                          hasAutoStartedInitialRef.current = true;
                          setTimeout(() => {
                            startAiLiveLesson(0);
                          }, 220);
                        }
                      }}
                      options={{
                        readOnly: interactionMode === 'LESSON_REFLECTION',
                        fontSize: 13.5,
                        fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 14 },
                        lineNumbersMinChars: 3,
                      }}
                    />
                  ) : null}
                </div>

                {showPreviewPane && (
                  <>
                    <div
                      onMouseDown={() => setDraggingSplitter('preview')}
                      className="w-1 bg-border hover:bg-neutral-500 cursor-ew-resize transition-colors shrink-0 z-20"
                    />
                    <div
                      style={{ width: `${previewWidth}px` }}
                      className="bg-background flex flex-col shrink-0 min-w-[200px] max-w-[520px]"
                    >
                      <div className="h-8 px-3 border-b border-border bg-secondary/40 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                        <span>Preview</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowPreviewPane(false)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <iframe
                        title="Preview"
                        srcDoc={livePreviewSrcDoc}
                        className="flex-1 w-full bg-background"
                        sandbox="allow-scripts"
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {!isMathLesson && showTerminalPane && (
            <>
              <div
                onMouseDown={() => setDraggingSplitter('terminal')}
                className="h-1 bg-border hover:bg-neutral-500 cursor-ns-resize transition-colors shrink-0 z-20"
              />
              <div
                data-ai-target="terminal-pane"
                style={{ height: `${terminalHeight}px` }}
                className="bg-card dark:bg-[#18181b] flex flex-col shrink-0 min-h-[80px] max-h-[420px]"
              >
                <div className="h-7 px-3.5 bg-secondary/60 border-b border-border flex items-center justify-between text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <TerminalIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-medium text-foreground">Console</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setTerminalLines([])}
                      className="text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowTerminalPane(false)}
                      className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-1 bg-background/50 dark:bg-[#141414] text-foreground select-text">
                  {terminalLines.map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap leading-relaxed">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>

        {/* 3. AI TUTOR (Bottom on mobile/small screens, right sidebar on desktop) */}
        {showTutorPane && (
          <>
            <div
              onMouseDown={() => setDraggingSplitter('tutor')}
              className="hidden md:block w-1 bg-border hover:bg-neutral-500 cursor-ew-resize transition-colors shrink-0 z-20"
            />
            <aside
              data-ai-target="tutor-pane"
              className="bg-card dark:bg-[#1b1b1b] flex flex-col shrink-0 border-t md:border-t-0 md:border-l border-border h-[42vh] md:h-full w-full md:w-[var(--tutor-w,350px)] md:min-w-[260px] md:max-w-[560px]"
              style={{ '--tutor-w': `${tutorWidth}px` }}
            >
              <div className="h-10 px-3.5 border-b border-border flex items-center justify-between shrink-0 bg-secondary/30">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      isAiSpeaking ? "bg-primary animate-ping" : "bg-emerald-500"
                    )}
                  />
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-semibold text-foreground">AI Tutor</span>
                    <span className="text-[10px] text-muted-foreground hidden sm:inline">
                      • Q&A & Concept Checks
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
                  onClick={() => setShowTutorPane(false)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-3.5 space-y-3 select-text">
                {tutorMessages.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center p-3">
                    <div className="w-10 h-10 rounded-2xl bg-secondary border border-border flex items-center justify-center text-foreground mb-3 shadow-xs">
                      <HelpCircle className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <h3 className="text-xs font-semibold text-foreground mb-1">
                      Interactive Socratic Tutor
                    </h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[280px]">
                      {isMathLesson
                        ? 'Ask questions about the lesson or your work on the maths board.'
                        : 'Ask questions about the lesson or the code you are working on.'}
                    </p>
                  </div>
                ) : (
                  tutorMessages.map((msg) => {
                    const isConceptQuestion = msg.type === 'concept-question';
                    const isConceptClarification = msg.type === 'concept-clarification';

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "rounded-xl p-3 text-xs leading-relaxed border transition shadow-xs",
                          msg.sender === 'student'
                            ? "bg-secondary text-foreground border-border ml-6"
                            : isConceptQuestion
                            ? "bg-secondary/40 border-amber-500/30 text-foreground"
                            : isConceptClarification
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-500 dark:text-amber-300"
                            : msg.type === 'success'
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                            : "bg-card dark:bg-[#181818] border-border text-foreground"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1.5 text-[11px] font-medium text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            {msg.sender === 'student' ? (
                              <span className="text-foreground font-semibold">
                                You {msg.isConceptAnswer ? '• Conceptual Answer' : '• Question'}
                              </span>
                            ) : isConceptQuestion ? (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 dark:text-amber-400 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
                                <HelpCircle className="w-3 h-3" />
                                Concept Check • Non-Code Input
                              </span>
                            ) : isConceptClarification ? (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 dark:text-amber-400 text-[10px] font-semibold">
                                Concept Feedback
                              </span>
                            ) : msg.type === 'success' ? (
                              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {msg.isConceptAnswer ? 'Concept Mastered' : 'Verified'}
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

                        {isConceptQuestion && msg.options && msg.options.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-border space-y-1.5">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 mb-1">
                              Choose your answer (Non-code input):
                            </div>
                            {msg.options.map((opt, optIdx) => (
                              <button
                                key={optIdx}
                                onClick={() => handleAnswerConceptQuestion(opt, msg)}
                                disabled={isEvaluating}
                                className="w-full text-left px-3 py-2 rounded-lg bg-background hover:bg-secondary border border-border hover:border-foreground/30 text-xs text-foreground transition group flex items-start gap-2.5 disabled:opacity-50"
                              >
                                <span className="w-5 h-5 rounded-md bg-secondary group-hover:bg-primary group-hover:text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-border transition">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="leading-snug">{opt}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {nextModule && interactionMode === 'COMPLETED' && (
                <div className="mx-3 mb-2 p-3 rounded-xl bg-secondary/60 border border-border flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {nextModule.isDetour ? 'Custom Path Module Created' : 'Up Next'}
                    </div>
                    <div className="text-xs font-semibold text-foreground truncate mt-0.5">
                      {nextModule.title.replace(/^\d+\.\s*/, '')}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => selectRoadmapNode(nextModule)}
                    className="gap-1 text-xs"
                  >
                    <span>Start</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}

              <div className="px-3 pt-2 pb-1 bg-card dark:bg-[#1b1b1b] border-t border-border flex items-center justify-between gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() =>
                    handleVerifyWithTutor(
                      isMathLesson
                        ? 'Can you guide me on how to construct or solve this on the digital board?'
                        : 'Can you give me a hint on what to write next for this challenge?'
                    )
                  }
                  disabled={isEvaluating}
                  className="flex-1 h-7 text-xs font-medium border-border hover:bg-secondary text-muted-foreground hover:text-foreground gap-1.5"
                  title="Ask for a gentle hint"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{isMathLesson ? 'Ask for a Math Hint' : 'Ask for a Hint'}</span>
                </Button>
              </div>

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
                        : pendingLessonResumeRef.current
                        ? 'Reply to the lesson question to continue...'
                        : isMathLesson
                        ? 'Ask about the theorem, vectors, or formulas...'
                        : 'Ask a question or discuss concepts (non-code)...'
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
          </>
        )}
      </div>

      {/* MOBILE BOTTOM ACTION BAR FOR CHECK SOLUTION & NEXT MODULE */}
      <div className="sm:hidden bg-background dark:bg-[#1b1b1b] border-t border-border px-3 py-2 flex items-center justify-between gap-2 shrink-0 z-30">
        {!isMathLesson && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRunCode(false)}
            disabled={isRunningCode || interactionMode === 'LESSON_REFLECTION'}
            className="flex-1 h-8 gap-1 px-2 text-xs font-medium border-border"
          >
            <TerminalIcon className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isRunningCode ? 'Running...' : 'Run'}</span>
          </Button>
        )}

        <Button
          size="sm"
          onClick={() => handleVerifyWithTutor(null)}
          disabled={isEvaluating || interactionMode === 'LESSON_REFLECTION'}
          className="flex-1 h-8 gap-1 px-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isEvaluating ? 'Checking...' : 'Check Solution'}</span>
        </Button>

        {nextModule && (
          <Button
            size="sm"
            onClick={() => selectRoadmapNode(nextModule)}
            disabled={interactionMode !== 'COMPLETED'}
            className={cn(
              "flex-1 h-8 gap-1 px-2 text-xs font-semibold shadow-xs",
              interactionMode === 'COMPLETED'
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "opacity-40"
            )}
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// LIVE INTERFACE TELEMETRY & CONTEXT TRACKER
// ============================================================================
// Continuously tracks what is happening across the IDE & LMS interface.
// Uses `diff` (jsdiff) for accurate code diff computation instead of custom loops.
// ============================================================================

import { diffLines, createTwoFilesPatch } from 'diff';

const MAX_ACTIVITY_EVENTS = 18;

export function createInterfaceEvent(type, detail, meta = {}) {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    timeLabel: new Date().toLocaleTimeString([], {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    type,
    detail,
    meta
  };
}

export function appendInterfaceEvent(eventsList, type, detail, meta = {}) {
  const last = eventsList[eventsList.length - 1];
  if (last && last.type === type && last.detail === detail && Date.now() - last.timestamp < 2500) {
    return eventsList;
  }
  const next = [...eventsList, createInterfaceEvent(type, detail, meta)];
  return next.slice(-MAX_ACTIVITY_EVENTS);
}

/**
 * Extracts a focused code window around the learner's current cursor line
 */
export function getCursorCodeWindow(code = '', cursorLine = 1, radius = 4) {
  const lines = code.split('\n');
  const clampedLine = Math.max(1, Math.min(lines.length || 1, cursorLine));
  const start = Math.max(0, clampedLine - 1 - radius);
  const end = Math.min(lines.length, clampedLine + radius);

  const snippet = lines
    .slice(start, end)
    .map((lineText, idx) => {
      const lineNum = start + idx + 1;
      const marker = lineNum === clampedLine ? '👉' : '  ';
      return `${marker} ${String(lineNum).padStart(2, ' ')} | ${lineText}`;
    })
    .join('\n');

  return {
    currentLineNumber: clampedLine,
    currentLineText: (lines[clampedLine - 1] || '').trim(),
    surroundingWindow: snippet,
    totalLines: lines.length
  };
}

/**
 * Computes a structured diff between the module's initial template and the learner's current code
 * using `diff` (jsdiff: `diffLines` & `createTwoFilesPatch`).
 */
export function summarizeFileDiff(initialCode = '', currentCode = '') {
  if (initialCode === currentCode) {
    return { hasModified: false, summary: 'No edits made to initial template yet.' };
  }

  const changes = diffLines(initialCode, currentCode);
  const addedSnippets = [];
  let addedLineCount = 0;
  let removedLineCount = 0;

  for (const part of changes) {
    if (part.added) {
      addedLineCount += part.count || 0;
      const nonTrivial = part.value
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith('//') && !l.startsWith('<!--'));
      addedSnippets.push(...nonTrivial);
    } else if (part.removed) {
      removedLineCount += part.count || 0;
    }
  }

  const unifiedPatch = createTwoFilesPatch(
    'template',
    'learner',
    initialCode,
    currentCode,
    '',
    '',
    { context: 2 }
  );

  return {
    hasModified: true,
    lineDelta: addedLineCount - removedLineCount,
    changedLinesPreview: addedSnippets.slice(0, 6),
    patch: unifiedPatch,
    summary:
      addedSnippets.length > 0
        ? `Learner added ${addedLineCount} line(s) / removed ${removedLineCount} line(s): ${addedSnippets
            .slice(0, 4)
            .map((s) => `"${s.slice(0, 70)}"`)
            .join(' | ')}`
        : 'Minor whitespace or comment edits.'
  };
}

/**
 * Builds a complete, structured snapshot of everything currently happening in the UI
 * for consumption by the LLM API during dynamic voice narration, live teaching, or Socratic chat.
 */
export function buildInterfaceContextSnapshot({
  currentView,
  activeTrack,
  activeNode,
  activeFile,
  openTabs,
  files,
  cursorPosition,
  selectedText,
  editorMarkers,
  interactionMode,
  timelineStepIndex,
  lastRuntimeOutput,
  terminalLines,
  panels,
  recentEvents,
  boardData = null
}) {
  const currentFileCode = files?.[activeFile] || '';
  const initialFileCode = activeNode?.initialFiles?.[activeFile] || '';
  const cursorWindow = getCursorCodeWindow(currentFileCode, cursorPosition?.lineNumber || 1, 4);
  const diffInfo = summarizeFileDiff(initialFileCode, currentFileCode);

  const recentActivityFormatted = (recentEvents || [])
    .slice(-10)
    .map((e) => `[${e.timeLabel}] (${e.type}) ${e.detail}`)
    .join('\n');

  const diagnosticsFormatted =
    editorMarkers && editorMarkers.length > 0
      ? editorMarkers.map((m) => `Line ${m.startLineNumber}: ${m.message}`).join('; ')
      : 'None (no syntax errors detected by Monaco)';

  return {
    view: currentView,
    trackTitle: activeTrack?.title || 'Frontend',
    nodeId: activeNode?.id,
    nodeTitle: activeNode?.title,
    isDetour: Boolean(activeNode?.isDetour),
    isMathBoard: Boolean(activeNode?.isMathBoard || activeTrack?.id === 'mathematics'),
    challengePrompt: activeNode?.challengeSpec?.prompt || activeNode?.description || '',
    boardData,
    interactionMode,
    timelineStepIndex,
    activeFile: activeFile || 'none',
    openTabs: openTabs || [],
    visiblePanels: panels || {},
    cursor: {
      lineNumber: cursorPosition?.lineNumber || 1,
      column: cursorPosition?.column || 1,
      currentLineText: cursorWindow.currentLineText,
      surroundingWindow: cursorWindow.surroundingWindow
    },
    selectedText: selectedText ? selectedText.slice(0, 400) : null,
    editorDiagnostics: diagnosticsFormatted,
    diffSummary: diffInfo.summary,
    hasModifiedCode: diffInfo.hasModified,
    currentFileCode,
    allFilesOverview: Object.entries(files || {}).map(([name, content]) => ({
      name,
      lineCount: (content || '').split('\n').length
    })),
    lastRuntimeOutput: lastRuntimeOutput || '(Code has not been executed in this session yet)',
    recentTerminalTail: (terminalLines || []).slice(-6).join('\n'),
    recentActivityLog: recentActivityFormatted || '(Session just started)'
  };
}

/**
 * Formats the interface context snapshot into a clean prompt block for the LLM
 */
export function formatInterfaceContextForPrompt(snapshot) {
  if (!snapshot) return '';

  let boardSection = '';
  if (snapshot.boardData) {
    const rawElements = Array.isArray(snapshot.boardData)
      ? snapshot.boardData
      : Array.isArray(snapshot.boardData.elements)
      ? snapshot.boardData.elements
      : [];
    const activeElements = rawElements.filter((el) => !el.isDeleted);

    // Extract arrows / vector rays
    const explicitVectors = (snapshot.boardData.vectors || []).map(
      (v) => `${v.name || 'v'}: [(${v.start?.[0]}, ${v.start?.[1]}) -> (${v.end?.[0]}, ${v.end?.[1]}), dx=${v.dx}, dy=${v.dy}, mag=${v.magnitude}]`
    );
    const excalidrawArrows = activeElements
      .filter((el) => el.type === 'arrow' || el.type === 'line')
      .map((el, i) => {
        const lastPoint = el.points?.[el.points.length - 1] || [el.width || 0, el.height || 0];
        const dx = Math.round(lastPoint[0]);
        const dy = Math.round(lastPoint[1]);
        const mag = Number(Math.hypot(dx, dy).toFixed(1));
        return `Arrow #${i + 1} at (${Math.round(el.x)}, ${Math.round(el.y)}) -> dx=${dx}, dy=${dy}, mag=${mag}`;
      });
    const allVectors = [...explicitVectors, ...excalidrawArrows];

    // Extract written text notes, equations & labels
    const explicitTexts = snapshot.boardData.texts || [];
    const excalidrawTexts = activeElements
      .filter((el) => el.type === 'text' && el.text)
      .map((el) => `"${el.text.trim()}"`);
    const allTexts = [...explicitTexts, ...excalidrawTexts];

    // Extract geometric figures
    const shapes = activeElements
      .filter((el) => ['rectangle', 'ellipse', 'diamond'].includes(el.type))
      .map((el) => `${el.type} (${Math.round(el.width)}x${Math.round(el.height)})`);

    const freehandCount = activeElements.filter((el) => el.type === 'freedraw').length;

    boardSection = `
=== DIGITAL MATH BOARD STATUS ===
• Active Canvas Items: ${activeElements.length || rawElements.length || 0}
• Text / Formulas / Labels: ${allTexts.length > 0 ? allTexts.join(' | ') : 'None'}
• Vectors & Arrows: ${allVectors.length > 0 ? allVectors.join('; ') : 'None'}
• Geometric Shapes: ${shapes.length > 0 ? shapes.join(', ') : 'None'}
• Freehand Sketches: ${freehandCount}
`;
  }

  return `=== LIVE IDE INTERFACE TELEMETRY SNAPSHOT ===
• Active View: ${snapshot.view.toUpperCase()} | Mode: ${snapshot.interactionMode}
• Active Track: ${snapshot.trackTitle}
• Active Module: ${snapshot.nodeTitle} ${snapshot.isDetour ? '(ADAPTIVE DETOUR)' : ''}
• Challenge Goal: ${snapshot.challengePrompt}
• Active Editor Tab: ${snapshot.activeFile} (Open tabs: ${snapshot.openTabs.join(', ')})
• Visible Panels: Explorer=${snapshot.visiblePanels.leftSidebar ? 'Open' : 'Closed'}, Preview=${snapshot.visiblePanels.preview ? 'Open' : 'Closed'}, Terminal=${snapshot.visiblePanels.terminal ? 'Open' : 'Closed'}, Tutor=${snapshot.visiblePanels.tutor ? 'Open' : 'Closed'}
• Cursor Position: Line ${snapshot.cursor.lineNumber}, Col ${snapshot.cursor.column} (Active line text: \`${snapshot.cursor.currentLineText || 'empty line'}\`)
${snapshot.selectedText ? `• Learner's Highlighted Selection:\n\`\`\`javascript\n${snapshot.selectedText}\n\`\`\`` : '• Learner Selection: (No text currently highlighted)'}
• Live Editor Diagnostics / Syntax Markers: ${snapshot.editorDiagnostics}
• Code Diff vs Template: ${snapshot.diffSummary}
${boardSection}
=== CODE WINDOW AROUND LEARNER'S CURSOR (${snapshot.activeFile}) ===
\`\`\`
${snapshot.cursor.surroundingWindow}
\`\`\`

=== FULL ACTIVE FILE CONTENT (${snapshot.activeFile}) ===
\`\`\`javascript
${snapshot.currentFileCode}
\`\`\`

=== LATEST TERMINAL / RUNTIME OUTPUT ===
\`\`\`
${snapshot.lastRuntimeOutput}
\`\`\`

=== RECENT USER INTERFACE ACTIONS (LIVE EVENT STREAM) ===
${snapshot.recentActivityLog}
=============================================`;
}

// ============================================================================
// DYNAMIC AI VOICE & INTERFACE-AWARE SOCRATIC TUTOR SERVICE
// ============================================================================
// All responses, answers to user questions, live-teaching narrations, and
// interface observations are generated dynamically by a live LLM grounded in
// real-time telemetry of the IDE interface.
// Supports OpenAI, Google Gemini, Anthropic Claude, Custom OpenAI-Compatible
// Endpoints, AND an automatic zero-key live OpenAI endpoint out of the box.
// ============================================================================

import { jsonrepair } from 'jsonrepair';
import removeMd from 'remove-markdown';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import { formatInterfaceContextForPrompt } from './interfaceTracker.js';
import {
  resolveTrajectoryDomain,
  startStruggleEpisode,
  getTrajectoryPromptAugmentation,
  buildWinningDetourNode
} from './pedagogicalTrajectoryRouter.js';

const DIRECT_QUESTION_SYSTEM_PROMPT = `You are Upskill AI, a patient coding tutor speaking with one learner in a chat.
Use simple everyday English. Explain any technical word the first time you use it.
When the learner answers a lesson question, respond to their idea: name what they understood, gently correct any mix-up, and explain why. When they ask about code, point to the relevant line, explain what it does, and why it is written that way. Use a small example when useful.
Use Socratic teaching naturally: invite the learner to predict an outcome or consider a choice. Ask at most one short follow-up question when it helps. Do not use multiple-choice quizzes. Never say code is complete when the learner only asked a conversational question.
Keep replies focused, warm, and clear, usually 3-6 short sentences. Point the cursor to a relevant line when possible.
Respond in valid JSON:
{
  "passed": false,
  "reply": "A direct, clear answer that explains the idea and why it matters",
  "spokenText": "The same answer in simple spoken English",
  "detectedGap": "optional short concept tag or null",
  "suggestDetourTitle": "optional practice module title",
  "cursorTarget": { "type": "editor", "line": 1, "label": "Short helpful label" }
};`

const SOCRATIC_EVAL_SYSTEM_PROMPT = `You are Upskill AI, a patient coding teacher inside a code editor.
Use plain English. Explain what the learner's code does, what is missing or incorrect, and why the suggested change works. Point to the exact line or variable. Give one small next step without writing the whole answer for them. Be encouraging without vague praise.
Keep the reply to 3-6 short sentences. Return valid JSON with passed, reply, spokenText, detectedGap, suggestDetourTitle, and cursorTarget.`

const LIVE_TEACH_SYSTEM_PROMPT = `You are Upskill AI, a live Scrimba-style voice instructor actively typing code in the learner's VS Code editor while tracking their interface and controlling a smooth on-screen AI pointer cursor.
Generate a clear lesson explanation in 4-6 short sentences. Use simple English and explain the code being written, how it works step by step, and why this approach is useful. Define any technical word the learner may not know. Use a small example or analogy when useful. Do not be vague, and do not ask a question here; a reflection question will appear later in the lesson.
- Sound like an engaging, live human pair-programming mentor speaking directly to the student from the moment the lesson begins.
- If this is the challenge handoff, explain the goal and the next decision the learner needs to make. Give a useful hint, but do not write the full answer.
Respond in valid JSON:
{
  "narration": "Markdown-formatted message for the tutor chat feed",
  "spokenText": "Clean plain-text version optimized for AI voice synthesis (no backticks or emojis)",
  "cursorLabel": "Short 3-6 word callout shown on the AI screen cursor while pointing at this step"
}`;

const INTERFACE_OBSERVER_SYSTEM_PROMPT = `You are Upskill AI, a real-time interface-aware AI voice pair-programmer inside a VS Code Web IDE with an on-screen pointer cursor.
You are observing the learner's live workspace telemetry (cursor line, highlighted code selection, file switches, syntax diagnostics, code edits, and terminal output).
Generate a concise, natural spoken response (1-3 sentences) reacting to the current interface event:
- Directly mention what is happening in their code and terminal right now (referencing exact line numbers and variable names).
- Give a helpful, actionable insight that moves them closer to solving the challenge.
Respond in valid JSON:
{
  "reply": "Concise markdown response for the chat stream",
  "spokenText": "Clean plain-text version for AI voice synthesis (no markdown symbols)",
  "cursorTarget": {
    "type": "editor or ui",
    "line": 12,
    "uiId": "optional: 'terminal-pane' | 'challenge-banner' | 'run-button'",
    "label": "Short 3-6 word callout for the AI cursor"
  }
}`;

/**
 * Unified Live LLM API caller:
 * Sends prompts and user API config to the app backend (/api/tutor).
 * If a provider key is set, the backend calls the official provider.
 * If no key is set or the provider fails, the backend falls back to the zero-key
 * live endpoint without triggering browser CORS / Cloudflare Turnstile 403 blocks.
 */
export async function callConfiguredLlm({
  systemPrompt,
  userPrompt,
  apiConfig,
  expectJson = true,
  temperature = 0.45,
  onProviderError = null
}) {
  const liveRes = await fetch('/api/tutor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemPrompt,
      userPrompt,
      apiConfig,
      expectJson,
      temperature
    }),
    signal: AbortSignal.timeout?.(45000)
  });

  if (!liveRes.ok) {
    const errorBody = await liveRes.json().catch(() => ({}));
    const error = new Error(errorBody.error || `AI service returned status ${liveRes.status}`);
    onProviderError?.(error);
    throw error;
  }

  const response = await liveRes.json();
  if (response.providerError) {
    onProviderError?.(new Error(response.providerError));
  }
  return expectJson ? safeParseJson(response.result) : response.text;
}

function safeParseJson(rawText) {
  try {
    return JSON.parse(rawText);
  } catch {
    try {
      const repaired = jsonrepair(rawText);
      return JSON.parse(repaired);
    } catch {
      return {
        reply: rawText,
        narration: rawText,
        spokenText: stripMarkdownForSpeech(rawText)
      };
    }
  }
}

function formatNumberedCode(code = '') {
  return code
    .split('\n')
    .map((line, i) => `${String(i + 1).padStart(2, ' ')} | ${line}`)
    .join('\n');
}

/**
 * 1. DYNAMIC AI-GENERATED LIVE LESSON NARRATION
 */
export async function generateDynamicLessonStepNarration({
  activeNode,
  stepIndex,
  totalSteps,
  step,
  interfaceSnapshot,
  apiConfig
}) {
  const telemetryBlock = formatInterfaceContextForPrompt(interfaceSnapshot);

  try {
    const userPrompt = `
Lesson Module: ${activeNode.title} (${activeNode.category})
Step ${stepIndex + 1} of ${totalSteps} ${
      step.isChallengeStop
        ? '(CHALLENGE HANDOFF STOP - Student takes over next)'
        : '(LIVE AI CODING STEP)'
    }
Target File: ${step.file || 'index.js'} (Highlighting Line ${step.highlightLine || 1})
Pedagogical Context for this Step: ${step.narration}

Code Being Live-Streamed in This Step (with line numbers):
\`\`\`javascript
${formatNumberedCode(step.codeSnapshot)}
\`\`\`

${telemetryBlock}

    Explain the code on line ${step.highlightLine || 1}. Describe what it does, how the important values move through it, and why this is a useful way to solve the problem. Define new terms in plain English. Give a short concrete example when it helps. Keep the explanation calm and clear, around 4-6 short sentences. Do not ask a question during the opening steps.`;

    const llmRes = await callConfiguredLlm({
      systemPrompt: LIVE_TEACH_SYSTEM_PROMPT,
      userPrompt,
      apiConfig,
      expectJson: true,
      temperature: 0.55
    });

    if (llmRes && (llmRes.narration || llmRes.reply)) {
      const text = sanitizeNoDirectSpoiler(llmRes.narration || llmRes.reply);
      return {
        text,
        spokenText: llmRes.spokenText || stripMarkdownForSpeech(text),
        cursorLabel:
          llmRes.cursorLabel ||
          (step.isChallengeStop
            ? `Your turn at Line ${step.highlightLine || 1}!`
            : `Explaining Line ${step.highlightLine || 1}`),
        isAiGenerated: true
      };
    }
  } catch (err) {
    console.warn('Live lesson step narration error:', err);
  }

  const lineNum = step.highlightLine || 1;
  const highlightedCode = (step.codeSnapshot || '').split('\n')[lineNum - 1]?.trim() || '';
  const lineExplanation = explainLessonCodeLine(highlightedCode);
  const plainFallback = `${step.narration}\n\nAt line ${lineNum}, the example says \`${highlightedCode}\`. ${lineExplanation} This matters because it helps meet the lesson goal: ${activeNode.challengeSpec?.prompt || activeNode.description}`;
  return {
    text: plainFallback,
    spokenText: stripMarkdownForSpeech(plainFallback),
    cursorLabel: step.isChallengeStop
      ? `Your Turn • Implement here (Ln ${lineNum})`
      : `Teaching at Line ${lineNum}`,
    isAiGenerated: false
  };
}

function explainLessonCodeLine(line) {
  if (/\bawait\b/.test(line)) return 'The code waits for an asynchronous result before using it, so later steps receive the real value instead of an unfinished request.';
  if (/\btry\s*\{/.test(line)) return 'This starts a protected block. If something inside fails, the catch block can handle the problem instead of stopping the whole program.';
  if (/\bcatch\s*\(/.test(line)) return 'This block receives an error from the try block, so the program can respond safely when something goes wrong.';
  if (/\breturn\b/.test(line)) return 'Return sends a value back to the code that called this function, so the caller can use the result.';
  if (/\bif\s*\(/.test(line)) return 'This condition lets the program choose what to do based on the current value.';
  if (/\bfunction\s+|=>/.test(line)) return 'This defines a reusable action. Its inputs arrive as values, the body performs the work, and the caller can use the result.';
  if (/\bnew (Map|Set)\b|\.has\(|\.add\(/.test(line)) return 'This uses a key lookup to remember what has already happened, which helps avoid searching everything or doing the same work twice.';
  if (/\b(const|let)\s+/.test(line)) return 'This gives a value a name so later lines can read it or update it as the program runs.';
  if (/\bsetTimeout\s*\(/.test(line)) return 'This schedules work to happen later, so the program can keep handling other tasks while it waits.';
  return 'This line is one step in the example. It connects the earlier setup to the result the lesson is building.';
}

/**
 * Creates one open-ended reflection during the middle of a lesson.
 */
export async function generateMidLessonReflection({
  activeNode,
  step,
  interfaceSnapshot,
  apiConfig
}) {
  const interfaceContext = interfaceSnapshot
    ? formatInterfaceContextForPrompt(interfaceSnapshot)
    : '';
  const prompt = `
You are teaching "${activeNode?.title || 'this lesson'}". The learner has just seen this explanation: "${step?.narration || activeNode?.description || ''}".
${interfaceContext}
Ask one short, open-ended question that helps the learner think about why the code works or predict what would happen if one detail changed. Use simple English. Do not ask for code, definitions, or a memorized fact. Do not provide answer choices or the answer. This is the middle of the lesson, after you have explained the idea.

Return JSON: { "question": "one question" }`;

  try {
    const res = await callConfiguredLlm({
      systemPrompt: 'You are a patient teacher. Ask only one thoughtful, open-ended question in simple English.',
      userPrompt: prompt,
      apiConfig,
      expectJson: true,
      temperature: 0.55
    });
    if (res?.question) {
      return {
        question: res.question
      };
    }
  } catch (err) {
    console.warn('Mid-lesson reflection generation failed, using a built-in question:', err);
  }

  const lineNumber = step?.highlightLine || 1;
  const codeLine = (step?.codeSnapshot || '').split('\n')[lineNumber - 1]?.trim();
  return {
    question: codeLine
      ? `What do you think would change if we removed this line: \`${codeLine}\`?`
      : 'What part of this example do you think matters most, and why?'
  };
}

/**
 * 2. REAL-TIME INTERFACE OBSERVER & VOICE RESPONSE GENERATOR
 */
export async function generateInterfaceAwareVoiceResponse({
  triggerType,
  userSpokenOrTypedPrompt = null,
  interfaceSnapshot,
  activeNode,
  chatHistory = [],
  apiConfig
}) {
  const telemetryBlock = formatInterfaceContextForPrompt(interfaceSnapshot);
  const defaultLine = interfaceSnapshot?.cursor?.lineNumber || 1;

  const recentChat = (chatHistory || [])
    .slice(-6)
    .map((m) => `${m.sender === 'student' ? 'LEARNER' : 'AI TUTOR'}: ${m.text}`)
    .join('\n');

  try {
    const userPrompt = `
Trigger Event: ${triggerType}
${
  userSpokenOrTypedPrompt
    ? `Learner's Question / Voice Input: "${userSpokenOrTypedPrompt}"`
    : 'Learner just executed code or requested a live workspace check.'
}

=== RECENT CONVERSATION HISTORY ===
${recentChat || '(No prior messages)'}

${telemetryBlock}

Respond directly and specifically to what is happening in the learner's editor and terminal right now. Keep it concise, natural for voice synthesis, and genuinely helpful.`;

    const llmRes = await callConfiguredLlm({
      systemPrompt: userSpokenOrTypedPrompt
        ? DIRECT_QUESTION_SYSTEM_PROMPT
        : INTERFACE_OBSERVER_SYSTEM_PROMPT,
      userPrompt,
      apiConfig,
      expectJson: true,
      temperature: 0.45
    });

    if (llmRes && (llmRes.reply || llmRes.narration)) {
      const cleanReply = sanitizeNoDirectSpoiler(llmRes.reply || llmRes.narration);
      return {
        reply: cleanReply,
        spokenText: llmRes.spokenText || stripMarkdownForSpeech(cleanReply),
        cursorTarget: llmRes.cursorTarget || {
          type: 'editor',
          line: defaultLine,
          label: `Line ${defaultLine}`
        },
        isAiGenerated: true
      };
    }
  } catch (err) {
    console.warn('Interface voice response error:', err);
  }

  return {
    reply: `Looking at line ${defaultLine} in \`${interfaceSnapshot?.activeFile || 'index.js'}\` — tell me what part of **${activeNode?.title}** you'd like to break down!`,
    spokenText: `Looking at line ${defaultLine}, tell me what part of ${activeNode?.title} you would like to break down.`,
    cursorTarget: {
      type: 'editor',
      line: defaultLine,
      label: `Line ${defaultLine}`
    },
    isAiGenerated: false
  };
}

/**
 * Detects whether the learner is struggling with JavaScript Functions or another
 * core concept (via code edits, syntax errors, terminal errors, or chat/voice questions).
 */
export function detectConceptStruggle({
  learnerCode = '',
  runtimeOutput = '',
  learnerQuestion = '',
  interfaceSnapshot = null,
  activeNode = null,
  localEval = null
}) {
  const q = (learnerQuestion || '').toLowerCase();
  const code = learnerCode || '';
  const out = runtimeOutput || '';
  const isHtmlModule =
    activeNode?.challengeSpec?.targetFile === 'index.html' ||
    activeNode?.conceptTag?.startsWith('html');

  // 1. Explicit question or struggle with JavaScript functions / methods / parameters / return
  const asksAboutFunctions =
    /\b(function|functions|method|methods|parameter|parameters|argument|arguments|return|how do i write a function|struggling.*function|declare.*function|arrow function)\b/i.test(
      q
    );

  // 2. Struggling to write a function or method in code (e.g. syntax error on function/method, missing withdraw/getBalance function structure, or incomplete function declaration)
  const hasSyntaxOrRefError =
    /SyntaxError|ReferenceError|TypeError: .* is not a function/i.test(out) ||
    (interfaceSnapshot?.diagnostics || []).some((d) => d.severity === 'error');

  const isJsChallenge = !isHtmlModule;
  let astHasSyntaxError = false;
  let astFoundWithdraw = false;

  if (isJsChallenge && code.trim()) {
    try {
      const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
      walk.simple(ast, {
        Property(node) {
          const keyName = node.key?.name || node.key?.value;
          if (keyName === 'withdraw' && (node.value?.type === 'FunctionExpression' || node.value?.type === 'ArrowFunctionExpression')) {
            astFoundWithdraw = true;
          }
        },
        FunctionDeclaration(node) {
          if (node.id?.name === 'withdraw') astFoundWithdraw = true;
        }
      });
    } catch {
      astHasSyntaxError = true;
    }
  }

  const missingExpectedFunctionInClosures =
    activeNode?.id === 'js-closures-state' && !astFoundWithdraw;

  const hasBrokenFunctionAttempt = astHasSyntaxError;

  if (
    asksAboutFunctions ||
    (isJsChallenge &&
      !localEval?.passed &&
      (missingExpectedFunctionInClosures ||
        hasBrokenFunctionAttempt ||
        /is not a function/i.test(out)))
  ) {
    return {
      gapTag: 'js-functions-fundamentals',
      title: 'JavaScript Functions: Inputs, Body & Return',
    };
  }

  // 3. Struggling with Return Values vs Side-Effects
  if (
    localEval?.detectedGap === 'missing-return-value' ||
    /\b(return value|why.*undefined|returns undefined)\b/i.test(q)
  ) {
    return {
      gapTag: 'return-values',
      title: 'Functions: Mutating State vs. Returning Values',
    };
  }

  // 4. Struggling with `this` vs Closure Lexical Scope
  if (
    localEval?.detectedGap === 'this-vs-lexical-scope' ||
    localEval?.detectedGap === 'state-mutation-in-closure' ||
    activeNode?.id === 'js-closures-state' ||
    activeNode?.conceptTag === 'closures' ||
    /\b(this\.|closure|lexical scope|outer scope|encapsulat)\b/i.test(q)
  ) {
    return {
      gapTag: 'this-vs-lexical-scope',
      title: 'Lexical Scope vs. Object Properties (`this`)',
    };
  }

  // 5. Struggling with Async / Promises & Event Loop
  if (
    localEval?.detectedGap === 'missing-await-promise' ||
    localEval?.detectedGap === 'promises-async' ||
    activeNode?.id === 'js-async-event-loop' ||
    activeNode?.conceptTag === 'promises-async' ||
    /\b(async|await|promise|try.*catch|event loop|microtask|macrotask)\b/i.test(q)
  ) {
    return {
      gapTag: 'promises-async',
      title: 'Async Functions, Promises & Microtask Event Loop',
    };
  }

  // 5b. Struggling with Coordinate Geometry / Vectors
  if (
    activeNode?.id === 'math-vectors-coordinate-geometry' ||
    activeNode?.conceptTag === 'vectors-geometry' ||
    activeNode?.isMathBoard ||
    localEval?.detectedGap === 'vectors-geometry' ||
    /\b(vector|vectors|coordinate|coordinates|cartesian|tip-to-tail|magnitude|dx|dy)\b/i.test(q)
  ) {
    return {
      gapTag: 'vectors-geometry',
      title: 'Coordinate Geometry & Vector Component Decomposition',
    };
  }

  // 6. Struggling with HTML tags & attributes
  if (
    isHtmlModule &&
    !localEval?.passed &&
    (localEval?.detectedGap || /\b(tag|element|attribute|href|button|html)\b/i.test(q))
  ) {
    return {
      gapTag: localEval?.detectedGap || 'html-elements',
      title: 'HTML Elements: Opening Tags, Attributes & Closing Tags',
    };
  }

  if (localEval?.detectedGap) {
    return {
      gapTag: localEval.detectedGap,
      title: localEval.detourNode?.title || 'Personalized Concept Practice',
    };
  }

  return null;
}

/**
 * 3. DIRECT QUESTION ANSWERING & SOCRATIC EVALUATION WITH FULL INTERFACE TELEMETRY
 *    Catches conceptual struggles (like writing JS functions), builds a custom Next Module,
 *    and supports the tutor conversation and helpful practice modules.
 */
export async function evaluateWithSocraticAI({
  learnerCode,
  runtimeOutput,
  activeNode,
  learnerQuestion = null,
  attemptCount = 1,
  interfaceSnapshot = null,
  chatHistory = [],
  apiConfig = {}
}) {
  const localEval = activeNode?.challengeSpec?.evaluateSubmission
    ? activeNode.challengeSpec.evaluateSubmission(learnerCode, runtimeOutput, interfaceSnapshot?.boardData)
    : {
        passed: false,
        socraticHint: ''
      };

  const detectedStruggle = detectConceptStruggle({
    learnerCode,
    runtimeOutput,
    learnerQuestion,
    interfaceSnapshot,
    activeNode,
    localEval
  });

  // Query Pedagogical Trajectory Router across 10,000+ struggles benchmark
  let struggleEpisode = null;
  let trajectoryAugmentation = '';
  const trajectoryDomain = resolveTrajectoryDomain(
    activeNode?.id,
    detectedStruggle?.gapTag || activeNode?.conceptTag
  );

  if (!localEval.passed && trajectoryDomain) {
    struggleEpisode = startStruggleEpisode({
      learnerId: apiConfig?.learnerId || 'student-active',
      nodeId: activeNode?.id,
      nodeTitle: activeNode?.title,
      conceptTag: detectedStruggle?.gapTag || activeNode?.conceptTag,
      struggleSignature: `check-${attemptCount}: ${localEval.socraticHint || 'struggle-check'}`
    });

    if (struggleEpisode) {
      trajectoryAugmentation = getTrajectoryPromptAugmentation(
        struggleEpisode.domainId,
        struggleEpisode.selectedArmKey
      );
    }
  }

  const telemetryBlock = interfaceSnapshot
    ? formatInterfaceContextForPrompt(interfaceSnapshot)
    : `Learner Code:\n\`\`\`javascript\n${formatNumberedCode(learnerCode)}\n\`\`\`\nTerminal Output:\n\`\`\`\n${runtimeOutput}\n\`\`\``;

  const recentChat = (chatHistory || [])
    .slice(-6)
    .map((m) => `${m.sender === 'student' ? 'LEARNER' : 'AI TUTOR'}: ${m.text}`)
    .join('\n');

  const isAskingQuestion = Boolean(learnerQuestion && learnerQuestion.trim().length > 0);

  try {
    const userPrompt = isAskingQuestion
      ? `
=== LEARNER'S INPUT IN RIGHT AI BAR ===
"${learnerQuestion}"

=== RECENT INTERACTION CHAT ===
${recentChat || '(First interaction)'}

=== CURRENT CHALLENGE GOAL ===
Module: ${activeNode.title}
Goal: ${activeNode.challengeSpec?.prompt || activeNode.description}

=== NUMBERED CODE IN EDITOR (${activeNode.challengeSpec?.targetFile || 'index.js'}) ===
\`\`\`javascript
${formatNumberedCode(learnerCode)}
\`\`\`

${telemetryBlock}

Detected Struggle Hint: ${detectedStruggle ? `${detectedStruggle.gapTag} (${detectedStruggle.title})` : 'none'}
${trajectoryAugmentation}

INSTRUCTION FOR RIGHT AI BAR:
Respond to the learner's actual message. If they are answering the reflection question shown in the recent chat, say what they understood, explain any mix-up gently, and show how the code supports the idea. If they ask a question, answer it with a clear explanation of what the code does and why it is written this way. Use simple English and ask no more than one useful follow-up question. Do not mark the code challenge complete when they are only chatting.
If useful, populate detectedGap and suggestDetourTitle for a focused practice module. Explain the idea and the implementation in plain English.`
      : `
Learner clicked "Check Solution" (Attempt #${attemptCount}).

=== CURRENT CHALLENGE GOAL ===
Module: ${activeNode.title}
Goal: ${activeNode.challengeSpec?.prompt || activeNode.description}

=== NUMBERED CODE IN EDITOR (${activeNode.challengeSpec?.targetFile || 'index.js'}) ===
\`\`\`javascript
${formatNumberedCode(learnerCode)}
\`\`\`

${telemetryBlock}

Automated Heuristic Check:
- passed: ${localEval.passed}
- detectedGap: ${localEval.detectedGap || detectedStruggle?.gapTag || 'none'}
- diagnostic note: ${localEval.socraticPraise || localEval.socraticHint}
${trajectoryAugmentation}

Evaluate the learner's code and terminal output specifically. If passed is true, congratulate them and explain why their code works. If passed is false, point out the exact line in their code that needs attention, and if they are struggling to write a function or another concept, set detectedGap and suggestDetourTitle so we build a custom module for them.`;

    const parsed = await callConfiguredLlm({
      systemPrompt: isAskingQuestion
        ? DIRECT_QUESTION_SYSTEM_PROMPT
        : SOCRATIC_EVAL_SYSTEM_PROMPT,
      userPrompt,
      apiConfig,
      expectJson: true,
      temperature: 0.4
    });

    if (parsed && (parsed.reply || parsed.narration)) {
      const cleanReply = sanitizeNoDirectSpoiler(parsed.reply || parsed.narration);
      const gap =
        parsed.detectedGap ||
        localEval.detectedGap ||
        detectedStruggle?.gapTag ||
        null;
      const detourTitle =
        parsed.suggestDetourTitle ||
        detectedStruggle?.title ||
        localEval.detourNode?.title ||
        null;

      const focal = inferFocalLineFromCode(
        learnerCode,
        interfaceSnapshot?.cursor?.lineNumber || 1
      );
      // The course's concrete challenge evaluator decides mastery. The model
      // can explain or question the result, but cannot unlock a module by itself.
      const didPass = !isAskingQuestion && Boolean(localEval.passed);

      const customDetourNode =
        !didPass && (struggleEpisode?.detourNodeId || gap || detourTitle)
          ? (struggleEpisode?.detourNodeId ? buildWinningDetourNode(struggleEpisode.detourNodeId, activeNode) : null) ||
            createDynamicDetourNode(gap || 'js-functions-fundamentals', detourTitle, activeNode) ||
            localEval.detourNode
          : null;

      return {
        passed: didPass,
        reply: cleanReply,
        spokenText: parsed.spokenText || stripMarkdownForSpeech(cleanReply),
        detectedGap: gap,
        detourNode: customDetourNode,
        trajectoryEpisodeId: struggleEpisode?.episodeId || null,
        trajectoryArm: struggleEpisode?.selectedArmKey || null,
        trajectoryDomain: trajectoryDomain?.id || null,
        cursorTarget: parsed.cursorTarget || {
          type: 'editor',
          line: focal.line,
          label: focal.label
        },
        isAiGenerated: true
      };
    }
  } catch (err) {
    console.warn('LLM evaluation error:', err);
  }

  const focal = inferFocalLineFromCode(
    learnerCode,
    interfaceSnapshot?.cursor?.lineNumber || 1
  );
  const gap = localEval.detectedGap || detectedStruggle?.gapTag || null;
  const detourTitle =
    detectedStruggle?.title || localEval.detourNode?.title || 'JavaScript Functions: Inputs, Body & Return';

  const customDetourNode = !localEval.passed
    ? (struggleEpisode?.detourNodeId ? buildWinningDetourNode(struggleEpisode.detourNodeId, activeNode) : null) ||
      createDynamicDetourNode(gap, detourTitle, activeNode) ||
      localEval.detourNode
    : null;

  const fallbackReply =
    localEval.passed
      ? localEval.socraticPraise
      : localEval.socraticHint ||
        `Check around line ${focal.line} in your editor and compare it with the challenge goal for **${activeNode.title}**.`;

  return {
    passed: localEval.passed,
    reply: fallbackReply,
    spokenText: stripMarkdownForSpeech(fallbackReply),
    detectedGap: gap,
    detourNode: customDetourNode,
    trajectoryEpisodeId: struggleEpisode?.episodeId || null,
    trajectoryArm: struggleEpisode?.selectedArmKey || null,
    trajectoryDomain: trajectoryDomain?.id || null,
    cursorTarget: {
      type: 'editor',
      line: focal.line,
      label: focal.label
    },
    isAiGenerated: false
  };
}

function inferFocalLineFromCode(code = '', fallbackLine = 1) {
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('this.balance') || lines[i].includes('this.secretCode')) {
      return { line: i + 1, label: `Look closely at \`this.\` on Line ${i + 1}` };
    }
  }
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('YOUR TURN') || lines[i].includes('withdraw(')) {
      return { line: i + 1, label: `Focus on Line ${i + 1}` };
    }
  }
  return { line: fallbackLine, label: `Inspecting Line ${fallbackLine}` };
}

// Guardrail filter: strips only large multi-line full-file solution dumps (>6 lines) while allowing helpful inline hints
function sanitizeNoDirectSpoiler(text = '') {
  if (!text) return '';
  return text.replace(/```[\s\S]*?```/g, (block) => {
    const innerLines = block
      .replace(/^```[a-zA-Z]*\n?/, '')
      .replace(/```$/, '')
      .trim()
      .split('\n');
    if (innerLines.length > 5) {
      return '[Try writing these lines directly in the editor!]';
    }
    return block;
  });
}

/**
 * Cleans raw markdown and AI responses for visual subtitle display.
 * Preserves HTML tags (e.g. `<main>`, `<h1>`, `<button>`) and code tokens
 * while stripping markdown markers (backticks, asterisks, hashes, links) and emojis.
 */
export function cleanMarkdownForSubtitles(rawText = '') {
  if (!rawText) return '';

  let t = rawText;

  // Replace code fences ```...``` with "code example"
  t = t.replace(/```[\s\S]*?```/g, 'code example');

  // Strip emojis and icon symbols
  t = t.replace(/[\u{1F300}-\u{1F9FF}|⚡📍✋🤔✅🎙️⚠️👇💡🎯🚀💻✨]/gu, '');

  // Strip backticks around inline code or tags: `<main>` -> <main>, `const x = 10;` -> const x = 10;
  t = t.replace(/`([^`]+)`/g, '$1');

  // Strip markdown bold and italic markers
  t = t.replace(/\*\*([^*]+)\*\*/g, '$1');
  t = t.replace(/\*([^*]+)\*/g, '$1');
  t = t.replace(/__([^_]+)__/g, '$1');
  t = t.replace(/_([^_]+)_/g, '$1');

  // Strip markdown links: [label](url) -> label
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Strip markdown headers
  t = t.replace(/^#{1,6}\s+/gm, '');

  // Normalize quotes and dashes
  t = t.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  t = t.replace(/—/g, ' - ');

  // Remove any remaining stray backticks or tildes
  t = t.replace(/[`~^]/g, '');

  // Normalize spaces
  t = t.replace(/\s+/g, ' ').trim();

  return t;
}

/**
 * Converts clean subtitle text into natural spoken English for Text-to-Speech engines.
 * Expands HTML tags (<button> -> button tag) and common programming operators phonetically.
 */
export function cleanTextForSpeech(subtitleText = '') {
  if (!subtitleText) return '';

  let s = subtitleText;

  // 1. Remove ellipsis, stray dots, trailing slashes, and placeholder symbols
  s = s.replace(/\.{2,}/g, '');
  s = s.replace(/<!--[\s\S]*?-->/g, ''); // HTML comments
  s = s.replace(/\/\*[\s\S]*?\*\//g, ''); // CSS/JS block comments
  s = s.replace(/\/\/[^\n]*/g, ''); // line comments
  s = s.replace(/[\\|~^_{}[\]]/g, ' ');

  // 2. Teach HTML tags naturally instead of reading angle brackets or closing slashes
  s = s.replace(/<\/([a-zA-Z0-9]+)>/g, 'closing $1 tag');
  s = s.replace(/<([a-zA-Z0-9]+)(?:\s+[^>]*)?>/g, '$1 tag');

  // 3. Natural teaching speech for common code constructs
  s = s.replace(/===/g, ' strictly equals ');
  s = s.replace(/!==/g, ' does not strictly equal ');
  s = s.replace(/==/g, ' equals ');
  s = s.replace(/!=/g, ' does not equal ');
  s = s.replace(/=>/g, ' arrow function ');
  s = s.replace(/\+\+/g, ' increment ');
  s = s.replace(/--/g, ' decrement ');
  s = s.replace(/&&/g, ' and ');
  s = s.replace(/\|\|/g, ' or ');

  // 4. Clean function calls: e.g. calculateTotal(price, tax) -> calculateTotal with price and tax
  s = s.replace(/([a-zA-Z0-9_$]+)\(\s*\)/g, '$1');
  s = s.replace(/([a-zA-Z0-9_$]+)\(([^)]+)\)/g, (match, fn, args) => {
    const cleanArgs = args.replace(/,/g, ' and ');
    return `${fn} with ${cleanArgs}`;
  });

  // 5. Clean headings and attributes
  s = s.replace(/\b(h[1-6])\b/gi, (m) => `heading ${m[1]}`);
  s = s.replace(/class=["'][^"']*["']/gi, '');
  s = s.replace(/href=["'][^"']*["']/gi, '');

  // 6. Strip any leftover technical punctuation that confuses TTS
  s = s.replace(/[<>;:=#*+]/g, ' ');

  // Normalize spaces
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

export function stripMarkdownForSpeech(text = '') {
  if (!text) return '';
  const subText = cleanMarkdownForSubtitles(text);
  return cleanTextForSpeech(subText);
}

/**
 * Dynamically builds a rich, multi-step Custom Learning Path Module (`detourNode`)
 * whenever the AI catches the student struggling with a concept (especially JavaScript Functions!).
 */
export function createDynamicDetourNode(gapTag, detourTitle, parentNode) {
  if (!gapTag && !detourTitle) return null;
  const normalizedGap = (gapTag || '').toLowerCase();
  const title = detourTitle || 'JavaScript Functions: Inputs, Body & Return';

  // 0. Winning Trajectory Detours from 10,000+ Students Telemetry Benchmark
  if (
    normalizedGap.includes('closure') ||
    normalizedGap.includes('lexical') ||
    normalizedGap === 'this-vs-lexical-scope' ||
    normalizedGap === 'state-mutation-in-closure'
  ) {
    const detour = buildWinningDetourNode('detour-closure-encapsulation-sandbox', parentNode);
    if (detour) return detour;
  }

  if (
    normalizedGap.includes('async') ||
    normalizedGap.includes('promise') ||
    normalizedGap.includes('event-loop') ||
    normalizedGap === 'missing-await-promise'
  ) {
    const detour = buildWinningDetourNode('detour-async-event-loop-sandbox', parentNode);
    if (detour) return detour;
  }

  if (
    normalizedGap.includes('vector') ||
    normalizedGap.includes('coordinate') ||
    normalizedGap.includes('geometry') ||
    normalizedGap === 'vectors-geometry'
  ) {
    const detour = buildWinningDetourNode('detour-vector-component-decomposition', parentNode);
    if (detour) return detour;
  }

  // 1. Specialized Custom Module for JavaScript Functions (Declaration, Parameters, Body & Return)
  if (
    normalizedGap.includes('function') ||
    normalizedGap.includes('method') ||
    normalizedGap.includes('parameter') ||
    title.toLowerCase().includes('function')
  ) {
    const step1Code = `// ==========================================================
// CUSTOM PATH MODULE: JavaScript Functions Step-by-Step
// ==========================================================

// 1. A function takes INPUTS (parameters) inside parentheses:
function addNumbers(a, b) {
  // 2. The BODY inside { } runs the calculation:
  const sum = a + b;
  // 3. The RETURN keyword sends the result back out:
  return sum;
}

console.log("addNumbers(10, 5) ->", addNumbers(10, 5));
`;

    const step2Code = `// ==========================================================
// CUSTOM PATH MODULE: JavaScript Functions Step-by-Step
// ==========================================================

function addNumbers(a, b) {
  const sum = a + b;
  return sum;
}

console.log("addNumbers(10, 5) ->", addNumbers(10, 5));

// 👇 YOUR TURN: Write a function named calculateTotal(price, tax)
// that adds price + tax and returns the result!


// Test your function when ready:
console.log("Total with tax:", typeof calculateTotal === "function" ? calculateTotal(40, 5) : "Write calculateTotal above!");
`;

    return {
      id: 'custom-path-js-functions',
      title: 'JavaScript Functions: Inputs, Body & Return',
      category: 'Custom Learning Path',
      status: 'in-progress',
      isDetour: true,
      conceptTag: 'js-functions-fundamentals',
      reason: `Custom path created because you were working on functions in "${(parentNode?.title || 'JavaScript').replace(/^\d+\.\s*/, '')}".`,
      description:
        'Master the 3 building blocks of every JavaScript function: input parameters `(a, b)`, the action body `{ ... }`, and sending back an output with `return`.',
      initialFiles: {
        'index.js': step1Code
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration:
            'I noticed you were working on writing functions, so I created this custom module just for you! Think of a JavaScript function like a machine: parameters `(a, b)` go in, the curly braces `{ }` process them, and `return` sends the output back.',
          file: 'index.js',
          highlightLine: 6,
          codeSnapshot: step1Code
        },
        {
          timeOffset: 3600,
          narration:
            'Now let us write one together! On line 14, declare `function calculateTotal(price, tax) { return price + tax; }` and click Check Solution.',
          file: 'index.js',
          highlightLine: 14,
          isChallengeStop: true,
          codeSnapshot: step2Code
        }
      ],
      challengeSpec: {
        prompt:
          'Write a function named `calculateTotal(price, tax)` that adds `price + tax` and returns the result.',
        targetFile: 'index.js',
        conceptsTested: ['js-functions-fundamentals', 'parameters', 'return-values'],
        evaluateSubmission(code, runtimeOutput) {
          const hasFnDecl =
            /function\s+calculateTotal\s*\(\s*([a-zA-Z0-9_$]+)\s*,\s*([a-zA-Z0-9_$]+)\s*\)|const\s+calculateTotal\s*=\s*\(\s*([a-zA-Z0-9_$]+)\s*,\s*([a-zA-Z0-9_$]+)\s*\)\s*=>/.test(
              code
            );
          const hasReturn = /calculateTotal[\s\S]*?return\s+/.test(code) || /=>\s*[^\{]/.test(code);
          const hasAddition = /\+/.test(code);

          if (!hasFnDecl) {
            return {
              passed: false,
              detectedGap: 'js-functions-fundamentals',
              socraticHint:
                'Start on line 14 with the `function` keyword, followed by the name `calculateTotal` and two parameters in parentheses: `function calculateTotal(price, tax) { ... }`.'
            };
          }
          if (!hasReturn) {
            return {
              passed: false,
              detectedGap: 'return-values',
              socraticHint:
                'Great job declaring `calculateTotal(price, tax)`! Now inside `{ ... }`, use the `return` keyword so your function sends back `price + tax`.'
            };
          }
          if (!hasAddition || (runtimeOutput && !runtimeOutput.includes('45'))) {
            return {
              passed: false,
              socraticHint:
                'Almost there! Make sure inside `calculateTotal(price, tax)` you return `price + tax` so `calculateTotal(40, 5)` outputs `45`.'
            };
          }
          return {
            passed: true,
            socraticPraise:
              'Awesome work! You wrote `calculateTotal(price, tax)` from scratch with parameters, a function body, and a `return` statement!'
          };
        }
      }
    };
  }

  // 2. If parentNode already had a specific built-in detourNode, return it
  if (parentNode?.challengeSpec && gapTag === 'this-vs-lexical-scope') {
    return null; // allow localEval.detourNode to be used if present
  }

  // 2b. Kenyan Industry 4.0 Specific Modules
  if (gapTag === 'mpesa-stk-push') {
    return {
      id: `custom-path-${normalizedGap}`,
      title: title || 'Safaricom Daraja STK Push & Async Promises',
      category: 'FinTech Rails',
      status: 'in-progress',
      isDetour: true,
      conceptTag: 'mpesa-stk-push',
      reason: 'Bridging university theory to Kenyan FinTech production standards.',
      description: 'Implement non-blocking M-Pesa STK push requests in Node.js.',
      initialFiles: {
        'index.js': `// Safaricom Daraja STK Push Service\nasync function initiateMpesaPayment(phoneNumber, amount) {\n  // Implement try / catch with await\n}\n`
      },
      challengeSpec: {
        prompt: 'Inside `async function initiateMpesaPayment(phoneNumber, amount)`, use `try / catch` to `await simulateDarajaStkPush(...)` and return the result.',
        targetFile: 'index.js',
        conceptsTested: ['async-await', 'try-catch', 'fintech-apis'],
        evaluateSubmission(code) {
          const hasAwait = /await\s+simulateDarajaStkPush/.test(code);
          const hasTryCatch = /try\s*\{[\s\S]*\}\s*catch/.test(code);
          return {
            passed: hasAwait && hasTryCatch,
            socraticPraise: 'Spot on! Production-grade asynchronous Daraja integration.',
            socraticHint: 'Make sure to await simulateDarajaStkPush inside try/catch.'
          };
        }
      }
    };
  }

  if (gapTag === 'webhook-idempotency') {
    return {
      id: `custom-path-${normalizedGap}`,
      title: title || 'Idempotent Webhook Callback Reconciliation',
      category: 'FinTech Rails',
      status: 'in-progress',
      isDetour: true,
      conceptTag: 'webhook-idempotency',
      reason: 'Ensuring duplicate payment notifications do not credit accounts twice.',
      description: 'Process incoming payment callbacks idempotently.',
      initialFiles: {
        'index.js': `// Webhook Idempotency Ledger\nfunction reconcileCallback(payload) {\n  // Check processedTransactions\n}\n`
      },
      challengeSpec: {
        prompt: 'In `reconcileCallback(payload)`, check if `processedTransactions.has(payload.transactionId)`. If true, return "DUPLICATE_IGNORED". Otherwise record and return "CREDITED".',
        targetFile: 'index.js',
        conceptsTested: ['idempotency', 'set-data-structure'],
        evaluateSubmission(code) {
          const hasCheck = /processedTransactions\.has/.test(code);
          return {
            passed: hasCheck,
            socraticPraise: 'Idempotency verified! No duplicate crediting.',
            socraticHint: 'Check if transactionId is in processedTransactions.'
          };
        }
      }
    };
  }

  // 3. General Custom Path Module for any other concept
  const starterCode = `// ==========================================================
// CUSTOM PATH MODULE: ${title}
// ==========================================================

function practiceConcept(input) {
  // Complete the function below to practice ${title}:
  return input;
}

console.log("Result:", practiceConcept("Ready"));
`;
  return {
    id: `custom-path-${normalizedGap || 'concept'}`,
    title,
    category: 'Custom Learning Path',
    status: 'in-progress',
    isDetour: true,
    conceptTag: normalizedGap || 'custom-concept',
    reason: `Custom module created to help you master ${title}.`,
    description: `Step-by-step interactive practice on ${title}.`,
    initialFiles: {
      'index.js': starterCode
    },
    aiTimeline: [
      {
        timeOffset: 0,
        narration: `Welcome to your custom module on ${title}! Let's practice this concept step by step so it clicks completely.`,
        file: 'index.js',
        highlightLine: 6,
        isChallengeStop: true,
        codeSnapshot: starterCode
      }
    ],
    challengeSpec: {
      prompt: `Update \`practiceConcept(input)\` on line 6 and run your code to test ${title}.`,
      targetFile: 'index.js',
      conceptsTested: [normalizedGap || 'custom-concept'],
      evaluateSubmission(code, runtimeOutput) {
        const modified = code.trim() !== starterCode.trim();
        return {
          passed: modified && Boolean(runtimeOutput),
          socraticPraise: `Great work completing your custom module on ${title}!`,
          socraticHint: `Try updating \`practiceConcept\` on line 6 and clicking Check Solution.`
        };
      }
    }
  };
}

// ============================================================================
// AI VOICE SYNTHESIS (OpenAI Neural TTS + Browser Neural Speech Synthesis)
// & SPEECH-TO-TEXT (MICROPHONE VOICE INPUT)
// ============================================================================

let activeAudioElement = null;
let activeAudioInterval = null;
let activeSubtitleTimer = null;
let activeKeepAliveTimer = null;
let activeDwellTimer = null;
let activeStartupFallbackTimer = null;
let speakingStateListeners = new Set();

export function onAiSpeakingStateChange(listener) {
  speakingStateListeners.add(listener);
  return () => speakingStateListeners.delete(listener);
}

let lastEmittedSpeaking = null;
let lastEmittedSubtitle = null;

function notifySpeakingState(isSpeaking, currentSubtitleLine = '') {
  if (
    lastEmittedSpeaking === isSpeaking &&
    lastEmittedSubtitle === currentSubtitleLine
  ) {
    return;
  }
  lastEmittedSpeaking = isSpeaking;
  lastEmittedSubtitle = currentSubtitleLine;

  speakingStateListeners.forEach((fn) => {
    try {
      fn(isSpeaking, currentSubtitleLine);
    } catch {
      // ignore
    }
  });
}

/**
 * Intelligent subtitle chunker:
 * - Splits clean narration text into natural, single-line reading chunks (~5-7 words max)
 * - Breaks along natural grammatical boundaries (commas, conjunctions, prepositions)
 * - Prevents dangling 1-2 word orphaned lines
 * - Generates synchronized phonetic duration estimates and character ranges
 */
export function splitIntoAlignedSubtitleChunks(rawText = '') {
  const cleanSub = cleanMarkdownForSubtitles(rawText);
  if (!cleanSub) return [];

  const rawWords = cleanSub.split(/\s+/).filter(Boolean);
  if (!rawWords.length) return [];

  const chunks = [];
  let currentWords = [];
  const breakWords = new Set([
    'and', 'but', 'or', 'for', 'with', 'to', 'in', 'on', 'at', 'that', 'which', 'because', 'from', 'by'
  ]);

  for (let i = 0; i < rawWords.length; i++) {
    const w = rawWords[i];
    const isLast = i === rawWords.length - 1;
    const remaining = rawWords.length - (i + 1);

    currentWords.push(w);
    const joined = currentWords.join(' ');
    const endsSentence = /[.!?]$/.test(w);
    const endsClause = /[,;:—]$/.test(w) && currentWords.length >= 3;

    const nextWord = !isLast ? rawWords[i + 1].toLowerCase().replace(/[^a-z]/g, '') : '';
    const shouldBreakBeforeNext = breakWords.has(nextWord) && currentWords.length >= 4;
    const isGettingLong = currentWords.length >= 7 || joined.length >= 42;

    const willLeaveOrphan = remaining > 0 && remaining <= 2;

    if (
      endsSentence ||
      (endsClause && !willLeaveOrphan) ||
      (shouldBreakBeforeNext && !willLeaveOrphan) ||
      (isGettingLong && !willLeaveOrphan) ||
      isLast
    ) {
      const subChunk = joined;
      const speechChunk = cleanTextForSpeech(subChunk);

      chunks.push({
        subtitleText: subChunk,
        spokenText: speechChunk,
        wordCount: currentWords.length
      });
      currentWords = [];
    }
  }

  if (currentWords.length) {
    const subChunk = currentWords.join(' ');
    const speechChunk = cleanTextForSpeech(subChunk);
    if (chunks.length) {
      chunks[chunks.length - 1].subtitleText += ' ' + subChunk;
      chunks[chunks.length - 1].spokenText += ' ' + speechChunk;
      chunks[chunks.length - 1].wordCount += currentWords.length;
    } else {
      chunks.push({
        subtitleText: subChunk,
        spokenText: speechChunk,
        wordCount: currentWords.length
      });
    }
  }

  // Calculate startChar and endChar offsets in the full concatenated spoken text
  let spokenCursor = 0;
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    c.startChar = spokenCursor;
    spokenCursor += c.spokenText.length;
    c.endChar = spokenCursor;
    spokenCursor += 1; // 1 space between chunks in .join(' ')

    // Phonetic duration calculation based on spoken word length and natural pauses
    const words = c.spokenText.split(/\s+/).filter(Boolean);
    let dur = 0;
    for (const w of words) {
      dur += Math.min(600, w.length * 28 + 180);
      if (/[,;:]$/.test(w)) dur += 220;
      if (/[.!?]$/.test(w)) dur += 380;
    }
    c.estimatedDurationMs = Math.max(850, dur);
  }

  return chunks;
}

/**
 * Selects the highest quality natural/neural voice available in the current browser.
 */
function getBestVoice() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices?.() || [];
  if (!voices.length) return null;

  return (
    voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Online (Natural)') || v.name.includes('Natural'))
    ) ||
    voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Google US English') || v.name.includes('Google UK English'))
    ) ||
    voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Neural') ||
          v.name.includes('Aria') ||
          v.name.includes('Guy') ||
          v.name.includes('Jenny'))
    ) ||
    voices.find((v) => v.lang.startsWith('en') && !v.name.includes('Desktop')) ||
    voices.find((v) => v.lang.startsWith('en')) ||
    voices[0]
  );
}

export async function speakNarration(
  text,
  enabled = true,
  onEnd = null,
  apiConfig = null
) {
  stopNarration();

  if (!text || typeof window === 'undefined') {
    if (onEnd) onEnd();
    return;
  }

  const chunks = splitIntoAlignedSubtitleChunks(text);
  if (!chunks.length) {
    if (onEnd) onEnd();
    return;
  }

  const fullSpokenText = chunks.map((c) => c.spokenText).join(' ');
  const totalEstimatedMs = chunks.reduce((sum, c) => sum + c.estimatedDurationMs, 0);

  // --------------------------------------------------------------------------
  // Mode 1: Voice is muted (still show perfectly timed single-line subtitles)
  // --------------------------------------------------------------------------
  if (!enabled) {
    let idx = 0;
    notifySpeakingState(true, chunks[0].subtitleText);

    const stepMuted = () => {
      if (idx < chunks.length - 1) {
        idx += 1;
        notifySpeakingState(true, chunks[idx].subtitleText);
        activeSubtitleTimer = setTimeout(stepMuted, chunks[idx].estimatedDurationMs);
      } else {
        activeDwellTimer = setTimeout(() => {
          notifySpeakingState(false, '');
          if (onEnd) onEnd();
        }, 650);
      }
    };

    activeSubtitleTimer = setTimeout(stepMuted, chunks[0].estimatedDurationMs);
    return;
  }

  // --------------------------------------------------------------------------
  // Mode 2: Neural Server TTS API (ElevenLabs / OpenAI TTS) with frame-accurate sync
  // --------------------------------------------------------------------------
  if (
    import.meta.env?.VITE_TTS_ENGINE === 'elevenlabs' ||
    import.meta.env?.VITE_TTS_ENGINE === 'openai-tts' ||
    Boolean(import.meta.env?.VITE_ELEVENLABS_API_KEY)
  ) {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voice: import.meta.env?.VITE_TTS_VOICE || 'nova',
          input: fullSpokenText.slice(0, 4000)
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        activeAudioElement = audio;

        // Pro-rate chunk durations across actual audio duration
        const setupAudioTiming = () => {
          const totalDurationSec =
            audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)
              ? audio.duration
              : totalEstimatedMs / 1000;
          let currentStart = 0;
          for (const c of chunks) {
            const fraction = c.estimatedDurationMs / totalEstimatedMs;
            const dur = fraction * totalDurationSec;
            c.startTime = currentStart;
            c.endTime = currentStart + dur;
            currentStart = c.endTime;
          }
        };

        audio.onloadedmetadata = setupAudioTiming;
        audio.oncanplay = setupAudioTiming;

        let lastSubtitle = chunks[0].subtitleText;
        notifySpeakingState(true, chunks[0].subtitleText);

        const syncToAudioTime = () => {
          if (!activeAudioElement || activeAudioElement !== audio) return;
          const t = audio.currentTime;
          const current =
            chunks.find((c) => t >= c.startTime && t < c.endTime) ||
            chunks[chunks.length - 1];
          if (current && current.subtitleText !== lastSubtitle) {
            lastSubtitle = current.subtitleText;
            notifySpeakingState(true, current.subtitleText);
          }
        };

        audio.ontimeupdate = syncToAudioTime;
        activeAudioInterval = setInterval(syncToAudioTime, 60);

        audio.onended = () => {
          if (activeAudioInterval) {
            clearInterval(activeAudioInterval);
            activeAudioInterval = null;
          }
          URL.revokeObjectURL(audioUrl);
          if (activeAudioElement === audio) activeAudioElement = null;
          activeDwellTimer = setTimeout(() => {
            notifySpeakingState(false, '');
            if (onEnd) onEnd();
          }, 650);
        };

        audio.onerror = () => {
          if (activeAudioInterval) {
            clearInterval(activeAudioInterval);
            activeAudioInterval = null;
          }
          URL.revokeObjectURL(audioUrl);
          if (activeAudioElement === audio) activeAudioElement = null;
          notifySpeakingState(false, '');
          if (onEnd) onEnd();
        };

        await audio.play();
        return;
      }
    } catch (err) {
      console.warn('OpenAI TTS fallback to Browser SpeechSynthesis:', err);
    }
  }

  // --------------------------------------------------------------------------
  // Mode 3: Browser Neural SpeechSynthesis with natural voice & boundary sync
  // --------------------------------------------------------------------------
  if (!('speechSynthesis' in window)) {
    let idx = 0;
    notifySpeakingState(true, chunks[0].subtitleText);
    const stepFallback = () => {
      if (idx < chunks.length - 1) {
        idx += 1;
        notifySpeakingState(true, chunks[idx].subtitleText);
        activeSubtitleTimer = setTimeout(stepFallback, chunks[idx].estimatedDurationMs);
      } else {
        activeDwellTimer = setTimeout(() => {
          notifySpeakingState(false, '');
          if (onEnd) onEnd();
        }, 650);
      }
    };
    activeSubtitleTimer = setTimeout(stepFallback, chunks[0].estimatedDurationMs);
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(fullSpokenText);
    const preferredVoice = getBestVoice();
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    let currentIdx = 0;
    let isSpeakingStarted = false;
    let isFinished = false;

    // Show Chunk 0 text only, but DO NOT advance until audio actually begins
    notifySpeakingState(true, chunks[0].subtitleText);

    const finishOnce = () => {
      if (isFinished) return;
      isFinished = true;

      if (activeSubtitleTimer) {
        clearTimeout(activeSubtitleTimer);
        activeSubtitleTimer = null;
      }
      if (activeStartupFallbackTimer) {
        clearTimeout(activeStartupFallbackTimer);
        activeStartupFallbackTimer = null;
      }
      if (activeKeepAliveTimer) {
        clearTimeout(activeKeepAliveTimer);
        activeKeepAliveTimer = null;
      }

      // Dwell on final subtitle for comfortable reading
      activeDwellTimer = setTimeout(() => {
        notifySpeakingState(false, '');
        if (onEnd) onEnd();
      }, 650);
    };

    const scheduleChunkTimer = (durationMs) => {
      if (activeSubtitleTimer) {
        clearTimeout(activeSubtitleTimer);
        activeSubtitleTimer = null;
      }
      // If we're on the last chunk, leave it visible until utterance.onend fires
      if (currentIdx >= chunks.length - 1) return;

      activeSubtitleTimer = setTimeout(() => {
        advanceToChunk(currentIdx + 1);
      }, durationMs);
    };

    const advanceToChunk = (nextIdx) => {
      if (isFinished || nextIdx <= currentIdx || nextIdx >= chunks.length) return;
      currentIdx = nextIdx;
      notifySpeakingState(true, chunks[currentIdx].subtitleText);
      scheduleChunkTimer(chunks[currentIdx].estimatedDurationMs);
    };

    // 1. Audio Start: Start advancing subtitles ONLY when speech actually starts playing
    utterance.onstart = () => {
      isSpeakingStarted = true;
      if (activeStartupFallbackTimer) {
        clearTimeout(activeStartupFallbackTimer);
        activeStartupFallbackTimer = null;
      }
      notifySpeakingState(true, chunks[0].subtitleText);
      scheduleChunkTimer(chunks[0].estimatedDurationMs);
    };

    // 2. Word Boundary Event: Frame-accurate synchronization when supported by browser voice
    utterance.onboundary = (event) => {
      // First boundary event confirms audio has started even if onstart was delayed
      if (!isSpeakingStarted) {
        isSpeakingStarted = true;
        if (activeStartupFallbackTimer) {
          clearTimeout(activeStartupFallbackTimer);
          activeStartupFallbackTimer = null;
        }
      }

      if (typeof event.charIndex === 'number') {
        const charIndex = event.charIndex;
        const foundIdx = chunks.findIndex(
          (c, idx) =>
            charIndex >= c.startChar &&
            (idx === chunks.length - 1 || charIndex < chunks[idx + 1].startChar)
        );
        if (foundIdx >= 0 && foundIdx !== currentIdx && foundIdx < chunks.length) {
          advanceToChunk(foundIdx);
        }
      }
    };

    utterance.onend = finishOnce;
    utterance.onerror = finishOnce;

    // Safety fallback: only if the browser completely fails to fire onstart/onboundary after 3.5s
    activeStartupFallbackTimer = setTimeout(() => {
      if (!isSpeakingStarted && !isFinished) {
        isSpeakingStarted = true;
        scheduleChunkTimer(chunks[0].estimatedDurationMs);
      }
    }, 3500);

    // Safety fallback: if utterance.onend never fires, ensure completion after total duration + 3s
    activeKeepAliveTimer = setTimeout(() => {
      if (!isFinished) {
        finishOnce();
      }
    }, totalEstimatedMs + 3000);

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('SpeechSynthesis error:', err);
    notifySpeakingState(false, '');
    if (onEnd) onEnd();
  }
}

export function stopNarration() {
  if (activeSubtitleTimer) {
    clearTimeout(activeSubtitleTimer);
    activeSubtitleTimer = null;
  }
  if (activeKeepAliveTimer) {
    clearTimeout(activeKeepAliveTimer);
    activeKeepAliveTimer = null;
  }
  if (activeDwellTimer) {
    clearTimeout(activeDwellTimer);
    activeDwellTimer = null;
  }
  if (activeStartupFallbackTimer) {
    clearTimeout(activeStartupFallbackTimer);
    activeStartupFallbackTimer = null;
  }
  if (activeAudioInterval) {
    clearInterval(activeAudioInterval);
    activeAudioInterval = null;
  }
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
      activeAudioElement = null;
    } catch {
      // ignore
    }
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
  notifySpeakingState(false, '');
}

/**
 * Speech-to-Text Microphone Listener
 */
export function startMicrophoneRecognition({ onInterimResult, onFinalResult, onError, onEnd }) {
  if (typeof window === 'undefined') {
    onError?.('Speech recognition is only available in a browser environment.');
    return null;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    onError?.('Your browser does not support Web Speech Recognition (try Chrome or Edge).');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  let finalTranscript = '';

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interim += transcript;
      }
    }
    if (interim) onInterimResult?.(interim);
    if (finalTranscript) onFinalResult?.(finalTranscript.trim());
  };

  recognition.onerror = (event) => {
    onError?.(event.error || 'Microphone recognition error');
  };

  recognition.onend = () => {
    onEnd?.(finalTranscript.trim());
  };

  recognition.start();
  return recognition;
}

export const startSpeechRecognition = startMicrophoneRecognition;

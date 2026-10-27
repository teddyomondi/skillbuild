// ============================================================================
// LAB STUDIO ENGINE: 10-MINUTE STEM CHALLENGE & SOCRATIC RUBRIC GENERATOR
// ============================================================================
// Packages the AI Cursor + AST Validator + Timeline Recorder into an authoring
// pipeline where any senior engineer, lecturer, or STEM creator can build an
// interactive Scrimba-style lab in 10 minutes simply by solving the problem
// on screen while talking.
// ============================================================================

import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import { diffLines, createTwoFilesPatch } from 'diff';
import { callConfiguredLlm, startSpeechRecognition } from './socraticAiTutor.js';
import { runCodeInWorkspace } from './runtimeEngine.js';

/**
 * Pre-configured STEM Domain Presets for 1-Click Creator Jumpstart
 */
export const STEM_DOMAINS = {
  coding: {
    id: 'coding',
    label: 'Software & Full-Stack',
    icon: 'Code2',
    fileExt: 'js',
    entryFile: 'index.js',
    sampleTitle: 'Resilient Async Worker with Exponential Backoff',
    sampleConcept: 'async-retry-jitter',
    starterCode: `// ============================================================================
// LAB: Resilient Asynchronous Worker with Exponential Backoff
// ============================================================================
// Industry Context: Distributed services must handle intermittent network
// failures without thundering-herd spikes against upstream databases.
// ============================================================================

/**
 * Execute an async task with retries and exponential backoff
 * @param {Function} task - Async function returning a Promise
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} baseDelayMs - Initial delay in milliseconds (default: 100)
 */
export async function executeWithRetry(task, maxRetries = 3, baseDelayMs = 100) {
  // 👇 YOUR TURN: Implement the retry loop with backoff below!
  
}

// Verification Test Runner
async function runTest() {
  console.log('--- Testing Resilient Worker ---');
  let attempts = 0;
  const flakyApi = async () => {
    attempts++;
    if (attempts < 3) throw new Error('Network timeout (504 Gateway Timeout)');
    return 'PAYMENT_CONFIRMED_200_OK';
  };

  const result = await executeWithRetry(flakyApi, 4, 20);
  console.log('Result:', result);
  console.log('Total attempts made:', attempts);
}

runTest();
`,
    solutionCode: `// ============================================================================
// LAB: Resilient Asynchronous Worker with Exponential Backoff
// ============================================================================

export async function executeWithRetry(task, maxRetries = 3, baseDelayMs = 100) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await task();
    } catch (err) {
      lastError = err;
      if (attempt === maxRetries) break;
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

async function runTest() {
  console.log('--- Testing Resilient Worker ---');
  let attempts = 0;
  const flakyApi = async () => {
    attempts++;
    if (attempts < 3) throw new Error('Network timeout (504 Gateway Timeout)');
    return 'PAYMENT_CONFIRMED_200_OK';
  };

  const result = await executeWithRetry(flakyApi, 4, 20);
  console.log('Result:', result);
  console.log('Total attempts made:', attempts);
}

runTest();
`
  },

  mathematics: {
    id: 'mathematics',
    label: 'Applied Mathematics & Vectors',
    icon: 'Sigma',
    fileExt: 'js',
    entryFile: 'index.js',
    sampleTitle: 'Vector Dot Product & Orthogonality Detector',
    sampleConcept: 'vector-orthogonality',
    starterCode: `// ============================================================================
// LAB: Vector Dot Product & Orthogonality Detector
// ============================================================================
// Mathematical Context: Two non-zero vectors u and v in R^n are orthogonal
// (perpendicular) if and only if their Euclidean inner product u • v = 0.
// In numerical computing, we check if |u • v| < epsilon.
// ============================================================================

/**
 * Calculates Euclidean inner product of two n-dimensional vectors
 */
export function dotProduct(u, v) {
  // 👇 YOUR TURN: Calculate sum(u[i] * v[i])
  
}

/**
 * Checks whether vectors are orthogonal within numerical tolerance
 */
export function areOrthogonal(u, v, epsilon = 1e-6) {
  // 👇 YOUR TURN: Verify if Math.abs(dotProduct(u, v)) < epsilon
  
}

function runVerification() {
  console.log('--- Verifying Vector Orthogonality ---');
  const v1 = [1, 2, -3];
  const v2 = [2, -1, 0]; // 1*2 + 2*(-1) + (-3)*0 = 2 - 2 + 0 = 0 (Orthogonal)
  const v3 = [3, 4, 5];

  console.log('v1 • v2 =', dotProduct(v1, v2));
  console.log('Are v1 & v2 orthogonal?', areOrthogonal(v1, v2));
  console.log('v1 • v3 =', dotProduct(v1, v3));
  console.log('Are v1 & v3 orthogonal?', areOrthogonal(v1, v3));
}

runVerification();
`,
    solutionCode: `// ============================================================================
// LAB: Vector Dot Product & Orthogonality Detector
// ============================================================================

export function dotProduct(u, v) {
  if (!Array.isArray(u) || !Array.isArray(v) || u.length !== v.length) {
    throw new Error('Vectors must have matching non-zero dimensions.');
  }
  return u.reduce((sum, val, idx) => sum + val * v[idx], 0);
}

export function areOrthogonal(u, v, epsilon = 1e-6) {
  const dot = dotProduct(u, v);
  return Math.abs(dot) < epsilon;
}

function runVerification() {
  console.log('--- Verifying Vector Orthogonality ---');
  const v1 = [1, 2, -3];
  const v2 = [2, -1, 0];
  const v3 = [3, 4, 5];

  console.log('v1 • v2 =', dotProduct(v1, v2));
  console.log('Are v1 & v2 orthogonal?', areOrthogonal(v1, v2));
  console.log('v1 • v3 =', dotProduct(v1, v3));
  console.log('Are v1 & v3 orthogonal?', areOrthogonal(v1, v3));
}

runVerification();
`
  },

  pcb: {
    id: 'pcb',
    label: 'PCB & Circuit Electronics',
    icon: 'Cpu',
    fileExt: 'js',
    entryFile: 'index.js',
    sampleTitle: 'RC Low-Pass Filter Cutoff & Bode Attenuation',
    sampleConcept: 'rc-filter-bode',
    starterCode: `// ============================================================================
// LAB: RC Low-Pass Filter Frequency Cutoff & Bode Attenuation
// ============================================================================
// Electronics Context: An RC passive filter attenuates high-frequency noise.
// Cutoff frequency fc = 1 / (2 * pi * R * C).
// At fc, signal power drops by 3dB (gain = 1 / sqrt(2) ≈ 0.707).
// Attenuation (dB) = -10 * log10(1 + (f / fc)^2).
// ============================================================================

/**
 * Calculates cutoff frequency in Hertz
 * @param {number} rOhms - Resistance in Ohms
 * @param {number} cFarads - Capacitance in Farads
 */
export function calculateCutoffFrequency(rOhms, cFarads) {
  // 👇 YOUR TURN: Compute 1 / (2 * Math.PI * rOhms * cFarads)
  
}

/**
 * Calculates attenuation in decibels (dB) at input frequency f
 */
export function calculateAttenuationDb(frequencyHz, cutoffHz) {
  // 👇 YOUR TURN: Compute -10 * Math.log10(1 + Math.pow(frequencyHz / cutoffHz, 2))
  
}

function verifyFilterDesign() {
  console.log('--- Hardware PCB Filter Verification ---');
  // R = 1kΩ, C = 100nF (0.1µF)
  const R = 1000;
  const C = 100e-9;
  const fc = calculateCutoffFrequency(R, C);
  console.log('Cutoff Frequency fc:', Math.round(fc), 'Hz (Expected ~1592 Hz)');
  
  const attenAtFc = calculateAttenuationDb(fc, fc);
  console.log('Attenuation at fc:', attenAtFc.toFixed(2), 'dB (Expected ~ -3.01 dB)');
  
  const attenAt10x = calculateAttenuationDb(fc * 10, fc);
  console.log('Attenuation at 10x fc:', attenAt10x.toFixed(2), 'dB (Expected ~ -20.04 dB)');
}

verifyFilterDesign();
`,
    solutionCode: `// ============================================================================
// LAB: RC Low-Pass Filter Frequency Cutoff & Bode Attenuation
// ============================================================================

export function calculateCutoffFrequency(rOhms, cFarads) {
  if (rOhms <= 0 || cFarads <= 0) {
    throw new Error('Resistance and capacitance must be positive values.');
  }
  return 1 / (2 * Math.PI * rOhms * cFarads);
}

export function calculateAttenuationDb(frequencyHz, cutoffHz) {
  const ratio = frequencyHz / cutoffHz;
  return -10 * Math.log10(1 + Math.pow(ratio, 2));
}

function verifyFilterDesign() {
  console.log('--- Hardware PCB Filter Verification ---');
  const R = 1000;
  const C = 100e-9;
  const fc = calculateCutoffFrequency(R, C);
  console.log('Cutoff Frequency fc:', Math.round(fc), 'Hz (Expected ~1592 Hz)');
  
  const attenAtFc = calculateAttenuationDb(fc, fc);
  console.log('Attenuation at fc:', attenAtFc.toFixed(2), 'dB (Expected ~ -3.01 dB)');
  
  const attenAt10x = calculateAttenuationDb(fc * 10, fc);
  console.log('Attenuation at 10x fc:', attenAt10x.toFixed(2), 'dB (Expected ~ -20.04 dB)');
}

verifyFilterDesign();
`
  },

  iot: {
    id: 'iot',
    label: 'IoT & Embedded Firmware',
    icon: 'Radio',
    fileExt: 'js',
    entryFile: 'index.js',
    sampleTitle: 'MicroPython Sensor Debounce & Ring-Buffer Telemetry',
    sampleConcept: 'iot-debounce-telemetry',
    starterCode: `// ============================================================================
// LAB: IoT Sensor Debounce & Ring-Buffer Telemetry
// ============================================================================
// Embedded Systems Context: Mechanical push-buttons and reed switches bounce
// electrically for 10-30ms upon contact. Firmware must discard false transitions.
// Telemetry queues must also run in fixed memory using a ring buffer.
// ============================================================================

export class DebouncedSensor {
  constructor(debounceMs = 50, bufferCapacity = 5) {
    this.debounceMs = debounceMs;
    this.bufferCapacity = bufferCapacity;
    this.lastTriggerTime = 0;
    this.readingBuffer = [];
    this.totalAccepted = 0;
  }

  /**
   * Process a hardware interrupt trigger with timestamp
   * Returns true if event was accepted, false if discarded as bounce noise.
   */
  handleInterrupt(timestampMs, sensorValue) {
    // 👇 YOUR TURN: Guard against bounce noise and append to ring buffer!
    
  }

  getBuffer() {
    return [...this.readingBuffer];
  }
}

function verifyFirmware() {
  console.log('--- Testing IoT Interrupt Debounce ---');
  const sensor = new DebouncedSensor(30, 3);

  // Rapid mechanical switch bouncing at t=100ms
  const e1 = sensor.handleInterrupt(100, 24.5); // Valid initial edge
  const e2 = sensor.handleInterrupt(105, 24.5); // Bounce noise (5ms < 30ms) -> discard
  const e3 = sensor.handleInterrupt(112, 24.5); // Bounce noise (12ms < 30ms) -> discard
  const e4 = sensor.handleInterrupt(145, 25.1); // Valid edge (45ms > 30ms) -> accept

  console.log('Event 1 accepted?', e1);
  console.log('Event 2 accepted (should be false)?', e2);
  console.log('Event 4 accepted (should be true)?', e4);
  console.log('Total valid readings:', sensor.totalAccepted);
  console.log('Ring buffer contents:', sensor.getBuffer());
}

verifyFirmware();
`,
    solutionCode: `// ============================================================================
// LAB: IoT Sensor Debounce & Ring-Buffer Telemetry
// ============================================================================

export class DebouncedSensor {
  constructor(debounceMs = 50, bufferCapacity = 5) {
    this.debounceMs = debounceMs;
    this.bufferCapacity = bufferCapacity;
    this.lastTriggerTime = 0;
    this.readingBuffer = [];
    this.totalAccepted = 0;
  }

  handleInterrupt(timestampMs, sensorValue) {
    if (timestampMs - this.lastTriggerTime < this.debounceMs) {
      return false; // Discard mechanical contact bounce
    }

    this.lastTriggerTime = timestampMs;
    this.totalAccepted++;

    if (this.readingBuffer.length >= this.bufferCapacity) {
      this.readingBuffer.shift(); // Evict oldest telemetry item (ring buffer)
    }
    this.readingBuffer.push({ t: timestampMs, value: sensorValue });
    return true;
  }

  getBuffer() {
    return [...this.readingBuffer];
  }
}

function verifyFirmware() {
  console.log('--- Testing IoT Interrupt Debounce ---');
  const sensor = new DebouncedSensor(30, 3);

  const e1 = sensor.handleInterrupt(100, 24.5);
  const e2 = sensor.handleInterrupt(105, 24.5);
  const e3 = sensor.handleInterrupt(112, 24.5);
  const e4 = sensor.handleInterrupt(145, 25.1);

  console.log('Event 1 accepted?', e1);
  console.log('Event 2 accepted (should be false)?', e2);
  console.log('Event 4 accepted (should be true)?', e4);
  console.log('Total valid readings:', sensor.totalAccepted);
  console.log('Ring buffer contents:', sensor.getBuffer());
}

verifyFirmware();
`
  }
};

/**
 * Creates an active Timeline Recording Session
 */
export function createRecordingSession({
  domain = 'coding',
  title = '',
  starterCode = '',
  entryFile = 'index.js'
}) {
  const startTime = Date.now();
  return {
    id: `session-${Date.now()}`,
    domain,
    title: title || STEM_DOMAINS[domain]?.sampleTitle || 'Untitled Interactive Lab',
    entryFile,
    startTime,
    isRecording: true,
    isPaused: false,
    starterCode: starterCode || STEM_DOMAINS[domain]?.starterCode || '',
    finalCode: starterCode || STEM_DOMAINS[domain]?.starterCode || '',
    challengeStopOffset: null,
    events: [],
    transcripts: [],
    snapshots: [
      {
        offsetMs: 0,
        file: entryFile,
        code: starterCode || STEM_DOMAINS[domain]?.starterCode || '',
        highlightLine: 1,
        note: 'Recording started'
      }
    ],
    lastTerminalOutput: ''
  };
}

/**
 * Starts Live Voice Audio Recognition for the Recording Session
 */
export function startStudioVoiceCapture({ onTranscript, onError }) {
  if (typeof window === 'undefined') return null;
  return startSpeechRecognition({
    onInterimResult: (interim) => {
      onTranscript?.({ text: interim, isFinal: false, timestamp: Date.now() });
    },
    onFinalResult: (finalText) => {
      onTranscript?.({ text: finalText, isFinal: true, timestamp: Date.now() });
    },
    onError: (err) => {
      onError?.(err);
    }
  });
}

/**
 * Inspects a JavaScript code snippet using Acorn AST
 * Extracts functions, identifiers, member expressions, and calls.
 */
export function analyzeCodeAst(code = '') {
  const result = {
    isValidAst: false,
    syntaxError: null,
    functions: [],
    identifiers: new Set(),
    calls: new Set(),
    memberExpressions: new Set(),
    hasAsync: false,
    hasLoops: false,
    classes: []
  };

  if (!code || typeof code !== 'string') return result;

  try {
    const ast = acorn.parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'module'
    });
    result.isValidAst = true;

    walk.simple(ast, {
      FunctionDeclaration(node) {
        if (node.id?.name) result.functions.push(node.id.name);
        if (node.async) result.hasAsync = true;
      },
      FunctionExpression(node) {
        if (node.id?.name) result.functions.push(node.id.name);
        if (node.async) result.hasAsync = true;
      },
      ArrowFunctionExpression(node) {
        if (node.async) result.hasAsync = true;
      },
      ClassDeclaration(node) {
        if (node.id?.name) result.classes.push(node.id.name);
      },
      Identifier(node) {
        result.identifiers.add(node.name);
      },
      CallExpression(node) {
        if (node.callee?.type === 'Identifier') {
          result.calls.add(node.callee.name);
        } else if (node.callee?.type === 'MemberExpression' && node.callee.property?.name) {
          result.calls.add(node.callee.property.name);
        }
      },
      MemberExpression(node) {
        if (node.property?.name) {
          result.memberExpressions.add(node.property.name);
        }
      },
      ForStatement() {
        result.hasLoops = true;
      },
      WhileStatement() {
        result.hasLoops = true;
      },
      ForOfStatement() {
        result.hasLoops = true;
      }
    });

    result.identifiers = Array.from(result.identifiers);
    result.calls = Array.from(result.calls);
    result.memberExpressions = Array.from(result.memberExpressions);
  } catch (err) {
    result.syntaxError = err.message;
  }

  return result;
}

/**
 * Compiles a rich AST and Runtime output validator function for synthesized challenges.
 * Validates Acorn AST nodes, required patterns, forbidden patterns, and terminal output.
 */
export function compileStudioAstEvaluator(challengeSpec = {}) {
  return function evaluate(code = '', runtimeOutput = '') {
    const codeStr = String(code || '');
    const outStr = String(runtimeOutput || '');

    // 1. Syntax check via Acorn AST
    let astResult = analyzeCodeAst(codeStr);
    if (!astResult.isValidAst && astResult.syntaxError) {
      return {
        passed: false,
        errorType: 'syntax',
        socraticHint: `Syntax issue detected: ${astResult.syntaxError}. Check for unclosed brackets, missing semicolons, or invalid keywords.`
      };
    }

    // 2. AST Rules: Required Identifiers & Functions
    const astRules = challengeSpec.astRules || {};
    if (Array.isArray(astRules.requiredFunctions) && astRules.requiredFunctions.length > 0) {
      for (const fn of astRules.requiredFunctions) {
        if (!astResult.functions.includes(fn) && !astResult.identifiers.includes(fn)) {
          return {
            passed: false,
            errorType: 'ast',
            socraticHint: `Your code needs to declare or export the function "${fn}". Check your function signature.`
          };
        }
      }
    }

    if (Array.isArray(astRules.requiredIdentifiers) && astRules.requiredIdentifiers.length > 0) {
      for (const id of astRules.requiredIdentifiers) {
        if (!astResult.identifiers.includes(id)) {
          return {
            passed: false,
            errorType: 'ast',
            socraticHint: `Your solution should define or use "${id}".`
          };
        }
      }
    }

    // 3. Required Patterns (Regex / Substring)
    if (Array.isArray(challengeSpec.requiredPatterns) && challengeSpec.requiredPatterns.length > 0) {
      for (const pattern of challengeSpec.requiredPatterns) {
        if (!pattern) continue;
        try {
          const rx = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
          if (!rx.test(codeStr)) {
            return {
              passed: false,
              errorType: 'pattern',
              socraticHint: challengeSpec.socraticTiers?.tier2_structural ||
                challengeSpec.socraticHint ||
                `Your solution needs to include: ${pattern}`
            };
          }
        } catch {
          if (!codeStr.toLowerCase().includes(String(pattern).toLowerCase())) {
            return {
              passed: false,
              errorType: 'pattern',
              socraticHint: challengeSpec.socraticHint || `Your solution needs to include: ${pattern}`
            };
          }
        }
      }
    }

    // 4. Forbidden Patterns
    if (Array.isArray(challengeSpec.forbiddenPatterns) && challengeSpec.forbiddenPatterns.length > 0) {
      for (const pattern of challengeSpec.forbiddenPatterns) {
        if (!pattern) continue;
        try {
          const rx = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
          if (rx.test(codeStr)) {
            return {
              passed: false,
              errorType: 'forbidden',
              socraticHint: `Avoid using: ${pattern}. Solve this using the recommended modern approach.`
            };
          }
        } catch {
          // ignore invalid regex
        }
      }
    }

    // 5. Expected Output Patterns
    if (Array.isArray(challengeSpec.expectedOutputPatterns) && challengeSpec.expectedOutputPatterns.length > 0) {
      for (const pattern of challengeSpec.expectedOutputPatterns) {
        if (!pattern) continue;
        try {
          const rx = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
          if (!rx.test(outStr) && !rx.test(codeStr)) {
            return {
              passed: false,
              errorType: 'output',
              socraticHint: challengeSpec.socraticTiers?.tier3_ast ||
                challengeSpec.socraticHint ||
                `The execution output should match: "${pattern}". Run your code and check the terminal output.`
            };
          }
        } catch {
          if (!outStr.toLowerCase().includes(String(pattern).toLowerCase())) {
            return {
              passed: false,
              errorType: 'output',
              socraticHint: challengeSpec.socraticHint || `The execution output should include "${pattern}".`
            };
          }
        }
      }
    }

    return {
      passed: true,
      socraticPraise: challengeSpec.socraticPraise || 'Phenomenal work! Your solution passed all AST and runtime checks.'
    };
  };
}

/**
 * Synthesizes a high-fidelity Scrimba interactive lab from a creator's recorded session.
 * Converts creator's spoken voice transcript, code diffs, keystrokes, and terminal output
 * into:
 * 1. Step-by-step Scrimba `aiTimeline` with AI Cursor paths
 * 2. Automated AST & Runtime Validator rubric
 * 3. 3-Tier Socratic Hint System
 * 4. Clean student starter file with handoff comments
 * 5. Remediation Detour module
 */
export async function synthesizeLabFromRecording({
  session,
  apiConfig = {},
  onProgress = null
}) {
  const {
    domain = 'coding',
    title = 'Interactive STEM Challenge',
    starterCode = '',
    finalCode = '',
    transcripts = [],
    snapshots = [],
    challengeStopOffset = null,
    entryFile = 'index.js',
    lastTerminalOutput = ''
  } = session;

  onProgress?.({ step: 1, label: 'Computing AST differences & keystroke timeline…' });

  // 1. Analyze AST and code delta
  const starterAst = analyzeCodeAst(starterCode);
  const solutionAst = analyzeCodeAst(finalCode);
  const diff = diffLines(starterCode, finalCode);
  const patch = createTwoFilesPatch('starter', 'solution', starterCode, finalCode);

  const addedLines = diff
    .filter((d) => d.added)
    .map((d) => d.value.trim())
    .filter(Boolean);

  const fullSpokenTranscript = transcripts
    .map((t) => t.text)
    .filter(Boolean)
    .join(' ')
    .trim();

  onProgress?.({ step: 2, label: 'Consulting AI Socratic Architect for rubric synthesis…' });

  const systemPrompt = `You are Upskill Studio AI, an expert STEM pedagogy architect and compiler engineer.
A senior STEM creator/lecturer just solved a problem live on screen while explaining their thinking.
Your job is to transform their recording into a dead-simple, interactive Scrimba-style coding/STEM lab.

You MUST reply with valid JSON ONLY. No markdown fences.
Schema:
{
  "id": "kebab-case-id",
  "title": "Action-oriented Title",
  "category": "Domain Category (e.g. Async Architecture, Numerical Calculus, Circuit Design, IoT Firmware)",
  "conceptTag": "kebab-case-concept",
  "description": "2-3 sentences explaining the industry/real-world context.",
  "targetFile": "${entryFile}",
  "initialFiles": {
    "${entryFile}": "Clean starter code for the learner, with comments and '// 👇 YOUR TURN: ...'"
  },
  "solutionFiles": {
    "${entryFile}": "The complete working solution"
  },
  "aiTimeline": [
    {
      "timeOffset": 0,
      "narration": "Opening narration synthesizing creator's spoken intro explaining the setup.",
      "file": "${entryFile}",
      "highlightLine": 4,
      "codeSnapshot": "Initial code state shown as instructor explains",
      "cursorTarget": { "line": 4, "column": 2, "label": "Lesson Intro", "variant": "teach" }
    },
    {
      "timeOffset": 3500,
      "narration": "Middle narration walking through the key formula/function.",
      "file": "${entryFile}",
      "highlightLine": 12,
      "codeSnapshot": "Midway state before student challenge",
      "cursorTarget": { "line": 12, "column": 4, "label": "Core Logic", "variant": "teach" }
    },
    {
      "timeOffset": 7000,
      "narration": "Handoff narration challenging the student to complete the implementation.",
      "file": "${entryFile}",
      "highlightLine": 15,
      "isChallengeStop": true,
      "codeSnapshot": "Handoff state with the challenge marker",
      "cursorTarget": { "line": 15, "column": 2, "label": "Your Turn Here", "variant": "handoff" }
    }
  ],
  "challengeSpec": {
    "prompt": "Clear, concise instructions for the student",
    "targetFile": "${entryFile}",
    "conceptsTested": ["tag-1", "tag-2"],
    "requiredPatterns": ["regexOrKeyword1", "regexOrKeyword2"],
    "forbiddenPatterns": ["antiPattern1"],
    "expectedOutputPatterns": ["expectedConsoleOutputSubstring"],
    "socraticPraise": "Enthusiastic pedagogical explanation of why this solution is robust.",
    "socraticHint": "Tier 1 gentle nudge (guiding question without spoiling the code).",
    "socraticTiers": {
      "tier1_nudge": "Socratic conceptual question to get them unstuck.",
      "tier2_structural": "Structural hint pointing to the syntax or control loop needed.",
      "tier3_ast": "Concrete technical hint mentioning the required method or formula parameter."
    },
    "astRules": {
      "requiredFunctions": ["functionName"],
      "requiredIdentifiers": ["identifierName"]
    }
  },
  "detourNode": {
    "id": "detour-id",
    "title": "Remediation: Fundamental Concept Practice",
    "category": "Adaptive Next Module",
    "reason": "Triggered if learner repeatedly misses AST requirements.",
    "description": "Focused 3-minute practice reinforcing the prerequisite concept."
  }
}

RULES:
1. Base the timeline and narration directly on the creator's spoken words and code progression.
2. The last timeline step MUST have "isChallengeStop": true.
3. Ensure 'initialFiles' has a runnable test harness so the learner can hit 'Run' and see feedback immediately.
4. 'requiredPatterns' and 'expectedOutputPatterns' must accurately verify the student's solution.`;

  const userPrompt = `
Domain: ${domain.toUpperCase()}
Title: ${title}
Creator's Spoken Audio Transcript:
"${fullSpokenTranscript || 'Creator solved the challenge on screen silently, demonstrating the solution step by step.'}"

Starter Code:
"""
${starterCode}
"""

Final Working Solution:
"""
${finalCode}
"""

Code Diff (Lines Added by Creator):
${addedLines.slice(0, 15).join('\n') || 'None detected'}

Terminal / Test Execution Output:
"""
${lastTerminalOutput || 'Code executed cleanly.'}
"""

Solution AST Functions: ${solutionAst.functions.join(', ') || 'N/A'}
Solution AST Classes: ${solutionAst.classes.join(', ') || 'N/A'}
Solution AST Identifiers: ${solutionAst.identifiers.slice(0, 10).join(', ')}

Synthesize a complete, high-quality interactive Scrimba challenge conforming strictly to the JSON schema.`;

  try {
    const rawLlmResponse = await callConfiguredLlm({
      systemPrompt,
      userPrompt,
      apiConfig,
      expectJson: true,
      temperature: 0.35
    });

    onProgress?.({ step: 3, label: 'Compiling AST validator and finalizing Socratic rubric…' });

    let synthesized = null;
    if (typeof rawLlmResponse === 'object' && rawLlmResponse !== null) {
      synthesized = rawLlmResponse;
    } else {
      synthesized = JSON.parse(rawLlmResponse);
    }

    // Attach compiled evaluator
    synthesized.challengeSpec.evaluateSubmission = compileStudioAstEvaluator(synthesized.challengeSpec);
    return synthesized;
  } catch (error) {
    console.warn('AI LLM Synthesis fallback triggered:', error);

    // High-Fidelity Deterministic Fallback Synthesizer
    // Guarantees immediate zero-latency synthesis even if offline or without API keys!
    return buildDeterministicFallbackLab({
      session,
      starterAst,
      solutionAst,
      diffLines: addedLines,
      fullSpokenTranscript,
      lastTerminalOutput
    });
  }
}

/**
 * Deterministic offline synthesizer that converts recorded session into a valid lab
 */
function buildDeterministicFallbackLab({
  session,
  starterAst,
  solutionAst,
  diffLines: addedLines,
  fullSpokenTranscript,
  lastTerminalOutput
}) {
  const {
    domain = 'coding',
    title = 'Interactive STEM Challenge',
    starterCode = '',
    finalCode = '',
    entryFile = 'index.js'
  } = session;

  const idSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `lab-${Date.now()}`;
  const domainPreset = STEM_DOMAINS[domain] || STEM_DOMAINS.coding;
  const primaryFn = solutionAst.functions[0] || solutionAst.classes[0] || 'solve';

  const narration1 = fullSpokenTranscript
    ? `Welcome to this interactive challenge on ${title}! In this lab, we look at the problem structure and starting environment.`
    : `Welcome to ${title}! Let's examine how this problem is structured and what we need to implement.`;

  const narration2 = `Notice how we need to declare our core logic in ${entryFile}. The key is handling the edge cases cleanly.`;

  const narration3 = `Now it's your turn! Implement the required logic in ${entryFile} and click Run to test your submission against the AST validator.`;

  const challengeSpec = {
    prompt: `Complete the implementation in \`${entryFile}\` so that it passes all runtime assertions and AST checks.`,
    targetFile: entryFile,
    conceptsTested: [domainPreset.sampleConcept, `${domain}-fundamentals`],
    requiredPatterns: [primaryFn],
    forbiddenPatterns: ['eval', 'Function\\('],
    expectedOutputPatterns: ['Result:', 'Verifying', 'Verification', '---', 'Testing'],
    socraticPraise: 'Excellent work! Your code implemented the solution cleanly and passed all tests.',
    socraticHint: `Think about what parameters \`${primaryFn}\` receives and what value it needs to return.`,
    socraticTiers: {
      tier1_nudge: `What are the expected inputs and return types for \`${primaryFn}\`?`,
      tier2_structural: `Make sure you handle the base case or loop iteration properly inside \`${primaryFn}\`.`,
      tier3_ast: `Your code must export or define the function \`${primaryFn}\` without syntax errors.`
    },
    astRules: {
      requiredFunctions: solutionAst.functions.slice(0, 2),
      requiredIdentifiers: solutionAst.identifiers.slice(0, 3)
    }
  };

  challengeSpec.evaluateSubmission = compileStudioAstEvaluator(challengeSpec);

  return {
    id: idSlug,
    title,
    category: domainPreset.label,
    conceptTag: domainPreset.sampleConcept,
    domain,
    description: `Master ${title} through live interactive code synthesis, AST verification, and Socratic feedback.`,
    targetFile: entryFile,
    initialFiles: {
      [entryFile]: starterCode
    },
    solutionFiles: {
      [entryFile]: finalCode
    },
    aiTimeline: [
      {
        timeOffset: 0,
        narration: narration1,
        file: entryFile,
        highlightLine: 4,
        codeSnapshot: starterCode,
        cursorTarget: { line: 4, column: 2, label: 'Problem Setup', variant: 'teach' }
      },
      {
        timeOffset: 3500,
        narration: narration2,
        file: entryFile,
        highlightLine: 12,
        codeSnapshot: starterCode,
        cursorTarget: { line: 12, column: 4, label: 'Implementation Point', variant: 'teach' }
      },
      {
        timeOffset: 7000,
        narration: narration3,
        file: entryFile,
        highlightLine: 16,
        isChallengeStop: true,
        codeSnapshot: starterCode,
        cursorTarget: { line: 16, column: 2, label: 'Your Turn', variant: 'handoff' }
      }
    ],
    challengeSpec,
    detourNode: {
      id: `detour-${idSlug}`,
      title: `Remediation: ${title} Foundations`,
      category: 'Adaptive Next Module',
      reason: 'Practice the underlying algorithmic and syntax patterns in isolation.',
      description: 'A focused 3-minute mini-challenge to solidify core concepts.'
    }
  };
}

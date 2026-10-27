// ============================================================================
// REDUZER SCHOOL: INTRODUCTION TO SOFTWARE DEVELOPMENT CURRICULUM
// Scraped & synthesized directly from https://reduzer.ac.ke/curriculum
// Lead Curriculum Architect: Samuel Owino
// Track: 48-Week Professional Software Development (Foundations & Core Engineering)
// ============================================================================

import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

/**
 * Safely extracts a declared or exported function/class from learner code for AST/runtime verification.
 */
function extractExecutableFunction(code = '', targetName = '') {
  try {
    const stripped = code.replace(/export\s+(default\s+)?/g, '');
    const runner = new Function(`
      ${stripped}
      try {
        return typeof ${targetName} !== 'undefined' ? ${targetName} : null;
      } catch {
        return null;
      }
    `);
    return runner();
  } catch {
    return null;
  }
}

export const REDUZER_SOFTWARE_DEV_TRACK = {
  id: 'reduzer-software-dev',
  title: 'Introduction to Software Development (Reduzer Curriculum)',
  subtitle: 'Computing Foundations, JavaScript/TypeScript, Asynchronous Systems & Product Engineering',
  icon: 'Code2',
  domain: 'Software Development',
  nodes: [
    // ------------------------------------------------------------------------
    // MODULE 1: The Story of Computing & Binary Logic (Weeks 1–2)
    // ------------------------------------------------------------------------
    {
      id: 'reduzer-binary-logic',
      title: '1. The Story of Computing: Binary Logic & Gates (Reduzer W1–2)',
      category: 'Computing Foundations',
      status: 'in-progress',
      isDetour: false,
      conceptTag: 'binary-logic-gates',
      description: 'Explore computing history from programmable calculating engines to modern CPUs. Build software simulations of fundamental binary logic gates (AND, OR, NOT, XOR) and a Half-Adder circuit to understand digital state evaluation.',
      targetFile: 'index.js',
      initialFiles: {
        'index.js': `// ============================================================================
// REDUZER SCHOOL: The Story of Computing & Binary Logic (Weeks 1–2)
// Curriculum: https://reduzer.ac.ke/curriculum
// ============================================================================
// At the heart of all software, information is represented as binary states:
// 0 (False / Low Voltage) and 1 (True / High Voltage).
// We compose simple logic gates to perform arithmetic and control execution.
// ============================================================================

/**
 * 1. AND Gate: Returns 1 if both inputs are 1, else 0
 */
export function andGate(a, b) {
  return (a === 1 && b === 1) ? 1 : 0;
}

/**
 * 2. OR Gate: Returns 1 if either input is 1, else 0
 */
export function orGate(a, b) {
  return (a === 1 || b === 1) ? 1 : 0;
}

/**
 * 3. NOT Gate: Inverts binary state (0 -> 1, 1 -> 0)
 */
export function notGate(a) {
  return a === 1 ? 0 : 1;
}

/**
 * 4. XOR Gate: Exclusive OR. Returns 1 if inputs differ, else 0
 * Formula using primitive gates: (A OR B) AND NOT (A AND B)
 */
export function xorGate(a, b) {
  // 👇 YOUR TURN: Implement the XOR gate using primitive logic operations!
  
}

/**
 * 5. Half-Adder: Adds two 1-bit binary digits.
 * Returns an object with:
 *   sum: A XOR B
 *   carry: A AND B
 */
export function halfAdder(a, b) {
  // 👇 YOUR TURN: Return { sum: ..., carry: ... }
  
}

// Verification Harness
function runVerification() {
  console.log('--- Verifying Binary Logic Gates ---');
  console.log('XOR(0, 0) ->', xorGate(0, 0), '(Expected 0)');
  console.log('XOR(1, 0) ->', xorGate(1, 0), '(Expected 1)');
  console.log('XOR(1, 1) ->', xorGate(1, 1), '(Expected 0)');

  const add01 = halfAdder(0, 1);
  console.log('HalfAdder(0, 1) -> sum:', add01?.sum, 'carry:', add01?.carry, '(Expected sum: 1, carry: 0)');

  const add11 = halfAdder(1, 1);
  console.log('HalfAdder(1, 1) -> sum:', add11?.sum, 'carry:', add11?.carry, '(Expected sum: 0, carry: 1)');
}

runVerification();
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: "Welcome to Reduzer's Introduction to Software Development! We start where modern computing begins: binary states and digital logic gates.",
          file: 'index.js',
          highlightLine: 14,
          cursorTarget: { type: 'editor', line: 14, label: 'Binary Logic Foundations' },
          codeSnapshot: `export function andGate(a, b) {\n  return (a === 1 && b === 1) ? 1 : 0;\n}`
        },
        {
          timeOffset: 3500,
          narration: "An XOR gate evaluates to 1 when inputs differ. A Half-Adder uses XOR for the sum and AND for the carry bit.",
          file: 'index.js',
          highlightLine: 35,
          cursorTarget: { type: 'editor', line: 35, label: 'Exclusive OR & Half-Adder' },
          codeSnapshot: `export function xorGate(a, b) {\n  // Formula: (A OR B) AND NOT (A AND B)\n}`
        },
        {
          timeOffset: 7000,
          narration: "Now it's your turn! Complete xorGate and halfAdder so all binary addition test cases pass cleanly.",
          file: 'index.js',
          highlightLine: 43,
          isChallengeStop: true,
          cursorTarget: { type: 'editor', line: 43, label: 'Your turn: Implement XOR and Half-Adder' },
          codeSnapshot: `export function halfAdder(a, b) {\n  // 👇 YOUR TURN: Return { sum: ..., carry: ... }\n}`
        }
      ],
      challengeSpec: {
        prompt: "Implement `xorGate(a, b)` to return 1 when inputs differ and 0 when identical. Then implement `halfAdder(a, b)` returning `{ sum: ..., carry: ... }`.",
        targetFile: 'index.js',
        conceptsTested: ['binary-logic', 'boolean-algebra', 'half-adder'],
        requiredPatterns: ['xorGate', 'halfAdder', 'sum', 'carry'],
        expectedOutputPatterns: ['XOR(1, 0) -> 1', 'HalfAdder(1, 1) -> sum: 0 carry: 1'],
        evaluateSubmission(code = '', runtimeOutput = '') {
          const fnXor = extractExecutableFunction(code, 'xorGate');
          const fnHalfAdder = extractExecutableFunction(code, 'halfAdder');

          if (typeof fnXor === 'function' && typeof fnHalfAdder === 'function') {
            try {
              const xor00 = fnXor(0, 0);
              const xor10 = fnXor(1, 0);
              const xor11 = fnXor(1, 1);
              const ha01 = fnHalfAdder(0, 1);
              const ha11 = fnHalfAdder(1, 1);
              if (
                xor00 === 0 && xor10 === 1 && xor11 === 0 &&
                ha01?.sum === 1 && ha01?.carry === 0 &&
                ha11?.sum === 0 && ha11?.carry === 1
              ) {
                return {
                  passed: true,
                  socraticPraise: 'Spot on! You simulated the fundamental logic gate network used in arithmetic logic units (ALUs).'
                };
              }
            } catch {}
          }

          if (
            runtimeOutput.includes('sum: 0') && runtimeOutput.includes('carry: 1') &&
            (code.includes('xorGate') && code.includes('halfAdder'))
          ) {
            return {
              passed: true,
              socraticPraise: 'Spot on! You simulated the fundamental logic gate network used in arithmetic logic units (ALUs).'
            };
          }

          return {
            passed: false,
            socraticHint: 'Remember: 1 + 1 in binary produces sum = 0 and carry = 1. Check your xorGate and halfAdder functions.'
          };
        }
      }
    },

    // ------------------------------------------------------------------------
    // MODULE 2: Computer Systems & CLI Environment (Weeks 3–4)
    // ------------------------------------------------------------------------
    {
      id: 'reduzer-computer-systems',
      title: '2. Computer Systems & CLI Environment (Reduzer W3–4)',
      category: 'Developer Tools',
      status: 'locked',
      isDetour: false,
      conceptTag: 'cli-process-systems',
      description: 'Reduzer Weeks 3–4: Learn how the operating system, memory model, and process arguments work. Build a command-line argument parser that handles boolean flags, named key-value pairs, and positional arguments.',
      targetFile: 'index.js',
      initialFiles: {
        'index.js': `// ============================================================================
// REDUZER SCHOOL: Computer Systems & Developer Tools (Weeks 3–4)
// Curriculum: https://reduzer.ac.ke/curriculum
// ============================================================================
// Command line tools receive argument vectors from the OS.
// Professional developer tools parse flags (--verbose), options (--port=8080),
// and positional inputs (build).
// ============================================================================

/**
 * Parses raw command-line arguments array into a structured object.
 * Examples:
 *   ['--verbose', '--port=3000', 'deploy']
 *   -> { flags: ['verbose'], options: { port: '3000' }, positional: ['deploy'] }
 */
export function parseCliArgs(args = []) {
  const result = {
    flags: [],
    options: {},
    positional: []
  };

  // 👇 YOUR TURN: Loop through args and populate flags, options, and positional!
  

  return result;
}

function verifyCliParser() {
  console.log('--- Verifying CLI Argument Parser ---');
  const sampleArgs = ['--debug', '--port=8080', '--env=staging', 'deploy', 'api'];
  const parsed = parseCliArgs(sampleArgs);

  console.log('Parsed flags:', parsed.flags);
  console.log('Parsed options:', parsed.options);
  console.log('Parsed positional:', parsed.positional);
}

verifyCliParser();
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: "In Weeks 3–4, we explore operating system processes and developer tools. Every terminal command passes string arguments to the program.",
          file: 'index.js',
          highlightLine: 16,
          cursorTarget: { type: 'editor', line: 16, label: 'CLI Argument Parsing' },
          codeSnapshot: `export function parseCliArgs(args = []) {\n  const result = { flags: [], options: {}, positional: [] };\n}`
        },
        {
          timeOffset: 3800,
          narration: "If an argument starts with '--' and contains '=', split into key and value for options. If it only starts with '--', push to flags. Otherwise, it is positional.",
          file: 'index.js',
          highlightLine: 24,
          cursorTarget: { type: 'editor', line: 24, label: 'Argument categorization' },
          codeSnapshot: `if (arg.startsWith('--')) {\n  if (arg.includes('=')) { /* option */ }\n  else { /* flag */ }\n}`
        },
        {
          timeOffset: 7200,
          narration: "Now implement parseCliArgs so developer scripts and build tools can inspect incoming process inputs.",
          file: 'index.js',
          highlightLine: 26,
          isChallengeStop: true,
          cursorTarget: { type: 'editor', line: 26, label: 'Your turn: Implement CLI Parser' },
          codeSnapshot: `// 👇 YOUR TURN: Loop through args and populate flags, options, and positional!\n`
        }
      ],
      challengeSpec: {
        prompt: "Complete `parseCliArgs(args)` so that arguments starting with `--key=val` are added to `options`, arguments starting with `--flag` are added to `flags` (without dashes), and all other strings are placed in `positional`.",
        targetFile: 'index.js',
        conceptsTested: ['cli-arguments', 'string-parsing', 'process-lifecycle'],
        requiredPatterns: ['parseCliArgs', 'startsWith', 'flags', 'options', 'positional'],
        expectedOutputPatterns: ["Parsed flags: [ 'debug' ]", "port: '8080'", "Parsed positional: [ 'deploy', 'api' ]"],
        evaluateSubmission(code = '', runtimeOutput = '') {
          const fn = extractExecutableFunction(code, 'parseCliArgs');
          if (typeof fn === 'function') {
            try {
              const testArgs = ['--debug', '--port=8080', 'deploy'];
              const res = fn(testArgs);
              if (
                res?.flags?.includes('debug') &&
                res?.options?.port === '8080' &&
                res?.positional?.includes('deploy')
              ) {
                return {
                  passed: true,
                  socraticPraise: "Excellent! You built a clean, standard CLI argument vector processor used across Node.js tooling."
                };
              }
            } catch {}
          }

          if (
            runtimeOutput.includes('debug') &&
            runtimeOutput.includes('8080') &&
            runtimeOutput.includes('deploy')
          ) {
            return {
              passed: true,
              socraticPraise: "Excellent! You built a clean, standard CLI argument vector processor used across Node.js tooling."
            };
          }

          return {
            passed: false,
            socraticHint: "Make sure `--debug` populates flags, `--port=8080` populates options.port, and `'deploy'` goes to positional."
          };
        }
      }
    },

    // ------------------------------------------------------------------------
    // MODULE 3: Product Planning & Validation Schemas (Weeks 5–6)
    // ------------------------------------------------------------------------
    {
      id: 'reduzer-product-validation',
      title: '3. Product Planning & Validation Schemas (Reduzer W5–6)',
      category: 'Product Engineering',
      status: 'locked',
      isDetour: false,
      conceptTag: 'input-validation-schemas',
      description: 'Reduzer Weeks 5–6: Connect technical specifications to user needs and boundary conditions. Build a declarative schema validation engine that verifies required fields, data formats, and produces actionable error diagnostics.',
      targetFile: 'index.js',
      initialFiles: {
        'index.js': `// ============================================================================
// REDUZER SCHOOL: Product Planning & Validation Schemas (Weeks 5–6)
// Curriculum: https://reduzer.ac.ke/curriculum
// ============================================================================
// Before writing database records or calling APIs, product engineers enforce
// boundary validation to protect system integrity and guide users clearly.
// ============================================================================

/**
 * Validates a user onboarding payload against product schema constraints:
 * 1. 'fullName': Required string, minimum 3 characters.
 * 2. 'email': Required string, must contain '@' and '.'
 * 3. 'age': Required integer, must be between 18 and 120.
 *
 * Returns { isValid: boolean, errors: string[] }
 */
export function validateOnboardingPayload(payload = {}) {
  const errors = [];

  // 👇 YOUR TURN: Validate fullName, email, and age against the rules!
  

  return {
    isValid: errors.length === 0,
    errors
  };
}

function verifyValidation() {
  console.log('--- Verifying Product Validation Schema ---');
  const validUser = { fullName: 'Amina Kimani', email: 'amina@reduzer.ac.ke', age: 24 };
  const invalidUser = { fullName: 'Al', email: 'invalid-email', age: 15 };

  console.log('Valid User Check:', validateOnboardingPayload(validUser));
  console.log('Invalid User Check:', validateOnboardingPayload(invalidUser));
}

verifyValidation();
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: "In Weeks 5–6 of Reduzer, we connect technical architecture to user constraints. Software must reject invalid data with clear feedback before corrupting downstream systems.",
          file: 'index.js',
          highlightLine: 18,
          cursorTarget: { type: 'editor', line: 18, label: 'Schema Validation' },
          codeSnapshot: `export function validateOnboardingPayload(payload = {}) {\n  const errors = [];\n}`
        },
        {
          timeOffset: 3800,
          narration: "Check fullName length, verify that email contains '@' and '.', and check that age is a number between 18 and 120.",
          file: 'index.js',
          highlightLine: 22,
          cursorTarget: { type: 'editor', line: 22, label: 'Boundary checks' },
          codeSnapshot: `if (!payload.fullName || payload.fullName.trim().length < 3) {\n  errors.push('fullName must be at least 3 characters');\n}`
        },
        {
          timeOffset: 7200,
          narration: "Your turn! Implement all three validation rules and return the structured isValid and errors report.",
          file: 'index.js',
          highlightLine: 24,
          isChallengeStop: true,
          cursorTarget: { type: 'editor', line: 24, label: 'Your turn: Implement Schema Validation' },
          codeSnapshot: `// 👇 YOUR TURN: Validate fullName, email, and age against the rules!\n`
        }
      ],
      challengeSpec: {
        prompt: "Complete `validateOnboardingPayload(payload)` to ensure `fullName` is at least 3 characters, `email` includes '@' and '.', and `age` is between 18 and 120.",
        targetFile: 'index.js',
        conceptsTested: ['input-validation', 'boundary-conditions', 'schema-contracts'],
        requiredPatterns: ['validateOnboardingPayload', 'errors', 'isValid'],
        expectedOutputPatterns: ['isValid: true', 'isValid: false', 'errors:'],
        evaluateSubmission(code = '', runtimeOutput = '') {
          const fn = extractExecutableFunction(code, 'validateOnboardingPayload');
          if (typeof fn === 'function') {
            try {
              const validRes = fn({ fullName: 'Amina Kimani', email: 'amina@reduzer.ac.ke', age: 24 });
              const invalidRes = fn({ fullName: 'Al', email: 'invalid-email', age: 15 });
              if (
                validRes?.isValid === true &&
                invalidRes?.isValid === false &&
                Array.isArray(invalidRes?.errors) &&
                invalidRes.errors.length >= 2
              ) {
                return {
                  passed: true,
                  socraticPraise: "Spot on! Robust schema validation prevents invalid data from reaching your databases or external payment rails."
                };
              }
            } catch {}
          }

          const hasValidTrue = /(?:isValid["']?\s*:\s*true)/i.test(runtimeOutput);
          const hasValidFalse = /(?:isValid["']?\s*:\s*false)/i.test(runtimeOutput);
          if (hasValidTrue && hasValidFalse) {
            return {
              passed: true,
              socraticPraise: "Spot on! Robust schema validation prevents invalid data from reaching your databases or external payment rails."
            };
          }

          return {
            passed: false,
            socraticHint: "Make sure validUser returns isValid: true and invalidUser returns isValid: false with accumulated error messages."
          };
        }
      }
    },

    // ------------------------------------------------------------------------
    // MODULE 4: Programming Fundamentals: Control Flow & Ledger (Weeks 7–8)
    // ------------------------------------------------------------------------
    {
      id: 'reduzer-programming-fundamentals',
      title: '4. Programming Fundamentals: Control Flow & Ledger (Reduzer W7–8)',
      category: 'Programming & Problem-Solving',
      status: 'locked',
      isDetour: false,
      conceptTag: 'control-flow-ledger',
      description: 'Reduzer Weeks 7–8: Trace values and control flow in JavaScript before running code. Build a financial ledger processing engine that evaluates deposits, withdrawals, tiered fee schedules, and enforces balance overdraft protection.',
      targetFile: 'index.js',
      initialFiles: {
        'index.js': `// ============================================================================
// REDUZER SCHOOL: Programming Fundamentals (Weeks 7–8)
// Curriculum: https://reduzer.ac.ke/curriculum
// ============================================================================
// Financial ledger engines process a sequence of transactions.
// They must calculate running balances, apply tiered transaction fees,
// and protect against negative overdraft balances.
// ============================================================================

/**
 * Process financial transactions with tiered fees and overdraft guards:
 * - Deposit: adds amount directly (fee: 0)
 * - Withdrawal fee tier:
 *     amount <= 500: fee = 10
 *     amount > 500: fee = 25
 * - If balance < (amount + fee), reject transaction (status: 'REJECTED')
 * - Otherwise accept (status: 'ACCEPTED') and deduct amount + fee.
 *
 * Returns: { finalBalance: number, acceptedCount: number, rejectedCount: number }
 */
export function processTransactionLedger(initialBalance = 0, transactions = []) {
  let balance = initialBalance;
  let acceptedCount = 0;
  let rejectedCount = 0;

  // 👇 YOUR TURN: Loop through transactions and apply the fee & balance rules!
  

  return {
    finalBalance: balance,
    acceptedCount,
    rejectedCount
  };
}

function verifyLedger() {
  console.log('--- Verifying Financial Ledger Engine ---');
  const txList = [
    { type: 'deposit', amount: 1000 },
    { type: 'withdrawal', amount: 400 }, // 400 + 10 fee = 410 deducted -> balance: 590
    { type: 'withdrawal', amount: 700 }, // 700 + 25 fee = 725 > 590 -> REJECTED
    { type: 'withdrawal', amount: 200 }  // 200 + 10 fee = 210 deducted -> balance: 380
  ];

  const result = processTransactionLedger(0, txList);
  console.log('Final Ledger Result:', result);
}

verifyLedger();
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: "In Weeks 7–8, we master control flow and state tracing. Financial applications must process a stream of events deterministically.",
          file: 'index.js',
          highlightLine: 21,
          cursorTarget: { type: 'editor', line: 21, label: 'Ledger State Engine' },
          codeSnapshot: `export function processTransactionLedger(initialBalance = 0, transactions = []) {\n  let balance = initialBalance;\n}`
        },
        {
          timeOffset: 3800,
          narration: "For withdrawals, calculate the fee based on amount. If balance is insufficient, increment rejectedCount. Otherwise, deduct total and increment acceptedCount.",
          file: 'index.js',
          highlightLine: 28,
          cursorTarget: { type: 'editor', line: 28, label: 'Fee calculation & overdraft check' },
          codeSnapshot: `const fee = tx.amount <= 500 ? 10 : 25;\nif (balance < tx.amount + fee) { rejectedCount++; }`
        },
        {
          timeOffset: 7200,
          narration: "Now complete processTransactionLedger so all transactions are accurately audited without negative balances.",
          file: 'index.js',
          highlightLine: 30,
          isChallengeStop: true,
          cursorTarget: { type: 'editor', line: 30, label: 'Your turn: Implement Ledger Engine' },
          codeSnapshot: `// 👇 YOUR TURN: Loop through transactions and apply the fee & balance rules!\n`
        }
      ],
      challengeSpec: {
        prompt: "Complete `processTransactionLedger(initialBalance, transactions)`. Calculate running balance, apply withdrawal fees (10 for <=500, 25 for >500), and reject transactions exceeding available funds.",
        targetFile: 'index.js',
        conceptsTested: ['control-flow', 'loops', 'arithmetic-state', 'guard-clauses'],
        requiredPatterns: ['processTransactionLedger', 'finalBalance', 'acceptedCount', 'rejectedCount'],
        expectedOutputPatterns: ['finalBalance: 380', 'acceptedCount: 3', 'rejectedCount: 1'],
        evaluateSubmission(code = '', runtimeOutput = '') {
          const fn = extractExecutableFunction(code, 'processTransactionLedger');
          if (typeof fn === 'function') {
            try {
              const testTxs = [
                { id: 'tx-1', type: 'withdrawal', amount: 400 },
                { id: 'tx-2', type: 'withdrawal', amount: 700 },
                { id: 'tx-3', type: 'deposit', amount: 300 }
              ];
              const res = fn(1000, testTxs);
              if (res?.finalBalance === 890 && res?.rejectedCount === 1 && res?.acceptedCount === 2) {
                return {
                  passed: true,
                  socraticPraise: "Excellent! You implemented reliable ledger state tracking with defensive balance checking."
                };
              }
              const sampleTxs = [
                { id: 'tx-1', type: 'withdrawal', amount: 400 },
                { id: 'tx-2', type: 'withdrawal', amount: 700 },
                { id: 'tx-3', type: 'deposit', amount: 200 },
                { id: 'tx-4', type: 'withdrawal', amount: 400 }
              ];
              const sampleRes = fn(1000, sampleTxs);
              if (sampleRes?.finalBalance === 380 && sampleRes?.rejectedCount === 1) {
                return {
                  passed: true,
                  socraticPraise: "Excellent! You implemented reliable ledger state tracking with defensive balance checking."
                };
              }
            } catch {}
          }

          if (
            (runtimeOutput.includes('380') || runtimeOutput.includes('finalBalance')) &&
            runtimeOutput.includes('rejectedCount: 1')
          ) {
            return {
              passed: true,
              socraticPraise: "Excellent! You implemented reliable ledger state tracking with defensive balance checking."
            };
          }

          return {
            passed: false,
            socraticHint: "Check the arithmetic: 1000 - 410 = 590. The 700 withdrawal needs 725, so it is rejected. Then 590 - 210 = 380 final balance."
          };
        }
      }
    },

    // ------------------------------------------------------------------------
    // MODULE 5: Functions, Collections & Unit Testing (Weeks 9–10)
    // ------------------------------------------------------------------------
    {
      id: 'reduzer-collections-testing',
      title: '5. Functions, Collections & Unit Testing (Reduzer W9–10)',
      category: 'Collections & Testing',
      status: 'locked',
      isDetour: false,
      conceptTag: 'pure-functions-testing',
      description: 'Reduzer Weeks 9–10: Divide requirements into pure functions with clear responsibilities. Use modern collections (Array, Map, Set) to transform data and build an automated unit assertion test suite.',
      targetFile: 'index.js',
      initialFiles: {
        'index.js': `// ============================================================================
// REDUZER SCHOOL: Functions, Collections and Testing (Weeks 9–10)
// Curriculum: https://reduzer.ac.ke/curriculum
// ============================================================================
// Modular software divides complex problems into small, testable functions.
// Collections like Set allow instant deduplication, and automated assertions
// guarantee that changes do not break existing requirements.
// ============================================================================

/**
 * 1. Deduplicates an array of user IDs using Set
 */
export function getUniqueUsers(userIds = []) {
  return Array.from(new Set(userIds));
}

/**
 * 2. Calculates average score from an array of numbers.
 * Returns 0 if empty.
 */
export function calculateAverage(scores = []) {
  if (!scores.length) return 0;
  const sum = scores.reduce((acc, curr) => acc + curr, 0);
  return Number((sum / scores.length).toFixed(2));
}

/**
 * 3. Aggregates telemetry metrics:
 * Filters events by action, extracts unique users, and computes average latency.
 * Returns { action, totalEvents, uniqueUserCount, avgLatencyMs }
 */
export function aggregateMetrics(events = [], targetAction = 'click') {
  // 👇 YOUR TURN: Filter events by targetAction, deduplicate userIds, and calculate average latencyMs!
  
}

// Built-in Unit Test Assertions
function runUnitTests() {
  console.log('--- Running Reduzer Unit Tests ---');
  const sampleEvents = [
    { userId: 'usr-1', action: 'checkout', latencyMs: 120 },
    { userId: 'usr-2', action: 'checkout', latencyMs: 200 },
    { userId: 'usr-1', action: 'checkout', latencyMs: 160 },
    { userId: 'usr-3', action: 'browse', latencyMs: 80 }
  ];

  const result = aggregateMetrics(sampleEvents, 'checkout');
  console.log('Aggregated Result:', result);

  // Assertions
  const asserts = [
    result.totalEvents === 3,
    result.uniqueUserCount === 2, // usr-1 and usr-2
    result.avgLatencyMs === 160
  ];

  const allPassed = asserts.every(Boolean);
  console.log('All Unit Tests Passed:', allPassed);
}

runUnitTests();
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: "Weeks 9–10 emphasize single responsibility functions and test assertions. Functions take clear inputs and produce predictable outputs.",
          file: 'index.js',
          highlightLine: 14,
          cursorTarget: { type: 'editor', line: 14, label: 'Pure functions & Collections' },
          codeSnapshot: `export function getUniqueUsers(userIds = []) {\n  return Array.from(new Set(userIds));\n}`
        },
        {
          timeOffset: 3800,
          narration: "In aggregateMetrics, filter events where event.action equals targetAction. Then pass userIds to getUniqueUsers and latencies to calculateAverage.",
          file: 'index.js',
          highlightLine: 31,
          cursorTarget: { type: 'editor', line: 31, label: 'Collection aggregation' },
          codeSnapshot: `const matching = events.filter(e => e.action === targetAction);\nconst uniqueCount = getUniqueUsers(matching.map(e => e.userId)).length;`
        },
        {
          timeOffset: 7200,
          narration: "Implement aggregateMetrics and make sure all automated unit tests pass cleanly.",
          file: 'index.js',
          highlightLine: 33,
          isChallengeStop: true,
          cursorTarget: { type: 'editor', line: 33, label: 'Your turn: Implement aggregateMetrics' },
          codeSnapshot: `// 👇 YOUR TURN: Filter events by targetAction, deduplicate userIds, and calculate average latencyMs!\n`
        }
      ],
      challengeSpec: {
        prompt: "Complete `aggregateMetrics(events, targetAction)`. Filter events by `targetAction`, compute `uniqueUserCount` using `Set`, and calculate `avgLatencyMs`.",
        targetFile: 'index.js',
        conceptsTested: ['pure-functions', 'collections-set', 'array-methods', 'unit-testing'],
        requiredPatterns: ['aggregateMetrics', 'uniqueUserCount', 'avgLatencyMs', 'totalEvents'],
        expectedOutputPatterns: ['totalEvents: 3', 'uniqueUserCount: 2', 'avgLatencyMs: 160', 'All Unit Tests Passed: true'],
        evaluateSubmission(code = '', runtimeOutput = '') {
          const fn = extractExecutableFunction(code, 'aggregateMetrics');
          if (typeof fn === 'function') {
            try {
              const sampleEvents = [
                { userId: 'usr-1', action: 'PAYMENT_SUBMIT', latencyMs: 120 },
                { userId: 'usr-2', action: 'PAYMENT_SUBMIT', latencyMs: 200 },
                { userId: 'usr-1', action: 'PAYMENT_SUBMIT', latencyMs: 160 }
              ];
              const res = fn(sampleEvents, 'PAYMENT_SUBMIT');
              if (res?.totalEvents === 3 && res?.uniqueUserCount === 2 && res?.avgLatencyMs === 160) {
                return {
                  passed: true,
                  socraticPraise: "Outstanding! You practiced modular functional programming and automated assertion verification."
                };
              }
            } catch {}
          }

          if (
            runtimeOutput.includes('All Unit Tests Passed: true') ||
            (runtimeOutput.includes('uniqueUserCount: 2') && runtimeOutput.includes('avgLatencyMs: 160'))
          ) {
            return {
              passed: true,
              socraticPraise: "Outstanding! You practiced modular functional programming and automated assertion verification."
            };
          }

          return {
            passed: false,
            socraticHint: "Ensure `aggregateMetrics` filters by `targetAction`, counts unique users (usr-1 and usr-2 = 2), and averages 120, 200, 160 to 160."
          };
        }
      }
    },

    // ------------------------------------------------------------------------
    // MODULE 6: Program Design, Types & Persistent Files (Weeks 11–12)
    // ------------------------------------------------------------------------
    {
      id: 'reduzer-persistent-files',
      title: '6. Program Design, Types & Persistent Files (Reduzer W11–12)',
      category: 'Architecture & Persistence',
      status: 'locked',
      isDetour: false,
      conceptTag: 'program-design-persistence',
      description: 'Reduzer Weeks 11–12: Separate business logic from persistence I/O. Build an in-memory record manager that serializes structured records to JSON, handles data validation, and safely catches corrupted files without crashing.',
      targetFile: 'index.js',
      initialFiles: {
        'index.js': `// ============================================================================
// REDUZER SCHOOL: Program Design, Types and Files (Weeks 11–12)
// Curriculum: https://reduzer.ac.ke/curriculum
// ============================================================================
// Real-world applications must persist data to disk or databases.
// A robust storage engine validates records before saving and handles
// malformed or corrupted file input safely without corrupting memory.
// ============================================================================

export class PersistentRecordStore {
  constructor() {
    this.storage = new Map();
  }

  /**
   * Save a validated record. Record must have a string 'id'.
   */
  save(record) {
    if (!record || typeof record.id !== 'string') {
      throw new Error('Record must contain a valid string id.');
    }
    this.storage.set(record.id, { ...record, updatedAt: Date.now() });
    return true;
  }

  get(id) {
    return this.storage.get(id) || null;
  }

  /**
   * Serializes all records to a formatted JSON string.
   */
  exportToJson() {
    // 👇 YOUR TURN: Return JSON string representation of all records in storage!
    
  }

  /**
   * Safely imports records from a JSON string.
   * If jsonString is malformed or invalid, catches the error and returns false.
   * If valid, saves all records and returns true.
   */
  importFromJsonSafely(jsonString) {
    // 👇 YOUR TURN: Parse jsonString safely with try/catch and import each record!
    
  }
}

function verifyStore() {
  console.log('--- Verifying Persistent Record Store ---');
  const store = new PersistentRecordStore();

  store.save({ id: 'doc-1', title: 'Product Spec', version: 1 });
  store.save({ id: 'doc-2', title: 'API Contract', version: 2 });

  const jsonExport = store.exportToJson();
  console.log('Exported JSON:', jsonExport);

  const newStore = new PersistentRecordStore();
  const success = newStore.importFromJsonSafely(jsonExport);
  console.log('Safe Import Success:', success);
  console.log('Imported doc-1 title:', newStore.get('doc-1')?.title);

  // Test corrupted JSON recovery
  const corruptImport = newStore.importFromJsonSafely('INVALID_CORRUPT_JSON_DATA{{{');
  console.log('Corrupted Import Handled Cleanly (should be false):', corruptImport);
}

verifyStore();
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: "In Weeks 11–12, we separate storage I/O from core logic. Programs must serialize state to persistent files and recover from corrupt input.",
          file: 'index.js',
          highlightLine: 17,
          cursorTarget: { type: 'editor', line: 17, label: 'Persistent Storage Architecture' },
          codeSnapshot: `export class PersistentRecordStore {\n  constructor() { this.storage = new Map(); }\n}`
        },
        {
          timeOffset: 3800,
          narration: "exportToJson converts Array.from(this.storage.values()) with JSON.stringify. importFromJsonSafely wraps JSON.parse in a try/catch block.",
          file: 'index.js',
          highlightLine: 34,
          cursorTarget: { type: 'editor', line: 34, label: 'Serialization and error boundaries' },
          codeSnapshot: `try {\n  const records = JSON.parse(jsonString);\n  records.forEach(r => this.save(r));\n  return true;\n} catch { return false; }`
        },
        {
          timeOffset: 7200,
          narration: "Implement exportToJson and importFromJsonSafely to ensure safe data persistence and corruption handling.",
          file: 'index.js',
          highlightLine: 43,
          isChallengeStop: true,
          cursorTarget: { type: 'editor', line: 43, label: 'Your turn: Implement JSON storage methods' },
          codeSnapshot: `// 👇 YOUR TURN: Parse jsonString safely with try/catch and import each record!\n`
        }
      ],
      challengeSpec: {
        prompt: "Implement `exportToJson()` and `importFromJsonSafely(jsonString)` on `PersistentRecordStore`. Ensure malformed JSON is caught in `try/catch` and returns `false` without crashing.",
        targetFile: 'index.js',
        conceptsTested: ['serialization', 'json-parsing', 'error-handling', 'defensive-programming'],
        requiredPatterns: ['exportToJson', 'importFromJsonSafely', 'JSON.stringify', 'JSON.parse', 'try', 'catch'],
        expectedOutputPatterns: ['Safe Import Success: true', 'Imported doc-1 title: Product Spec', 'Corrupted Import Handled Cleanly (should be false): false'],
        evaluateSubmission(code = '', runtimeOutput = '') {
          const StoreClass = extractExecutableFunction(code, 'PersistentRecordStore');
          if (typeof StoreClass === 'function') {
            try {
              const store = new StoreClass();
              store.save({ id: 'rec-1', name: 'Alpha' });
              const json = store.exportToJson();
              const parsed = JSON.parse(json);
              const importOk = store.importFromJsonSafely(JSON.stringify([{ id: 'rec-2', name: 'Beta' }]));
              const corruptHandled = store.importFromJsonSafely('{ invalid JSON');
              if (Array.isArray(parsed) && importOk === true && corruptHandled === false) {
                return {
                  passed: true,
                  socraticPraise: "Excellent! You implemented safe JSON persistence with defensive error boundary recovery."
                };
              }
            } catch {}
          }

          if (
            runtimeOutput.includes('Safe Import Success: true') &&
            (runtimeOutput.includes('should be false): false') || runtimeOutput.includes(': false'))
          ) {
            return {
              passed: true,
              socraticPraise: "Excellent! You implemented safe JSON persistence with defensive error boundary recovery."
            };
          }

          return {
            passed: false,
            socraticHint: "Make sure `exportToJson()` returns valid JSON and `importFromJsonSafely` catches parsing errors with `try/catch`."
          };
        }
      }
    },

    // ------------------------------------------------------------------------
    // MODULE 7: Algorithms, Debugging & Asynchronous Execution (Weeks 13–14)
    // ------------------------------------------------------------------------
    {
      id: 'reduzer-async-algorithms',
      title: '7. Algorithms, Debugging & Asynchronous Execution (Reduzer W13–14)',
      category: 'Algorithms & Asynchronous Systems',
      status: 'locked',
      isDetour: false,
      conceptTag: 'async-promises-algorithms',
      description: 'Reduzer Weeks 13–14: Compare algorithmic efficiency, debug delayed state changes, and coordinate non-blocking JavaScript Promises with exponential backoff retry mechanisms.',
      targetFile: 'index.js',
      initialFiles: {
        'index.js': `// ============================================================================
// REDUZER SCHOOL: Algorithms, Debugging & Asynchronous Work (Weeks 13–14)
// Curriculum: https://reduzer.ac.ke/curriculum
// ============================================================================
// Modern web applications interact with distributed APIs across variable networks.
// Software engineers handle latency and transient failures using Promises,
// async/await, and retry strategies.
// ============================================================================

/**
 * Execute an async operation with automatic retry logic and delay:
 * - If asyncTask() succeeds, immediately return the result.
 * - If asyncTask() throws an error, retry up to maxRetries times.
 * - Wait delayMs between retry attempts.
 * - If all retries fail, throw the last encountered error.
 */
export async function retryWithBackoff(asyncTask, maxRetries = 3, delayMs = 50) {
  // 👇 YOUR TURN: Implement the asynchronous retry loop with Promises!
  
}

async function verifyAsyncWorker() {
  console.log('--- Verifying Asynchronous Retry Worker ---');
  let attemptCount = 0;

  // A flaky remote service that fails twice before succeeding
  const flakyService = async () => {
    attemptCount++;
    console.log('Service called, attempt #', attemptCount);
    if (attemptCount < 3) {
      throw new Error('Carrier timeout 504');
    }
    return { status: 200, payload: 'REDUZER_API_OK' };
  };

  const response = await retryWithBackoff(flakyService, 4, 30);
  console.log('Final Result:', response);
  console.log('Total Attempts Recorded:', attemptCount);
}

verifyAsyncWorker();
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: "Weeks 13–14 focus on asynchronous systems and debugging. Networks are inherently unreliable, so backend services must handle intermittent dropouts gracefully.",
          file: 'index.js',
          highlightLine: 18,
          cursorTarget: { type: 'editor', line: 18, label: 'Asynchronous Retry Architecture' },
          codeSnapshot: `export async function retryWithBackoff(asyncTask, maxRetries = 3, delayMs = 50) {\n  let lastError;\n}`
        },
        {
          timeOffset: 3800,
          narration: "Use a loop from 0 to maxRetries. Wrap await asyncTask() in a try/catch. On failure, wait using new Promise(resolve => setTimeout(resolve, delayMs)).",
          file: 'index.js',
          highlightLine: 20,
          cursorTarget: { type: 'editor', line: 20, label: 'Delay promise chaining' },
          codeSnapshot: `try {\n  return await asyncTask();\n} catch (err) {\n  lastError = err;\n  await new Promise(r => setTimeout(r, delayMs));\n}`
        },
        {
          timeOffset: 7200,
          narration: "Implement retryWithBackoff so the flaky network service recovers seamlessly.",
          file: 'index.js',
          highlightLine: 22,
          isChallengeStop: true,
          cursorTarget: { type: 'editor', line: 22, label: 'Your turn: Implement retry loop' },
          codeSnapshot: `// 👇 YOUR TURN: Implement the asynchronous retry loop with Promises!\n`
        }
      ],
      challengeSpec: {
        prompt: "Implement `retryWithBackoff(asyncTask, maxRetries, delayMs)`. Catch errors, delay between attempts with a `setTimeout` Promise, and return the resolved result upon success.",
        targetFile: 'index.js',
        conceptsTested: ['asynchronous-javascript', 'promises', 'error-recovery', 'retry-pattern'],
        requiredPatterns: ['retryWithBackoff', 'await', 'async', 'Promise', 'setTimeout'],
        expectedOutputPatterns: ['REDUZER_API_OK', 'Total Attempts Recorded: 3'],
        async evaluateSubmission(code = '', runtimeOutput = '') {
          const fn = extractExecutableFunction(code, 'retryWithBackoff');
          if (typeof fn === 'function') {
            try {
              let calls = 0;
              const flakyTask = async () => {
                calls++;
                if (calls < 3) throw new Error('Simulated network glitch');
                return 'SUCCESS_RECOVERED';
              };
              const result = await fn(flakyTask, 3, 10);
              if (result === 'SUCCESS_RECOVERED' && calls === 3) {
                return {
                  passed: true,
                  socraticPraise: "Bravo! You mastered resilient asynchronous coordination in JavaScript."
                };
              }
            } catch {}
          }

          if (
            runtimeOutput.includes('REDUZER_API_OK') &&
            (runtimeOutput.includes('Total Attempts Recorded: 3') || runtimeOutput.includes('3'))
          ) {
            return {
              passed: true,
              socraticPraise: "Bravo! You mastered resilient asynchronous coordination in JavaScript."
            };
          }

          return {
            passed: false,
            socraticHint: "Make sure you catch the error and retry up to maxRetries times with `await new Promise(res => setTimeout(res, delayMs))`."
          };
        }
      }
    },

    // ------------------------------------------------------------------------
    // MODULE 8: Full-Stack Practice: Service Coordinator & Conflict Resolution (Weeks 15–16)
    // ------------------------------------------------------------------------
    {
      id: 'reduzer-fullstack-service',
      title: '8. Integrated Service & Conflict Resolution (Reduzer W15–16)',
      category: 'Full-Stack Integration',
      status: 'locked',
      isDetour: false,
      conceptTag: 'fullstack-service-coordination',
      description: 'Reduzer Weeks 15–16: Connect interface requests, state locking, and audit verification into an end-to-end booking service that prevents race conditions and handles conflicting double-booking attempts.',
      targetFile: 'index.js',
      initialFiles: {
        'index.js': `// ============================================================================
// REDUZER SCHOOL: Programming Practice and Review (Weeks 15–16)
// Curriculum: https://reduzer.ac.ke/curriculum
// ============================================================================
// In full-stack production systems, multiple users book tickets or make payments
// simultaneously. A service coordinator must prevent race conditions, guarantee
// data correctness, and emit audit logs.
// ============================================================================

export class BookingCoordinator {
  constructor(totalSeats = 10) {
    this.totalSeats = totalSeats;
    this.reservedSeats = new Set();
    this.auditLog = [];
  }

  /**
   * Reserves a seat for a user:
   * 1. Validate seatNumber is between 1 and totalSeats. If not:
   *    return { success: false, reason: 'INVALID_SEAT_NUMBER' }
   * 2. If seat is already in reservedSeats:
   *    return { success: false, reason: 'SEAT_ALREADY_RESERVED' }
   * 3. Otherwise:
   *    add seat to reservedSeats
   *    push audit event { timestamp: Date.now(), userId, seatNumber, status: 'CONFIRMED' }
   *    return { success: true, seatNumber, userId }
   */
  reserveSeat(userId, seatNumber) {
    // 👇 YOUR TURN: Implement the reservation guard logic and audit trail!
    
  }

  getAvailableSeats() {
    const available = [];
    for (let i = 1; i <= this.totalSeats; i++) {
      if (!this.reservedSeats.has(i)) available.push(i);
    }
    return available;
  }
}

function verifyBookingService() {
  console.log('--- Verifying Booking Service Coordinator ---');
  const coordinator = new BookingCoordinator(5);

  const res1 = coordinator.reserveSeat('user-alice', 3);
  console.log('Booking Seat 3 (Alice):', res1.success);

  // Attempt double booking on the same seat
  const res2 = coordinator.reserveSeat('user-bob', 3);
  console.log('Booking Seat 3 (Bob - Conflict):', res2.success, res2.reason);

  // Attempt out-of-bounds seat
  const res3 = coordinator.reserveSeat('user-claire', 99);
  console.log('Booking Seat 99 (Invalid):', res3.success, res3.reason);

  console.log('Remaining available seats:', coordinator.getAvailableSeats());
  console.log('Total audit entries:', coordinator.auditLog.length);
}

verifyBookingService();
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: "In Weeks 15–16, we integrate all fundamentals into a cohesive service coordinator that prevents conflicting state updates and records an audit trail.",
          file: 'index.js',
          highlightLine: 24,
          cursorTarget: { type: 'editor', line: 24, label: 'Service Coordination' },
          codeSnapshot: `export class BookingCoordinator {\n  constructor(totalSeats = 10) { this.reservedSeats = new Set(); }\n}`
        },
        {
          timeOffset: 3800,
          narration: "Check bounds: 1 <= seatNumber <= totalSeats. Check collision: this.reservedSeats.has(seatNumber). If available, record the reservation.",
          file: 'index.js',
          highlightLine: 29,
          cursorTarget: { type: 'editor', line: 29, label: 'Collision prevention' },
          codeSnapshot: `if (this.reservedSeats.has(seatNumber)) {\n  return { success: false, reason: 'SEAT_ALREADY_RESERVED' };\n}`
        },
        {
          timeOffset: 7200,
          narration: "Implement reserveSeat to complete the Reduzer Introduction to Software Development milestone!",
          file: 'index.js',
          highlightLine: 31,
          isChallengeStop: true,
          cursorTarget: { type: 'editor', line: 31, label: 'Your turn: Implement reserveSeat' },
          codeSnapshot: `// 👇 YOUR TURN: Implement the reservation guard logic and audit trail!\n`
        }
      ],
      challengeSpec: {
        prompt: "Complete `reserveSeat(userId, seatNumber)` on `BookingCoordinator`. Reject invalid seat numbers and double bookings, record confirmed reservations in `reservedSeats`, and append to `auditLog`.",
        targetFile: 'index.js',
        conceptsTested: ['service-coordination', 'conflict-resolution', 'audit-logging', 'data-correctness'],
        requiredPatterns: ['reserveSeat', 'reservedSeats', 'auditLog', 'INVALID_SEAT_NUMBER', 'SEAT_ALREADY_RESERVED'],
        expectedOutputPatterns: ['Booking Seat 3 (Alice): true', 'SEAT_ALREADY_RESERVED', 'INVALID_SEAT_NUMBER', 'Remaining available seats: [ 1, 2, 4, 5 ]', 'Total audit entries: 1'],
        evaluateSubmission(code = '', runtimeOutput = '') {
          const CoordClass = extractExecutableFunction(code, 'BookingCoordinator');
          if (typeof CoordClass === 'function') {
            try {
              const coord = new CoordClass(5);
              const b1 = coord.reserveSeat('alice', 2);
              const b2 = coord.reserveSeat('bob', 2); // duplicate
              const b3 = coord.reserveSeat('claire', 99); // out-of-bounds
              if (
                b1?.success === true &&
                b2?.success === false && b2?.reason === 'SEAT_ALREADY_RESERVED' &&
                b3?.success === false && b3?.reason === 'INVALID_SEAT_NUMBER'
              ) {
                return {
                  passed: true,
                  socraticPraise: "Congratulations! You completed the Reduzer Introduction to Software Development milestone with production-grade data correctness."
                };
              }
            } catch {}
          }

          if (
            runtimeOutput.includes('Booking Seat 3 (Alice): true') &&
            runtimeOutput.includes('SEAT_ALREADY_RESERVED') &&
            runtimeOutput.includes('INVALID_SEAT_NUMBER')
          ) {
            return {
              passed: true,
              socraticPraise: "Congratulations! You completed the Reduzer Introduction to Software Development milestone with production-grade data correctness."
            };
          }

          return {
            passed: false,
            socraticHint: "Make sure you return `{ success: false, reason: 'INVALID_SEAT_NUMBER' }` for seat 99 and `{ success: false, reason: 'SEAT_ALREADY_RESERVED' }` for duplicate seat 3."
          };
        }
      }
    }
  ]
};

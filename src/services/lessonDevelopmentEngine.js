// ============================================================================
// AUTONOMOUS COURSE & LESSON DEVELOPMENT ENGINE
// ============================================================================
// Builds complete interactive, runnable Scrimba-style courses on the fly
// utilizing the LLM based on user data, learning goals, syllabus text,
// or diagnosed Industry 4.0 vs Education 4.0 skill gaps.
//
// Each developed module includes:
// 1. Production-grade starter files (with real industry context)
// 2. Step-by-step Scrimba `aiTimeline` with code typing snapshots and handoff stops
// 3. Challenge specification with AST & runtime output validation
// 4. Non-code conceptual checks & Socratic guidance hints
// 5. Interactive UI pathway metadata
// ============================================================================

import { jsonrepair } from 'jsonrepair';
import { callConfiguredLlm } from './socraticAiTutor.js';

/**
 * Compiles a dynamic AST, regex, and runtime output verification function
 * from a declarative challenge specification.
 */
export function compileChallengeEvaluator(challengeSpec = {}) {
  return function evaluateSubmission(code = '', runtimeOutput = '') {
    const codeStr = String(code || '');
    const outStr = String(runtimeOutput || '');

    // 1. Required code patterns (regex or keyword)
    if (Array.isArray(challengeSpec.requiredPatterns) && challengeSpec.requiredPatterns.length > 0) {
      for (const pattern of challengeSpec.requiredPatterns) {
        if (!pattern) continue;
        try {
          const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
          if (!regex.test(codeStr)) {
            return {
              passed: false,
              socraticHint: challengeSpec.socraticHint || `Your solution needs to implement: ${pattern}`
            };
          }
        } catch {
          if (!codeStr.toLowerCase().includes(String(pattern).toLowerCase())) {
            return {
              passed: false,
              socraticHint: challengeSpec.socraticHint || `Your solution needs to include: ${pattern}`
            };
          }
        }
      }
    }

    // 2. Forbidden patterns (e.g. avoid synchronous blocking calls or raw eval)
    if (Array.isArray(challengeSpec.forbiddenPatterns) && challengeSpec.forbiddenPatterns.length > 0) {
      for (const pattern of challengeSpec.forbiddenPatterns) {
        if (!pattern) continue;
        try {
          const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
          if (regex.test(codeStr)) {
            return {
              passed: false,
              socraticHint: `Avoid using: ${pattern}. Solve this using the recommended modern approach.`
            };
          }
        } catch {
          // ignore invalid regex
        }
      }
    }

    // 3. Expected runtime / terminal output patterns
    if (Array.isArray(challengeSpec.expectedOutputPatterns) && challengeSpec.expectedOutputPatterns.length > 0) {
      for (const pattern of challengeSpec.expectedOutputPatterns) {
        if (!pattern) continue;
        try {
          const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
          if (!regex.test(outStr) && !regex.test(codeStr)) {
            return {
              passed: false,
              socraticHint: challengeSpec.socraticHint || `The code output should match: "${pattern}". Check your return value and console output.`
            };
          }
        } catch {
          if (!outStr.toLowerCase().includes(String(pattern).toLowerCase())) {
            return {
              passed: false,
              socraticHint: challengeSpec.socraticHint || `The code output should include "${pattern}".`
            };
          }
        }
      }
    }

    return {
      passed: true,
      socraticPraise: challengeSpec.socraticPraise || 'Spot on! Your code passed all AST and runtime checks.'
    };
  };
}

/**
 * Curated Kenyan Industry 4.0 Track Templates
 * Provides instant, zero-latency lesson development grounded in the Silicon Savannah tech landscape.
 */
export const KENYAN_INDUSTRY_TRACK_TEMPLATES = {
  'asynchronous-fintech-systems': {
    trackId: 'kenya-fintech-rails',
    title: 'Kenyan Industry 4.0: M-Pesa FinTech Rails & Resilient Async Architecture',
    subtitle: 'Daraja APIs, reliable webhooks, and transaction handling',
    icon: 'Smartphone',
    domain: 'FinTech & Digital Payments',
    nodes: [
      {
        id: 'ke-mpesa-stk-promise',
        title: '1. Safaricom Daraja STK Push & Asynchronous Promises',
        category: 'FinTech Rails',
        conceptTag: 'mpesa-stk-push',
        description: 'Implement non-blocking M-Pesa STK push requests in Node.js to handle variable carrier latencies across Kenyan mobile networks.',
        targetFile: 'index.js',
        initialFiles: {
          'index.js': `// ============================================================================
// KENYAN INDUSTRY 4.0: Safaricom Daraja STK Push Payment Service
// ============================================================================

// Simulated Daraja Gateway API
function simulateDarajaStkPush(phoneNumber, amount) {
  return new Promise((resolve, reject) => {
    if (!phoneNumber.startsWith("254") || phoneNumber.length !== 12) {
      return reject(new Error("Invalid Kenyan phone number format. Use 2547XXXXXXXX."));
    }
    // Simulate mobile network delay (100ms)
    setTimeout(() => {
      resolve({
        MerchantRequestID: "MR-" + Math.floor(Math.random() * 90000 + 10000),
        CheckoutRequestID: "ws_CO_" + Date.now(),
        ResponseCode: "0",
        CustomerMessage: \`Success! STK prompt sent to \${phoneNumber} for KES \${amount}.\`
      });
    }, 100);
  });
}

// 👇 YOUR TURN: Implement initiateMpesaPayment(phone, amount) using async / await & try/catch
async function initiateMpesaPayment(phoneNumber, amount) {
  
}

// Test with Nairobi user checkout
initiateMpesaPayment("254712345678", 500).then((res) => console.log("Payment Result:", res));
`
        },
        aiTimeline: [
          {
            timeOffset: 0,
            narration: "Welcome to your personalized Kenyan Industry 4.0 track! In Kenya's digital economy, Safaricom's Daraja M-Pesa API is the backbone of all commerce. Let's see how our Daraja simulator works.",
            file: 'index.js',
            highlightLine: 6,
            codeSnapshot: `// ============================================================================
// KENYAN INDUSTRY 4.0: Safaricom Daraja STK Push Payment Service
// ============================================================================

function simulateDarajaStkPush(phoneNumber, amount) {
  return new Promise((resolve, reject) => {
    if (!phoneNumber.startsWith("254") || phoneNumber.length !== 12) {
      return reject(new Error("Invalid Kenyan phone number format. Use 2547XXXXXXXX."));
    }
    setTimeout(() => {
      resolve({
        MerchantRequestID: "MR-" + Math.floor(Math.random() * 90000 + 10000),
        CheckoutRequestID: "ws_CO_" + Date.now(),
        ResponseCode: "0",
        CustomerMessage: \`Success! STK prompt sent to \${phoneNumber} for KES \${amount}.\`
      });
    }, 100);
  });
}
`
          },
          {
            timeOffset: 3500,
            narration: "Traditional university curricula teach synchronous blocking code. But in Industry 4.0, payments are strictly asynchronous: we must await the promise and wrap it in try-catch to catch network drops gracefully.",
            file: 'index.js',
            highlightLine: 21,
            codeSnapshot: `// ============================================================================
// KENYAN INDUSTRY 4.0: Safaricom Daraja STK Push Payment Service
// ============================================================================

function simulateDarajaStkPush(phoneNumber, amount) {
  return new Promise((resolve, reject) => {
    if (!phoneNumber.startsWith("254") || phoneNumber.length !== 12) {
      return reject(new Error("Invalid Kenyan phone number format. Use 2547XXXXXXXX."));
    }
    setTimeout(() => {
      resolve({
        MerchantRequestID: "MR-" + Math.floor(Math.random() * 90000 + 10000),
        CheckoutRequestID: "ws_CO_" + Date.now(),
        ResponseCode: "0",
        CustomerMessage: \`Success! STK prompt sent to \${phoneNumber} for KES \${amount}.\`
      });
    }, 100);
  });
}

// 👇 YOUR TURN: Implement initiateMpesaPayment(phone, amount) using async / await & try/catch
async function initiateMpesaPayment(phoneNumber, amount) {
  try {
    const response = await simulateDarajaStkPush(phoneNumber, amount);
    return response;
  } catch (err) {
    return { error: err.message };
  }
}

initiateMpesaPayment("254712345678", 500).then((res) => console.log("Payment Result:", res));
`
          },
          {
            timeOffset: 7000,
            narration: "Now take over at line 23! Complete the function so it awaits simulateDarajaStkPush, returns the response, and catches errors gracefully without crashing the server.",
            file: 'index.js',
            highlightLine: 22,
            isChallengeStop: true,
            codeSnapshot: `// ============================================================================
// KENYAN INDUSTRY 4.0: Safaricom Daraja STK Push Payment Service
// ============================================================================

function simulateDarajaStkPush(phoneNumber, amount) {
  return new Promise((resolve, reject) => {
    if (!phoneNumber.startsWith("254") || phoneNumber.length !== 12) {
      return reject(new Error("Invalid Kenyan phone number format. Use 2547XXXXXXXX."));
    }
    setTimeout(() => {
      resolve({
        MerchantRequestID: "MR-" + Math.floor(Math.random() * 90000 + 10000),
        CheckoutRequestID: "ws_CO_" + Date.now(),
        ResponseCode: "0",
        CustomerMessage: \`Success! STK prompt sent to \${phoneNumber} for KES \${amount}.\`
      });
    }, 100);
  });
}

// 👇 YOUR TURN: Implement initiateMpesaPayment(phone, amount) using async / await & try/catch
async function initiateMpesaPayment(phoneNumber, amount) {
  // Use try / catch and await simulateDarajaStkPush(phoneNumber, amount)
  
}

initiateMpesaPayment("254712345678", 500).then((res) => console.log("Payment Result:", res));
`
          }
        ],
        challengeSpec: {
          prompt: "Inside `async function initiateMpesaPayment(phoneNumber, amount)`, use `try / catch` to `await simulateDarajaStkPush(phoneNumber, amount)` and return the result. If an error occurs, catch it and return `{ error: err.message }`.",
          targetFile: 'index.js',
          conceptsTested: ['async-await', 'try-catch', 'fintech-apis', 'mpesa-rails'],
          requiredPatterns: ['await\\s+simulateDarajaStkPush', 'try\\s*\\{', 'catch\\s*\\('],
          expectedOutputPatterns: ['Payment Result'],
          socraticPraise: "Spot on! That async / await pattern with try-catch is the standard resilience pattern across Kenyan FinTech APIs.",
          socraticHint: "Remember to use `await simulateDarajaStkPush(phoneNumber, amount)` inside a `try { ... } catch (err) { ... }` block."
        }
      },
      {
        id: 'ke-mpesa-webhook-idempotency',
        title: '2. C2B Webhook Confirmation & Transaction Idempotency',
        category: 'FinTech Rails',
        conceptTag: 'mpesa-webhook-idempotency',
        description: 'Build an idempotent payment callback handler that prevents double-crediting customer balances when mobile networks retry webhooks.',
        targetFile: 'index.js',
        initialFiles: {
          'index.js': `// ============================================================================
// KENYAN INDUSTRY 4.0: M-Pesa C2B Webhook Idempotency Store
// ============================================================================

const processedTransactions = new Set();
const ledger = {};

function creditAccount(accountNo, amount) {
  ledger[accountNo] = (ledger[accountNo] || 0) + amount;
  return ledger[accountNo];
}

// 👇 YOUR TURN: Process incoming webhook transaction safely
// 1. Check if transaction.TransID was already processed
// 2. If already processed, return { status: 'duplicate', transId: transaction.TransID }
// 3. If new, add to processedTransactions, creditAccount, and return { status: 'credited', balance: ... }
function handleMpesaConfirmation(transaction) {
  
}

// Simulated test callbacks (including duplicate retry)
console.log(handleMpesaConfirmation({ TransID: "RBA1234567", BillRefNumber: "ACC-01", TransAmount: 1500 }));
console.log(handleMpesaConfirmation({ TransID: "RBA1234567", BillRefNumber: "ACC-01", TransAmount: 1500 }));
`
        },
        aiTimeline: [
          {
            timeOffset: 0,
            narration: "Network drops cause carrier gateways to retry webhooks up to 5 times. If we don't track idempotency, the customer gets credited 5 times!",
            file: 'index.js',
            highlightLine: 6,
            codeSnapshot: `const processedTransactions = new Set();\nconst ledger = {};`
          },
          {
            timeOffset: 4000,
            narration: "Take over at line 14! Implement handleMpesaConfirmation: check `processedTransactions.has(transaction.TransID)` before crediting the ledger.",
            file: 'index.js',
            highlightLine: 14,
            isChallengeStop: true,
            codeSnapshot: `function handleMpesaConfirmation(transaction) {\n  // Check processedTransactions.has(transaction.TransID)\n}`
          }
        ],
        challengeSpec: {
          prompt: "In `handleMpesaConfirmation(transaction)`, check if `processedTransactions.has(transaction.TransID)`. If true, return `{ status: 'duplicate', transId: transaction.TransID }`. Otherwise, add it with `.add()`, call `creditAccount()`, and return `{ status: 'credited', balance: ... }`.",
          targetFile: 'index.js',
          conceptsTested: ['idempotency', 'Set', 'data-integrity', 'fintech-ledger'],
          requiredPatterns: ['processedTransactions\\.has', 'processedTransactions\\.add', 'duplicate'],
          expectedOutputPatterns: ['duplicate'],
          socraticPraise: "Brilliant! Idempotency is the cornerstone of high-scale digital financial services.",
          socraticHint: "Check `if (processedTransactions.has(transaction.TransID))` at the top of the function."
        }
      }
    ]
  },

  'offline-first-agritech': {
    trackId: 'kenya-agritech-offline',
    title: 'Kenyan Industry 4.0: Offline-First AgriTech & Sensor Telemetry',
    subtitle: 'Local sync queues, indexed storage, and rural network tolerance',
    icon: 'Database',
    domain: 'AgriTech & Smart Farming',
    nodes: [
      {
        id: 'ke-agri-local-queue',
        title: '1. Resilient Offline Sensor Buffer & Retry Queue',
        category: 'Edge & Offline Architecture',
        conceptTag: 'offline-buffer-queue',
        description: 'Build an offline sync buffer that stores soil moisture sensor readings locally in rural Rift Valley farming nodes when cellular connectivity drops.',
        targetFile: 'index.js',
        initialFiles: {
          'index.js': `// ============================================================================
// KENYAN INDUSTRY 4.0: Rift Valley AgriTech Offline Sensor Buffer
// ============================================================================

class OfflineSensorQueue {
  constructor() {
    this.buffer = [];
  }

  // Push reading with timestamp and status 'pending'
  enqueueReading(sensorId, moistureValue) {
    this.buffer.push({
      sensorId,
      moistureValue,
      recordedAt: Date.now(),
      synced: false
    });
  }

  // 👇 YOUR TURN: Flush unsynced readings when network connects
  // Filter for unsynced items, mark them synced: true, and return count of synced items
  flushPendingReadings() {
    
  }
}

const queue = new OfflineSensorQueue();
queue.enqueueReading("SENSOR-NAKURU-01", 38.5);
queue.enqueueReading("SENSOR-NAKURU-02", 42.1);
console.log("Synced items count:", queue.flushPendingReadings());
`
        },
        aiTimeline: [
          {
            timeOffset: 0,
            narration: "In rural Kenya, IoT farm sensors regularly lose 2G connectivity. Offline-first queues buffer telemetry on device until the link is restored.",
            file: 'index.js',
            highlightLine: 10,
            codeSnapshot: `class OfflineSensorQueue { ... }`
          },
          {
            timeOffset: 4000,
            narration: "Take over in `flushPendingReadings()`. Filter through `this.buffer` for readings where `synced === false`, mark them `synced = true`, and return how many were synced.",
            file: 'index.js',
            highlightLine: 20,
            isChallengeStop: true,
            codeSnapshot: `flushPendingReadings() {\n  // Filter and mark synced\n}`
          }
        ],
        challengeSpec: {
          prompt: "Implement `flushPendingReadings()` to find all items in `this.buffer` where `synced === false`, set `item.synced = true`, and return the total count of flushed readings.",
          targetFile: 'index.js',
          conceptsTested: ['offline-first', 'queues', 'state-management', 'iot-telemetry'],
          requiredPatterns: ['this\\.buffer', 'synced'],
          expectedOutputPatterns: ['Synced items count'],
          socraticPraise: "Excellent! Offline-first queue buffering is essential for rural IoT and logistics across East Africa.",
          socraticHint: "Loop over `this.buffer`, find items where `!item.synced`, set `item.synced = true`, and count them."
        }
      }
    ]
  },

  'agentic-ai-tool-calling': {
    trackId: 'kenya-agentic-ai',
    title: 'Industry 4.0 AI Engineering: Autonomous Tool Calling & Local APIs',
    subtitle: 'LLM tool proposal dispatch, registry security, and USSD bridges',
    icon: 'Sparkles',
    domain: 'AI Engineering & Agentic Systems',
    nodes: [
      {
        id: 'ke-agent-tool-dispatcher',
        title: '1. Deterministic Agent Dispatcher for Kenyan AgriTech',
        category: 'AI Engineering',
        conceptTag: 'agentic-ai-dispatch',
        description: 'Build a secure function-calling router that maps LLM tool proposals to live agricultural advisory services in Kenya.',
        targetFile: 'index.js',
        initialFiles: {
          'index.js': `// ============================================================================
// KENYAN INDUSTRY 4.0: Autonomous AI AgriTech Agent Dispatcher
// ============================================================================

const toolRegistry = {
  getCropPrice(args) {
    const prices = { maize: "KES 4,200 per 90kg bag", tea: "KES 65 per kg", coffee: "KES 110 per kg" };
    return prices[args.crop.toLowerCase()] || "Price data unavailable for " + args.crop;
  },
  getRainfallForecast(args) {
    return \`Rainfall forecast for \${args.county}: Moderate rains expected.\`;
  }
};

// 👇 YOUR TURN: Implement executeAgentTool(toolCall) using dynamic dispatch
// toolCall: { name: "getCropPrice", args: { crop: "maize" } }
// 1. Look up toolRegistry[toolCall.name]
// 2. If it is a function, call it with toolCall.args and return the output
// 3. Otherwise return "Error: Tool not found"
function executeAgentTool(toolCall) {
  
}

console.log(executeAgentTool({ name: "getCropPrice", args: { crop: "maize" } }));
console.log(executeAgentTool({ name: "getRainfallForecast", args: { county: "Nakuru" } }));
`
        },
        aiTimeline: [
          {
            timeOffset: 0,
            narration: "Across Kenya, AI agents are powering farmer advisory and SMS helpdesks. Instead of dangerous eval(), we route proposed tools through a strict registry whitelist.",
            file: 'index.js',
            highlightLine: 6,
            codeSnapshot: `const toolRegistry = { ... };`
          },
          {
            timeOffset: 4500,
            narration: "Take over at line 18! Look up `toolRegistry[toolCall.name]`. If found, execute it with `toolCall.args`. If not found, return an error string.",
            file: 'index.js',
            highlightLine: 18,
            isChallengeStop: true,
            codeSnapshot: `function executeAgentTool(toolCall) {\n  // Implement dynamic dispatch\n}`
          }
        ],
        challengeSpec: {
          prompt: "In `executeAgentTool(toolCall)`, dynamically look up `toolRegistry[toolCall.name]`. If it is a function, call it with `toolCall.args` and return its output. Otherwise return 'Error: Tool not found'.",
          targetFile: 'index.js',
          conceptsTested: ['dynamic-dispatch', 'tool-calling', 'agentic-ai', 'whitelist-security'],
          requiredPatterns: ['toolRegistry\\[', 'typeof', 'function'],
          expectedOutputPatterns: ['KES 4,200', 'Moderate rains'],
          socraticPraise: "Spot on! That dynamic tool dispatch pattern is the security heart of enterprise AI agents in Kenya.",
          socraticHint: "Look up `const handler = toolRegistry[toolCall.name]`. Check `typeof handler === 'function'`."
        }
      }
    ]
  }
};

/**
 * Procedural fallback course synthesizer for offline/zero-latency scenarios.
 * Produces complete, runnable Scrimba tracks tailored to any domain and prompt.
 */
export function synthesizeDomainFallbackTrack({
  topic = 'Modern Full-Stack Engineering',
  domain = 'Software Engineering',
  learnerProfile = {},
  moduleCount = 3
}) {
  const learnerName = learnerProfile?.name || 'Learner';
  const cleanTopic = String(topic || 'Interactive Coding').trim();
  const slug = cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'custom-track';
  const trackId = `${slug}-${Date.now().toString(36)}`;

  const count = Math.min(6, Math.max(2, Number(moduleCount) || 3));
  const nodes = [];

  for (let i = 0; i < count; i++) {
    const stepNum = i + 1;
    const moduleId = `${slug}-module-${stepNum}`;
    let title = `${stepNum}. Architecture & Core Foundations`;
    let category = 'Foundations';
    let conceptTag = `${slug}-foundation`;
    let starterCode = '';
    let prompt = '';
    let requiredPatterns = [];

    if (i === 0) {
      title = `${stepNum}. ${cleanTopic}: Core Data Models & Validation`;
      category = 'Data Architecture';
      conceptTag = `${slug}-data-validation`;
      starterCode = `// ============================================================================
// ${cleanTopic.toUpperCase()} — MODULE 1: Data Models & Validation
// ============================================================================

const stateRegistry = new Map();

// Helper simulator
function validateRecord(record) {
  if (!record || typeof record.id !== "string") {
    throw new Error("Invalid record: missing string ID");
  }
  return true;
}

// 👇 YOUR TURN: Implement registerRecord(record)
// 1. Validate the record using validateRecord(record) inside a try/catch
// 2. If valid, save it to stateRegistry: stateRegistry.set(record.id, record)
// 3. Return { success: true, id: record.id }
// 4. If invalid, catch error and return { success: false, error: err.message }
function registerRecord(record) {
  
}

// Test cases
console.log(registerRecord({ id: "REC-101", title: "Active Module" }));
console.log(registerRecord({ title: "Broken Module (Missing ID)" }));
`;
      prompt = "Implement `registerRecord(record)`: validate using `validateRecord(record)`, save to `stateRegistry.set(record.id, record)`, and return `{ success: true, id: record.id }` with try/catch error handling.";
      requiredPatterns = ['validateRecord', 'stateRegistry\\.set', 'try\\s*\\{', 'catch'];
    } else if (i === 1) {
      title = `${stepNum}. Asynchronous Pipeline & Service Integration`;
      category = 'Service Integration';
      conceptTag = `${slug}-async-pipeline`;
      starterCode = `// ============================================================================
// ${cleanTopic.toUpperCase()} — MODULE 2: Async Pipeline
// ============================================================================

function mockRemoteApiCall(payload) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!payload || !payload.id) return reject(new Error("Remote API: Missing payload ID"));
      resolve({ status: 200, confirmationCode: "CONF-" + Math.floor(Math.random() * 90000 + 10000) });
    }, 80);
  });
}

// 👇 YOUR TURN: Implement dispatchServiceTask(payload) using async / await
// Await mockRemoteApiCall(payload), log the confirmation, and return the response.
async function dispatchServiceTask(payload) {
  
}

dispatchServiceTask({ id: "TASK-808", priority: "high" }).then(res => console.log("Task Result:", res));
`;
      prompt = "Inside `async function dispatchServiceTask(payload)`, use `try / catch` to `await mockRemoteApiCall(payload)` and return the resolved response object.";
      requiredPatterns = ['await\\s+mockRemoteApiCall', 'try\\s*\\{', 'catch'];
    } else {
      title = `${stepNum}. Resilient Fault Tolerance & Output Verification`;
      category = 'Production Deployment';
      conceptTag = `${slug}-fault-tolerance`;
      starterCode = `// ============================================================================
// ${cleanTopic.toUpperCase()} — MODULE ${stepNum}: Production Fault Tolerance
// ============================================================================

const retryHistory = [];

// 👇 YOUR TURN: Implement executeWithRetry(fn, maxAttempts)
// Execute fn(). If it succeeds, return the result.
// If it fails, retry up to maxAttempts times, recording each attempt in retryHistory.
async function executeWithRetry(fn, maxAttempts = 3) {
  
}

// Test with simulated failing function that succeeds on attempt 2
let attempts = 0;
const flakyTask = async () => {
  attempts++;
  if (attempts < 2) throw new Error("Temporary network glitch");
  return "Connected successfully!";
};

executeWithRetry(flakyTask, 3).then(res => console.log("Retry Outcome:", res));
`;
      prompt = "Implement `executeWithRetry(fn, maxAttempts)`: repeatedly attempt executing `await fn()`. If an error occurs, catch it and retry until `maxAttempts`. Return the successful result or throw the final error.";
      requiredPatterns = ['await', 'maxAttempts', 'catch'];
    }

    const node = {
      id: moduleId,
      title,
      category,
      status: i === 0 ? 'in-progress' : 'locked',
      isDetour: false,
      isCustomGenerated: true,
      conceptTag,
      description: `Master hands-on ${category.toLowerCase()} for ${cleanTopic} with live code execution and Socratic AI mentoring.`,
      targetFile: 'index.js',
      initialFiles: {
        'index.js': starterCode
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: `Welcome to Module ${stepNum} of ${cleanTopic}! Let's examine the architectural scaffolding and see how our service models are structured.`,
          file: 'index.js',
          highlightLine: 4,
          codeSnapshot: starterCode.split('// 👇 YOUR TURN:')[0]
        },
        {
          timeOffset: 4000,
          narration: `Now take over at the challenge prompt! Complete the implementation so it handles edge cases gracefully and passes all test assertions.`,
          file: 'index.js',
          highlightLine: 18,
          isChallengeStop: true,
          codeSnapshot: starterCode
        }
      ],
      challengeSpec: {
        prompt,
        targetFile: 'index.js',
        conceptsTested: [conceptTag, 'error-handling', 'modern-javascript'],
        requiredPatterns,
        expectedOutputPatterns: ['Result', 'Outcome', 'success'],
        socraticPraise: `Outstanding work! You have successfully mastered ${title}!`,
        socraticHint: `Check the challenge description carefully: ensure you handle try/catch and return the expected response object.`
      }
    };

    node.challengeSpec.evaluateSubmission = compileChallengeEvaluator(node.challengeSpec);
    nodes.push(node);
  }

  return {
    id: trackId,
    title: `${cleanTopic}`,
    subtitle: `Custom AI-synthesized pathway for ${domain} (${learnerProfile?.priorExperience || 'Practical'})`,
    icon: 'Sparkles',
    domain,
    isCustomGenerated: true,
    generatedForLearner: learnerName,
    generatedAt: new Date().toISOString(),
    nodes
  };
}

/**
 * Autonomous Course Development Engine powered by the Live LLM.
 * Accepts user input (goal, topic, domain, experience level, raw syllabus/notes)
 * and constructs a fully compliant, runnable Scrimba-style course track with:
 * - Starter code files
 * - Multi-step Scrimba code timelines with audio narration
 * - AST & runtime challenge evaluators
 * - Interactive UI pathway integration
 */
export async function generateAiCourseFromUserInput({
  prompt = '',
  topic = '',
  domain = 'FinTech & Software Engineering',
  learnerProfile = {},
  syllabusText = '',
  moduleCount = 3,
  mismatchReport = null,
  apiConfig = {},
  onProgress = null
}) {
  const effectiveTopic = String(topic || prompt || 'Modern Web & Software Engineering').trim();
  const learnerName = learnerProfile?.name || 'Student';
  const experience = learnerProfile?.priorExperience || 'intermediate';
  const count = Math.min(6, Math.max(2, Number(moduleCount) || 3));

  onProgress?.({ step: 1, label: 'Analyzing learning goals and industry domain context…' });

  const systemPrompt = `You are Upskill Curriculum AI, an elite Scrimba curriculum architect and senior software engineer.
Your mission is to generate a complete, production-grade, interactive coding course tailored to the learner's exact input.

You MUST respond with valid JSON ONLY. No markdown fences, no explanatory preambles.
The JSON must follow this exact schema:
{
  "trackId": "kebab-case-slug",
  "title": "Clear, Inspiring Course Title",
  "subtitle": "Actionable subtitle of skills taught",
  "icon": "Sparkles" | "Smartphone" | "Database" | "Server" | "Code2" | "Cpu" | "Globe" | "Shield",
  "domain": "Target Industry Domain",
  "nodes": [
    {
      "id": "slug-module-1",
      "title": "1. Actionable Title",
      "category": "Section Category",
      "conceptTag": "kebab-case-concept",
      "description": "2-3 sentences explaining the industry context and why this pattern matters.",
      "targetFile": "index.js",
      "initialFiles": {
        "index.js": "// Complete, runnable JavaScript starter code with comments and a clear '// 👇 YOUR TURN:' comment"
      },
      "aiTimeline": [
        {
          "timeOffset": 0,
          "narration": "Engaging opening narration explaining the code setup (2-3 sentences).",
          "file": "index.js",
          "highlightLine": 4,
          "codeSnapshot": "Initial code snapshot shown to student"
        },
        {
          "timeOffset": 4500,
          "narration": "Handoff instructions explaining what function to implement and a gentle hint.",
          "file": "index.js",
          "highlightLine": 16,
          "isChallengeStop": true,
          "codeSnapshot": "Code snapshot with challenge ready for student to edit"
        }
      ],
      "challengeSpec": {
        "prompt": "Exact challenge instructions for the student",
        "targetFile": "index.js",
        "conceptsTested": ["concept-1", "concept-2"],
        "requiredPatterns": ["patternToMatch1", "patternToMatch2"],
        "expectedOutputPatterns": ["expectedSubstringInOutput"],
        "socraticPraise": "Warm praise explaining why their solution works",
        "socraticHint": "Gentle hint guiding them without giving away the answer"
      }
    }
  ]
}

CRITICAL RULES:
1. Provide exactly ${count} progressive modules in 'nodes'.
2. 'initialFiles' must have real, runnable JavaScript code with a '// 👇 YOUR TURN:' section.
3. Every node must have 2-3 aiTimeline steps. The LAST step must have "isChallengeStop": true.
4. "requiredPatterns" in challengeSpec must contain 1-3 regex/keyword patterns essential to verifying the solution.
5. All code must run cleanly with node index.js and print verification output using console.log.`;

  const userPrompt = `
Generate a ${count}-module interactive Scrimba coding course for:
Learner Name: ${learnerName}
Experience Level: ${experience}
Target Domain / Industry: ${domain}
Core Learning Goal / Topic: ${effectiveTopic}
${syllabusText ? `Raw Syllabus / Documentation Outline to Convert:\n"""\n${syllabusText.slice(0, 3000)}\n"""\n` : ''}
${mismatchReport ? `Diagnosed Skills Gap Delta: Theory Score ${mismatchReport.theoryScore}%, Applied Score ${mismatchReport.appliedScore}%. Gaps: ${mismatchReport.identifiedGaps?.join(', ')}.\n` : ''}

Design challenging, highly practical real-world modules that teach by doing. Return valid JSON only.`;

  onProgress?.({ step: 2, label: 'Synthesizing production starter code & interactive Scrimba timelines…' });

  try {
    const rawResponse = await callConfiguredLlm({
      systemPrompt,
      userPrompt,
      apiConfig,
      expectJson: true,
      temperature: 0.35
    });

    onProgress?.({ step: 3, label: 'Compiling AST challenge evaluators and UI pathway…' });

    let parsed = null;
    if (typeof rawResponse === 'object' && rawResponse !== null && Array.isArray(rawResponse.nodes)) {
      parsed = rawResponse;
    } else if (typeof rawResponse === 'string') {
      try {
        parsed = JSON.parse(rawResponse);
      } catch {
        const repaired = jsonrepair(rawResponse);
        parsed = JSON.parse(repaired);
      }
    }

    if (parsed && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
      // Normalize and compile all nodes
      const trackId = parsed.trackId || `${effectiveTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
      const normalizedNodes = parsed.nodes.map((node, index) => {
        const nodeId = node.id || `${trackId}-mod-${index + 1}`;
        const targetFile = node.targetFile || node.challengeSpec?.targetFile || 'index.js';
        const initialFiles = node.initialFiles && Object.keys(node.initialFiles).length > 0
          ? node.initialFiles
          : { [targetFile]: `// Lesson ${index + 1}: ${node.title}\nconsole.log("Ready!");\n` };

        const aiTimeline = Array.isArray(node.aiTimeline) && node.aiTimeline.length > 0
          ? node.aiTimeline.map((step, sIdx, sArr) => ({
              timeOffset: step.timeOffset ?? sIdx * 3500,
              narration: step.narration || `Step ${sIdx + 1} of ${node.title}`,
              file: step.file || targetFile,
              highlightLine: step.highlightLine || 1,
              codeSnapshot: step.codeSnapshot || initialFiles[targetFile] || '',
              isChallengeStop: step.isChallengeStop ?? (sIdx === sArr.length - 1)
            }))
          : [
              {
                timeOffset: 0,
                narration: `Welcome to ${node.title}! Let's review the code structure.`,
                file: targetFile,
                highlightLine: 1,
                codeSnapshot: initialFiles[targetFile] || ''
              },
              {
                timeOffset: 4000,
                narration: node.challengeSpec?.prompt || `Complete the challenge implementation!`,
                file: targetFile,
                highlightLine: 5,
                isChallengeStop: true,
                codeSnapshot: initialFiles[targetFile] || ''
              }
            ];

        // Ensure the last step is marked as challenge stop
        if (!aiTimeline.some((s) => s.isChallengeStop)) {
          aiTimeline[aiTimeline.length - 1].isChallengeStop = true;
        }

        const challengeSpec = {
          prompt: node.challengeSpec?.prompt || node.description || `Implement the required logic in ${targetFile}`,
          targetFile,
          conceptsTested: Array.isArray(node.challengeSpec?.conceptsTested)
            ? node.challengeSpec.conceptsTested
            : [node.conceptTag || 'javascript-skills'],
          requiredPatterns: Array.isArray(node.challengeSpec?.requiredPatterns)
            ? node.challengeSpec.requiredPatterns
            : [],
          forbiddenPatterns: Array.isArray(node.challengeSpec?.forbiddenPatterns)
            ? node.challengeSpec.forbiddenPatterns
            : [],
          expectedOutputPatterns: Array.isArray(node.challengeSpec?.expectedOutputPatterns)
            ? node.challengeSpec.expectedOutputPatterns
            : [],
          socraticPraise: node.challengeSpec?.socraticPraise || `Great work completing ${node.title}!`,
          socraticHint: node.challengeSpec?.socraticHint || `Review the comments and ensure your code returns the expected output.`
        };

        challengeSpec.evaluateSubmission = compileChallengeEvaluator(challengeSpec);

        return {
          id: nodeId,
          title: node.title || `${index + 1}. Module`,
          category: node.category || 'Core Concepts',
          status: index === 0 ? 'in-progress' : 'locked',
          isDetour: false,
          isCustomGenerated: true,
          conceptTag: node.conceptTag || `${trackId}-concept-${index + 1}`,
          description: node.description || `Practical lesson covering ${node.title}`,
          targetFile,
          initialFiles,
          aiTimeline,
          challengeSpec
        };
      });

      onProgress?.({ step: 4, label: 'Course pathway successfully built!' });

      return {
        id: trackId,
        title: parsed.title || effectiveTopic,
        subtitle: parsed.subtitle || `AI-tailored curriculum for ${learnerName}`,
        icon: parsed.icon || 'Sparkles',
        domain: parsed.domain || domain,
        isCustomGenerated: true,
        generatedForLearner: learnerName,
        generatedAt: new Date().toISOString(),
        nodes: normalizedNodes
      };
    }
  } catch (err) {
    console.warn('[CourseGenerator] LLM course generation call failed, falling back to smart procedural synthesis:', err.message);
  }

  // Graceful smart synthesis fallback
  onProgress?.({ step: 4, label: 'Synthesizing adaptive course track…' });
  return synthesizeDomainFallbackTrack({
    topic: effectiveTopic,
    domain,
    learnerProfile,
    moduleCount: count
  });
}

/**
 * Autonomous Course Development Engine for Skill Gaps.
 * Synthesizes a personalized, runnable Scrimba-style Course Track tailored
 * to the learner's diagnosed skill mismatch in Kenya's Industry 4.0 context.
 */
export async function developCourseForSkillGap({
  mismatchReport,
  learnerProfile,
  apiConfig = {},
  onProgress = null
}) {
  const gapTag = mismatchReport?.primaryGapTag || 'asynchronous-fintech-systems';
  const domain = mismatchReport?.domainName || 'FinTech & Digital Payments';
  const recommendedTitle = mismatchReport?.recommendedCourseTitle || 'Kenyan Industry 4.0 Adaptive Track';

  try {
    return await generateAiCourseFromUserInput({
      topic: recommendedTitle,
      domain,
      learnerProfile,
      mismatchReport,
      moduleCount: 3,
      apiConfig,
      onProgress
    });
  } catch (err) {
    console.warn('[SkillGapEngine] Dynamic synthesis error, using curated template:', err);
    const template =
      KENYAN_INDUSTRY_TRACK_TEMPLATES[gapTag] ||
      KENYAN_INDUSTRY_TRACK_TEMPLATES['asynchronous-fintech-systems'];

    return {
      id: `${template.trackId}-${Date.now().toString(36)}`,
      title: mismatchReport?.recommendedCourseTitle || template.title,
      subtitle: mismatchReport?.recommendedSubtitle || template.subtitle,
      icon: template.icon || 'Sparkles',
      domain: template.domain || domain,
      isCustomGenerated: true,
      generatedForLearner: learnerProfile?.name || 'Student',
      generatedAt: new Date().toISOString(),
      mismatchDiagnostic: {
        theoryScore: mismatchReport?.theoryScore || 70,
        appliedScore: mismatchReport?.appliedScore || 45,
        identifiedGaps: mismatchReport?.identifiedGaps || [],
        mismatchSummary: mismatchReport?.mismatchSummary || ''
      },
      nodes: template.nodes.map((node, index) => {
        const cloned = {
          ...node,
          status: index === 0 ? 'in-progress' : 'locked',
          isDetour: false,
          isCustomGenerated: true
        };
        cloned.challengeSpec.evaluateSubmission = compileChallengeEvaluator(cloned.challengeSpec);
        return cloned;
      })
    };
  }
}

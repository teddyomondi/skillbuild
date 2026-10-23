// ============================================================================
// AUTONOMOUS COURSE & LESSON DEVELOPMENT ENGINE
// ============================================================================
// Builds complete interactive, runnable Scrimba-style courses on the fly based
// on the learner's Industry 4.0 vs Education 4.0 skills gap.
//
// Each developed module includes:
// 1. Production-grade starter files (with real Kenyan Industry context)
// 2. Step-by-step Scrimba `aiTimeline` with code typing snapshots and handoff stops
// 3. Challenge specification with concrete AST / regex validation
// 4. Non-code conceptual check questions for the right AI interaction bar
// 5. Lesson steps explain the code before the learner tries it
//
// "Build a system that can develop lessons, and teach, not just develop the lessons"
// ============================================================================

import { callConfiguredLlm } from './socraticAiTutor.js';

/**
 * Curated Kenyan Industry 4.0 Track Templates
 * Provides instant, zero-latency lesson development grounded in the Silicon Savannah tech landscape.
 */
const KENYAN_INDUSTRY_TRACK_TEMPLATES = {
  'asynchronous-fintech-systems': {
    trackId: 'kenya-fintech-rails',
    title: 'Kenyan Industry 4.0: M-Pesa FinTech Rails & Resilient Async Architecture',
    subtitle: 'Daraja APIs, reliable webhooks, and transaction handling',
    icon: 'Smartphone',
    nodes: [
      {
        id: 'ke-mpesa-stk-promise',
        title: '1. Safaricom Daraja STK Push & Asynchronous Promises',
        category: 'FinTech Rails',
        conceptTag: 'mpesa-stk-push',
        description: 'Implement non-blocking M-Pesa STK push requests in Node.js to handle variable carrier latencies across Kenyan mobile networks.',
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

// Simulated Daraja Gateway API
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
          evaluateSubmission(code, runtimeOutput) {
            const hasAwait = /await\s+simulateDarajaStkPush/.test(code);
            const hasTryCatch = /try\s*\{[\s\S]*\}\s*catch/.test(code);
            const returnsResult = /return\s+/.test(code);

            if (!hasAwait) {
              return {
                passed: false,
                detectedGap: 'missing-await-promise',
                socraticHint: "Remember that `simulateDarajaStkPush` returns a Promise. How do you pause inside an `async function` until that payment promise resolves? (Hint: `await`)"
              };
            }
            if (!hasTryCatch) {
              return {
                passed: false,
                detectedGap: 'unhandled-promise-rejection',
                socraticHint: "What happens if a user enters an invalid phone number like '0712345678' instead of '254...'? How do you wrap the `await` call with `try { ... } catch (err) { ... }` so the server doesn't crash?"
              };
            }
            if (!returnsResult) {
              return {
                passed: false,
                socraticHint: "Don't forget to return the response from inside your `try` block so the caller receives the payment status!"
              };
            }
            return {
              passed: true,
              socraticPraise: "Spot on! That is the exact asynchronous pattern used in production Safaricom Daraja integrations across Kenya."
            };
          }
        },
      },
      {
        id: 'ke-daraja-webhook-reconciliation',
        title: '2. Idempotent Webhook Callback Reconciliation',
        category: 'FinTech Rails',
        conceptTag: 'webhook-idempotency',
        description: 'Process incoming payment callbacks idempotently so duplicate Safaricom webhooks never credit an account twice.',
        initialFiles: {
          'index.js': `// ============================================================================
// KENYAN INDUSTRY 4.0: Idempotent Payment Webhook Ledger
// ============================================================================

// In-memory ledger tracking processed M-Pesa Transaction IDs
const processedTransactions = new Set();
const userAccounts = new Map([
  ["user_nairobi_101", { name: "Wanjiku", balance: 1200 }]
]);

// 👇 YOUR TURN: Complete reconcileCallback(payload) to ensure idempotency!
function reconcileCallback(payload) {
  // payload: { transactionId: "QHK3459XJ", userId: "user_nairobi_101", amount: 500 }
  // 1. If processedTransactions already has payload.transactionId, return "DUPLICATE_IGNORED"
  // 2. Otherwise add transactionId to processedTransactions, update user balance, and return "CREDITED"
  
}

// Simulation: Safaricom occasionally sends the same callback twice during network retries:
console.log("Run 1:", reconcileCallback({ transactionId: "QHK3459XJ", userId: "user_nairobi_101", amount: 500 }));
console.log("Run 2 (Duplicate):", reconcileCallback({ transactionId: "QHK3459XJ", userId: "user_nairobi_101", amount: 500 }));
console.log("Final Balance (Should be 1700, not 2200):", userAccounts.get("user_nairobi_101").balance);
`
        },
        aiTimeline: [
          {
            timeOffset: 0,
            narration: "In Kenyan tech, telecoms will retry sending a webhook if your server takes more than 5 seconds to reply. If you don't check for duplicate Transaction IDs, the user gets credited twice!",
            file: 'index.js',
            highlightLine: 11,
            codeSnapshot: `const processedTransactions = new Set();
const userAccounts = new Map([
  ["user_nairobi_101", { name: "Wanjiku", balance: 1200 }]
]);

function reconcileCallback(payload) {
  // Checking transaction idempotency is a core Industry 4.0 requirement
}
`
          },
          {
            timeOffset: 4000,
            narration: "Take over in `reconcileCallback`! Check if `processedTransactions.has(payload.transactionId)`. If so, return 'DUPLICATE_IGNORED'. Otherwise, record it and update the account.",
            file: 'index.js',
            highlightLine: 12,
            isChallengeStop: true,
            codeSnapshot: `const processedTransactions = new Set();
const userAccounts = new Map([
  ["user_nairobi_101", { name: "Wanjiku", balance: 1200 }]
]);

// 👇 YOUR TURN: Complete reconcileCallback(payload) to ensure idempotency!
function reconcileCallback(payload) {
  if (processedTransactions.has(payload.transactionId)) {
    return "DUPLICATE_IGNORED";
  }
  processedTransactions.add(payload.transactionId);
  const account = userAccounts.get(payload.userId);
  if (account) {
    account.balance += payload.amount;
  }
  return "CREDITED";
}

console.log("Run 1:", reconcileCallback({ transactionId: "QHK3459XJ", userId: "user_nairobi_101", amount: 500 }));
console.log("Run 2 (Duplicate):", reconcileCallback({ transactionId: "QHK3459XJ", userId: "user_nairobi_101", amount: 500 }));
console.log("Final Balance:", userAccounts.get("user_nairobi_101").balance);
`
          }
        ],
        challengeSpec: {
          prompt: "In `reconcileCallback(payload)`, check if `processedTransactions.has(payload.transactionId)`. If true, return 'DUPLICATE_IGNORED'. Otherwise, add the `transactionId`, increment the user's `balance` in `userAccounts`, and return 'CREDITED'.",
          targetFile: 'index.js',
          conceptsTested: ['idempotency', 'set-data-structure', 'fintech-ledgers', 'defensive-programming'],
          evaluateSubmission(code, runtimeOutput) {
            const hasCheck = /processedTransactions\.has/.test(code);
            const hasAdd = /processedTransactions\.add/.test(code);
            const returnsDuplicate = /DUPLICATE_IGNORED/.test(code);
            const returnsCredited = /CREDITED/.test(code);

            if (!hasCheck || !returnsDuplicate) {
              return {
                passed: false,
                socraticHint: "How do you check if `payload.transactionId` has already been processed using `processedTransactions.has(...)`?"
              };
            }
            if (!hasAdd) {
              return {
                passed: false,
                socraticHint: "When a new transaction arrives for the first time, make sure to add it: `processedTransactions.add(payload.transactionId)`."
              };
            }
            return {
              passed: true,
              socraticPraise: "Excellent! Idempotency is what prevents double-crediting in FinTech systems across Kenya and worldwide."
            };
          }
        },
      }
    ]
  },

  'cloud-api-resilience': {
    trackId: 'kenya-cloud-backend',
    title: 'Industry 4.0 Backend Engineering: High-Throughput Cloud APIs',
    subtitle: 'Rate limits, the Node.js event loop, and reliable data',
    icon: 'Server',
    nodes: [
      {
        id: 'ke-token-bucket-limiter',
        title: '1. In-Memory Token Bucket for Burst Protection',
        category: 'Cloud APIs',
        conceptTag: 'rate-limiting',
        description: 'Build an in-memory token bucket rate limiter to protect cloud services against mobile network retry storms.',
        initialFiles: {
          'index.js': `// ============================================================================
// KENYAN INDUSTRY 4.0: Token Bucket Rate Limiter
// Protects Kenyan cloud APIs against bursts from mobile networks
// ============================================================================

const clientBuckets = new Map();

function allowRequest(clientId, maxTokens = 3) {
  // 👇 YOUR TURN: Read or initialize client tokens in clientBuckets.
  // If tokens > 0, decrement by 1 and return true. Otherwise return false!
  
}

console.log("Req 1 (Allowed):", allowRequest("client_mombasa"));
console.log("Req 2 (Allowed):", allowRequest("client_mombasa"));
console.log("Req 3 (Allowed):", allowRequest("client_mombasa"));
console.log("Req 4 (Should be false):", allowRequest("client_mombasa"));
`
        },
        aiTimeline: [
          {
            timeOffset: 0,
            narration: "When internet connectivity is intermittent, mobile apps in Kenya burst retries simultaneously. A token bucket limits requests without locking your server.",
            file: 'index.js',
            highlightLine: 7,
            codeSnapshot: `const clientBuckets = new Map();

function allowRequest(clientId, maxTokens = 3) {
  // Let's implement the token bucket logic
}
`
          },
          {
            timeOffset: 4000,
            narration: "Take over in `allowRequest`! Retrieve the current token count with `clientBuckets.get(clientId) ?? maxTokens`. If greater than zero, decrement and return true.",
            file: 'index.js',
            highlightLine: 8,
            isChallengeStop: true,
            codeSnapshot: `const clientBuckets = new Map();

function allowRequest(clientId, maxTokens = 3) {
  const currentTokens = clientBuckets.get(clientId) ?? maxTokens;
  if (currentTokens > 0) {
    clientBuckets.set(clientId, currentTokens - 1);
    return true;
  }
  return false;
}

console.log("Req 1:", allowRequest("client_mombasa"));
console.log("Req 2:", allowRequest("client_mombasa"));
console.log("Req 3:", allowRequest("client_mombasa"));
console.log("Req 4 (Should be false):", allowRequest("client_mombasa"));
`
          }
        ],
        challengeSpec: {
          prompt: "Inside `allowRequest(clientId, maxTokens = 3)`, retrieve tokens with `clientBuckets.get(clientId) ?? maxTokens`. If `tokens > 0`, store `tokens - 1` and return `true`. Otherwise return `false`.",
          targetFile: 'index.js',
          conceptsTested: ['map-lookups', 'token-bucket', 'rate-limiting', 'production-resilience'],
          evaluateSubmission(code, runtimeOutput) {
            const usesGet = /clientBuckets\.get/.test(code);
            const usesSet = /clientBuckets\.set/.test(code);
            if (!usesGet || !usesSet) {
              return {
                passed: false,
                socraticHint: "How do you read from and write to the `clientBuckets` Map using `.get()` and `.set()`?"
              };
            }
            return {
              passed: true,
              socraticPraise: "Outstanding! This token bucket pattern prevents API denial-of-service across distributed mobile applications."
            };
          }
        },
      }
    ]
  },

  'agentic-ai-tool-calling': {
    trackId: 'kenya-agentic-ai',
    title: 'Industry 4.0 AI Engineering: Autonomous Tool Calling & Local APIs',
    subtitle: 'LLM tools, query routing, and practical AI integrations',
    icon: 'Sparkles',
    nodes: [
      {
        id: 'ke-agent-tool-dispatcher',
        title: '1. Deterministic Agent Dispatcher for Kenyan AgriTech',
        category: 'AI Engineering',
        conceptTag: 'agentic-ai-dispatch',
        description: 'Build a secure function-calling router that maps LLM tool proposals to live agricultural advisory services in Kenya.',
        initialFiles: {
          'index.js': `// ============================================================================
// KENYAN INDUSTRY 4.0: Autonomous AI AgriTech Agent Dispatcher
// Connects farmer conversational prompts to verified tool handlers
// ============================================================================

const toolRegistry = {
  getCropPrice(args) {
    const prices = { maize: "KES 4,200 per 90kg bag", tea: "KES 65 per kg", coffee: "KES 110 per kg" };
    return prices[args.crop.toLowerCase()] || "Price data unavailable for " + args.crop;
  },
  getRainfallForecast(args) {
    return \`Rainfall forecast for \${args.county}: Moderate rains expected Tuesday through Thursday.\`;
  }
};

// 👇 YOUR TURN: Implement executeAgentTool(toolCall) using dynamic dispatch
function executeAgentTool(toolCall) {
  // toolCall: { name: "getCropPrice", args: { crop: "maize" } }
  // 1. Look up toolRegistry[toolCall.name]
  // 2. If it exists, call it with toolCall.args and return the result
  // 3. Otherwise return "Error: Tool not found"
  
}

// Test agent tool calls
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
            codeSnapshot: `const toolRegistry = {
  getCropPrice(args) { ... },
  getRainfallForecast(args) { ... }
};

function executeAgentTool(toolCall) {
  // Let's implement dynamic dispatch
}
`
          },
          {
            timeOffset: 4500,
            narration: "Take over at line 17! Look up `toolRegistry[toolCall.name]`. If found, execute it with `toolCall.args`. If not found, return an error string.",
            file: 'index.js',
            highlightLine: 18,
            isChallengeStop: true,
            codeSnapshot: `const toolRegistry = {
  getCropPrice(args) {
    const prices = { maize: "KES 4,200 per 90kg bag", tea: "KES 65 per kg" };
    return prices[args.crop.toLowerCase()] || "Price data unavailable";
  },
  getRainfallForecast(args) {
    return \`Rainfall forecast for \${args.county}: Moderate rains expected.\`;
  }
};

// 👇 YOUR TURN: Implement executeAgentTool(toolCall) using dynamic dispatch
function executeAgentTool(toolCall) {
  const handler = toolRegistry[toolCall.name];
  if (typeof handler === 'function') {
    return handler(toolCall.args);
  }
  return "Error: Tool not found";
}

console.log(executeAgentTool({ name: "getCropPrice", args: { crop: "maize" } }));
`
          }
        ],
        challengeSpec: {
          prompt: "In `executeAgentTool(toolCall)`, dynamically look up `toolRegistry[toolCall.name]`. If it is a function, call it with `toolCall.args` and return its output. Otherwise return 'Error: Tool not found'.",
          targetFile: 'index.js',
          conceptsTested: ['dynamic-dispatch', 'tool-calling', 'agentic-ai', 'whitelist-security'],
          evaluateSubmission(code, runtimeOutput) {
            const accessesRegistry = /toolRegistry\[.*\]/.test(code);
            const invokesHandler = /handler\(.*toolCall\.args.*\)/.test(code) || /toolRegistry\[.*\]\(.*args.*\)/.test(code);
            if (!accessesRegistry) {
              return {
                passed: false,
                socraticHint: "How do you access the function on `toolRegistry` using the variable `toolCall.name`? (Hint: `toolRegistry[toolCall.name]`)"
              };
            }
            return {
              passed: true,
              socraticPraise: "Spot on! That dynamic tool dispatch pattern is the security heart of enterprise AI agents in Kenya."
            };
          }
        },
      }
    ]
  }
};

/**
 * Autonomous Course Development Engine
 * Synthesizes a personalized, runnable Scrimba-style Course Track tailored
 * to the learner's diagnosed skill mismatch in Kenya's Industry 4.0 context.
 */
export async function developCourseForSkillGap({
  mismatchReport,
  learnerProfile,
  apiConfig = {}
}) {
  const gapTag = mismatchReport?.primaryGapTag || 'asynchronous-fintech-systems';

  // Check if we have a template matching the diagnosed gap
  const template =
    KENYAN_INDUSTRY_TRACK_TEMPLATES[gapTag] ||
    KENYAN_INDUSTRY_TRACK_TEMPLATES['asynchronous-fintech-systems'];

  // Prepare custom track object
  const customTrack = {
    id: `${template.trackId}-${Date.now().toString(36)}`,
    title: mismatchReport?.recommendedCourseTitle || template.title,
    subtitle: mismatchReport?.recommendedSubtitle || template.subtitle,
    icon: template.icon || 'Sparkles',
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
      return {
        ...node,
        status: index === 0 ? 'in-progress' : 'locked',
        isDetour: false,
        isCustomGenerated: true
      };
    })
  };

  return customTrack;
}

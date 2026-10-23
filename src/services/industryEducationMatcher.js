// ============================================================================
// INDUSTRY 4.0 vs EDUCATION 4.0: KENYAN CONTEXT SKILLS MISMATCH ENGINE
// ============================================================================
// Compares Industry 4.0 requirements (Silicon Savannah: M-Pesa APIs, asynchronous
// event systems, resilient offline-first cloud architectures, AI tool routers)
// with Education 4.0 competencies (hands-on, experiential, continuous AST evaluation)
// to diagnose the exact learner skill delta and generate customized courses.
// ============================================================================

export const KENYAN_INDUSTRY_DOMAINS = [
  {
    id: 'fintech-rails',
    name: 'FinTech Rails & M-Pesa Systems',
    description: 'Safaricom Daraja API, STK Push, B2C/C2B webhooks, transaction reconciliation, and ledger resilience.',
    marketDemandScore: 98,
    industryPillars: ['M-Pesa Webhooks', 'STK Push Handling', 'Idempotency', 'Asynchronous Reconciliation', 'API Security']
  },
  {
    id: 'cloud-backend',
    name: 'Resilient Cloud & Distributed APIs',
    description: 'Asynchronous event loops, in-memory caching, microservices, and offline-first mobile data optimization.',
    marketDemandScore: 94,
    industryPillars: ['Async/Await & Microtasks', 'Token Bucket Rate Limiting', 'In-Memory Maps & Redis', 'Middleware Security']
  },
  {
    id: 'fullstack-web',
    name: 'Modern Full-Stack & UI Engineering',
    description: 'Reactive single-page architectures, accessible semantic DOM, component state encapsulation, and client caching.',
    marketDemandScore: 91,
    industryPillars: ['Component Scoping', 'Closures & State Isolation', 'Semantic Accessibility', 'Client-Side Routing']
  },
  {
    id: 'agentic-ai',
    name: 'AI Automation & Tool-Calling Agents',
    description: 'Autonomous LLM tool dispatch, USSD-to-AI gateway bridges, deterministic registries, and prompt engineering.',
    marketDemandScore: 96,
    industryPillars: ['Tool-Call Registry', 'Dynamic Function Dispatch', 'Structured Outputs', 'Context Telemetry']
  }
];

export const EDUCATION_4_0_PRINCIPLES = [
  {
    id: 'experiential-coding',
    title: 'Experiential vs Rote Learning',
    description: 'Moving beyond memorized textbook syntax to real-world code generation, immediate execution, and AST evaluation.'
  },
  {
    id: 'competency-progression',
    title: 'Competency-Based Mastery',
    description: 'Dynamic difficulty adaptation and detour creation when a conceptual struggle is detected, rather than rigid grade bands.'
  },
  {
    id: 'localized-application',
    title: 'Localized Contextual Relevance',
    description: 'Grounding computer science exercises in genuine Kenyan industrial realities (e.g., M-Pesa, logistics, mobile-first latency).'
  }
];

/**
 * Diagnostic questions presented during student onboarding.
 * Each question compares an Education 3.0 theoretical instinct with an Industry 4.0 production habit.
 */
export const DIAGNOSTIC_QUESTIONS = [
  {
    id: 'q1-async-timeout',
    domain: 'fintech-rails',
    title: '1. Handling Asynchronous M-Pesa Payment Callbacks',
    scenario:
      'A user initiates an M-Pesa STK Push payment on an e-commerce checkout. In Kenya, Safaricom Daraja callbacks often take between 3 to 15 seconds to return to your backend webhook.',
    question: 'How should your backend service handle this transaction?',
    options: [
      {
        id: 'opt-a',
        text: 'Keep the client HTTP socket connection open with a synchronous while-loop until Safaricom answers.',
        isIndustryReady: false,
        gapIdentified: 'synchronous-blocking-antipattern',
        explanation: 'Education 3.0 textbook instinct: Synchronous blocking locks the Node.js event loop, exhausting server connections under high traffic.'
      },
      {
        id: 'opt-b',
        text: 'Acknowledge the STK push initiation immediately with a pending transaction ID, and asynchronously update payment status when the Daraja webhook callback fires.',
        isIndustryReady: true,
        gapIdentified: null,
        explanation: 'Industry 4.0 Standard: Asynchronous event-driven architecture handles high throughput and unpredictable network latencies without blocking.'
      },
      {
        id: 'opt-c',
        text: 'Poll the Safaricom endpoint every 100 milliseconds directly from the mobile browser.',
        isIndustryReady: false,
        gapIdentified: 'client-polling-overload',
        explanation: 'Exhausts client mobile data bundles and exceeds Daraja rate limits.'
      }
    ]
  },
  {
    id: 'q2-state-isolation',
    domain: 'fullstack-web',
    title: '2. State Encapsulation in Multi-Tenant Web Apps',
    scenario:
      'You are building a client dashboard where multiple users view their account balances simultaneously in a single-page web application.',
    question: 'How do you ensure a user’s balance and auth tokens remain strictly private in memory?',
    options: [
      {
        id: 'opt-a',
        text: 'Store all user balances on the global `window` object with unique prefixes.',
        isIndustryReady: false,
        gapIdentified: 'global-scope-pollution',
        explanation: 'Education 3.0 instinct: Global state causes security vulnerabilities and state collision across sessions.'
      },
      {
        id: 'opt-b',
        text: 'Encapsulate balance and private keys inside factory functions using lexical closures and scoped modules.',
        isIndustryReady: true,
        gapIdentified: null,
        explanation: 'Industry 4.0 Standard: Lexical closures and private module state guarantee that data is only accessible via authorized methods.'
      },
      {
        id: 'opt-c',
        text: 'Convert all variables into cookies so the browser can manage them automatically.',
        isIndustryReady: false,
        gapIdentified: 'cookie-overload-security',
        explanation: 'Cookies add unnecessary overhead to every HTTP request and risk XSS/CSRF exposure.'
      }
    ]
  },
  {
    id: 'q3-resilience-rate-limiting',
    domain: 'cloud-backend',
    title: '3. API Resilience Under Kenyan Mobile Network Conditions',
    scenario:
      'Clients accessing your API frequently switch between 3G/4G/WiFi across Kenyan counties, occasionally causing rapid burst retries that strain your database.',
    question: 'What is the most effective Education 4.0 / Industry 4.0 architecture to protect your service?',
    options: [
      {
        id: 'opt-a',
        text: 'Implement an in-memory Token Bucket rate limiter (using a Map/Redis) and return 429 Retry-After headers with client-side exponential backoff.',
        isIndustryReady: true,
        gapIdentified: null,
        explanation: 'Industry 4.0 Standard: Protects server resources while allowing legitimate burst traffic and guiding clients to retry politely.'
      },
      {
        id: 'opt-b',
        text: 'Query the database directly on every request to count rows in a request log table.',
        isIndustryReady: false,
        gapIdentified: 'unbounded-db-queries',
        explanation: 'Education 3.0 textbook approach: Unbounded DB queries collapse database connection pools during network retry storms.'
      },
      {
        id: 'opt-c',
        text: 'Reject all requests originating from IP addresses that send more than 1 request per second permanently.',
        isIndustryReady: false,
        gapIdentified: 'overly-aggressive-ip-blocking',
        explanation: 'Carrier-grade NAT (used by Safaricom and Airtel) groups thousands of mobile users behind single public IPs, causing mass outages.'
      }
    ]
  },
  {
    id: 'q4-ai-integration',
    domain: 'agentic-ai',
    title: '4. Autonomous AI Agent Tool Dispatching',
    scenario:
      'An enterprise in Nairobi wants an AI customer service agent that can look up inventory, check weather for farmers, and query orders based on conversational prompts.',
    question: 'How should the backend safely execute tools proposed by the LLM?',
    options: [
      {
        id: 'opt-a',
        text: 'Pass the LLM’s suggested code directly to `eval()` on the server for maximum flexibility.',
        isIndustryReady: false,
        gapIdentified: 'arbitrary-code-execution-eval',
        explanation: 'Critical Security Vulnerability: `eval()` allows prompt injection to compromise the entire host machine.'
      },
      {
        id: 'opt-b',
        text: 'Use a deterministic dispatch registry object where tool names map strictly to pre-validated JavaScript handler functions.',
        isIndustryReady: true,
        gapIdentified: null,
        explanation: 'Industry 4.0 Standard: Dynamic dispatch through a whitelisted registry guarantees safety, predictability, and clean logging.'
      },
      {
        id: 'opt-c',
        text: 'Write a giant 50-condition if-else block in the frontend client code.',
        isIndustryReady: false,
        gapIdentified: 'client-side-business-logic',
        explanation: 'Exposes private API credentials and cannot scale as tools grow.'
      }
    ]
  }
];

/**
 * Compares learner responses and profile against Kenyan Industry 4.0 standards.
 * Generates a structured Mismatch Report highlighting their exact competencies,
 * conceptual gaps, and the custom course pathway needed.
 */
export function evaluateSkillMismatch({
  learnerProfile,
  diagnosticAnswers = {}
}) {
  const {
    name = 'Learner',
    educationBackground = 'university-cs',
    targetDomain = 'fintech-rails',
    priorExperience = 'beginner'
  } = learnerProfile || {};

  let industryReadinessScore = 0;
  const identifiedGaps = [];
  const masteredPillars = [];

  DIAGNOSTIC_QUESTIONS.forEach((q) => {
    const chosenOptId = diagnosticAnswers[q.id];
    const chosenOption = q.options.find((opt) => opt.id === chosenOptId);

    if (chosenOption?.isIndustryReady) {
      industryReadinessScore += 25;
      masteredPillars.push({
        title: q.title.replace(/^\d+\.\s*/, ''),
        domain: q.domain,
        note: chosenOption.explanation
      });
    } else if (chosenOption) {
      identifiedGaps.push({
        gapTag: chosenOption.gapIdentified || `${q.domain}-mismatch`,
        domain: q.domain,
        title: q.title.replace(/^\d+\.\s*/, ''),
        explanation: chosenOption.explanation
      });
    } else {
      // Unanswered question treated as diagnostic gap
      identifiedGaps.push({
        gapTag: `${q.domain}-untested`,
        domain: q.domain,
        title: q.title.replace(/^\d+\.\s*/, ''),
        explanation: 'Requires hands-on experiential training to build production-grade intuition.'
      });
    }
  });

  // Calculate Industry vs Education 4.0 Comparison Scores
  const theoryScore =
    educationBackground === 'university-cs'
      ? 85
      : educationBackground === 'tvet-diploma'
      ? 70
      : 55;

  const appliedScore = Math.max(20, Math.min(100, industryReadinessScore + (priorExperience === 'experienced' ? 20 : 0)));

  // Determine Primary Skill Gap
  let primaryGapTag = 'asynchronous-fintech-systems';
  let recommendedCourseTitle = 'Kenyan Industry 4.0: FinTech Rails & Resilient Async Architecture';
  let recommendedSubtitle = 'Bridging academic theory to Silicon Savannah production standards (M-Pesa, Webhooks, Cloud APIs)';

  if (targetDomain === 'agentic-ai' || identifiedGaps.some((g) => g.domain === 'agentic-ai')) {
    primaryGapTag = 'agentic-ai-tool-calling';
    recommendedCourseTitle = 'Industry 4.0 AI Engineering: Autonomous Tool Calling & Local APIs';
    recommendedSubtitle = 'Production AI agents, deterministic dispatch, and local Kenyan data pipelines';
  } else if (targetDomain === 'cloud-backend' || identifiedGaps.some((g) => g.domain === 'cloud-backend')) {
    primaryGapTag = 'cloud-api-resilience';
    recommendedCourseTitle = 'Industry 4.0 Backend Engineering: High-Throughput Cloud APIs';
    recommendedSubtitle = 'Mastering the Node.js event loop, token-bucket rate limiters, and distributed maps';
  } else if (targetDomain === 'fullstack-web') {
    primaryGapTag = 'modern-state-encapsulation';
    recommendedCourseTitle = 'Education 4.0 Full-Stack: Reactive Architectures & Encapsulated State';
    recommendedSubtitle = 'Modern JavaScript closures, single-page architectures, and semantic accessibility';
  }

  const mismatchSummary =
    appliedScore >= 75
      ? 'Strong practical foundation! Your custom course will focus on advanced distributed resilience and high-scale Kenyan FinTech patterns.'
      : appliedScore >= 50
      ? 'Good theoretical grounding, but noticeable gap in production asynchronous event systems and real-world API error resilience.'
      : 'Significant mismatch detected between academic rote theory and Kenyan Industry 4.0 job demands. Your custom course will start with hands-on experiential foundations.';

  return {
    learnerName: name,
    educationBackground,
    targetDomain,
    priorExperience,
    theoryScore,
    appliedScore,
    mismatchDelta: Math.abs(theoryScore - appliedScore),
    identifiedGaps,
    masteredPillars,
    primaryGapTag,
    recommendedCourseTitle,
    recommendedSubtitle,
    mismatchSummary,
    industryContext: {
      location: 'Kenya (Silicon Savannah)',
      keyEcosystems: ['M-Pesa / Daraja Rails', 'Cloud Microservices', 'Agentic AI Bridges', 'Offline-First Web']
    }
  };
}

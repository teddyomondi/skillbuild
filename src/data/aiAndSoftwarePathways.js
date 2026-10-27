// ============================================================================
// AI ENGINEER & SOFTWARE ENGINEER PATHWAYS (SCRATCH TO PRO)
// ============================================================================
// Industry-grade, hands-on Scrimba-style interactive modules covering:
// 1. AI Engineer: Prompting -> Structured Outputs -> Embeddings -> RAG ->
//    Tool Calling -> ReAct Agent Loops -> KV Cache Compaction -> LLM Evals
// 2. Software Engineer: LRU Cache -> Concurrency Pools -> Distributed Rate Limiting ->
//    Circuit Breakers -> Transactional Outbox -> Distributed Tracing
// ============================================================================

export const AI_ENGINEER_TRACK = {
  id: 'fullstack-ai',
  title: 'AI Engineer: Scratch to Pro (roadmap.sh/ai-engineer)',
  subtitle: 'Prompt Engineering, Structured Outputs, RAG, ReAct Agents, KV Memory & Evals',
  icon: 'Sparkles',
  nodes: [
    {
      id: 'ai-prompt-tokens',
      title: '1. Prompt Engineering, Role Messages & Token Budgets',
      category: 'LLM Foundations',
      status: 'in-progress',
      isDetour: false,
      conceptTag: 'prompt-tokens',
      description: 'Format standard multi-turn conversational payloads with system instructions, user queries, and token budget estimation.',
      initialFiles: {
        'package.json': `{
  "name": "ai-foundations-lab",
  "type": "module",
  "scripts": { "start": "node index.js" }
}`,
        'index.js': `// ==========================================================
// AI ENGINEER LEVEL 1: Message Structuring & Token Guardrails
// ==========================================================

function formatChatPayload(systemPrompt, userQuery, history = []) {
  // 👇 YOUR TURN: Construct an array of standard role objects:
  // 1. First item: { role: 'system', content: systemPrompt }
  // 2. Include all existing turns from history
  // 3. Final item: { role: 'user', content: userQuery }
  // Return the complete formatted messages array!
  
}

const history = [
  { role: 'user', content: 'What is a vector embedding?' },
  { role: 'assistant', content: 'An embedding is a list of floating-point numbers representing semantic meaning.' }
];

const payload = formatChatPayload(
  'You are an expert AI Engineer instructor.',
  'How do we compute cosine similarity between them?',
  history
);

console.log('Formatted Payload Length:', payload.length);
console.log('First Role:', payload[0]?.role);
console.log('Last Role:', payload[payload.length - 1]?.role);
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: "Welcome to the AI Engineer Pathway! Every production LLM API—OpenAI, Anthropic, Gemini—communicates through structured role-based message arrays. Your turn: assemble the system prompt, history, and user query into the standard message format!",
          file: 'index.js',
          highlightLine: 4,
          isChallengeStop: true,
          codeSnapshot: `function formatChatPayload(systemPrompt, userQuery, history = []) {
  // 👇 YOUR TURN: Construct an array of standard role objects:
  
}`
        }
      ],
      challengeSpec: {
        prompt: "Return an array starting with `{ role: 'system', content: systemPrompt }`, followed by `...history`, and ending with `{ role: 'user', content: userQuery }`.",
        targetFile: 'index.js',
        conceptsTested: ['role-based-messaging', 'chat-payload'],
        evaluateSubmission(code) {
          const hasSystemRole = /role:\s*['"]system['"]/.test(code);
          const hasUserRole = /role:\s*['"]user['"]/.test(code);
          const handlesHistory = /\.\.\.history|history/.test(code);
          if (!hasSystemRole) {
            return { passed: false, socraticHint: "Did you define the first message with role: 'system' and content: systemPrompt?" };
          }
          if (!hasUserRole) {
            return { passed: false, socraticHint: "Did you append the user message with role: 'user' at the end?" };
          }
          if (!handlesHistory) {
            return { passed: false, socraticHint: "Make sure you spread or include the prior conversation turns from `history` in the middle." };
          }
          return { passed: true, socraticPraise: "Excellent! That role hierarchy is the foundation of all chat completion APIs." };
        }
      }
    },

    {
      id: 'ai-structured-outputs-zod',
      title: '2. Constrained Decoding & JSON Schema Coercion',
      category: 'Structured Outputs',
      status: 'locked',
      isDetour: false,
      conceptTag: 'structured-outputs',
      description: 'Clean raw LLM completions, strip markdown code fences, and parse guaranteed type-safe JSON objects.',
      initialFiles: {
        'package.json': `{
  "name": "ai-structured-outputs",
  "type": "module",
  "scripts": { "start": "node index.js" }
}`,
        'index.js': `// ==========================================================
// AI ENGINEER LEVEL 2: Structured Outputs & JSON Parsing
// ==========================================================

function extractAndParseJson(rawLlmResponse) {
  // 👇 YOUR TURN: LLMs often wrap JSON in \`\`\`json ... \`\`\` backticks.
  // 1. Strip out markdown code block backticks if present.
  // 2. Parse the clean string using JSON.parse().
  // 3. Return the parsed object!
  
}

// Test Case: Typical LLM output with markdown fences
const rawOutput = \`\`\`json
{
  "summary": "Vector database indices use HNSW graphs.",
  "confidence": 0.96,
  "tags": ["embeddings", "hnsw", "vector-search"]
}
\`\`\`;

const parsed = extractAndParseJson(rawOutput);
console.log("Parsed Summary:", parsed?.summary);
console.log("Confidence:", parsed?.confidence);
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: "Production AI systems cannot rely on freeform text. When an LLM generates structured data, it frequently wraps output in markdown backticks. Complete `extractAndParseJson` to clean and parse the JSON string safely!",
          file: 'index.js',
          highlightLine: 4,
          isChallengeStop: true,
          codeSnapshot: `function extractAndParseJson(rawLlmResponse) {
  // Strip code fences and parse JSON safely
}`
        }
      ],
      challengeSpec: {
        prompt: "Clean raw LLM output by removing ````json` and ```` backticks, then return `JSON.parse(cleaned)`.",
        targetFile: 'index.js',
        conceptsTested: ['structured-json-parsing', 'markdown-cleanup'],
        evaluateSubmission(code) {
          const hasJsonParse = /JSON\.parse/.test(code);
          const hasReplaceOrRegex = /replace|match|trim/.test(code);
          if (!hasJsonParse) {
            return { passed: false, socraticHint: "How do you parse a validated JSON string into a JavaScript object in standard JS?" };
          }
          if (!hasReplaceOrRegex) {
            return { passed: false, socraticHint: "What method can you use on `rawLlmResponse` to remove the ```json and ``` fences before parsing?" };
          }
          return { passed: true, socraticPraise: "Spot on! Bulletproof JSON cleanup prevents 99% of LLM downstream parsing crashes." };
        }
      }
    },

    {
      id: 'ai-vector-embeddings-cosine',
      title: '3. Vector Embeddings & High-Dimensional Semantic Search',
      category: 'Semantic Search & Embeddings',
      status: 'locked',
      isDetour: false,
      conceptTag: 'vector-embeddings',
      description: 'Calculate cosine similarity between query embeddings and document vectors to find the nearest semantic neighbor.',
      initialFiles: {
        'package.json': `{
  "name": "ai-vector-search",
  "type": "module",
  "scripts": { "start": "node index.js" }
}`,
        'index.js': `// ==========================================================
// AI ENGINEER LEVEL 3: Vector Embeddings & Cosine Similarity
// ==========================================================

function cosineSimilarity(vecA, vecB) {
  // 👇 YOUR TURN: Compute dot product and vector magnitudes:
  // dotProduct = sum(A[i] * B[i])
  // magA = sqrt(sum(A[i]^2)), magB = sqrt(sum(B[i]^2))
  // Return dotProduct / (magA * magB)
  
}

const queryEmbedding = [0.2, 0.8, 0.5];
const doc1Embedding = [0.22, 0.79, 0.48]; // Highly semantically similar
const doc2Embedding = [-0.6, 0.1, -0.7]; // Dissimilar topic

console.log("Similarity Doc 1 (Should be ~0.99):", cosineSimilarity(queryEmbedding, doc1Embedding).toFixed(3));
console.log("Similarity Doc 2 (Should be low):", cosineSimilarity(queryEmbedding, doc2Embedding).toFixed(3));
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: "Embeddings turn words into coordinate vectors in high-dimensional space. To find what a user means, we compute the angle between vectors using Cosine Similarity. Implement `cosineSimilarity` to rank semantic matches!",
          file: 'index.js',
          highlightLine: 4,
          isChallengeStop: true,
          codeSnapshot: `function cosineSimilarity(vecA, vecB) {
  // Compute dot product and magnitudes
}`
        }
      ],
      challengeSpec: {
        prompt: "Implement cosine similarity: calculate the dot product divided by the product of both vector Euclidean magnitudes.",
        targetFile: 'index.js',
        conceptsTested: ['dot-product', 'vector-magnitude', 'cosine-similarity'],
        evaluateSubmission(code) {
          const hasMathSqrt = /Math\.(sqrt|hypot)/.test(code);
          const hasDotProduct = /\*|\.reduce/.test(code);
          if (!hasMathSqrt) {
            return { passed: false, socraticHint: "Remember that vector magnitude is the square root of the sum of squared components (`Math.sqrt` or `Math.hypot`)." };
          }
          if (!hasDotProduct) {
            return { passed: false, socraticHint: "Have you calculated the dot product by multiplying corresponding elements `vecA[i] * vecB[i]`?" };
          }
          return { passed: true, socraticPraise: "Brilliant! You just built the core mathematical primitive powering Pinecone, Milvus, and pgvector." };
        }
      }
    },

    {
      id: 'ai-rag-retrieval-pipeline',
      title: '4. Hybrid RAG (Retrieval-Augmented Generation) Pipeline',
      category: 'RAG Architecture',
      status: 'locked',
      isDetour: false,
      conceptTag: 'rag-retrieval',
      description: 'Assemble top-ranked documentation chunks into a context-packed, hallucination-resistant prompt.',
      initialFiles: {
        'package.json': `{
  "name": "ai-rag-pipeline",
  "type": "module",
  "scripts": { "start": "node index.js" }
}`,
        'index.js': `// ==========================================================
// AI ENGINEER LEVEL 4: RAG Context Assembly
// ==========================================================

function buildRagPrompt(userQuery, retrievedChunks) {
  // 👇 YOUR TURN:
  // 1. Join all chunk texts with newlines: "[1] chunk1\\n[2] chunk2..."
  // 2. Return a formatted prompt string instructing the AI:
  //    "CONTEXT:\\n" + formattedContext + "\\n\\nQUESTION: " + userQuery + "\\n\\nAnswer using ONLY the context above."
  
}

const retrievedDocs = [
  "Redis sliding-window rate limiters use ZSET with timestamps as scores.",
  "Token bucket allows short bursts while maintaining average throughput limit."
];

const ragPrompt = buildRagPrompt("How does a Redis rate limiter handle timestamps?", retrievedDocs);
console.log(ragPrompt);
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: "RAG solves LLM hallucinations by retrieving verified private knowledge chunks and packing them into the prompt. Implement `buildRagPrompt` to format retrieved snippets into an authoritative context window!",
          file: 'index.js',
          highlightLine: 4,
          isChallengeStop: true,
          codeSnapshot: `function buildRagPrompt(userQuery, retrievedChunks) {
  // Assemble context and question
}`
        }
      ],
      challengeSpec: {
        prompt: "Format `retrievedChunks` into numbered context blocks and return a prompt string containing `userQuery` with anti-hallucination instructions.",
        targetFile: 'index.js',
        conceptsTested: ['rag-prompting', 'context-injection'],
        evaluateSubmission(code) {
          const usesChunks = /retrievedChunks/.test(code);
          const usesQuery = /userQuery/.test(code);
          const hasContextMarker = /CONTEXT|context/.test(code);
          if (!usesChunks || !usesQuery) {
            return { passed: false, socraticHint: "Make sure you include both `retrievedChunks` and `userQuery` in the generated prompt string." };
          }
          if (!hasContextMarker) {
            return { passed: false, socraticHint: "Structure the prompt clearly with a 'CONTEXT' section header before the question." };
          }
          return { passed: true, socraticPraise: "Superb! Context-augmented prompt framing is the cornerstone of enterprise RAG systems." };
        }
      }
    },

    {
      id: 'ai-tool-calling-router',
      title: '5. Deterministic Agent Tool Dispatcher & Schema Registry',
      category: 'AI Agents & Function Calling',
      status: 'locked',
      isDetour: false,
      conceptTag: 'tool-calling',
      description: 'Build the dynamic execution router that dispatches LLM tool call payloads ({ name, args }) to JavaScript functions.',
      initialFiles: {
        'package.json': `{
  "name": "ai-tool-dispatch",
  "type": "module",
  "scripts": { "start": "node index.js" }
}`,
        'index.js': `// ==========================================================
// AI ENGINEER LEVEL 5: Deterministic Tool Dispatcher
// ==========================================================

const toolsRegistry = {
  getWeather: ({ city }) => \`Sunny, 24°C in \${city}\`,
  queryDocs: ({ topic }) => \`Found 3 articles on \${topic}\`
};

function executeToolCall(toolCall) {
  // 👇 YOUR TURN: Look up toolCall.name inside toolsRegistry.
  // If it exists, invoke it with toolCall.args and return the result!
  
}

console.log(executeToolCall({ name: "getWeather", args: { city: "Nairobi" } }));
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: "AI Agents take real-world actions through Function Calling. The LLM produces a `{ name, args }` JSON object. Complete `executeToolCall` to dynamically invoke the corresponding handler from `toolsRegistry`!",
          file: 'index.js',
          highlightLine: 10,
          isChallengeStop: true,
          codeSnapshot: `function executeToolCall(toolCall) {
  // Dynamically dispatch toolCall.name with toolCall.args
}`
        }
      ],
      challengeSpec: {
        prompt: "Look up `toolsRegistry[toolCall.name]`, verify it exists, and return the result of calling it with `toolCall.args`.",
        targetFile: 'index.js',
        conceptsTested: ['dynamic-dispatch', 'tool-calling'],
        evaluateSubmission(code) {
          const accessesRegistry = /toolsRegistry\[.*\]/.test(code);
          const passesArgs = /toolCall\.args/.test(code);
          if (!accessesRegistry) {
            return { passed: false, socraticHint: "How do you dynamically look up a property on `toolsRegistry` using `toolCall.name`?" };
          }
          if (!passesArgs) {
            return { passed: false, socraticHint: "What arguments object from `toolCall` should you supply when invoking the tool function?" };
          }
          return { passed: true, socraticPraise: "Spot on! That dynamic registry pattern is the exact backbone of every agent tool-calling loop." };
        }
      }
    },

    {
      id: 'ai-react-agent-loop',
      title: '6. Autonomous ReAct Agent Loop (Thought, Action, Observation)',
      category: 'Agentic Workflows',
      status: 'locked',
      isDetour: false,
      conceptTag: 'react-agent-loop',
      description: 'Implement the canonical Reasoning + Acting loop that iteratively invokes tools until reaching a Final Answer.',
      initialFiles: {
        'package.json': `{
  "name": "ai-react-agent",
  "type": "module",
  "scripts": { "start": "node index.js" }
}`,
        'index.js': `// ==========================================================
// AI ENGINEER LEVEL 6: Autonomous ReAct Agent Loop
// ==========================================================

function runReActLoop(stepsList) {
  // 👇 YOUR TURN: Iterate through stepsList.
  // If step.action exists, record the observation "Executed: " + step.action
  // When you encounter step.finalAnswer, immediately return step.finalAnswer!
  
}

const mockAgentTrajectory = [
  { thought: "Need user account status.", action: "checkUser(101)" },
  { thought: "Account is active.", action: "fetchUsage(101)" },
  { thought: "All data gathered.", finalAnswer: "User 101 has 85 remaining API credits." }
];

const answer = runReActLoop(mockAgentTrajectory);
console.log("Agent Resolution:", answer);
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: "ReAct (Reasoning + Acting) is the algorithmic engine behind Devin, Claude artifacts, and modern autonomous coders. Complete `runReActLoop` to process actions and stop when reaching `finalAnswer`!",
          file: 'index.js',
          highlightLine: 4,
          isChallengeStop: true,
          codeSnapshot: `function runReActLoop(stepsList) {
  // Process thought, action, observation until finalAnswer
}`
        }
      ],
      challengeSpec: {
        prompt: "Iterate through `stepsList`. When `step.finalAnswer` is present, return it immediately.",
        targetFile: 'index.js',
        conceptsTested: ['react-loop', 'agentic-termination'],
        evaluateSubmission(code) {
          const checksFinal = /finalAnswer/.test(code);
          const hasLoop = /for|while|find|forEach/.test(code);
          if (!hasLoop) {
            return { passed: false, socraticHint: "Use a loop (e.g. `for (const step of stepsList)`) to inspect each agent action step." };
          }
          if (!checksFinal) {
            return { passed: false, socraticHint: "Make sure you check if `step.finalAnswer` is defined and return it to complete the loop." };
          }
          return { passed: true, socraticPraise: "Brilliant! That termination condition is what keeps autonomous agents from infinite loops." };
        }
      }
    },

    {
      id: 'ai-context-compaction-kv',
      title: '7. Context Window Compaction & Sliding-Window Memory',
      category: 'Context Engineering & Memory',
      status: 'locked',
      isDetour: false,
      conceptTag: 'context-compaction',
      description: 'Prune chat history to avoid token context limits while permanently preserving the System Instruction.',
      initialFiles: {
        'package.json': `{
  "name": "ai-context-compactor",
  "type": "module",
  "scripts": { "start": "node index.js" }
}`,
        'index.js': `// ==========================================================
// AI ENGINEER LEVEL 7: Context Window Sliding Compaction
// ==========================================================

function compactConversation(messages, maxRecentTurns = 2) {
  // 👇 YOUR TURN:
  // 1. Extract the permanent system message (messages[0]).
  // 2. Take only the last 'maxRecentTurns' messages from the rest of the conversation.
  // 3. Return a clean array: [systemMessage, ...recentTurns]
  
}

const longChat = [
  { role: 'system', content: 'You are Upskill Agent.' },
  { role: 'user', content: 'Turn 1' },
  { role: 'assistant', content: 'Reply 1' },
  { role: 'user', content: 'Turn 2' },
  { role: 'assistant', content: 'Reply 2' },
  { role: 'user', content: 'Turn 3 (Latest)' }
];

const compacted = compactConversation(longChat, 2);
console.log("Compacted Message Count (Should be 3):", compacted.length);
console.log("First Role:", compacted[0].role);
console.log("Latest Message:", compacted[compacted.length - 1].content);
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: "Long agent trajectories quickly blow past the 128k or 200k token limit. Production systems use sliding context compaction to preserve the system prompt while pruning stale intermediate turns. Complete `compactConversation`!",
          file: 'index.js',
          highlightLine: 4,
          isChallengeStop: true,
          codeSnapshot: `function compactConversation(messages, maxRecentTurns = 2) {
  // Preserve system prompt + last N turns
}`
        }
      ],
      challengeSpec: {
        prompt: "Return an array containing `messages[0]` followed by the last `maxRecentTurns` messages from `messages.slice(1)`.",
        targetFile: 'index.js',
        conceptsTested: ['sliding-context-window', 'memory-management'],
        evaluateSubmission(code) {
          const accessesSystem = /messages\[0\]/.test(code);
          const usesSlice = /slice/.test(code);
          if (!accessesSystem) {
            return { passed: false, socraticHint: "Did you extract the system prompt from `messages[0]` so it is never pruned?" };
          }
          if (!usesSlice) {
            return { passed: false, socraticHint: "Use `.slice(-maxRecentTurns)` on the conversation turns to capture only the most recent messages." };
          }
          return { passed: true, socraticPraise: "Excellent! You now know how ChatGPT and Claude maintain active sessions across hundreds of turns." };
        }
      }
    },

    {
      id: 'ai-evals-guardrails',
      title: '8. LLM-as-a-Judge Evaluation & Hallucination Guardrails',
      category: 'LLMOps & Evaluation',
      status: 'locked',
      isDetour: false,
      conceptTag: 'llm-evals',
      description: 'Build an automated evaluation assertion harness verifying factual containment and blocking toxic or hallucinated outputs.',
      initialFiles: {
        'package.json': `{
  "name": "ai-evals-harness",
  "type": "module",
  "scripts": { "start": "node index.js" }
}`,
        'index.js': `// ==========================================================
// AI ENGINEER LEVEL 8 (PRO): Automated LLM Evaluation Harness
// ==========================================================

function evaluateOutput(llmResponse, requiredFacts, bannedTerms = []) {
  // 👇 YOUR TURN:
  // 1. Check if ANY bannedTerm appears in llmResponse (if so, return { passed: false, reason: 'GUARDRAIL_BREACH' }).
  // 2. Count how many requiredFacts are contained in llmResponse.
  // 3. If factCoverage === 100%, return { passed: true, score: 100 }. Otherwise return { passed: false, score }.
  
}

const testResponse = "Vector search uses Euclidean distance and HNSW graph indexing.";
const required = ["Euclidean distance", "HNSW"];
const banned = ["hallucination_token", "fake_concept"];

const evalResult = evaluateOutput(testResponse, required, banned);
console.log("Evaluation Passed:", evalResult.passed);
console.log("Score:", evalResult.score);
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: "The final step to becoming a Senior AI Engineer is Evals. You cannot ship LLMs to production without deterministic assertion harnesses and guardrail validators. Complete `evaluateOutput` to certify your AI engineering mastery!",
          file: 'index.js',
          highlightLine: 4,
          isChallengeStop: true,
          codeSnapshot: `function evaluateOutput(llmResponse, requiredFacts, bannedTerms = []) {
  // Validate facts and enforce guardrails
}`
        }
      ],
      challengeSpec: {
        prompt: "Verify that all `requiredFacts` are included in `llmResponse` and that zero `bannedTerms` are present. Return `{ passed, score }`.",
        targetFile: 'index.js',
        conceptsTested: ['llm-evals', 'guardrail-enforcement'],
        evaluateSubmission(code) {
          const checksBanned = /bannedTerms|some|includes/.test(code);
          const checksFacts = /requiredFacts|every|filter/.test(code);
          if (!checksBanned) {
            return { passed: false, socraticHint: "Make sure you check whether `llmResponse` contains any forbidden term from `bannedTerms`." };
          }
          if (!checksFacts) {
            return { passed: false, socraticHint: "Calculate how many of the `requiredFacts` appear in `llmResponse` using `.includes()`." };
          }
          return { passed: true, socraticPraise: "Congratulations! You have completed the AI Engineer Pathway from Scratch to Pro!" };
        }
      }
    }
  ]
};

export const SOFTWARE_ENGINEER_TRACK = {
  id: 'software-engineer',
  title: 'Software Engineer: Scratch to Pro (roadmap.sh/software-architect)',
  subtitle: 'Data Structures, Concurrency, Distributed Rate Limiting, Circuit Breakers & Outbox Architecture',
  icon: 'Layers',
  nodes: [
    {
      id: 'se-dsa-hash-lru-cache',
      title: '1. Memory Layout, Hash Tables & LRU Cache Eviction',
      category: 'Data Structures & Memory',
      status: 'in-progress',
      isDetour: false,
      conceptTag: 'lru-cache',
      description: 'Implement an O(1) Least Recently Used (LRU) Cache supporting get() recency updates and capacity overflow evictions.',
      initialFiles: {
        'package.json': `{
  "name": "se-lru-cache",
  "type": "module",
  "scripts": { "start": "node index.js" }
}`,
        'index.js': `// ==========================================================
// SOFTWARE ENGINEER LEVEL 1: Least Recently Used (LRU) Cache
// ==========================================================

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    // 👇 YOUR TURN: If key doesn't exist, return -1.
    // Otherwise, refresh its recency in the Map and return value!
    
  }

  put(key, value) {
    // 👇 YOUR TURN: If key exists, delete it first to update position.
    // If size exceeds capacity, evict the oldest key (Map.prototype.keys().next().value).
    // Set the new key-value pair!
    
  }
}

const lru = new LRUCache(2);
lru.put("a", 1);
lru.put("b", 2);
console.log("Get 'a':", lru.get("a")); // 1 (refreshes recency)
lru.put("c", 3); // evicts 'b'
console.log("Get 'b' (Should be -1):", lru.get("b"));
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: "Welcome to the Software Engineer Pathway! High-performance systems rely on predictable caching. In JavaScript, `Map` retains insertion order, enabling an O(1) LRU cache. Implement `get` and `put` with capacity eviction!",
          file: 'index.js',
          highlightLine: 9,
          isChallengeStop: true,
          codeSnapshot: `class LRUCache {
  // Complete get(key) and put(key, value)
}`
        }
      ],
      challengeSpec: {
        prompt: "Complete `get(key)` to refresh key position and `put(key, value)` to evict the oldest key when `cache.size > capacity`.",
        targetFile: 'index.js',
        conceptsTested: ['lru-cache', 'hash-map-ordering'],
        evaluateSubmission(code) {
          const hasDelete = /\.delete/.test(code);
          const hasSet = /\.set/.test(code);
          const checksCapacity = /capacity/.test(code);
          if (!hasDelete || !hasSet) {
            return { passed: false, socraticHint: "To refresh recency in a JavaScript Map, delete the key before re-setting it with `this.cache.set()`." };
          }
          if (!checksCapacity) {
            return { passed: false, socraticHint: "In `put()`, did you check if `this.cache.size > this.capacity` and delete the first entry?" };
          }
          return { passed: true, socraticPraise: "Spot on! That O(1) LRU cache is the fundamental building block of database buffer pools and Redis." };
        }
      }
    },

    {
      id: 'se-concurrency-event-loop',
      title: '2. Asynchronous Concurrency Pools & Promise Limiting',
      category: 'Concurrency & Runtimes',
      status: 'locked',
      isDetour: false,
      conceptTag: 'async-concurrency',
      description: 'Build a concurrency pool that processes asynchronous tasks with a strict concurrency ceiling (p-limit pattern).',
      initialFiles: {
        'package.json': `{
  "name": "se-concurrency-pool",
  "type": "module",
  "scripts": { "start": "node index.js" }
}`,
        'index.js': `// ==========================================================
// SOFTWARE ENGINEER LEVEL 2: Async Concurrency Ceiling (p-limit)
// ==========================================================

function createConcurrencyLimiter(concurrencyLimit) {
  let activeCount = 0;
  const queue = [];

  const next = () => {
    if (activeCount < concurrencyLimit && queue.length > 0) {
      activeCount++;
      const task = queue.shift();
      task().finally(() => {
        activeCount--;
        next();
      });
    }
  };

  return function enqueue(fn) {
    // 👇 YOUR TURN: Return a new Promise that pushes an async execution wrapper
    // to 'queue' and calls 'next()' to trigger execution!
    
  };
}

const limit = createConcurrencyLimiter(2);
const job = (id, ms) => () => new Promise(res => setTimeout(() => {
  console.log(\`Job \${id} completed\`);
  res(id);
}, ms));

Promise.all([
  limit(job(1, 100)),
  limit(job(2, 50)),
  limit(job(3, 80))
]).then(() => console.log("All concurrency jobs finished!"));
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: "Firing 1,000 parallel async requests crashes databases and triggers upstream rate limits. Production engineers use concurrency pools to throttle execution. Implement `enqueue` to queue and execute tasks up to `concurrencyLimit`!",
          file: 'index.js',
          highlightLine: 18,
          isChallengeStop: true,
          codeSnapshot: `return function enqueue(fn) {
  // Wrap fn in a Promise, queue it, and invoke next()
}`
        }
      ],
      challengeSpec: {
        prompt: "In `enqueue(fn)`, return a new Promise, push a task to `queue` that runs `fn()` and resolves/rejects the outer Promise, then call `next()`.",
        targetFile: 'index.js',
        conceptsTested: ['promise-queue', 'concurrency-control'],
        evaluateSubmission(code) {
          const returnsPromise = /new Promise/.test(code);
          const callsNext = /next\(\)/.test(code);
          if (!returnsPromise) {
            return { passed: false, socraticHint: "Each queued item should return a `new Promise((resolve, reject) => ...)`." };
          }
          if (!callsNext) {
            return { passed: false, socraticHint: "Don't forget to invoke `next()` after pushing the task into `queue` so execution begins." };
          }
          return { passed: true, socraticPraise: "Brilliant! You just built the core architecture of the popular `p-limit` npm package." };
        }
      }
    },

    {
      id: 'se-distributed-rate-limiter',
      title: '3. Distributed Token Bucket with Atomic Key Expiration',
      category: 'Distributed Systems',
      status: 'locked',
      isDetour: false,
      conceptTag: 'distributed-rate-limiting',
      description: 'Implement an in-memory token bucket rate limiter with timestamp-based token replenishment to withstand concurrent bursts.',
      initialFiles: {
        'package.json': `{
  "name": "se-token-bucket",
  "type": "module",
  "scripts": { "start": "node index.js" }
}`,
        'index.js': `// ==========================================================
// SOFTWARE ENGINEER LEVEL 3: Atomic Token Bucket Rate Limiter
// ==========================================================

class TokenBucket {
  constructor(capacity, refillRatePerSec) {
    this.capacity = capacity;
    this.refillRate = refillRatePerSec;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  refill() {
    const now = Date.now();
    const elapsedSec = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.refillRate);
    this.lastRefill = now;
  }

  consume(tokensToTake = 1) {
    // 👇 YOUR TURN:
    // 1. Refill tokens based on elapsed time.
    // 2. If this.tokens >= tokensToTake, subtract tokensToTake and return true.
    // 3. Otherwise return false (rate limited)!
    
  }
}

const bucket = new TokenBucket(3, 1);
console.log("Req 1 (Allowed):", bucket.consume(1));
console.log("Req 2 (Allowed):", bucket.consume(1));
console.log("Req 3 (Allowed):", bucket.consume(1));
console.log("Req 4 (Should be false):", bucket.consume(1));
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: "Unlike fixed window counters that allow 2x traffic spikes at window boundaries, the Token Bucket smoothly refills tokens over time. Implement `consume` to replenish tokens and enforce request boundaries!",
          file: 'index.js',
          highlightLine: 18,
          isChallengeStop: true,
          codeSnapshot: `consume(tokensToTake = 1) {
  // Refill tokens and check balance
}`
        }
      ],
      challengeSpec: {
        prompt: "In `consume()`, invoke `this.refill()`. If `this.tokens >= tokensToTake`, decrement and return `true`, else return `false`.",
        targetFile: 'index.js',
        conceptsTested: ['token-bucket', 'rate-limiting-algorithms'],
        evaluateSubmission(code) {
          const callsRefill = /this\.refill\(\)/.test(code);
          const checksTokens = /this\.tokens\s*>=/.test(code);
          if (!callsRefill) {
            return { passed: false, socraticHint: "Make sure you call `this.refill()` before checking the token balance." };
          }
          if (!checksTokens) {
            return { passed: false, socraticHint: "Did you verify that `this.tokens >= tokensToTake` before deducting tokens?" };
          }
          return { passed: true, socraticPraise: "Excellent! This continuous refill calculation is the exact algorithm used in AWS API Gateway and Cloudflare." };
        }
      }
    },

    {
      id: 'se-circuit-breaker-retry',
      title: '4. System Fault Tolerance: Circuit Breaker & Exponential Jitter',
      category: 'System Resilience',
      status: 'locked',
      isDetour: false,
      conceptTag: 'circuit-breaker',
      description: 'Implement the Circuit Breaker pattern with CLOSED, OPEN, and HALF_OPEN states to isolate failing downstream services.',
      initialFiles: {
        'package.json': `{
  "name": "se-circuit-breaker",
  "type": "module",
  "scripts": { "start": "node index.js" }
}`,
        'index.js': `// ==========================================================
// SOFTWARE ENGINEER LEVEL 4: Circuit Breaker Pattern
// ==========================================================

class CircuitBreaker {
  constructor(failureThreshold = 3, resetTimeoutMs = 1000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeoutMs;
    this.state = 'CLOSED'; // 'CLOSED' | 'OPEN' | 'HALF_OPEN'
    this.failureCount = 0;
    this.nextAttempt = Date.now();
  }

  async execute(action) {
    // 👇 YOUR TURN:
    // 1. If state === 'OPEN' and Date.now() > this.nextAttempt, transition state to 'HALF_OPEN'.
    // 2. If state === 'OPEN' (and not ready), throw new Error('CIRCUIT_OPEN').
    // 3. Try action(): On success, reset failures to 0 and set state to 'CLOSED'.
    // 4. On catch: Increment failures. If failures >= failureThreshold, set state to 'OPEN' and nextAttempt = Date.now() + resetTimeout.
    
  }
}

const breaker = new CircuitBreaker(2, 500);
const failingService = async () => { throw new Error("Service unavailable"); };

(async () => {
  try { await breaker.execute(failingService); } catch (e) {}
  try { await breaker.execute(failingService); } catch (e) {}
  console.log("Breaker State (Should be OPEN):", breaker.state);
})();
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: "When a microservice goes down, hammering it with retries creates a cascading outage. A Circuit Breaker 'trips' open to fail fast, shielding the backend until it recovers. Complete `execute` to implement the 3-state machine!",
          file: 'index.js',
          highlightLine: 14,
          isChallengeStop: true,
          codeSnapshot: `async execute(action) {
  // Handle CLOSED, OPEN, and HALF_OPEN transitions
}`
        }
      ],
      challengeSpec: {
        prompt: "Implement the Circuit Breaker state machine: reject when `OPEN`, reset on success in `HALF_OPEN`, and trip to `OPEN` when failures reach threshold.",
        targetFile: 'index.js',
        conceptsTested: ['circuit-breaker', 'fault-tolerance'],
        evaluateSubmission(code) {
          const checksOpen = /'OPEN'/.test(code);
          const checksHalfOpen = /'HALF_OPEN'/.test(code);
          const handlesTryCatch = /try\s*\{[\s\S]*\}\s*catch/.test(code);
          if (!checksOpen || !checksHalfOpen) {
            return { passed: false, socraticHint: "Be sure to handle the transition to 'HALF_OPEN' when the reset timeout has elapsed, and 'OPEN' when threshold is reached." };
          }
          if (!handlesTryCatch) {
            return { passed: false, socraticHint: "Wrap `await action()` in a try/catch block to intercept downstream errors and increment `this.failureCount`." };
          }
          return { passed: true, socraticPraise: "Spot on! That resilience pattern prevents cascading cluster failures in microservices." };
        }
      }
    },

    {
      id: 'se-event-driven-outbox',
      title: '5. Event-Driven Microservices & Transactional Outbox Pattern',
      category: 'Distributed Architecture',
      status: 'locked',
      isDetour: false,
      conceptTag: 'transactional-outbox',
      description: 'Ensure atomic consistency between relational database transactions and asynchronous message broker events.',
      initialFiles: {
        'package.json': `{
  "name": "se-outbox-pattern",
  "type": "module",
  "scripts": { "start": "node index.js" }
}`,
        'index.js': `// ==========================================================
// SOFTWARE ENGINEER LEVEL 5: Transactional Outbox Pattern
// ==========================================================

function createOrderWithOutbox(db, orderData) {
  // 👇 YOUR TURN: In distributed systems, publishing directly to Kafka/RabbitMQ
  // can fail after DB commits, leading to data divergence.
  // Solve this with the Outbox pattern:
  // 1. Insert orderData into db.orders
  // 2. Insert outbox record into db.outbox: { eventType: 'ORDER_CREATED', payload: orderData, published: false }
  // 3. Return { orderId: orderData.id, status: 'COMMITTED_WITH_OUTBOX' }
  
}

const mockDb = { orders: [], outbox: [] };
const result = createOrderWithOutbox(mockDb, { id: "ord-9921", total: 450.0 });
console.log("Order Saved:", mockDb.orders.length);
console.log("Outbox Queued:", mockDb.outbox.length);
console.log("Event Type:", mockDb.outbox[0]?.eventType);
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: "The dual-write problem is the #1 cause of data corruption in microservices. If you save to Postgres and publish to Kafka, one can fail while the other succeeds. The Transactional Outbox saves both in a single database transaction. Complete `createOrderWithOutbox`!",
          file: 'index.js',
          highlightLine: 4,
          isChallengeStop: true,
          codeSnapshot: `function createOrderWithOutbox(db, orderData) {
  // Atomically write order and outbox event
}`
        }
      ],
      challengeSpec: {
        prompt: "Push `orderData` to `db.orders` and an event object with `eventType: 'ORDER_CREATED'` and `published: false` to `db.outbox`.",
        targetFile: 'index.js',
        conceptsTested: ['transactional-outbox', 'dual-write-problem'],
        evaluateSubmission(code) {
          const pushesOrders = /db\.orders\.push/.test(code);
          const pushesOutbox = /db\.outbox\.push/.test(code);
          const hasEventType = /eventType/.test(code);
          if (!pushesOrders || !pushesOutbox) {
            return { passed: false, socraticHint: "Make sure you push `orderData` into `db.orders` and the outbox event into `db.outbox`." };
          }
          if (!hasEventType) {
            return { passed: false, socraticHint: "The outbox record must include an `eventType: 'ORDER_CREATED'` identifier for consumer dispatchers." };
          }
          return { passed: true, socraticPraise: "Excellent! That outbox pattern is the industry standard for reliable event-driven systems (Debezium / Kafka Connect)." };
        }
      }
    },

    {
      id: 'se-observability-tracing',
      title: '6. Distributed Tracing & W3C TraceContext Propagation',
      category: 'Production Engineering & SRE',
      status: 'locked',
      isDetour: false,
      conceptTag: 'distributed-tracing',
      description: 'Inject and propagate W3C traceparent headers across distributed microservices for end-to-end latency observability.',
      initialFiles: {
        'package.json': `{
  "name": "se-distributed-tracing",
  "type": "module",
  "scripts": { "start": "node index.js" }
}`,
        'index.js': `// ==========================================================
// SOFTWARE ENGINEER LEVEL 6 (PRO): W3C TraceContext Propagation
// ==========================================================

function injectTraceparent(headers = {}, traceId, spanId) {
  // 👇 YOUR TURN:
  // W3C TraceContext specification format:
  // 'version-traceid-parentid-traceflags'
  // Version is '00', traceflags is '01' (sampled).
  // Set headers['traceparent'] = \`00-\${traceId}-\${spanId}-01\`
  // Return the mutated headers object!
  
}

const traceId = "4bf92f3577b34da6a3ce929d0e0e4736";
const spanId = "00f067aa0ba902b7";

const outgoingHeaders = injectTraceparent({ "Content-Type": "application/json" }, traceId, spanId);
console.log("Injected traceparent:", outgoingHeaders["traceparent"]);
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: "In microservice architectures, debugging a slow request requires tracking its journey across 20 servers. The W3C TraceContext standard defines how services propagate trace and span IDs in HTTP headers. Complete `injectTraceparent` to master distributed observability!",
          file: 'index.js',
          highlightLine: 4,
          isChallengeStop: true,
          codeSnapshot: `function injectTraceparent(headers = {}, traceId, spanId) {
  // Format W3C traceparent header: 00-traceid-spanid-01
}`
        }
      ],
      challengeSpec: {
        prompt: "Set `headers['traceparent'] = \`00-\${traceId}-\${spanId}-01\`` and return `headers`.",
        targetFile: 'index.js',
        conceptsTested: ['distributed-tracing', 'w3c-trace-context', 'opentelemetry'],
        evaluateSubmission(code) {
          const setsTraceparent = /traceparent/.test(code);
          const formatsHeader = /00-.*-01/.test(code);
          if (!setsTraceparent) {
            return { passed: false, socraticHint: "Did you set the `traceparent` key on the `headers` object?" };
          }
          if (!formatsHeader) {
            return { passed: false, socraticHint: "Ensure the format strictly adheres to the W3C standard: `00-${traceId}-${spanId}-01`." };
          }
          return { passed: true, socraticPraise: "Congratulations! You have completed the Software Engineer Pathway from Scratch to Pro!" };
        }
      }
    }
  ]
};

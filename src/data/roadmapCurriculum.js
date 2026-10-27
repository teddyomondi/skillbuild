// Dynamic Roadmap.sh Curriculum & Adaptive Detour Engine
// Provides canonical roadmap.sh tracks AND dynamically injects detour nodes when the AI detects conceptual gaps.
// Uses `node-html-parser` for real HTML DOM querying and `acorn` + `acorn-walk` for JS AST inspection.

import { parse as parseHtml } from 'node-html-parser';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import { REDUZER_SOFTWARE_DEV_TRACK } from './reduzerCurriculum.js';
import { AI_ENGINEER_TRACK, SOFTWARE_ENGINEER_TRACK } from './aiAndSoftwarePathways.js';
import { MATHEMATICS_SCRATCH_TO_PRO_TRACK, MIT_VECTOR_CALCULUS_TRACK } from './mathCurriculum.js';

export const ROADMAP_TRACKS = [
  REDUZER_SOFTWARE_DEV_TRACK,
  {
    id: 'frontend',
    title: 'Frontend Developer (roadmap.sh/frontend)',
    subtitle: 'Semantic HTML, Modern CSS, DOM & Interactive JavaScript',
    icon: 'Layout',
    nodes: [
      {
        id: 'html-semantic-structure',
        title: '1. Semantic HTML & Page Structure',
        category: 'HTML Foundations',
        status: 'in-progress',
        isDetour: false,
        conceptTag: 'semantic-html',
        description: 'Build a clean, accessible profile card using semantic HTML elements (<main>, <h1>, <p>, and <button>).',
        initialFiles: {
          'index.html': `<!-- LESSON 1: Semantic HTML Foundations -->
<main class="card">
  <span class="badge">HTML Foundations</span>
  <h1>Welcome to Upskill</h1>
</main>
`,
          'styles.css': `body {
  background: #0f172a;
  color: #f8fafc;
  font-family: system-ui, sans-serif;
  padding: 1.5rem;
}
.card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
}
.badge {
  display: inline-block;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  background: #0284c7;
  font-size: 0.75rem;
  font-weight: 600;
}
h1 {
  margin: 0.75rem 0 0.5rem;
  font-size: 1.4rem;
}
p {
  color: #cbd5e1;
  line-height: 1.5;
  margin-bottom: 1rem;
}
button {
  background: #10b981;
  color: #022c22;
  border: none;
  border-radius: 8px;
  padding: 0.55rem 1.1rem;
  font-weight: 700;
  cursor: pointer;
}
`
        },
        aiTimeline: [
          {
            timeOffset: 0,
            narration: "Welcome to HTML Foundations! Every web page starts with clean, semantic HTML tags that describe the meaning of your content.",
            file: 'index.html',
            highlightLine: 2,
            codeSnapshot: `<!-- LESSON 1: Semantic HTML Foundations -->
<main class="card">
  <span class="badge">Developer Profile</span>
`
          },
          {
            timeOffset: 3200,
            narration: "Inside our `<main>` container, I'm adding an `<h1>` heading tag for the main title of the card.",
            file: 'index.html',
            highlightLine: 4,
            codeSnapshot: `<!-- LESSON 1: Semantic HTML Foundations -->
<main class="card">
  <span class="badge">Developer Profile</span>
  <h1>Ada Lovelace</h1>
`
          },
          {
            timeOffset: 6500,
            narration: "Now it's your turn! Right below the `<h1>` heading, add a `<p>` paragraph describing Ada's role, and a `<button>` element with text like Follow or Connect.",
            file: 'index.html',
            highlightLine: 6,
            isChallengeStop: true,
            codeSnapshot: `<!-- LESSON 1: Semantic HTML Foundations -->
<main class="card">
  <span class="badge">Developer Profile</span>
  <h1>Ada Lovelace</h1>
  <!-- 👇 YOUR TURN: Add a <p> paragraph and a <button> below! -->
  
</main>
`
          }
        ],
        challengeSpec: {
          prompt: "Inside `<main class=\"card\">`, add a `<p>...</p>` paragraph element and a `<button>...</button>` element right below `<h1>Ada Lovelace</h1>`.",
          targetFile: 'index.html',
          conceptsTested: ['semantic-html', 'html-tags', 'closing-tags'],
          evaluateSubmission(code) {
            const root = parseHtml(code || '');
            const hasMain = Boolean(root.querySelector('main'));
            const hasH1 = Boolean(root.querySelector('main h1') || root.querySelector('h1'));
            const pEl = root.querySelector('main p') || root.querySelector('p');
            const hasP = Boolean(pEl && pEl.text.trim().length > 0);
            const btnEl = root.querySelector('main button') || root.querySelector('button');
            const hasButton = Boolean(btnEl && btnEl.text.trim().length > 0);
            const usesDivButton = Boolean(root.querySelector('div.button') || root.querySelector('div[role="button"]'));

            if (usesDivButton && !hasButton) {
              return {
                passed: false,
                detectedGap: 'semantic-button-vs-div',
                detourNode: {
                  id: 'detour-semantic-button',
                  title: 'Semantic `<button>` vs Generic `<div>`',
                  category: 'Personalized Next Module',
                  status: 'in-progress',
                  isDetour: true,
                  conceptTag: 'semantic-button-vs-div',
                  reason: 'Added as your next module to practice accessible interactive HTML elements.',
                  description: 'Why real `<button>` tags provide built-in keyboard navigation and screen-reader support compared to `<div>`.',
                  initialFiles: {
                    'index.html': `<!-- PERSONALIZED MODULE: Semantic Buttons -->
<main class="card">
  <h2>Newsletter Signup</h2>
  <!-- Replace this div with a semantic <button> element: -->
  <div class="button">Subscribe Now</div>
</main>
`
                  },
                  aiTimeline: [
                    {
                      timeOffset: 0,
                      narration: "Using a `<div>` for a clickable button prevents keyboard users from focusing it with Tab. Replace the `<div>` on line 5 with a real `<button>` tag!",
                      file: 'index.html',
                      highlightLine: 5,
                      isChallengeStop: true,
                      codeSnapshot: `<!-- PERSONALIZED MODULE: Semantic Buttons -->
<main class="card">
  <h2>Newsletter Signup</h2>
  <!-- 👇 Replace this div with <button>Subscribe Now</button> -->
  <div class="button">Subscribe Now</div>
</main>
`
                    }
                  ],
                  challengeSpec: {
                    prompt: "Replace `<div class=\"button\">Subscribe Now</div>` with a semantic `<button>Subscribe Now</button>` element.",
                    targetFile: 'index.html',
                    conceptsTested: ['semantic-button-vs-div'],
                    evaluateSubmission(detourCode) {
                      if (/<button[\s>][\s\S]+?<\/button>/i.test(detourCode)) {
                        return {
                          passed: true,
                          socraticPraise: "Awesome! Using a real `<button>` makes your HTML immediately accessible to keyboards and assistive technologies."
                        };
                      }
                      return {
                        passed: false,
                        socraticHint: "Look at line 5: how can you change `<div class=\"button\">...</div>` into `<button>...</button>`?"
                      };
                    }
                  }
                },
                socraticHint: "I see you used a `<div>` for the button! In HTML, which dedicated tag gives us a real, keyboard-accessible button without needing a `<div>`?"
              };
            }

            if (!hasP) {
              return {
                passed: false,
                socraticHint: "Let's start with the bio text right under `<h1>Ada Lovelace</h1>`. How do you write an opening `<p>` tag, some text inside it, and a closing `</p>` tag on line 6?"
              };
            }

            if (!hasButton) {
              return {
                passed: false,
                socraticHint: "Great job adding the `<p>` paragraph! Next, right below your `</p>` tag, how can you add a `<button>...</button>` element with a label inside it?"
              };
            }

            if (!hasMain || !hasH1) {
              return {
                passed: false,
                socraticHint: "Make sure your `<p>` and `<button>` are placed inside the `<main class=\"card\">...</main>` container right below `<h1>Ada Lovelace</h1>`."
              };
            }

            return {
              passed: true,
              socraticPraise: "Well done! You structured a semantic HTML card with `<main>`, `<h1>`, `<p>`, and `<button>`."
            };
          }
        }
      },
      {
        id: 'html-links-lists',
        title: '2. HTML Lists & Hyperlinks (`<ul>`, `<li>`, `<a>`)',
        category: 'HTML Foundations',
        status: 'locked',
        isDetour: false,
        conceptTag: 'html-lists-links',
        description: 'Structure navigation menus and resource lists using unordered lists (`<ul>`, `<li>`) and anchor tags (`<a href="...">`).',
        initialFiles: {
          'index.html': `<!-- LESSON 2: HTML Lists & Anchor Links -->
<nav class="card">
  <h2>Learning Resources</h2>
  <ul>
    <li><a href="https://developer.mozilla.org">MDN Web Docs</a></li>
    <!-- Add a second <li> with an <a> link below! -->
  </ul>
</nav>
`,
          'styles.css': `body {
  background: #0f172a;
  color: #f8fafc;
  font-family: system-ui, sans-serif;
  padding: 1.5rem;
}
.card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
}
ul {
  padding-left: 1.25rem;
  line-height: 1.9;
}
a {
  color: #38bdf8;
  text-decoration: underline;
}
`
        },
        aiTimeline: [
          {
            timeOffset: 0,
            narration: "In Module 2, we combine unordered lists `<ul>` with list items `<li>` and anchor tags `<a>` to create clickable links.",
            file: 'index.html',
            highlightLine: 5,
            isChallengeStop: true,
            codeSnapshot: `<!-- LESSON 2: HTML Lists & Anchor Links -->
<nav class="card">
  <h2>Learning Resources</h2>
  <ul>
    <li><a href="https://developer.mozilla.org">MDN Web Docs</a></li>
    <!-- 👇 YOUR TURN: Add a second <li> containing an <a href="..."> link below! -->
    
  </ul>
</nav>
`
          }
        ],
        challengeSpec: {
          prompt: "Inside the `<ul>`, add a second `<li>` item containing an `<a href=\"...\">...</a>` link.",
          targetFile: 'index.html',
          conceptsTested: ['html-lists', 'html-links', 'href-attribute'],
          evaluateSubmission(code) {
            const root = parseHtml(code || '');
            const liMatches = root.querySelectorAll('ul li');
            const aMatches = root.querySelectorAll('ul li a[href]').filter(
              (a) => (a.getAttribute('href') || '').trim().length > 0 && a.text.trim().length > 0
            );

            if (liMatches.length < 2) {
              return {
                passed: false,
                socraticHint: "Right now there is only one `<li>...</li>` item inside `<ul>`. How can you add a second `<li>...</li>` on line 7?"
              };
            }
            if (aMatches.length < 2) {
              return {
                passed: false,
                socraticHint: "Nice second `<li>`! Now place an `<a href=\"https://...\">Link Text</a>` anchor tag inside that `<li>`—remember to include the `href` attribute!"
              };
            }
            return {
              passed: true,
              socraticPraise: "Spot on! You built a semantic list of links using `<ul>`, `<li>`, and `<a href=\"...\">`."
            };
          }
        }
      },
      {
        id: 'js-closures-state',
        title: '3. Lexical Scope & Closures (State Encapsulation)',
        category: 'JavaScript Core',
        status: 'in-progress',
        isDetour: false,
        conceptTag: 'closures',
        description: 'Understand how inner functions retain access to their outer lexical scope even after the outer function returns—the foundation of hooks and private state.',
        initialFiles: {
          'package.json': `{
  "name": "scrimba-Closure-lab",
  "type": "module",
  "scripts": {
    "start": "node index.js",
    "test": "node test.js"
  }
}`,
          'index.js': `// ==========================================================
// LESSON 1: Lexical Scope & Closures (roadmap.sh/frontend)
// Watch the AI Tutor write the foundation, or fork at any time!
// ==========================================================

function createCounter(initialValue = 0) {
  let count = initialValue;

  return {
    increment() {
      count += 1;
      return count;
    }
  };
}

const counter = createCounter(10);
console.log("After increment:", counter.increment());
`,
          'styles.css': `body {
  background: #0f172a;
  color: #f8fafc;
  font-family: system-ui, sans-serif;
  padding: 1.5rem;
}
.card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
}
.badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  background: #0284c7;
  font-size: 0.75rem;
  font-weight: 600;
}
`,
          'index.html': `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="card">
    <span class="badge">Live Preview + Console</span>
    <h2>Closure State Sandbox</h2>
    <p id="output">Run your code to inspect closure state encapsulation.</p>
  </div>
</body>
</html>`
        },
        aiTimeline: [
          {
            timeOffset: 0,
            narration: "Welcome! Unlike a static video, this is a live VS Code workspace. Watch me build a stateful factory using a JavaScript Closure.",
            file: 'index.js',
            highlightLine: 6,
            codeSnapshot: `// ==========================================================
// LESSON 1: Lexical Scope & Closures (roadmap.sh/frontend)
// ==========================================================

function createWallet(startingBalance = 100) {
  // 'balance' lives inside createWallet's lexical environment.
  // Outside code CANNOT mutate 'balance' directly!
  let balance = startingBalance;
`
          },
          {
            timeOffset: 3500,
            narration: "Notice how `let balance` is private inside `createWallet`. Now I'll return an object with a `deposit` method that closes over `balance`.",
            file: 'index.js',
            highlightLine: 12,
            codeSnapshot: `// ==========================================================
// LESSON 1: Lexical Scope & Closures (roadmap.sh/frontend)
// ==========================================================

function createWallet(startingBalance = 100) {
  // 'balance' lives inside createWallet's lexical environment.
  // Outside code CANNOT mutate 'balance' directly!
  let balance = startingBalance;

  return {
    deposit(amount) {
      balance += amount;
      return balance;
    },
`
          },
          {
            timeOffset: 7500,
            narration: "Now it's your turn! Pause here: add a `withdraw(amount)` method and a `getBalance()` method inside the returned object so that `withdraw` subtracts `amount` (only if `amount <= balance`) and returns the updated `balance`. I'll check your work without giving away the answer!",
            file: 'index.js',
            highlightLine: 17,
            isChallengeStop: true,
            codeSnapshot: `// ==========================================================
// LESSON 1: Lexical Scope & Closures (roadmap.sh/frontend)
// ==========================================================

function createWallet(startingBalance = 100) {
  let balance = startingBalance;

  return {
    deposit(amount) {
      balance += amount;
      return balance;
    },
    // 👇 YOUR TURN: Implement withdraw(amount) and getBalance() below!
    
  };
}

const myWallet = createWallet(100);
console.log("Deposit 50 ->", myWallet.deposit(50));
// Uncomment or test below once you implement withdraw & getBalance:
console.log("Withdraw 30 ->", myWallet.withdraw ? myWallet.withdraw(30) : "Not implemented yet");
console.log("Final Balance ->", myWallet.getBalance ? myWallet.getBalance() : "Not implemented yet");
`
          }
        ],
        challengeSpec: {
          prompt: "Implement `withdraw(amount)` (which subtracts `amount` from `balance` if sufficient funds exist and returns `balance`) and `getBalance()` (which returns the current `balance`) inside the object returned by `createWallet`.",
          targetFile: 'index.js',
          conceptsTested: ['closures', 'object-methods', 'return-values', 'reference-vs-mutation'],
          evaluateSubmission(code, runtimeOutput) {
            let hasWithdraw = false;
            let hasGetBalance = false;
            let usesThisBalance = false;
            let mutatesBalance = false;
            let hasReturnInWithdraw = false;
            let hasReturnInGetBalance = false;

            try {
              const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
              walk.simple(ast, {
                MemberExpression(node) {
                  if (node.object?.type === 'ThisExpression' && node.property?.name === 'balance') {
                    usesThisBalance = true;
                  }
                },
                AssignmentExpression(node) {
                  if (
                    node.left?.name === 'balance' &&
                    (node.operator === '-=' || node.operator === '=')
                  ) {
                    mutatesBalance = true;
                  }
                },
                Property(node) {
                  const propName = node.key?.name || node.key?.value;
                  const fnNode = node.value;
                  if (propName === 'withdraw' && fnNode && (fnNode.type === 'FunctionExpression' || fnNode.type === 'ArrowFunctionExpression')) {
                    hasWithdraw = true;
                    walk.simple(fnNode, {
                      ReturnStatement(ret) {
                        if (ret.argument) hasReturnInWithdraw = true;
                      }
                    });
                  }
                  if (propName === 'getBalance' && fnNode && (fnNode.type === 'FunctionExpression' || fnNode.type === 'ArrowFunctionExpression')) {
                    hasGetBalance = true;
                    walk.simple(fnNode, {
                      ReturnStatement(ret) {
                        if (ret.argument) hasReturnInGetBalance = true;
                      }
                    });
                  }
                }
              });
            } catch {
              // Fallback if syntax is incomplete while typing
              hasWithdraw = /withdraw\s*\(\s*([a-zA-Z0-9_$]+)\s*\)|withdraw\s*:\s*function/.test(code);
              hasGetBalance = /getBalance\s*\(\s*\)|getBalance\s*:\s*function/.test(code);
              usesThisBalance = /this\.balance/.test(code);
              mutatesBalance = /balance\s*-=\s*|balance\s*=\s*balance\s*-/.test(code);
              hasReturnInWithdraw = /withdraw[\s\S]*?return\s+balance/.test(code);
              hasReturnInGetBalance = /getBalance[\s\S]*?return\s+balance/.test(code);
            }

            if (usesThisBalance) {
              return {
                passed: false,
                detectedGap: 'this-vs-lexical-scope',
                detourNode: {
                  id: 'detour-this-vs-closure',
                  title: 'Object Properties (`this`) vs. Lexical Scope',
                  category: 'Personalized Next Module',
                  status: 'in-progress',
                  isDetour: true,
                  conceptTag: 'this-vs-lexical-scope',
                  reason: 'Added as your next module to practice `this` vs. closure variables.',
                  description: 'Understand why `this.property` is `undefined` when a variable is declared with `let` inside a factory function.',
                  initialFiles: {
                    'index.js': `// ==========================================================
// PERSONALIZED MODULE: 'this.property' vs Lexical Variables
// ==========================================================

function createVault() {
  let secretCode = 4242; // Lexical variable (Private!)

  return {
    // Update getSecret() so it returns the lexical variable instead of this.secretCode:
    getSecret() {
      return this.secretCode;
    }
  };
}

const vault = createVault();
console.log("Vault secret is:", vault.getSecret());
`
                  },
                  aiTimeline: [
                    {
                      timeOffset: 0,
                      narration: "In our last lesson, we saw how `this.` looks for a public property on an object, whereas `let secretCode` lives in the outer function's scope. Try removing `this.` on line 11 so `getSecret()` reads `secretCode` directly!",
                      file: 'index.js',
                      highlightLine: 11,
                      isChallengeStop: true,
                      codeSnapshot: `// ==========================================================
// PERSONALIZED MODULE: 'this.property' vs Lexical Variables
// ==========================================================

function createVault() {
  let secretCode = 4242; // Lexical variable (Private!)

  return {
    // 👇 YOUR TURN: Return secretCode directly instead of this.secretCode:
    getSecret() {
      return this.secretCode;
    }
  };
}

const vault = createVault();
console.log("Vault secret is:", vault.getSecret());
`
                    }
                  ],
                  challengeSpec: {
                    prompt: "Update `getSecret()` so that it returns the lexical variable `secretCode` instead of `this.secretCode`.",
                    targetFile: 'index.js',
                    conceptsTested: ['this-vs-lexical-scope'],
                    evaluateSubmission(detourCode) {
                      if (!/this\.secretCode/.test(detourCode) && /return\s+secretCode/.test(detourCode)) {
                        return {
                          passed: true,
                          socraticPraise: "Spot on! By referencing `secretCode` directly without `this.`, JavaScript walks up the lexical scope chain into `createVault` and finds the private variable."
                        };
                      }
                      return {
                        passed: false,
                        socraticHint: "Look closely at line 11: when you write `this.secretCode`, JavaScript looks for a property attached to the returned object itself. What happens if you return `secretCode` directly?"
                      };
                    }
                  }
                },
                socraticHint: "Interesting! I see you used `this.balance`. When `balance` is declared with `let balance = ...` inside `createWallet`, is `balance` a property on the returned object (`this`), or is it a variable living in the outer function's scope? Look at how `deposit(amount)` accessed `balance` on line 10—what happens if you omit `this.`?"
              };
            }

            if (!hasWithdraw) {
              return {
                passed: false,
                detectedGap: 'js-functions-fundamentals',
                socraticHint: "Look at how `deposit` is written inside the returned object. Add a `withdraw(amount)` method beside it. What should happen to `balance` when money is taken out, and what value should `withdraw` return?"
              };
            }

            if (!mutatesBalance) {
              return {
                passed: false,
                detectedGap: 'state-mutation-in-closure',
                socraticHint: "I see your `withdraw` method! Right now, though, is `balance` actually being updated when `withdraw` runs, or is it only calculating `balance - amount` without saving it back into `balance`? Compare it to how `deposit` uses `+=`."
              };
            }

            if (!hasReturnInWithdraw) {
              return {
                passed: false,
                detectedGap: 'missing-return-value',
                detourNode: {
                  id: 'detour-implicit-undefined-return',
                  title: 'Mutating State vs. Returning Values',
                  category: 'Personalized Next Module',
                  status: 'in-progress',
                  isDetour: true,
                  conceptTag: 'return-values',
                  reason: 'Added as your next module to practice explicit return values.',
                  description: 'Understand why a function that modifies a variable still evaluates to `undefined` unless it explicitly returns a value.',
                  initialFiles: {
                    'index.js': `// ==========================================================
// PERSONALIZED MODULE: Side-Effects vs Return Values
// ==========================================================
let score = 10;

function addPoints(pts) {
  score += pts;
  // Add a return statement below so addPoints(5) hands back the updated score!
}

console.log("Returned value:", addPoints(5));
`
                  },
                  aiTimeline: [
                    {
                      timeOffset: 0,
                      narration: "Here `score += pts` updates the variable, but without a `return` statement the function hands back `undefined`. Add `return score;` on line 8!",
                      file: 'index.js',
                      highlightLine: 8,
                      isChallengeStop: true,
                      codeSnapshot: `// ==========================================================
// PERSONALIZED MODULE: Side-Effects vs Return Values
// ==========================================================
let score = 10;

function addPoints(pts) {
  score += pts;
  // 👇 YOUR TURN: Return the updated score below!
  
}

console.log("Returned value:", addPoints(5));
`
                    }
                  ],
                  challengeSpec: {
                    prompt: "Update `addPoints(pts)` so that after updating `score`, it returns the updated `score`.",
                    targetFile: 'index.js',
                    conceptsTested: ['return-values'],
                    evaluateSubmission(detourCode) {
                      if (/return\s+score/.test(detourCode)) {
                        return {
                          passed: true,
                          socraticPraise: "Exactly! Mutating a variable changes state, and `return score` hands that value back to the caller."
                        };
                      }
                      return {
                        passed: false,
                        socraticHint: "After `score += pts;` runs, what keyword tells JavaScript what value `addPoints(5)` should evaluate to?"
                      };
                    }
                  }
                },
                socraticHint: "Your `withdraw` method updates `balance`! However, when `console.log(myWallet.withdraw(30))` runs, what does `withdraw(30)` hand back to `console.log` if there is no `return` statement at the end of `withdraw`?"
              };
            }

            if (!hasGetBalance || !hasReturnInGetBalance) {
              return {
                passed: false,
                socraticHint: "`withdraw(amount)` is working nicely! Now look at the second part of the challenge: how can we add a `getBalance()` method to that same object so outside code can read `balance` without changing it?"
              };
            }

            if (runtimeOutput && runtimeOutput.includes('120')) {
              return {
                passed: true,
                socraticPraise: "Brilliant work! You encapsulated `balance` inside `createWallet`'s lexical scope and exposed controlled methods (`deposit`, `withdraw`, `getBalance`) that close over it. Notice how external code can never corrupt `balance` directly!"
              };
            }

            return {
              passed: true,
              socraticPraise: "Excellent job! Both `withdraw(amount)` and `getBalance()` properly close over the private `balance` variable and return the expected state."
            };
          }
        }
      },
      {
        id: 'js-async-event-loop',
        title: '2. Async JS, Promises & Microtask Queue',
        category: 'JavaScript Core',
        status: 'locked',
        isDetour: false,
        conceptTag: 'promises-async',
        description: 'Master asynchronous data fetching, error handling with try/catch, and why Promises resolve before setTimeout.',
        initialFiles: {
          'package.json': `{
  "name": "scrimba-async-lab",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  }
}`,
          'index.js': `// ==========================================================
// LESSON 2: Async / Await & Promise Error Handling
// ==========================================================

function fetchUserProfile(userId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (userId > 0) {
        resolve({ id: userId, name: "Ada Lovelace", role: "Pioneer" });
      } else {
        reject(new Error("Invalid userId: must be positive"));
      }
    }, 150);
  });
}

// Watch the AI Tutor or implement loadDashboard(userId) below!
`
        },
        aiTimeline: [
          {
            timeOffset: 0,
            narration: "In Roadmap step 2, we move from synchronous closures to Asynchronous Promises. Here `fetchUserProfile` returns a Promise that resolves after 150ms.",
            file: 'index.js',
            highlightLine: 5,
            codeSnapshot: `// ==========================================================
// LESSON 2: Async / Await & Promise Error Handling
// ==========================================================

function fetchUserProfile(userId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (userId > 0) {
        resolve({ id: userId, name: "Ada Lovelace", role: "Pioneer" });
      } else {
        reject(new Error("Invalid userId: must be positive"));
      }
    }, 150);
  });
}
`
          },
          {
            timeOffset: 3800,
            narration: "If I call `const user = fetchUserProfile(1)` without `await`, `user` is just a pending Promise object, not Ada's profile! Your turn: write an `async function loadDashboard(userId)` that awaits `fetchUserProfile(userId)` inside a `try / catch` block and logs `user.name`.",
            file: 'index.js',
            highlightLine: 18,
            isChallengeStop: true,
            codeSnapshot: `// ==========================================================
// LESSON 2: Async / Await & Promise Error Handling
// ==========================================================

function fetchUserProfile(userId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (userId > 0) {
        resolve({ id: userId, name: "Ada Lovelace", role: "Pioneer" });
      } else {
        reject(new Error("Invalid userId: must be positive"));
      }
    }, 150);
  });
}

// 👇 YOUR TURN: Complete async function loadDashboard(userId) using await + try/catch
async function loadDashboard(userId) {
  
}

loadDashboard(1);
`
          }
        ],
        challengeSpec: {
          prompt: "Complete `async function loadDashboard(userId)` so that it uses `try / catch`, `await`s `fetchUserProfile(userId)`, logs the user's `name`, and catches any error gracefully.",
          targetFile: 'index.js',
          conceptsTested: ['async-await', 'try-catch', 'promises'],
          evaluateSubmission(code) {
            const hasAwait = /await\s+fetchUserProfile/.test(code);
            const hasTryCatch = /try\s*\{[\s\S]*\}\s*catch/.test(code);
            const accessesName = /\.name/.test(code);

            if (!hasAwait) {
              return {
                passed: false,
                detectedGap: 'missing-await-promise',
                socraticHint: "When you call `fetchUserProfile(userId)` directly inside `loadDashboard`, what does it return immediately—the user object, or a `Promise` that hasn't finished yet? Which keyword pauses `loadDashboard` until that Promise settles?"
              };
            }
            if (!hasTryCatch) {
              return {
                passed: false,
                socraticHint: "Nice use of `await`! Now, what happens if someone calls `loadDashboard(-1)` and the Promise rejects? How can you wrap your `await` call so a rejected Promise is caught instead of crashing the program?"
              };
            }
            if (!accessesName) {
              return {
                passed: false,
                socraticHint: "You have `await` and `try / catch` in place! Once the Promise resolves to the user object `{ id, name, role }`, how can you log `user.name` to the console?"
              };
            }
            return {
              passed: true,
              socraticPraise: "Fantastic! You combined `async/await` with `try/catch` to handle both resolved values and rejected Promises cleanly."
            };
          }
        }
      },
      {
        id: 'js-array-immutability',
        title: '3. Functional Array Pipelines (map / filter / reduce)',
        category: 'Frontend State Patterns',
        status: 'locked',
        isDetour: false,
        conceptTag: 'array-methods',
        description: 'Transform data declaratively without mutating original arrays—essential for React state updates.',
        initialFiles: {
          'package.json': `{
  "name": "scrimba-array-lab",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  }
}`,
          'index.js': `// ==========================================================
// LESSON 3: Declarative Array Pipelines (roadmap.sh/frontend)
// ==========================================================

const courses = [
  { title: "HTML & CSS", completed: true, hours: 6 },
  { title: "Closures Deep Dive", completed: true, hours: 4 },
  { title: "Async Event Loop", completed: false, hours: 5 },
  { title: "React State Hooks", completed: true, hours: 8 }
];

// 👇 YOUR TURN: Create 'completedTitles' using .filter() and .map()
// so it contains only the titles of completed courses!
const completedTitles = [];

console.log("Completed Titles:", completedTitles);
`
        },
        aiTimeline: [
          {
            timeOffset: 0,
            narration: "In modern Frontend frameworks on roadmap.sh, we avoid mutating arrays with `for` loops and `.push()`. Instead we chain `.filter()` and `.map()`.",
            file: 'index.js',
            highlightLine: 5,
            isChallengeStop: true,
            codeSnapshot: `// ==========================================================
// LESSON 3: Declarative Array Pipelines (roadmap.sh/frontend)
// ==========================================================

const courses = [
  { title: "HTML & CSS", completed: true, hours: 6 },
  { title: "Closures Deep Dive", completed: true, hours: 4 },
  { title: "Async Event Loop", completed: false, hours: 5 },
  { title: "React State Hooks", completed: true, hours: 8 }
];

// 👇 YOUR TURN: Chain courses.filter(...) and .map(...) to get an array
// of titles of only the completed courses!
const completedTitles = courses;

console.log("Completed Titles:", completedTitles);
`
          }
        ],
        challengeSpec: {
          prompt: "Chain `.filter()` and `.map()` on `courses` so `completedTitles` holds an array of `title` strings for courses where `completed` is `true`.",
          targetFile: 'index.js',
          conceptsTested: ['array-filter', 'array-map'],
          evaluateSubmission(code) {
            const hasFilter = /\.filter\s*\(/.test(code);
            const hasMap = /\.map\s*\(/.test(code);
            if (!hasFilter) {
              return {
                passed: false,
                socraticHint: "Before extracting the course titles, we only want the subset of courses where `completed` is `true`. Which array method tests each element with a predicate function and keeps only matching items?"
              };
            }
            if (!hasMap) {
              return {
                passed: false,
                socraticHint: "Great job filtering the array! Right now, each element in your filtered array is still a full `{ title, completed, hours }` object. Which array method transforms each object into just its `.title` string?"
              };
            }
            return {
              passed: true,
              socraticPraise: "Clean, immutable, and declarative! Chaining `.filter(c => c.completed).map(c => c.title)` is one of the most common patterns in React and modern UI engineering."
            };
          }
        }
      }
    ]
  },
  {
    id: 'backend',
    title: 'Backend & API Engineer (roadmap.sh/backend)',
    subtitle: 'Node.js Runtime, Middleware Pipelines, Auth & Caching',
    icon: 'Server',
    nodes: [
      {
        id: 'node-middleware-chain',
        title: '1. Request Middleware & `next()` Control Flow',
        category: 'Node.js & APIs',
        status: 'in-progress',
        isDetour: false,
        conceptTag: 'middleware',
        description: 'Build an Express-style middleware pipeline from scratch to understand how authentication and logging guards work.',
        initialFiles: {
          'package.json': `{
  "name": "scrimba-middleware-lab",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  }
}`,
          'index.js': `// ==========================================================
// BACKEND PATH: Express-style Auth Middleware (roadmap.sh/backend)
// ==========================================================

function requireApiKey(req, res, next) {
  // 👇 YOUR TURN: If req.headers['x-api-key'] === 'secret-123', call next().
  // Otherwise, set res.statusCode = 401 and return res.send('Unauthorized').
  
}

// Test harness
const mockRes = {
  statusCode: 200,
  send(msg) { console.log(\`Response [\${this.statusCode}]: \${msg}\`); }
};

requireApiKey({ headers: {} }, mockRes, () => console.log("Next called for empty headers!"));
requireApiKey({ headers: { 'x-api-key': 'secret-123' } }, mockRes, () => console.log("Authenticated! Proceeding to route handler."));
`
        },
        aiTimeline: [
          {
            timeOffset: 0,
            narration: "Welcome to the Backend Roadmap! Every API framework relies on middleware functions `(req, res, next)`. Let's pause right inside `requireApiKey` so you can write the guard logic.",
            file: 'index.js',
            highlightLine: 6,
            isChallengeStop: true,
            codeSnapshot: `// ==========================================================
// BACKEND PATH: Express-style Auth Middleware (roadmap.sh/backend)
// ==========================================================

function requireApiKey(req, res, next) {
  // 👇 YOUR TURN: Check if req.headers['x-api-key'] === 'secret-123'.
  // If valid, invoke next(). Otherwise set res.statusCode = 401 and call res.send('Unauthorized').
  
}

const mockRes = {
  statusCode: 200,
  send(msg) { console.log(\`Response [\${this.statusCode}]: \${msg}\`); }
};

requireApiKey({ headers: {} }, mockRes, () => console.log("Next called for empty headers!"));
requireApiKey({ headers: { 'x-api-key': 'secret-123' } }, mockRes, () => console.log("Authenticated! Proceeding to route handler."));
`
          }
        ],
        challengeSpec: {
          prompt: "Inside `requireApiKey(req, res, next)`, check if `req.headers['x-api-key'] === 'secret-123'`. If so, call `next()`. Otherwise set `res.statusCode = 401` and call `res.send('Unauthorized')`.",
          targetFile: 'index.js',
          conceptsTested: ['middleware', 'control-flow'],
          evaluateSubmission(code) {
            const checksHeader = /req\.headers\[['"]x-api-key['"]\]/.test(code);
            const callsNext = /next\s*\(\s*\)/.test(code);
            const sets401 = /401/.test(code);
            if (!checksHeader) {
              return {
                passed: false,
                socraticHint: "How can you inspect the `'x-api-key'` property inside `req.headers` using bracket notation?"
              };
            }
            if (!callsNext) {
              return {
                passed: false,
                socraticHint: "When the API key matches `'secret-123'`, which callback parameter passed into `requireApiKey(req, res, next)` hands control to the next middleware in the chain?"
              };
            }
            if (!sets401) {
              return {
                passed: false,
                socraticHint: "What HTTP status code should you assign to `res.statusCode` before calling `res.send('Unauthorized')` when the API key is missing or invalid?"
              };
            }
            return {
              passed: true,
              socraticPraise: "Spot on! You just built an Express-compatible authentication guard middleware."
            };
          }
        }
      },
      {
        id: 'node-rate-limiter',
        title: '2. In-Memory Token Bucket Rate Limiter',
        category: 'API Security & Caching',
        status: 'locked',
        isDetour: false,
        conceptTag: 'rate-limiting',
        description: 'Protect backend endpoints from abuse by tracking request counts per IP address in a Map.',
        initialFiles: {
          'package.json': `{
  "name": "scrimba-ratelimit-lab",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  }
}`,
          'index.js': `// ==========================================================
// BACKEND LESSON 2: IP Rate Limiter (roadmap.sh/backend)
// ==========================================================

const requestCounts = new Map();

function isAllowed(ip, limit = 3) {
  // 👇 YOUR TURN: Read current count for 'ip' from requestCounts (default 0).
  // If count >= limit, return false. Otherwise increment count in Map and return true!
  
}

console.log("Req 1:", isAllowed("192.168.1.1", 2));
console.log("Req 2:", isAllowed("192.168.1.1", 2));
console.log("Req 3 (Should be false):", isAllowed("192.168.1.1", 2));
`
        },
        aiTimeline: [
          {
            timeOffset: 0,
            narration: "Rate limiting is a core Backend Roadmap milestone. Complete `isAllowed(ip, limit)` using `requestCounts.get(ip)` and `requestCounts.set(ip, ...)`!",
            file: 'index.js',
            highlightLine: 8,
            isChallengeStop: true,
            codeSnapshot: `// ==========================================================
// BACKEND LESSON 2: IP Rate Limiter (roadmap.sh/backend)
// ==========================================================

const requestCounts = new Map();

function isAllowed(ip, limit = 3) {
  // 👇 YOUR TURN: Read current count for 'ip' from requestCounts (default 0).
  // If count >= limit, return false. Otherwise increment count in Map and return true!
  
}

console.log("Req 1:", isAllowed("192.168.1.1", 2));
console.log("Req 2:", isAllowed("192.168.1.1", 2));
console.log("Req 3 (Should be false):", isAllowed("192.168.1.1", 2));
`
          }
        ],
        challengeSpec: {
          prompt: "Use `requestCounts.get(ip)` and `requestCounts.set(ip, count + 1)` inside `isAllowed(ip, limit)` to return `false` when `count >= limit` and `true` otherwise.",
          targetFile: 'index.js',
          conceptsTested: ['map-data-structure', 'rate-limiting'],
          evaluateSubmission(code) {
            const usesGet = /requestCounts\.get/.test(code);
            const usesSet = /requestCounts\.set/.test(code);
            if (!usesGet || !usesSet) {
              return {
                passed: false,
                socraticHint: "How do you read an existing entry from a JavaScript `Map` (`requestCounts.get(ip)`) and store the incremented count (`requestCounts.set(...)`)?"
              };
            }
            return {
              passed: true,
              socraticPraise: "Awesome! You just implemented an IP rate limiter using a JavaScript `Map`."
            };
          }
        }
      }
    ]
  },
  AI_ENGINEER_TRACK,
  SOFTWARE_ENGINEER_TRACK,
  MATHEMATICS_SCRATCH_TO_PRO_TRACK,
  MIT_VECTOR_CALCULUS_TRACK,
  {
    id: 'caltech-embedded-iot',
    workspaceType: 'circuit',
    title: 'Embedded Systems & Robotics (ESP32 / Arduino)',
    subtitle: 'Hardware GPIO control, pulse-width modulation, ultrasonic distance sensing, and serial telemetry on real microcontrollers',
    icon: 'Cpu',
    nodes: [
      {
        id: 'circuit-mod-1-gpio-blink',
        title: '1. GPIO Configuration & Digital Output Control',
        category: 'Digital GPIO',
        status: 'in-progress',
        workspaceType: 'circuit',
        conceptTag: 'arduino-digital-io',
        description: 'Program an Arduino Uno to blink an external LED on Digital Pin 13, configuring pinMode and toggling voltage levels safely.',
        targetFile: 'sketch.ino',
        microcontroller: 'arduino-uno',
        wokwiProjectId: 'arduino-uno-basic-led',
        initialFiles: {
          'sketch.ino': `// ============================================================================
// CALTECH ROBOTICS LAB: Lab 1 — Digital GPIO & LED Blinking
// Microcontroller: Arduino Uno (ATmega328P)
// Pin 13 -> 220Ω Resistor -> LED Anode -> Cathode -> GND
// ============================================================================

const int LED_PIN = 13;

void setup() {
  Serial.begin(115200);
  Serial.println("System Initialized: Arduino Uno GPIO Ready");
  
  // 👇 YOUR TURN: Configure LED_PIN as an OUTPUT using pinMode()
  
}

void loop() {
  // 👇 YOUR TURN: Turn the LED ON (HIGH), pause 500ms with delay(),
  // turn the LED OFF (LOW), and pause 500ms with delay().
  // Also print "LED State: ON" and "LED State: OFF" to the Serial Monitor!
  
}
`,
          'diagram.json': JSON.stringify({
            version: 1,
            author: 'Caltech Robotics Lab',
            editor: 'wokwi',
            parts: [
              { type: 'wokwi-arduino-uno', id: 'uno', top: 10, left: 10, attrs: {} },
              { type: 'wokwi-led', id: 'led1', top: -50, left: 240, attrs: { color: 'red' } },
              { type: 'wokwi-resistor', id: 'r1', top: 20, left: 240, attrs: { value: '220' } }
            ],
            connections: [
              [ 'uno:13', 'r1:1', 'green', [ 'v0' ] ],
              [ 'r1:2', 'led1:A', 'green', [ 'v0' ] ],
              [ 'uno:GND.1', 'led1:C', 'black', [ 'v0' ] ]
            ]
          }, null, 2)
        },
        circuitComponents: [
          { id: 'uno', type: 'microcontroller', model: 'Arduino Uno' },
          { id: 'led1', type: 'led', color: '#ef4444', label: 'Status LED', pinConnected: '13' },
          { id: 'r1', type: 'resistor', resistance: '220Ω', label: 'Current Limiter' }
        ],
        aiTimeline: [
          {
            timeOffset: 0,
            narration: "Welcome to Embedded Systems! On your circuit canvas, we have an Arduino Uno wired to a red LED on Pin 13 through a 220-ohm current-limiting resistor.",
            file: 'sketch.ino',
            highlightLine: 8,
            cursorTarget: { type: 'ui', uiId: 'circuit-component-uno', label: 'Arduino Uno (Pin 13)' },
            codeSnapshot: `const int LED_PIN = 13;\n\nvoid setup() {\n  Serial.begin(115200);\n  Serial.println("System Initialized: Arduino Uno GPIO Ready");\n}`
          },
          {
            timeOffset: 4500,
            narration: "Microcontroller pins start in high-impedance mode. Before driving current to the LED, we must call pinMode(LED_PIN, OUTPUT) inside setup().",
            file: 'sketch.ino',
            highlightLine: 13,
            cursorTarget: { type: 'editor', line: 13, label: 'pinMode(LED_PIN, OUTPUT);' },
            codeSnapshot: `const int LED_PIN = 13;\n\nvoid setup() {\n  Serial.begin(115200);\n  Serial.println("System Initialized: Arduino Uno GPIO Ready");\n  pinMode(LED_PIN, OUTPUT);\n}\n\nvoid loop() {\n}`
          },
          {
            timeOffset: 8500,
            narration: "Now take over! Inside loop(), toggle the LED using digitalWrite(LED_PIN, HIGH), delay(500), digitalWrite(LED_PIN, LOW), delay(500), and print the state to the Serial monitor.",
            file: 'sketch.ino',
            highlightLine: 18,
            isChallengeStop: true,
            cursorTarget: { type: 'editor', line: 18, label: 'Your turn: Write loop() blink cycle' },
            codeSnapshot: `const int LED_PIN = 13;\n\nvoid setup() {\n  Serial.begin(115200);\n  Serial.println("System Initialized: Arduino Uno GPIO Ready");\n  pinMode(LED_PIN, OUTPUT);\n}\n\nvoid loop() {\n  // Turn LED ON, wait 500ms, turn OFF, wait 500ms\n  \n}`
          }
        ],
        challengeSpec: {
          prompt: "In `setup()`, call `pinMode(LED_PIN, OUTPUT);`. In `loop()`, call `digitalWrite(LED_PIN, HIGH); delay(500); digitalWrite(LED_PIN, LOW); delay(500);` and output `Serial.println(\"LED State: ON\");` to the serial monitor.",
          targetFile: 'sketch.ino',
          conceptsTested: ['gpio-pinmode', 'digitalwrite', 'delays', 'serial-telemetry'],
          requiredPatterns: ['pinMode\\s*\\(\\s*LED_PIN\\s*,\\s*OUTPUT\\s*\\)', 'digitalWrite\\s*\\(\\s*LED_PIN', 'delay\\s*\\('],
          expectedSerialPatterns: ['Ready', 'LED State'],
          evaluateSubmission(firmwareCode = '', serialOutput = '') {
            const hasPinMode = /pinMode\s*\(\s*(LED_PIN|13)\s*,\s*OUTPUT\s*\)/i.test(firmwareCode);
            const hasWrite = /digitalWrite\s*\(\s*(LED_PIN|13)/i.test(firmwareCode);
            const hasDelay = /delay\s*\(/i.test(firmwareCode);

            if (!hasPinMode) {
              return {
                passed: false,
                socraticHint: "Remember to configure pin 13 as an output using `pinMode(LED_PIN, OUTPUT);` inside `setup()`."
              };
            }
            if (!hasWrite || !hasDelay) {
              return {
                passed: false,
                socraticHint: "Inside `loop()`, use `digitalWrite(LED_PIN, HIGH); delay(500); digitalWrite(LED_PIN, LOW); delay(500);` to cycle the voltage."
              };
            }
            return {
              passed: true,
              socraticPraise: "Outstanding! You've mastered hardware GPIO configuration and digital switching on real microcontroller silicon."
            };
          }
        }
      },
      {
        id: 'circuit-mod-2-pwm-sensors',
        title: '2. Pulse-Width Modulation (PWM) & Servo Actuators',
        category: 'Analog & PWM',
        status: 'locked',
        workspaceType: 'circuit',
        conceptTag: 'arduino-pwm-servo',
        description: 'Control robotic servo angles and analog LED brightness levels using Pulse-Width Modulation signals on pin ~9.',
        targetFile: 'sketch.ino',
        microcontroller: 'arduino-uno',
        initialFiles: {
          'sketch.ino': `// ============================================================================
// CALTECH ROBOTICS LAB: Lab 2 — Pulse-Width Modulation & Actuator Signals
// Microcontroller: Arduino Uno (Pin ~9 PWM Output)
// ============================================================================

const int PWM_PIN = 9;

void setup() {
  Serial.begin(115200);
  pinMode(PWM_PIN, OUTPUT);
  Serial.println("PWM Actuator Controller Active on Pin 9");
}

// 👇 YOUR TURN: Write setActuatorPower(int dutyCycle)
// Use analogWrite(PWM_PIN, dutyCycle) where dutyCycle is between 0 and 255.
// Log the value to the Serial monitor!
void setActuatorPower(int dutyCycle) {
  
}

void loop() {
  for (int val = 0; val <= 255; val += 50) {
    setActuatorPower(val);
    delay(200);
  }
}
`,
          'diagram.json': JSON.stringify({
            version: 1,
            author: 'Caltech Robotics Lab',
            editor: 'wokwi',
            parts: [
              { type: 'wokwi-arduino-uno', id: 'uno', top: 10, left: 10, attrs: {} },
              { type: 'wokwi-servo', id: 'servo1', top: -70, left: 220, attrs: {} }
            ],
            connections: [
              [ 'uno:9', 'servo1:PWM', 'orange', [ 'v0' ] ],
              [ 'uno:5V', 'servo1:V+', 'red', [ 'v0' ] ],
              [ 'uno:GND.1', 'servo1:GND', 'black', [ 'v0' ] ]
            ]
          }, null, 2)
        },
        circuitComponents: [
          { id: 'uno', type: 'microcontroller', model: 'Arduino Uno' },
          { id: 'servo1', type: 'servo', label: 'Robotic Servo Arm', pinConnected: '9', angle: 90 }
        ],
        aiTimeline: [
          {
            timeOffset: 0,
            narration: "Unlike digital pins that are strictly 0 or 1, PWM pins simulate analog voltage by rapidly pulsing between 0V and 5V.",
            file: 'sketch.ino',
            highlightLine: 6,
            cursorTarget: { type: 'ui', uiId: 'circuit-component-servo1', label: 'PWM Servo Arm (Pin ~9)' },
            codeSnapshot: `const int PWM_PIN = 9;`
          },
          {
            timeOffset: 4500,
            narration: "Take over in `setActuatorPower(dutyCycle)`! Use `analogWrite(PWM_PIN, dutyCycle)` and report the power level to the Serial monitor.",
            file: 'sketch.ino',
            highlightLine: 16,
            isChallengeStop: true,
            cursorTarget: { type: 'editor', line: 16, label: 'Implement analogWrite(PWM_PIN, dutyCycle)' },
            codeSnapshot: `void setActuatorPower(int dutyCycle) {\n  // Use analogWrite(PWM_PIN, dutyCycle)\n}`
          }
        ],
        challengeSpec: {
          prompt: "In `setActuatorPower(int dutyCycle)`, clamp dutyCycle between 0 and 255, call `analogWrite(PWM_PIN, dutyCycle);`, and print `\"Power: \"` plus the value using `Serial.println()`.",
          targetFile: 'sketch.ino',
          conceptsTested: ['pwm', 'analogwrite', 'duty-cycle'],
          requiredPatterns: ['analogWrite\\s*\\(\\s*PWM_PIN', 'Serial\\.print'],
          expectedSerialPatterns: ['PWM Actuator', 'Power'],
          evaluateSubmission(firmwareCode = '') {
            const hasAnalogWrite = /analogWrite\s*\(\s*(PWM_PIN|9)/i.test(firmwareCode);
            if (!hasAnalogWrite) {
              return {
                passed: false,
                socraticHint: "Invoke `analogWrite(PWM_PIN, dutyCycle);` inside `setActuatorPower`."
              };
            }
            return {
              passed: true,
              socraticPraise: "Excellent! PWM is the foundational signal protocol used to drive robotic motors, servos, and drone ESCs."
            };
          }
        }
      }
    ]
  }
];


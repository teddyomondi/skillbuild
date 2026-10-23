// Dynamic Roadmap.sh Curriculum & Adaptive Detour Engine
// Provides canonical roadmap.sh tracks AND dynamically injects detour nodes when the AI detects conceptual gaps.
// Uses `node-html-parser` for real HTML DOM querying and `acorn` + `acorn-walk` for JS AST inspection.

import { parse as parseHtml } from 'node-html-parser';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

export const ROADMAP_TRACKS = [
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
  {
    id: 'fullstack-ai',
    title: 'AI & Full-Stack Engineer (roadmap.sh/ai-engineer)',
    subtitle: 'Prompt Engineering, Structured Outputs, RAG & Tool Calling',
    icon: 'Sparkles',
    nodes: [
      {
        id: 'ai-tool-calling-router',
        title: '1. Deterministic Agent Tool-Call Dispatcher',
        category: 'AI Agents & Tools',
        status: 'in-progress',
        isDetour: false,
        conceptTag: 'tool-calling',
        description: 'Build the execution router that connects an LLM structured tool call to real JavaScript functions.',
        initialFiles: {
          'package.json': `{
  "name": "scrimba-ai-agent-lab",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  }
}`,
          'index.js': `// ==========================================================
// AI ENGINEER PATH: Agent Tool Call Dispatcher (roadmap.sh/ai-engineer)
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
            narration: "In the AI Engineer roadmap, LLMs don't execute code directly—they emit a `{ name, args }` object. Your turn: complete `executeToolCall(toolCall)` to dispatch the right function from `toolsRegistry`!",
            file: 'index.js',
            highlightLine: 11,
            isChallengeStop: true,
            codeSnapshot: `// ==========================================================
// AI ENGINEER PATH: Agent Tool Call Dispatcher (roadmap.sh/ai-engineer)
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
              return {
                passed: false,
                socraticHint: "How can you dynamically access a property on `toolsRegistry` when the function name is stored inside `toolCall.name`?"
              };
            }
            if (!passesArgs) {
              return {
                passed: false,
                socraticHint: "Once you retrieve the function from `toolsRegistry`, what argument object from `toolCall` should you pass when invoking it?"
              };
            }
            return {
              passed: true,
              socraticPraise: "Spot on! That dynamic registry pattern is the exact backbone of every LLM tool-calling loop."
            };
          }
        }
      }
    ]
  },
  {
    id: 'mathematics',
    title: 'Maths',
    subtitle: 'Coordinate geometry, functions, geometry, trigonometry, calculus, and linear algebra',
    icon: 'Compass',
    nodes: [
      {
        id: 'math-vectors-coordinate-geometry',
        title: '1. Coordinate Geometry & Vector Operations',
        category: 'Linear Algebra & Vectors',
        status: 'in-progress',
        isDetour: false,
        conceptTag: 'vectors-geometry',
        isMathBoard: true,
        description: 'Plot vector u = (3, 2) from (0, 0), then add vector v = (1, 4) using the tip-to-tail method to plot the resultant vector u + v = (4, 6).',
        initialBoard: {
          elements: [
            {
              id: 'vec-u',
              name: 'u',
              type: 'vector',
              x1: 0,
              y1: 0,
              x2: 3,
              y2: 2,
              color: '#38bdf8',
              width: 3.5,
              label: 'u = (3, 2)',
              showComponents: true,
              isReference: true
            },
            {
              id: 'formula-1',
              type: 'text',
              x: -9,
              y: 7,
              text: 'Tip-to-Tail Rule: R = u + v = (3+1, 2+4) = (4, 6)',
              color: '#fbbf24',
              fontSize: 16
            }
          ]
        },
        initialFiles: {
          'notes.math': `# Lesson 1: Vectors & Coordinate Geometry

Vector u: (3, 2)
Vector v: (1, 4)

Resultant: R = u + v
R_x = 3 + 1 = 4
R_y = 2 + 4 = 6
R = (4, 6)

Magnitude:
|R| = sqrt(4^2 + 6^2) = sqrt(16 + 36) = sqrt(52) ≈ 7.21 units
`
        },
        aiTimeline: [
          {
            timeOffset: 0,
            narration: 'Welcome to Interactive Mathematics! On your digital board, we have a 2D Cartesian coordinate plane with origin at (0, 0). Vector u is plotted in cyan with components Δx = 3 and Δy = 2.',
            file: 'notes.math',
            highlightLine: 3
          },
          {
            timeOffset: 4500,
            narration: "To add vectors visually, we use the tip-to-tail method: start at the tip of vector u at (3, 2), then travel by vector v: 1 unit right, and 4 units up.",
            file: 'notes.math',
            highlightLine: 6
          },
          {
            timeOffset: 8000,
            narration: "Now it's your turn! Select the Vector tool on your digital board, click at (3, 2), and draw vector v ending at (4, 6) to complete the resultant vector!",
            file: 'notes.math',
            highlightLine: 9,
            isChallengeStop: true
          }
        ],
        challengeSpec: {
          prompt: 'Select the Vector tool from the digital board toolbar. Click at (3, 2) and draw vector v = (1, 4) ending at (4, 6) to verify the resultant vector u + v.',
          targetConcept: 'vectors',
          evaluateSubmission(code, runtimeOutput, boardData) {
            const vectors = boardData?.vectors || [];
            // Check for vector v starting at or near (3, 2) and ending near (4, 6),
            // OR any resultant vector from (0, 0) to near (4, 6)
            const hasResultant = vectors.some((v) => {
              const endsNear46 = Math.hypot(v.end[0] - 4, v.end[1] - 6) <= 0.8;
              const startsNear32 = Math.hypot(v.start[0] - 3, v.start[1] - 2) <= 0.8;
              const startsNearOrigin = Math.hypot(v.start[0] - 0, v.start[1] - 0) <= 0.8;
              return endsNear46 && (startsNear32 || startsNearOrigin);
            });

            if (!hasResultant) {
              return {
                passed: false,
                socraticHint: 'Select the Vector Arrow tool from the top toolbar. Click at point (3, 2) and drag to point (4, 6) on the grid!'
              };
            }

            return {
              passed: true,
              socraticPraise: 'Brilliant vector construction! You correctly added vectors u + v = (4, 6) with magnitude |R| = 7.21 using the tip-to-tail method.'
            };
          }
        }
      },
      {
        id: 'math-calculus-tangent-derivatives',
        title: '2. Calculus: Tangents & Instantaneous Slopes',
        category: 'Differential Calculus',
        status: 'locked',
        isDetour: false,
        conceptTag: 'calculus-derivatives',
        isMathBoard: true,
        description: 'On the parabola f(x) = 0.5 * x^2, draw the tangent line at x = 2 where the derivative slope is f\'(2) = 2, passing through point (2, 2).',
        initialBoard: {
          elements: [
            {
              id: 'parabola',
              type: 'plot',
              fn: (x) => 0.5 * x * x,
              color: '#34d399',
              width: 3,
              label: 'f(x) = 0.5 * x^2',
              labelX: 3
            },
            {
              id: 'point-p',
              type: 'circle',
              cx: 2,
              cy: 2,
              radius: 0.25,
              color: '#fbbf24',
              fill: '#fbbf24',
              label: 'P(2, 2)'
            },
            {
              id: 'formula-calc',
              type: 'text',
              x: -9,
              y: 7,
              text: "f'(x) = x  |  At x=2, slope m = f'(2) = 2",
              color: '#38bdf8',
              fontSize: 16
            }
          ]
        },
        initialFiles: {
          'notes.math': `# Lesson 2: Tangent Lines & Derivatives

Function: f(x) = 0.5 * x^2
Derivative: f'(x) = d/dx [0.5 * x^2] = x

Point of Tangency:
x_0 = 2
y_0 = f(2) = 0.5 * (2^2) = 2

Slope of Tangent Line:
m = f'(2) = 2

Point-Slope Equation:
y - 2 = 2 * (x - 2)
y = 2x - 2
`
        },
        aiTimeline: [
          {
            timeOffset: 0,
            narration: 'Calculus reveals instantaneous rates of change. On your board, we have the emerald parabola f(x) = 0.5 * x^2 and a gold point P at (2, 2).',
            file: 'notes.math',
            highlightLine: 3
          },
          {
            timeOffset: 4500,
            narration: "The derivative function is f'(x) = x. At x = 2, the instantaneous slope of the curve is exactly m = 2.",
            file: 'notes.math',
            highlightLine: 9
          },
          {
            timeOffset: 8000,
            narration: "Your turn: select the Line or Vector tool and draw the tangent line passing through (2, 2) with slope 2 (for example, connecting (1, 0) and (3, 4)).",
            file: 'notes.math',
            highlightLine: 13,
            isChallengeStop: true
          }
        ],
        challengeSpec: {
          prompt: 'Use the Line or Vector tool to draw the tangent line y = 2x - 2 passing through (2, 2) with slope m = 2.',
          targetConcept: 'derivatives',
          evaluateSubmission(code, runtimeOutput, boardData) {
            const lines = (boardData?.elements || []).filter(
              (el) => el.type === 'line' || el.type === 'vector'
            );
            const hasTangent = lines.some((l) => {
              const dx = l.x2 - l.x1;
              const dy = l.y2 - l.y1;
              if (Math.abs(dx) < 0.2) return false;
              const slope = dy / dx;
              const passesNearP =
                Math.hypot((l.x1 + l.x2) / 2 - 2, (l.y1 + l.y2) / 2 - 2) <= 1.5 ||
                Math.hypot(l.x1 - 2, l.y1 - 2) <= 1.0 ||
                Math.hypot(l.x2 - 2, l.y2 - 2) <= 1.0;
              return Math.abs(slope - 2) <= 0.4 && passesNearP;
            });

            if (!hasTangent) {
              return {
                passed: false,
                socraticHint: 'Draw a straight line through point P(2, 2) that rises 2 units for every 1 unit of run (e.g. from (1, 0) to (3, 4))!'
              };
            }

            return {
              passed: true,
              socraticPraise: "Excellent calculus intuition! You constructed the exact tangent line y = 2x - 2 with slope m = f'(2) = 2."
            };
          }
        }
      },
      {
        id: 'math-trigonometry-unit-circle',
        title: '3. Trigonometry & The Unit Circle',
        category: 'Trigonometry',
        status: 'locked',
        isDetour: false,
        conceptTag: 'unit-circle-trig',
        isMathBoard: true,
        description: 'Construct a 45° reference triangle inside the circle of radius R = 4, showing the (cos θ, sin θ) projection legs.',
        initialBoard: {
          elements: [
            {
              id: 'unit-circle',
              type: 'circle',
              cx: 0,
              cy: 0,
              radius: 4,
              color: '#818cf8',
              fill: 'rgba(129, 140, 248, 0.08)',
              label: 'Radius R = 4'
            },
            {
              id: 'formula-trig',
              type: 'text',
              x: -9,
              y: 7,
              text: 'cos²(θ) + sin²(θ) = 1  |  θ = 45° (π/4 rad)',
              color: '#34d399',
              fontSize: 16
            }
          ]
        },
        initialFiles: {
          'notes.math': `# Lesson 3: Trigonometry & The Unit Circle

Circle Radius: R = 4
Angle: θ = 45° (π/4 rad)

Projections:
Adjacent (X) = R * cos(45°) = 4 * (sqrt(2)/2) ≈ 2.83
Opposite (Y) = R * sin(45°) = 4 * (sqrt(2)/2) ≈ 2.83

Pythagorean Identity:
(2.83)^2 + (2.83)^2 = 8 + 8 = 16 = 4^2
`
        },
        aiTimeline: [
          {
            timeOffset: 0,
            narration: 'Every trigonometric function lives on the circle. The X-projection is cosine, and the Y-projection is sine.',
            file: 'notes.math',
            highlightLine: 3
          },
          {
            timeOffset: 4500,
            narration: "For an angle of 45 degrees, both sine and cosine are equal, forming an isosceles right triangle with hypotenuse R = 4.",
            file: 'notes.math',
            highlightLine: 7
          },
          {
            timeOffset: 8000,
            narration: "Your turn: select the Triangle or Vector tool and draw the 45° reference hypotenuse from (0, 0) to point (2.8, 2.8) on the circle perimeter!",
            file: 'notes.math',
            highlightLine: 12,
            isChallengeStop: true
          }
        ],
        challengeSpec: {
          prompt: 'Draw a vector or hypotenuse from origin (0, 0) to point (2.8, 2.8) on the circle at 45°.',
          targetConcept: 'trigonometry',
          evaluateSubmission(code, runtimeOutput, boardData) {
            const vectors = (boardData?.elements || []).filter(
              (el) => el.type === 'vector' || el.type === 'line'
            );
            const has45Vector = vectors.some((v) => {
              const startsAtOrigin = Math.hypot(v.x1, v.y1) <= 0.8;
              const endsNearPerimeter = Math.hypot(v.x2 - 2.8, v.y2 - 2.8) <= 1.0;
              return startsAtOrigin && endsNearPerimeter;
            });

            if (!has45Vector) {
              return {
                passed: false,
                socraticHint: 'Select the Vector Arrow tool, start at origin (0, 0), and drag upward at a 45° angle to the circle boundary near (2.8, 2.8)!'
              };
            }

            return {
              passed: true,
              socraticPraise: 'Superb geometric proof! You accurately constructed the 45° projection triangle on the circle where X = R*cos(45°) and Y = R*sin(45°).'
            };
          }
        }
      },
      {
        id: 'math-linear-transformations',
        title: '4. Linear Transformations & Matrix Grids',
        category: 'Linear Algebra',
        status: 'locked',
        isDetour: false,
        conceptTag: 'matrix-transformations',
        isMathBoard: true,
        description: 'Apply the shear matrix T = [[1, 1], [0, 1]]. Draw the transformed basis vector j\' = (1, 1) while i\' = (1, 0) remains fixed.',
        initialBoard: {
          elements: [
            {
              id: 'basis-i',
              name: 'i',
              type: 'vector',
              x1: 0,
              y1: 0,
              x2: 2,
              y2: 0,
              color: '#38bdf8',
              width: 3.5,
              label: "i' = (2, 0)",
              isReference: true
            },
            {
              id: 'formula-matrix',
              type: 'text',
              x: -9,
              y: 7,
              text: 'Shear Matrix: T = [[1, 1], [0, 1]]  |  Det(T) = 1 (Area Preserved)',
              color: '#fb7185',
              fontSize: 16
            }
          ]
        },
        initialFiles: {
          'notes.math': `# Lesson 4: Linear Transformations & Matrices

Standard Basis:
i = (1, 0)
j = (0, 1)

Transformation Matrix T:
[ 1  1 ]
[ 0  1 ]

Transforming j:
T * j = [ 1*0 + 1*1 ] = [ 1 ]
        [ 0*0 + 1*1 ]   [ 1 ]
j' = (1, 1) (scaled on board: (2, 2))

Determinant:
det(T) = (1*1) - (1*0) = 1 (preserves 2D area!)
`
        },
        aiTimeline: [
          {
            timeOffset: 0,
            narration: 'Matrices are geometric functions that transform space. In linear algebra, a matrix is completely determined by where it sends the basis vectors i and j.',
            file: 'notes.math',
            highlightLine: 3
          },
          {
            timeOffset: 4500,
            narration: "A horizontal shear matrix leaves vector i fixed on the X-axis, while shearing vector j into (1, 1). Notice that the area between the vectors remains exactly 1.",
            file: 'notes.math',
            highlightLine: 11
          },
          {
            timeOffset: 8000,
            narration: "Your turn: select the Vector tool, start at (0, 0), and draw the sheared basis vector j' ending at (2, 2)!",
            file: 'notes.math',
            highlightLine: 15,
            isChallengeStop: true
          }
        ],
        challengeSpec: {
          prompt: "Draw the transformed basis vector j' from (0, 0) to (2, 2) to complete the shear matrix visualization.",
          targetConcept: 'matrix-transformations',
          evaluateSubmission(code, runtimeOutput, boardData) {
            const vectors = (boardData?.elements || []).filter(
              (el) => el.type === 'vector'
            );
            const hasShearedJ = vectors.some((v) => {
              const startsAtOrigin = Math.hypot(v.x1, v.y1) <= 0.8;
              const endsNear22 = Math.hypot(v.x2 - 2, v.y2 - 2) <= 0.8;
              return startsAtOrigin && endsNear22;
            });

            if (!hasShearedJ) {
              return {
                passed: false,
                socraticHint: "Select the Vector Arrow tool, click at (0, 0), and drag to (2, 2) to draw the sheared vector j'!"
              };
            }

            return {
              passed: true,
              socraticPraise: "Outstanding! You visually proved the matrix shear transformation: vector j' lands at (1, 1) and the unit parallelogram has determinant area 1."
            };
          }
        }
      },
      {
        id: 'math-functions-lines-and-slope',
        title: '5. Functions: Lines, Slope & Intercepts',
        category: 'Algebra & Functions',
        status: 'locked',
        isDetour: false,
        conceptTag: 'linear-functions',
        isMathBoard: true,
        description: 'Explore the line y = 2x + 1. Use its slope and y-intercept to place two points, then draw the line through them.',
        initialBoard: {
          elements: [
            {
              id: 'line-function-graph',
              type: 'plot',
              fn: (x) => 2 * x + 1,
              color: '#34d399',
              width: 3,
              label: 'y = 2x + 1',
              labelX: 2
            },
            {
              id: 'line-function-note',
              type: 'text',
              x: -9,
              y: 7,
              text: 'Slope = 2  |  y-intercept = 1',
              color: '#fbbf24',
              fontSize: 16
            }
          ]
        },
        initialFiles: {
          'notes.math': `# Lesson 5: Lines, Slope, and Intercepts

We will draw the line y = 2x + 1.

1. The y-intercept is 1. This means the line crosses the vertical axis at (0, 1).
2. The slope is 2. For every 1 step to the right, the line goes 2 steps up.
3. Starting at (0, 1), move right 2 and up 4. This gives a second point: (2, 5).
4. Draw a straight line through (0, 1) and (2, 5).

Check: (5 - 1) / (2 - 0) = 4 / 2 = 2, so the slope is correct.
`
        },
        aiTimeline: [
          {
            timeOffset: 0,
            narration: 'A function gives one output for each input. The green graph shows y equals 2x plus 1. We can read two useful facts from this equation.',
            file: 'notes.math',
            highlightLine: 3
          },
          {
            timeOffset: 4500,
            narration: 'The plus 1 tells us where the line crosses the vertical axis: at the point zero comma one. The 2 is the slope: go one step right and two steps up.',
            file: 'notes.math',
            highlightLine: 7
          },
          {
            timeOffset: 8500,
            narration: 'Now draw a straight line through zero comma one and two comma five. These points should give the same slope of two.',
            file: 'notes.math',
            highlightLine: 9,
            isChallengeStop: true
          }
        ],
        challengeSpec: {
          prompt: 'Use the Line tool to draw a line through (0, 1) and (2, 5). Its slope should be 2 and its y-intercept should be 1.',
          targetConcept: 'linear-functions',
          evaluateSubmission(code, runtimeOutput, boardData) {
            const lines = (boardData?.elements || []).filter(
              (element) => element.type === 'line' || element.type === 'vector'
            );
            const hasFunctionLine = lines.some((line) => {
              const dx = line.x2 - line.x1;
              if (Math.abs(dx) < 0.2) return false;
              const slope = (line.y2 - line.y1) / dx;
              const intercept = line.y1 - slope * line.x1;
              return Math.abs(slope - 2) <= 0.25 && Math.abs(intercept - 1) <= 0.7;
            });

            return hasFunctionLine
              ? { passed: true, socraticPraise: 'Good graph. Your line rises 2 units for each step right and crosses the y-axis at 1, so it matches y = 2x + 1.' }
              : { passed: false, socraticHint: 'Start at (0, 1), then move 2 units right and 4 units up to (2, 5). Draw a straight line through both points.' };
          }
        }
      },
      {
        id: 'math-geometry-pythagorean-theorem',
        title: '6. Geometry: The Pythagorean Theorem',
        category: 'Geometry',
        status: 'locked',
        isDetour: false,
        conceptTag: 'pythagorean-theorem',
        isMathBoard: true,
        description: 'Build a right triangle with side lengths 3 and 4. Use the board to see why the hypotenuse has length 5.',
        initialBoard: {
          elements: [
            {
              id: 'pythagorean-note',
              type: 'text',
              x: -9,
              y: 7,
              text: 'a² + b² = c²  |  3² + 4² = 5²',
              color: '#fbbf24',
              fontSize: 17
            }
          ]
        },
        initialFiles: {
          'notes.math': `# Lesson 6: The Pythagorean Theorem

This rule works for right-angled triangles.

a and b are the two shorter sides. c is the hypotenuse, opposite the right angle.

For a triangle with shorter sides 3 and 4:
a² + b² = c²
3² + 4² = c²
9 + 16 = 25
c = 5

On the board, draw the sides from (0, 0) to (3, 0), from (3, 0) to (3, 4), and from (3, 4) back to (0, 0).
`
        },
        aiTimeline: [
          {
            timeOffset: 0,
            narration: 'The Pythagorean theorem connects the sides of a right triangle. The two shorter sides meet at the right angle. The longest side, across from it, is called the hypotenuse.',
            file: 'notes.math',
            highlightLine: 3
          },
          {
            timeOffset: 5000,
            narration: 'For side lengths 3 and 4, square each number and add: 9 plus 16 is 25. The hypotenuse is the square root of 25, which is 5.',
            file: 'notes.math',
            highlightLine: 8
          },
          {
            timeOffset: 9000,
            narration: 'Draw the three sides using the points zero comma zero, three comma zero, and three comma four. Notice the diagonal should measure 5 units.',
            file: 'notes.math',
            highlightLine: 14,
            isChallengeStop: true
          }
        ],
        challengeSpec: {
          prompt: 'Use the Line tool to draw all three sides between (0, 0), (3, 0), and (3, 4). The side lengths should be 3, 4, and 5.',
          targetConcept: 'pythagorean-theorem',
          evaluateSubmission(code, runtimeOutput, boardData) {
            const lines = (boardData?.elements || []).filter(
              (element) => element.type === 'line' || element.type === 'vector'
            );
            const lengths = lines.map((line) => Math.hypot(
              line.x2 - line.x1,
              line.y2 - line.y1
            ));
            const hasLength = (target) => lengths.some((length) => Math.abs(length - target) <= 0.6);
            const hasTriangle = hasLength(3) && hasLength(4) && hasLength(5);

            return hasTriangle
              ? { passed: true, socraticPraise: 'You built the 3-4-5 right triangle. Squaring the shorter sides gives 9 + 16 = 25, so the hypotenuse is 5.' }
              : { passed: false, socraticHint: 'Draw three line segments with lengths 3, 4, and 5. The 3-unit and 4-unit sides meet at a right angle.' };
          }
        }
      }
    ]
  }
];


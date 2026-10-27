// ============================================================================
// SYLLABUS-TO-WORKSPACE TRANSFORMATION ENGINE
// ============================================================================
// Automatically turns static PDF syllabi and course outlines from schools,
// bootcamps, and STEM creators into live, Socratic, cursor-guided workspaces:
// 1. Code IDE (Computer Science, Web, Software Engineering, Python, JS, AI)
// 2. Excalidraw Math Canvas (Calculus, Linear Algebra, Geometry, Mechanics, Physics)
// 3. Embedded Wokwi / Circuit Canvas (IoT, Arduino, ESP32, Robotics, Sensors)
// ============================================================================

import { jsonrepair } from 'jsonrepair';
import { extractTextFromPdf } from './pdfParser.js';
import { callConfiguredLlm } from './socraticAiTutor.js';
import { compileChallengeEvaluator } from './lessonDevelopmentEngine.js';

/**
 * Compiles a circuit & firmware evaluation function for Wokwi / Circuit Canvas.
 * Validates C++/Arduino code, pin assignments, and virtual serial telemetry.
 */
export function compileCircuitEvaluator(challengeSpec = {}) {
  return function evaluateCircuitSubmission(firmwareCode = '', serialOutput = '', circuitState = {}) {
    const code = String(firmwareCode || '');
    const serial = String(serialOutput || '');
    const activePins = circuitState.pins || {};

    // 1. Check required C++ / Arduino patterns (e.g. pinMode, digitalWrite, analogRead, Serial.println)
    if (Array.isArray(challengeSpec.requiredPatterns) && challengeSpec.requiredPatterns.length > 0) {
      for (const pattern of challengeSpec.requiredPatterns) {
        if (!pattern) continue;
        try {
          const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
          if (!regex.test(code)) {
            return {
              passed: false,
              socraticHint: challengeSpec.socraticHint || `Your firmware needs to configure or invoke: ${pattern}`
            };
          }
        } catch {
          if (!code.toLowerCase().includes(String(pattern).toLowerCase())) {
            return {
              passed: false,
              socraticHint: challengeSpec.socraticHint || `Your firmware needs to include: ${pattern}`
            };
          }
        }
      }
    }

    // 2. Check required Serial output patterns
    if (Array.isArray(challengeSpec.expectedSerialPatterns) && challengeSpec.expectedSerialPatterns.length > 0) {
      for (const pattern of challengeSpec.expectedSerialPatterns) {
        if (!pattern) continue;
        try {
          const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
          if (!regex.test(serial) && !regex.test(code)) {
            return {
              passed: false,
              socraticHint: challengeSpec.socraticHint || `The serial monitor output should match: "${pattern}". Check your Serial.println statements.`
            };
          }
        } catch {
          if (!serial.toLowerCase().includes(String(pattern).toLowerCase()) && !code.toLowerCase().includes(String(pattern).toLowerCase())) {
            return {
              passed: false,
              socraticHint: challengeSpec.socraticHint || `The serial monitor should report "${pattern}".`
            };
          }
        }
      }
    }

    // 3. Check pin wiring state if specified
    if (challengeSpec.requiredPinState) {
      const { pin, state } = challengeSpec.requiredPinState;
      if (activePins[pin] !== undefined && activePins[pin] !== state) {
        return {
          passed: false,
          socraticHint: `Check pin ${pin}: it is currently ${activePins[pin]}, but was expected to be ${state}.`
        };
      }
    }

    return {
      passed: true,
      socraticPraise: challengeSpec.socraticPraise || 'Sensational! Your circuit and firmware passed all simulation checks.'
    };
  };
}

/**
 * Pre-loaded STEM & School Syllabus Templates for Instant 1-Click Generation
 */
export const PRELOADED_SYLLABUS_PRESETS = [
  {
    id: 'caltech-embedded-iot',
    institution: 'Caltech Robotics Lab & STEM Academy',
    title: 'Embedded Systems & Robotics with ESP32 / Arduino',
    domain: 'Embedded Systems & IoT',
    workspaceType: 'circuit',
    description: 'Hardware GPIO control, pulse-width modulation, ultrasonic distance sensing, and serial telemetry on real microcontrollers.',
    syllabusSnippet: `Unit 1: Microcontroller GPIOs & Digital Output (LEDs & Current-Limiting Resistors)
Unit 2: Analog Sensing & PWM Control (Light Sensors, Potentiometers & Servos)
Unit 3: I2C/SPI Sensor Telemetry & Ultrasonic Ranging (Distance Measurements)`,
    trackData: {
      id: 'caltech-embedded-iot',
      workspaceType: 'circuit',
      title: 'Caltech STEM: Embedded Systems & ESP32 / Arduino Robotics',
      subtitle: 'Hands-on hardware simulation, GPIO control, PWM, and sensor telemetry',
      icon: 'Cpu',
      domain: 'Hardware & Embedded IoT',
      isCustomGenerated: true,
      generatedFor: 'Caltech Robotics Lab & STEM Academy',
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
  // Initialize Serial communication at 115200 baud
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
            { id: 'uno', type: 'microcontroller', model: 'Arduino Uno', pins: { '13': 'HIGH', 'GND': '0V', '5V': '5V' } },
            { id: 'led1', type: 'led', color: '#ef4444', label: 'Status LED', pinConnected: '13', active: true },
            { id: 'r1', type: 'resistor', resistance: '220Ω', label: 'Current Limiter' }
          ],
          aiTimeline: [
            {
              timeOffset: 0,
              narration: "Welcome to Caltech Robotics! On your circuit canvas, we have an Arduino Uno wired to a red LED on Pin 13 through a 220-ohm current-limiting resistor.",
              file: 'sketch.ino',
              highlightLine: 8,
              cursorTarget: { type: 'ui', uiId: 'circuit-component-uno', label: 'Arduino Uno (Pin 13)' },
              codeSnapshot: `const int LED_PIN = 13;\n\nvoid setup() {\n  Serial.begin(115200);\n  Serial.println("System Initialized: Arduino Uno GPIO Ready");\n}`
            },
            {
              timeOffset: 4500,
              narration: "Microcontroller pins start in high-impedance input mode. Before driving current to the LED, we must call pinMode(LED_PIN, OUTPUT) inside setup().",
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
            socraticPraise: "Outstanding! You've mastered hardware GPIO configuration and digital switching on real microcontroller silicon.",
            socraticHint: "Remember: `pinMode(LED_PIN, OUTPUT);` belongs inside `setup()`, and `digitalWrite(LED_PIN, HIGH)` / `LOW` with `delay(500);` belongs in `loop()`."
          }
        },
        {
          id: 'circuit-mod-2-pwm-sensors',
          title: '2. Pulse-Width Modulation (PWM) & Servo Control',
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
// Log the percentage (dutyCycle * 100 / 255) to the Serial monitor!
void setActuatorPower(int dutyCycle) {
  
}

void loop() {
  // Sweep PWM from 0 to 255 in steps of 25
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
              narration: "Unlike digital pins that are strictly 0 or 1, PWM pins simulate analog voltage by rapidly pulsing between 0V and 5V. On the Uno, PWM pins are marked with a tilde.",
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
            conceptsTested: ['pwm', 'analogwrite', 'duty-cycle', 'actuators'],
            requiredPatterns: ['analogWrite\\s*\\(\\s*PWM_PIN', 'Serial\\.print'],
            expectedSerialPatterns: ['PWM Actuator', 'Power'],
            socraticPraise: "Excellent! PWM is the foundational signal protocol used to drive robotic motors, servos, and drone ESCs.",
            socraticHint: "Invoke `analogWrite(PWM_PIN, dutyCycle);` and call `Serial.print(\"Power: \"); Serial.println(dutyCycle);`."
          }
        }
      ]
    }
  },
  {
    id: 'stanford-fullstack-bootcamp',
    institution: 'Stanford Code Accelerator & Full-Stack Bootcamp',
    title: 'Modern Full-Stack Engineering & Microservices',
    domain: 'Full-Stack Software Engineering',
    workspaceType: 'code',
    description: 'Declarative component state, asynchronous API orchestration, and resilient backend middleware pipelines.',
    syllabusSnippet: `Module 1: Semantic DOM & State Hydration
Module 2: Asynchronous Microservice Gateways & Error Resilience
Module 3: In-Memory Caching & Distributed Webhook Pipelines`,
    trackData: null // synthesized dynamically via syllabus parser
  },
  {
    id: 'mit-vector-calculus',
    institution: 'MIT Department of Mathematics (18.02 OCW)',
    title: 'Multivariable Calculus, Vectors & Differential Geometry',
    domain: 'Applied & Pure Mathematics',
    workspaceType: 'math',
    description: 'Visual vector addition, dot & cross products, gradient vector fields, and instantaneous tangent planes on the Excalidraw Math Canvas.',
    syllabusSnippet: `Week 1: Vectors, Dot Products, and Linear Projections
Week 2: Cross Products & Normal Vectors in 3D Space
Week 3: Multivariable Derivatives & Tangent Planes`,
    trackData: null // synthesized dynamically via syllabus parser
  }
];

/**
 * Detects workspace modality from syllabus content and creator preference:
 * - 'circuit' (Arduino, ESP32, Wokwi, GPIO, electronics, microcontroller, robotics, sensors)
 * - 'math' (Calculus, vectors, algebra, geometry, physics, formulas, trigonometry)
 * - 'code' (JavaScript, Python, React, web, backend, APIs, algorithms, software engineering)
 */
export function detectWorkspaceModality(syllabusText = '', override = 'auto') {
  if (override && override !== 'auto' && ['code', 'math', 'circuit'].includes(override)) {
    return override;
  }

  const text = String(syllabusText || '').toLowerCase();

  // Circuit / Embedded keywords
  const circuitHits = (
    text.match(/\b(arduino|esp32|wokwi|circuit|circuits|microcontroller|gpio|breadboard|sensor|sensors|actuator|robotics|firmware|iot|pwm|adc|embedded systems|soldering|schematic|logic gates|resistor|led|transistor)\b/g) || []
  ).length;

  // Math keywords
  const mathHits = (
    text.match(/\b(calculus|vector|vectors|geometry|algebra|derivative|integral|tangent|matrix|matrices|trigonometry|theorem|cartesian|linear algebra|differential equations|functions|graphing|parabola)\b/g) || []
  ).length;

  // Code keywords
  const codeHits = (
    text.match(/\b(javascript|python|react|html|css|node|backend|frontend|api|rest|database|sql|algorithms|fullstack|git|json|async|await|functions|oop|class)\b/g) || []
  ).length;

  if (circuitHits > 0 && circuitHits >= mathHits && circuitHits >= codeHits) {
    return 'circuit';
  }
  if (mathHits > 0 && mathHits > codeHits) {
    return 'math';
  }
  return 'code';
}

/**
 * Procedural Fallback Track Synthesizer for Circuit / Embedded Workspaces
 */
export function synthesizeCircuitFallbackTrack({
  title = 'Embedded Systems & IoT Hardware Lab',
  institution = 'STEM Creator Lab',
  syllabusText = '',
  moduleCount = 3
}) {
  const cleanTitle = String(title).trim() || 'Embedded Systems & Robotics';
  const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'circuit-lab';
  const trackId = `${slug}-${Date.now().toString(36)}`;

  const preset = PRELOADED_SYLLABUS_PRESETS.find((p) => p.workspaceType === 'circuit');
  if (preset && preset.trackData) {
    return {
      ...preset.trackData,
      id: trackId,
      title: cleanTitle,
      subtitle: `Syllabus converted for ${institution} (Embedded Wokwi / Circuit Canvas)`,
      generatedFor: institution,
      generatedAt: new Date().toISOString()
    };
  }

  return {
    id: trackId,
    workspaceType: 'circuit',
    title: cleanTitle,
    subtitle: `Live Circuit & Embedded Workspace for ${institution}`,
    icon: 'Cpu',
    domain: 'Hardware & Embedded IoT',
    isCustomGenerated: true,
    generatedFor: institution,
    generatedAt: new Date().toISOString(),
    nodes: [
      {
        id: `${slug}-mod-1`,
        title: '1. Microcontroller Hardware Setup & GPIO Switching',
        category: 'Digital Electronics',
        status: 'in-progress',
        workspaceType: 'circuit',
        conceptTag: 'embedded-gpio',
        description: 'Configure microcontroller input/output pins, control digital signals, and inspect serial monitor telemetry.',
        targetFile: 'sketch.ino',
        microcontroller: 'arduino-uno',
        initialFiles: {
          'sketch.ino': `// Embedded Firmware Starter\nconst int STATUS_PIN = 13;\n\nvoid setup() {\n  Serial.begin(115200);\n  pinMode(STATUS_PIN, OUTPUT);\n  Serial.println("Hardware initialized successfully.");\n}\n\nvoid loop() {\n  // 👇 YOUR TURN: Drive STATUS_PIN HIGH, delay 500ms, drive LOW, delay 500ms\n  \n}\n`
        },
        aiTimeline: [
          {
            timeOffset: 0,
            narration: `Welcome to ${cleanTitle}! We have configured the microcontroller virtual circuit board and firmware pipeline.`,
            file: 'sketch.ino',
            highlightLine: 4,
            cursorTarget: { type: 'editor', line: 4, label: 'Pin 13 Output' }
          },
          {
            timeOffset: 4500,
            narration: 'Take over at line 10! Complete the loop cycle using digitalWrite and delay.',
            file: 'sketch.ino',
            highlightLine: 10,
            isChallengeStop: true,
            cursorTarget: { type: 'editor', line: 10, label: 'Your turn: Write loop()' }
          }
        ],
        challengeSpec: {
          prompt: 'Inside loop(), call digitalWrite(STATUS_PIN, HIGH), delay(500), digitalWrite(STATUS_PIN, LOW), and delay(500).',
          targetFile: 'sketch.ino',
          conceptsTested: ['gpio-output', 'digitalwrite', 'delays'],
          requiredPatterns: ['digitalWrite', 'delay'],
          expectedSerialPatterns: ['initialized'],
          socraticPraise: 'Great job! Your microcontroller firmware runs cleanly.',
          socraticHint: 'Use digitalWrite(STATUS_PIN, HIGH) and delay(500).'
        }
      }
    ]
  };
}

/**
 * Procedural Fallback Track Synthesizer for Math Workspaces
 */
export function synthesizeMathFallbackTrack({
  title = 'Applied Mathematics & Calculus Canvas',
  institution = 'STEM Academy',
  syllabusText = '',
  moduleCount = 3
}) {
  const cleanTitle = String(title).trim() || 'Calculus & Vector Mathematics';
  const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'math-canvas';
  const trackId = `${slug}-${Date.now().toString(36)}`;

  return {
    id: trackId,
    workspaceType: 'math',
    title: cleanTitle,
    subtitle: `Converted for ${institution} (Excalidraw Math Canvas)`,
    icon: 'Compass',
    domain: 'Pure & Applied Mathematics',
    isCustomGenerated: true,
    generatedFor: institution,
    generatedAt: new Date().toISOString(),
    nodes: [
      {
        id: `${slug}-mod-1`,
        title: '1. Vector Operations & Coordinate Geometry',
        category: 'Linear Algebra',
        status: 'in-progress',
        workspaceType: 'math',
        isMathBoard: true,
        conceptTag: 'vectors-geometry',
        description: 'Construct vector u = (3, 2), vector v = (1, 4), and verify the resultant vector u + v on the Excalidraw whiteboard.',
        targetFile: 'notes.math',
        initialBoard: {
          elements: [
            { id: 'vec-u', type: 'vector', x1: 0, y1: 0, x2: 3, y2: 2, color: '#38bdf8', label: 'u = (3, 2)' }
          ]
        },
        initialFiles: {
          'notes.math': `# Vector Addition\nu = (3, 2)\nv = (1, 4)\nResultant R = u + v = (4, 6)\n`
        },
        aiTimeline: [
          {
            timeOffset: 0,
            narration: 'Welcome to your Excalidraw Math Canvas! Vector u is plotted starting at the origin (0, 0).',
            file: 'notes.math',
            highlightLine: 2,
            cursorTarget: { type: 'ui', uiId: 'math-board-canvas', label: 'Vector u = (3, 2)' }
          },
          {
            timeOffset: 4500,
            narration: 'Select the Vector arrow tool from the toolbar and draw vector v from (3, 2) to (4, 6)!',
            file: 'notes.math',
            highlightLine: 4,
            isChallengeStop: true,
            cursorTarget: { type: 'ui', uiId: 'math-tool-vector', label: 'Draw vector v = (1, 4)' }
          }
        ],
        challengeSpec: {
          prompt: 'Use the Vector tool on your whiteboard to plot vector v = (1, 4) starting at (3, 2) and ending at (4, 6).',
          targetConcept: 'vectors',
          evaluateSubmission(code, runtimeOutput, boardData) {
            const count = boardData?.elements?.length || 0;
            if (count < 2) {
              return {
                passed: false,
                socraticHint: 'Select the vector tool on the board and connect the tip of u to (4, 6).'
              };
            }
            return {
              passed: true,
              socraticPraise: 'Well done! You constructed the vector resultant on the canvas.'
            };
          }
        }
      }
    ]
  };
}

/**
 * Main Autonomous Syllabus Transformation Engine
 * Accepts PDF File/Buffer or raw text from Schools, Bootcamps, or Creators,
 * extracts learning units and maps to Code IDE, Excalidraw Math, or Embedded Wokwi Circuit Canvas!
 */
export async function transformSyllabusToWorkspaceTrack({
  pdfFileOrBuffer = null,
  syllabusText = '',
  institutionName = 'STEM Creator / School',
  targetWorkspace = 'auto',
  experienceLevel = 'intermediate',
  moduleCount = 3,
  apiConfig = {},
  onProgress = null
}) {
  onProgress?.({ step: 1, label: 'Extracting text and structure from syllabus PDF…' });

  let extractedContent = String(syllabusText || '').trim();
  if (pdfFileOrBuffer) {
    try {
      const pdfText = await extractTextFromPdf(pdfFileOrBuffer);
      if (pdfText && pdfText.length > 20) {
        extractedContent = `${pdfText}\n\n${extractedContent}`.trim();
      }
    } catch (err) {
      console.warn('[SyllabusEngine] PDF extraction warning:', err.message);
    }
  }

  if (!extractedContent || extractedContent.length < 15) {
    extractedContent = 'Computer Science & Embedded IoT Syllabus: Microcontroller GPIO, async systems, circuit design, and reactive programming.';
  }

  // Determine workspace modality
  onProgress?.({ step: 2, label: 'Classifying STEM domain (Code IDE, Math Canvas, or Embedded Wokwi)…' });
  const determinedWorkspace = detectWorkspaceModality(extractedContent, targetWorkspace);

  // If circuit, build embedded circuit track
  if (determinedWorkspace === 'circuit') {
    onProgress?.({ step: 3, label: 'Synthesizing Embedded Wokwi / Circuit Canvas workspace with hardware schematic…' });

    const systemPrompt = `You are the Upskill Hardware & Embedded Curriculum AI.
Convert this STEM / electronics syllabus into an interactive Embedded Wokwi / Circuit Canvas course track for Arduino / ESP32.
Respond in valid JSON ONLY with no markdown formatting:
{
  "trackId": "kebab-case-slug",
  "title": "Clear Course Title",
  "subtitle": "Actionable Subtitle",
  "workspaceType": "circuit",
  "icon": "Cpu",
  "domain": "Embedded Systems & Robotics",
  "nodes": [
    {
      "id": "slug-mod-1",
      "title": "1. Lesson Title",
      "category": "GPIO & Actuators",
      "conceptTag": "kebab-concept",
      "workspaceType": "circuit",
      "description": "Hardware background and why this circuit connection matters.",
      "targetFile": "sketch.ino",
      "microcontroller": "arduino-uno",
      "initialFiles": {
        "sketch.ino": "// Complete, runnable Arduino C++ code with setup(), loop(), Serial.begin(115200), and '// 👇 YOUR TURN:'"
      },
      "aiTimeline": [
        {
          "timeOffset": 0,
          "narration": "Walkthrough of the circuit pins and microcontroller setup.",
          "file": "sketch.ino",
          "highlightLine": 5,
          "cursorTarget": { "type": "editor", "line": 5, "label": "Hardware Pin Config" }
        },
        {
          "timeOffset": 4500,
          "narration": "Challenge instructions for the student to write firmware and test simulation.",
          "file": "sketch.ino",
          "highlightLine": 12,
          "isChallengeStop": true,
          "cursorTarget": { "type": "editor", "line": 12, "label": "Your turn: implement logic" }
        }
      ],
      "challengeSpec": {
        "prompt": "Exact challenge task for student",
        "targetFile": "sketch.ino",
        "conceptsTested": ["gpio", "pinmode"],
        "requiredPatterns": ["pinMode", "digitalWrite"],
        "expectedSerialPatterns": ["Ready"],
        "socraticPraise": "Warm feedback explaining why their firmware works",
        "socraticHint": "Gentle hint without spoiling the answer"
      }
    }
  ]
}`;

    const userPrompt = `INSTITUTION / CREATOR: ${institutionName}
EXPERIENCE LEVEL: ${experienceLevel}
SYLLABUS TEXT:
${extractedContent.slice(0, 4000)}

Generate ${moduleCount} progressive embedded hardware modules. Return valid JSON only.`;

    try {
      const response = await callConfiguredLlm({
        systemPrompt,
        userPrompt,
        apiConfig,
        expectJson: true,
        temperature: 0.35
      });

      if (response && Array.isArray(response.nodes) && response.nodes.length > 0) {
        onProgress?.({ step: 4, label: 'Compiling Wokwi simulation evaluators and AI cursor paths…' });

        const trackId = response.trackId || `circuit-${Date.now().toString(36)}`;
        const normalizedNodes = response.nodes.map((node, idx) => {
          const spec = {
            ...node.challengeSpec,
            targetFile: node.targetFile || 'sketch.ino',
            requiredPatterns: node.challengeSpec?.requiredPatterns || ['pinMode'],
            expectedSerialPatterns: node.challengeSpec?.expectedSerialPatterns || []
          };
          spec.evaluateSubmission = compileCircuitEvaluator(spec);

          return {
            ...node,
            id: node.id || `${trackId}-mod-${idx + 1}`,
            status: idx === 0 ? 'in-progress' : 'locked',
            workspaceType: 'circuit',
            microcontroller: node.microcontroller || 'arduino-uno',
            challengeSpec: spec
          };
        });

        return {
          id: trackId,
          workspaceType: 'circuit',
          title: response.title || 'Embedded Systems & IoT Hardware Lab',
          subtitle: response.subtitle || `Interactive Circuit Canvas for ${institutionName}`,
          icon: 'Cpu',
          domain: response.domain || 'Embedded Systems & Robotics',
          isCustomGenerated: true,
          generatedFor: institutionName,
          generatedAt: new Date().toISOString(),
          nodes: normalizedNodes
        };
      }
    } catch (err) {
      console.warn('[SyllabusEngine] LLM circuit synthesis fallback:', err.message);
    }

    return synthesizeCircuitFallbackTrack({
      title: 'Embedded Systems & Robotics Lab',
      institution: institutionName,
      syllabusText: extractedContent,
      moduleCount
    });
  }

  // If math, build Excalidraw Math Canvas track
  if (determinedWorkspace === 'math') {
    onProgress?.({ step: 3, label: 'Synthesizing Excalidraw Math Canvas workspace with coordinate geometry…' });
    return synthesizeMathFallbackTrack({
      title: 'Multivariable Calculus & Geometry Canvas',
      institution: institutionName,
      syllabusText: extractedContent,
      moduleCount
    });
  }

  // Otherwise, build Code IDE track
  onProgress?.({ step: 3, label: 'Synthesizing Code IDE workspace with Scrimba cursor timeline…' });
  const { generateAiCourseFromUserInput } = await import('./lessonDevelopmentEngine.js');
  const codeTrack = await generateAiCourseFromUserInput({
    topic: 'Software Engineering Syllabus',
    domain: 'Software Engineering & Web',
    learnerProfile: { name: institutionName, priorExperience: experienceLevel },
    syllabusText: extractedContent,
    moduleCount,
    apiConfig,
    onProgress: (p) => onProgress?.({ step: p.step, label: p.label })
  });

  return {
    ...codeTrack,
    workspaceType: 'code',
    generatedFor: institutionName
  };
}

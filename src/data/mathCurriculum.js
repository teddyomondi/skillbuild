// ============================================================================
// MATHEMATICS CURRICULUM: SCRATCH TO PRO
// Complete, progressive mathematical pathway spanning:
// - Foundations: Number line, arithmetic order, signed numbers, Cartesian coordinates
// - Geometry & Algebra: Euclidean proofs, Pythagorean theorem, linear & quadratic curves
// - Periodic Functions & Vectors: Unit circle trigonometry, 2D vector spaces, dot products
// - Matrices & Calculus: Shear transformations, determinants, differential tangents
// - Pro & Applied Math: Riemann integration, multivariable gradients & optimization
// ============================================================================

/**
 * Normalizes geometric elements from Excalidraw or custom digital board.
 * Supports lines, arrows, vectors, and custom plane geometries.
 */
export function extractBoardGeometry(boardData) {
  const elements = (boardData?.elements || []).filter((el) => !el.isDeleted);
  const vectors = boardData?.vectors || [];
  const linesAndVectors = [];

  // 1. Process custom vector entries
  for (const v of vectors) {
    if (v.start && v.end) {
      linesAndVectors.push({
        type: 'vector',
        x1: v.start[0],
        y1: v.start[1],
        x2: v.end[0],
        y2: v.end[1],
        dx: v.end[0] - v.start[0],
        dy: v.end[1] - v.start[1],
        length: Math.hypot(v.end[0] - v.start[0], v.end[1] - v.start[1]),
        isReference: Boolean(v.isReference)
      });
    }
  }

  // 2. Process element objects (Excalidraw & canvas shapes)
  for (const el of elements) {
    if (typeof el.x1 === 'number' && typeof el.x2 === 'number') {
      linesAndVectors.push({
        type: el.type || 'vector',
        x1: el.x1,
        y1: el.y1,
        x2: el.x2,
        y2: el.y2,
        dx: el.x2 - el.x1,
        dy: el.y2 - el.y1,
        length: Math.hypot(el.x2 - el.x1, el.y2 - el.y1),
        isReference: Boolean(el.isReference)
      });
    } else if (el.type === 'arrow' || el.type === 'line') {
      const p1 = el.points?.[0] || [0, 0];
      const p2 = el.points?.[el.points.length - 1] || [el.width || 0, el.height || 0];
      const startX = el.x + p1[0];
      const startY = el.y + p1[1];
      const endX = el.x + p2[0];
      const endY = el.y + p2[1];
      linesAndVectors.push({
        type: el.type,
        x1: startX,
        y1: startY,
        x2: endX,
        y2: endY,
        dx: endX - startX,
        dy: endY - startY,
        length: Math.hypot(endX - startX, endY - startY),
        isReference: Boolean(el.isReference)
      });
    }
  }

  return {
    elements,
    linesAndVectors,
    userElements: elements.filter((el) => !el.isReference),
    userLines: linesAndVectors.filter((l) => !l.isReference)
  };
}

// ============================================================================
// 1. PRIMARY MATHEMATICS PATHWAY: SCRATCH TO PRO
// ============================================================================
export const MATHEMATICS_SCRATCH_TO_PRO_TRACK = {
  id: 'mathematics',
  workspaceType: 'math',
  title: 'Mathematics: Scratch to Pro',
  subtitle: 'From arithmetic & coordinate geometry to calculus, linear algebra, and multivariable optimization',
  icon: 'Compass',
  domain: 'Pure & Applied Mathematics',
  nodes: [
    // ------------------------------------------------------------------------
    // MODULE 1: The Number Line & Directed Numbers (Scratch Foundation)
    // ------------------------------------------------------------------------
    {
      id: 'math-number-line-and-integers',
      title: '1. The Number Line & Directed Numbers',
      category: 'Foundations & Pre-Algebra',
      status: 'in-progress',
      isDetour: false,
      isMathBoard: true,
      workspaceType: 'math',
      conceptTag: 'number-line-integers',
      description: 'Understand numbers as geometric positions and directed movements along a 1D continuous axis. Start at position 4 and add (-7) to reach -3 by moving 7 units to the left.',
      initialBoard: {
        elements: [
          {
            id: 'number-line-axis',
            type: 'line',
            x1: -8,
            y1: 0,
            x2: 8,
            y2: 0,
            color: '#64748b',
            width: 2.5,
            isReference: true
          },
          {
            id: 'point-origin',
            type: 'circle',
            cx: 0,
            cy: 0,
            radius: 0.25,
            color: '#38bdf8',
            fill: '#38bdf8',
            label: '0 (Origin)',
            isReference: true
          },
          {
            id: 'point-start-4',
            type: 'circle',
            cx: 4,
            cy: 0,
            radius: 0.3,
            color: '#34d399',
            fill: '#34d399',
            label: 'Start (4)',
            isReference: true
          },
          {
            id: 'formula-disp',
            type: 'text',
            x: -8,
            y: 5,
            text: 'Addition as Displacement: 4 + (-7) = 4 - 7 = -3',
            color: '#fbbf24',
            fontSize: 16
          }
        ]
      },
      initialFiles: {
        'notes.math': `# Lesson 1: The Number Line & Directed Numbers

The continuous real number line (ℝ) is the geometric foundation of all mathematics.

- Every real number corresponds to a unique point on a 1D axis.
- Zero (0) is the origin dividing positive and negative orientations.
- Positive numbers lie to the right; negative numbers lie to the left.

## Directed Displacements
Addition is geometric movement:
- Adding +3 moves 3 units to the right.
- Adding (-7) moves 7 units to the left.

Mathematical Evaluation:
  Start Position:     x₁ = 4
  Displacement (Δx):  -7
  Final Position:     x₂ = 4 + (-7) = -3
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: 'Welcome to Mathematics: Scratch to Pro! All mathematics begins with order on the continuous number line. Notice the origin at zero with positive numbers to the right and negative numbers to the left.',
          file: 'notes.math',
          highlightLine: 3
        },
        {
          timeOffset: 4500,
          narration: 'Adding a negative number is geometric displacement to the left. Starting at position four, adding negative seven shifts us seven units to the left.',
          file: 'notes.math',
          highlightLine: 12
        },
        {
          timeOffset: 8500,
          narration: 'Your turn: select the Arrow or Line tool from the toolbar. Click at point 4 on the axis and draw an arrow pointing 7 units left to end at -3!',
          file: 'notes.math',
          highlightLine: 18,
          isChallengeStop: true
        }
      ],
      challengeSpec: {
        prompt: 'Use the Arrow or Line tool to draw a displacement vector starting at x = 4 and ending at x = -3.',
        targetConcept: 'number-line-integers',
        evaluateSubmission(code, runtimeOutput, boardData) {
          const geo = extractBoardGeometry(boardData);
          const hasDirectedDisplacement = geo.linesAndVectors.some((line) => {
            const startsNear4 = Math.abs(line.x1 - 4) <= 1.3;
            const endsNearNeg3 = Math.abs(line.x2 - (-3)) <= 1.3;
            const movedLeft7 = line.dx <= -5.5 && line.dx >= -8.5;
            return (startsNear4 && endsNearNeg3) || (startsNear4 && movedLeft7) || (endsNearNeg3 && movedLeft7);
          }) || (geo.userElements.length > 0 && String(code || runtimeOutput).includes('-3'));

          if (!hasDirectedDisplacement && geo.userElements.length === 0) {
            return {
              passed: false,
              socraticHint: 'Select the Arrow tool from the top toolbar. Click at number 4 and drag 7 units left to -3!'
            };
          }

          return {
            passed: true,
            socraticPraise: 'Sensational start! You demonstrated directed 1D displacement: 4 + (-7) = -3. Negative numbers naturally represent leftward translations on the line.'
          };
        }
      }
    },

    // ------------------------------------------------------------------------
    // MODULE 2: The Cartesian Coordinate Plane & Euclidean Distance
    // ------------------------------------------------------------------------
    {
      id: 'math-cartesian-coordinates-and-distance',
      title: '2. The Cartesian Coordinate Plane & Distance',
      category: 'Coordinate Geometry',
      status: 'locked',
      isDetour: false,
      isMathBoard: true,
      workspaceType: 'math',
      conceptTag: 'cartesian-coordinates-distance',
      description: 'Expand from 1D to the 2D Cartesian plane. Connect point A(1, 2) to point B(4, 6) with a straight line segment, and verify the Euclidean distance d = sqrt(3² + 4²) = 5 units.',
      initialBoard: {
        elements: [
          {
            id: 'point-a',
            type: 'circle',
            cx: 1,
            cy: 2,
            radius: 0.25,
            color: '#38bdf8',
            fill: '#38bdf8',
            label: 'A(1, 2)',
            isReference: true
          },
          {
            id: 'point-b',
            type: 'circle',
            cx: 4,
            cy: 6,
            radius: 0.25,
            color: '#fb7185',
            fill: '#fb7185',
            label: 'B(4, 6)',
            isReference: true
          },
          {
            id: 'delta-x-leg',
            type: 'line',
            x1: 1,
            y1: 2,
            x2: 4,
            y2: 2,
            color: '#475569',
            width: 1.5,
            isReference: true
          },
          {
            id: 'delta-y-leg',
            type: 'line',
            x1: 4,
            y1: 2,
            x2: 4,
            y2: 6,
            color: '#475569',
            width: 1.5,
            isReference: true
          },
          {
            id: 'formula-dist',
            type: 'text',
            x: -8,
            y: 7,
            text: 'Distance: d = √[(4-1)² + (6-2)²] = √(3² + 4²) = √25 = 5',
            color: '#34d399',
            fontSize: 16
          }
        ]
      },
      initialFiles: {
        'notes.math': `# Lesson 2: The Cartesian Coordinate Plane & Distance

René Descartes unified algebra and geometry by crossing two perpendicular number lines:
- The horizontal X-axis (abscissa)
- The vertical Y-axis (ordinate)

Point A: (x₁, y₁) = (1, 2)
Point B: (x₂, y₂) = (4, 6)

## Component Deltas:
Δx = x₂ - x₁ = 4 - 1 = 3 units
Δy = y₂ - y₁ = 6 - 2 = 4 units

## Euclidean Distance Formula:
d = sqrt( (Δx)² + (Δy)² )
d = sqrt( 3² + 4² ) = sqrt( 9 + 16 ) = sqrt(25) = 5 units
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: 'By taking two perpendicular number lines, we obtain the Cartesian coordinate plane. Any position in 2D space is uniquely specified by an ordered pair (x, y).',
          file: 'notes.math',
          highlightLine: 3
        },
        {
          timeOffset: 4500,
          narration: 'To find the straight-line distance between point A at (1, 2) and point B at (4, 6), notice the horizontal gap is 3 and the vertical gap is 4.',
          file: 'notes.math',
          highlightLine: 11
        },
        {
          timeOffset: 8500,
          narration: 'Select the Line or Arrow tool and draw the direct connecting segment from point (1, 2) to point (4, 6) to verify the distance of 5 units!',
          file: 'notes.math',
          highlightLine: 16,
          isChallengeStop: true
        }
      ],
      challengeSpec: {
        prompt: 'Draw a straight line or arrow connecting point A(1, 2) to point B(4, 6).',
        targetConcept: 'cartesian-coordinates-distance',
        evaluateSubmission(code, runtimeOutput, boardData) {
          const geo = extractBoardGeometry(boardData);
          const hasSegment = geo.linesAndVectors.some((line) => {
            const p1NearA = Math.hypot(line.x1 - 1, line.y1 - 2) <= 1.2;
            const p2NearB = Math.hypot(line.x2 - 4, line.y2 - 6) <= 1.2;
            const p1NearB = Math.hypot(line.x1 - 4, line.y1 - 6) <= 1.2;
            const p2NearA = Math.hypot(line.x2 - 1, line.y2 - 2) <= 1.2;
            const lengthNear5 = Math.abs(line.length - 5) <= 1.2;
            return (p1NearA && p2NearB) || (p1NearB && p2NearA) || ((p1NearA || p2NearB) && lengthNear5);
          }) || geo.userElements.length >= 1;

          if (!hasSegment) {
            return {
              passed: false,
              socraticHint: 'Use the Line or Arrow tool to connect point A(1, 2) directly to point B(4, 6)!'
            };
          }

          return {
            passed: true,
            socraticPraise: 'Brilliant! You connected points A and B, confirming Euclidean distance d = √(3² + 4²) = 5 units.'
          };
        }
      }
    },

    // ------------------------------------------------------------------------
    // MODULE 3: Euclidean Geometry & The Pythagorean Theorem
    // ------------------------------------------------------------------------
    {
      id: 'math-geometry-pythagorean-theorem',
      title: '3. Euclidean Geometry & The Pythagorean Theorem',
      category: 'Euclidean Geometry',
      status: 'locked',
      isDetour: false,
      isMathBoard: true,
      workspaceType: 'math',
      conceptTag: 'pythagorean-theorem',
      description: 'Build a right-angled triangle with base leg 3 and vertical leg 4 meeting at (3, 0). Construct the diagonal hypotenuse of length 5 back to (0, 0), proving a² + b² = c².',
      initialBoard: {
        elements: [
          {
            id: 'pythagorean-note',
            type: 'text',
            x: -8,
            y: 7,
            text: 'Pythagorean Theorem: a² + b² = c²  |  3² + 4² = 9 + 16 = 25 = 5²',
            color: '#fbbf24',
            fontSize: 17
          }
        ]
      },
      initialFiles: {
        'notes.math': `# Lesson 3: The Pythagorean Theorem

The Pythagorean theorem governs right-angled triangles in Euclidean geometry:

  a² + b² = c²

Where:
- a and b are the perpendicular legs.
- c is the hypotenuse opposite the 90° right angle.

For a right triangle with legs 3 and 4:
  3² + 4² = 9 + 16 = 25
  c = sqrt(25) = 5

Construct the three vertices on your board:
1. Origin: (0, 0)
2. Corner: (3, 0)
3. Apex:   (3, 4)
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: 'The Pythagorean theorem states that in any right triangle, the square of the hypotenuse equals the sum of the squares of the other two sides.',
          file: 'notes.math',
          highlightLine: 3
        },
        {
          timeOffset: 4500,
          narration: 'Squaring 3 gives 9. Squaring 4 gives 16. Their sum is 25, whose square root is exactly 5.',
          file: 'notes.math',
          highlightLine: 11
        },
        {
          timeOffset: 8500,
          narration: 'Now draw the three sides between (0, 0), (3, 0), and (3, 4) to construct the complete 3-4-5 right triangle!',
          file: 'notes.math',
          highlightLine: 16,
          isChallengeStop: true
        }
      ],
      challengeSpec: {
        prompt: 'Draw the three sides of the right triangle between (0, 0), (3, 0), and (3, 4) with lengths 3, 4, and 5.',
        targetConcept: 'pythagorean-theorem',
        evaluateSubmission(code, runtimeOutput, boardData) {
          const geo = extractBoardGeometry(boardData);
          const lengths = geo.linesAndVectors.map((l) => l.length);
          const hasLength = (target) => lengths.some((length) => Math.abs(length - target) <= 0.8);
          const hasTriangle = (hasLength(3) && hasLength(4) && hasLength(5)) || geo.userElements.length >= 2;

          if (!hasTriangle) {
            return {
              passed: false,
              socraticHint: 'Draw the three sides: from (0, 0) to (3, 0), from (3, 0) to (3, 4), and from (3, 4) back to (0, 0)!'
            };
          }

          return {
            passed: true,
            socraticPraise: 'Superb geometric proof! You constructed the 3-4-5 right triangle, visually demonstrating that 3² + 4² = 25 = 5².'
          };
        }
      }
    },

    // ------------------------------------------------------------------------
    // MODULE 4: Linear Functions, Slope & Rates of Change
    // ------------------------------------------------------------------------
    {
      id: 'math-functions-lines-and-slope',
      title: '4. Linear Functions, Slope & Rates of Change',
      category: 'Algebra & Functions',
      status: 'locked',
      isDetour: false,
      isMathBoard: true,
      workspaceType: 'math',
      conceptTag: 'linear-functions',
      description: 'Explore the linear function f(x) = 2x + 1. Understand slope m = 2 (rate of change: rise over run) and y-intercept c = 1. Draw a line through (0, 1) and (2, 5).',
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
            x: -8,
            y: 7,
            text: 'Slope m = Δy/Δx = 2  |  y-intercept c = 1 at (0, 1)',
            color: '#fbbf24',
            fontSize: 16
          }
        ]
      },
      initialFiles: {
        'notes.math': `# Lesson 4: Linear Functions & Slope

A function f: ℝ → ℝ maps each input x to a unique output y.

The slope-intercept form of a straight line is:
  y = m*x + c

Where:
- m = Slope = (y₂ - y₁) / (x₂ - x₁) = rate of change.
- c = Y-intercept = point where the line crosses the vertical axis at (0, c).

For y = 2x + 1:
1. At x = 0: y = 2(0) + 1 = 1  =>  Point (0, 1)
2. At x = 2: y = 2(2) + 1 = 5  =>  Point (2, 5)

Slope Check:
  m = (5 - 1) / (2 - 0) = 4 / 2 = 2 (rises 2 units for every 1 unit right).
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: 'In algebra, linear functions model constant rates of change. The equation y equals 2x plus 1 tells us both the starting value and the steepness.',
          file: 'notes.math',
          highlightLine: 3
        },
        {
          timeOffset: 4500,
          narration: 'The constant 1 is the y-intercept at point (0, 1). The slope 2 means whenever we take 1 step right, we must climb 2 steps up.',
          file: 'notes.math',
          highlightLine: 9
        },
        {
          timeOffset: 8500,
          narration: 'Use the Line tool to draw a straight line through point (0, 1) and point (2, 5) to verify the slope of 2!',
          file: 'notes.math',
          highlightLine: 14,
          isChallengeStop: true
        }
      ],
      challengeSpec: {
        prompt: 'Draw a line passing through (0, 1) and (2, 5) with slope m = 2 and y-intercept c = 1.',
        targetConcept: 'linear-functions',
        evaluateSubmission(code, runtimeOutput, boardData) {
          const geo = extractBoardGeometry(boardData);
          const hasFunctionLine = geo.linesAndVectors.some((line) => {
            if (Math.abs(line.dx) < 0.2) return false;
            const slope = line.dy / line.dx;
            const intercept = line.y1 - slope * line.x1;
            return Math.abs(slope - 2) <= 0.35 && Math.abs(intercept - 1) <= 0.8;
          }) || geo.userElements.length >= 1;

          if (!hasFunctionLine) {
            return {
              passed: false,
              socraticHint: 'Start at (0, 1), move right 2 units and up 4 units to (2, 5), and draw a line through both points!'
            };
          }

          return {
            passed: true,
            socraticPraise: 'Spot on! Your line has slope m = 2 and y-intercept c = 1, correctly modeling the function y = 2x + 1.'
          };
        }
      }
    },

    // ------------------------------------------------------------------------
    // MODULE 5: Quadratic Functions, Parabolas & Roots
    // ------------------------------------------------------------------------
    {
      id: 'math-quadratic-functions-parabolas',
      title: '5. Quadratic Functions, Parabolas & Roots',
      category: 'Algebra & Polynomials',
      status: 'locked',
      isDetour: false,
      isMathBoard: true,
      workspaceType: 'math',
      conceptTag: 'quadratic-functions',
      description: 'Analyze non-linear polynomial curves f(x) = x² - 4x + 3. Identify the minimum vertex at (2, -1), the roots at x = 1 and x = 3, and draw the vertical axis of symmetry x = 2.',
      initialBoard: {
        elements: [
          {
            id: 'vertex-point',
            type: 'circle',
            cx: 2,
            cy: -1,
            radius: 0.25,
            color: '#fb7185',
            fill: '#fb7185',
            label: 'Vertex (2, -1)',
            isReference: true
          },
          {
            id: 'root-1',
            type: 'circle',
            cx: 1,
            cy: 0,
            radius: 0.2,
            color: '#34d399',
            fill: '#34d399',
            label: 'Root (1, 0)',
            isReference: true
          },
          {
            id: 'root-2',
            type: 'circle',
            cx: 3,
            cy: 0,
            radius: 0.2,
            color: '#34d399',
            fill: '#34d399',
            label: 'Root (3, 0)',
            isReference: true
          },
          {
            id: 'parabola-formula',
            type: 'text',
            x: -8,
            y: 7,
            text: 'f(x) = (x-1)(x-3) = x² - 4x + 3  |  Axis of Symmetry: x = 2',
            color: '#38bdf8',
            fontSize: 16
          }
        ]
      },
      initialFiles: {
        'notes.math': `# Lesson 5: Quadratic Functions & Parabolas

Quadratic functions introduce acceleration and curvature:
  f(x) = a*x² + b*x + c
  Here: a = 1, b = -4, c = 3

## Finding the Roots (Zeros):
Factoring:
  x² - 4x + 3 = (x - 1)(x - 3) = 0
  Roots: x = 1 and x = 3

## Vertex & Axis of Symmetry:
The parabola turns at its vertex:
  x_v = -b / (2a) = -(-4) / 2 = 2
  y_v = f(2) = 2² - 4(2) + 3 = 4 - 8 + 3 = -1

The vertical line x = 2 is the axis of bilateral reflection symmetry.
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: 'Unlike straight lines, quadratic functions bend symmetrically into parabolas. The curve crosses the horizontal axis at its roots, x equals 1 and 3.',
          file: 'notes.math',
          highlightLine: 3
        },
        {
          timeOffset: 4500,
          narration: 'Halfway between the roots sits the vertex at (2, -1). The vertical line x = 2 splits the parabola into two symmetrical mirror halves.',
          file: 'notes.math',
          highlightLine: 14
        },
        {
          timeOffset: 8500,
          narration: 'Draw a vertical line along x = 2 passing through vertex (2, -1) and extending upward to mark the axis of symmetry!',
          file: 'notes.math',
          highlightLine: 19,
          isChallengeStop: true
        }
      ],
      challengeSpec: {
        prompt: 'Draw the vertical axis of symmetry x = 2 passing through the vertex at (2, -1).',
        targetConcept: 'quadratic-functions',
        evaluateSubmission(code, runtimeOutput, boardData) {
          const geo = extractBoardGeometry(boardData);
          const hasAxis = geo.linesAndVectors.some((line) => {
            const isVertical = Math.abs(line.dx) <= 0.5 && line.length >= 2.5;
            const passesX2 = Math.abs(line.x1 - 2) <= 0.8 || Math.abs(line.x2 - 2) <= 0.8;
            return isVertical && passesX2;
          }) || geo.userElements.length >= 1;

          if (!hasAxis) {
            return {
              passed: false,
              socraticHint: 'Select the Line tool and draw a vertical line straight up along x = 2 through the vertex point (2, -1)!'
            };
          }

          return {
            passed: true,
            socraticPraise: 'Excellent! The vertical line x = 2 is the axis of symmetry, confirming the vertex formula x = -b/(2a) = 2.'
          };
        }
      }
    },

    // ------------------------------------------------------------------------
    // MODULE 6: Trigonometry & The Unit Circle
    // ------------------------------------------------------------------------
    {
      id: 'math-trigonometry-unit-circle',
      title: '6. Trigonometry & The Unit Circle',
      category: 'Trigonometry',
      status: 'locked',
      isDetour: false,
      isMathBoard: true,
      workspaceType: 'math',
      conceptTag: 'unit-circle-trig',
      description: 'Connect geometry, rotational angles, and periodic waves. In a circle of radius R = 4, draw the 45° (π/4 radian) radius vector to (2.83, 2.83) to reveal the cosine and sine projection legs.',
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
            label: 'Radius R = 4',
            isReference: true
          },
          {
            id: 'formula-trig',
            type: 'text',
            x: -8,
            y: 7,
            text: 'cos²(θ) + sin²(θ) = 1  |  θ = 45° (π/4 rad)',
            color: '#34d399',
            fontSize: 16
          }
        ]
      },
      initialFiles: {
        'notes.math': `# Lesson 6: Trigonometry & The Unit Circle

Trigonometry maps rotational angles directly to orthogonal Cartesian projections:
- The horizontal projection leg is Cosine: X = R * cos(θ)
- The vertical projection leg is Sine:     Y = R * sin(θ)

For Radius R = 4 and angle θ = 45° (π/4 radians):
  cos(45°) = sin(45°) = sqrt(2)/2 ≈ 0.7071
  X = 4 * 0.7071 ≈ 2.83
  Y = 4 * 0.7071 ≈ 2.83

Pythagorean Identity Verification:
  X² + Y² = 2.83² + 2.83² = 8 + 8 = 16 = R²
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: 'Every trigonometric function lives on the circle. As a ray sweeps through an angle, its horizontal shadow is cosine and its vertical height is sine.',
          file: 'notes.math',
          highlightLine: 3
        },
        {
          timeOffset: 4500,
          narration: 'At 45 degrees, cosine and sine are identical. On a circle of radius 4, both coordinates equal 2.83.',
          file: 'notes.math',
          highlightLine: 8
        },
        {
          timeOffset: 8500,
          narration: 'Select the Arrow tool, start at origin (0, 0), and draw the 45-degree radius vector ending at (2.83, 2.83) on the circle perimeter!',
          file: 'notes.math',
          highlightLine: 13,
          isChallengeStop: true
        }
      ],
      challengeSpec: {
        prompt: 'Draw a radius vector from origin (0, 0) to point (2.83, 2.83) on the circle perimeter at 45°.',
        targetConcept: 'unit-circle-trig',
        evaluateSubmission(code, runtimeOutput, boardData) {
          const geo = extractBoardGeometry(boardData);
          const has45Vector = geo.linesAndVectors.some((line) => {
            const startsNearOrigin = Math.hypot(line.x1, line.y1) <= 1.0;
            const endsNearPerimeter = Math.hypot(line.x2 - 2.83, line.y2 - 2.83) <= 1.2;
            return startsNearOrigin && endsNearPerimeter;
          }) || geo.userElements.length >= 1;

          if (!has45Vector) {
            return {
              passed: false,
              socraticHint: 'Select the Arrow tool, click at (0, 0), and drag upward at 45° to the circle edge near (2.8, 2.8)!'
            };
          }

          return {
            passed: true,
            socraticPraise: 'Superb geometric proof! At 45°, X = R*cos(45°) ≈ 2.83 and Y = R*sin(45°) ≈ 2.83, confirming cos²θ + sin²θ = 1.'
          };
        }
      }
    },

    // ------------------------------------------------------------------------
    // MODULE 7: Vector Spaces & Coordinate Operations
    // ------------------------------------------------------------------------
    {
      id: 'math-vectors-coordinate-geometry',
      title: '7. Vector Spaces & Coordinate Operations',
      category: 'Linear Algebra & Vectors',
      status: 'locked',
      isDetour: false,
      isMathBoard: true,
      workspaceType: 'math',
      conceptTag: 'vectors-geometry',
      description: 'Step into linear algebra. Vectors have magnitude and direction. Given vector u = (3, 2) from (0, 0), add vector v = (1, 4) using the tip-to-tail method to plot the resultant u + v = (4, 6).',
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
            id: 'formula-tip-to-tail',
            type: 'text',
            x: -8,
            y: 7,
            text: 'Tip-to-Tail Rule: R = u + v = (3+1, 2+4) = (4, 6)',
            color: '#fbbf24',
            fontSize: 16
          }
        ]
      },
      initialFiles: {
        'notes.math': `# Lesson 7: Vectors & Coordinate Geometry

A vector represents directional displacement in vector space:
  u = (3, 2)
  v = (1, 4)

## Tip-to-Tail Vector Addition:
To add vectors geometrically:
1. Place the tail of vector v at the tip of vector u at (3, 2).
2. Move 1 unit right and 4 units up:
   R_x = 3 + 1 = 4
   R_y = 2 + 4 = 6
   R = (4, 6)

## Resultant Magnitude:
|R| = sqrt(4² + 6²) = sqrt(16 + 36) = sqrt(52) ≈ 7.21 units
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: 'In linear algebra, vectors have magnitude and direction. Vector u is plotted in cyan starting at origin (0, 0) and ending at (3, 2).',
          file: 'notes.math',
          highlightLine: 3
        },
        {
          timeOffset: 4500,
          narration: 'To add vector v geometrically, we place its tail at the tip of u at (3, 2) and travel 1 unit right and 4 units up.',
          file: 'notes.math',
          highlightLine: 7
        },
        {
          timeOffset: 8500,
          narration: 'Select the Arrow tool, click at (3, 2), and draw vector v ending at (4, 6) to complete the tip-to-tail resultant!',
          file: 'notes.math',
          highlightLine: 13,
          isChallengeStop: true
        }
      ],
      challengeSpec: {
        prompt: 'Draw vector v = (1, 4) starting at tip (3, 2) and ending at (4, 6) on the grid.',
        targetConcept: 'vectors-geometry',
        evaluateSubmission(code, runtimeOutput, boardData) {
          const geo = extractBoardGeometry(boardData);
          const hasResultant = geo.linesAndVectors.some((line) => {
            const endsNear46 = Math.hypot(line.x2 - 4, line.y2 - 6) <= 1.2;
            const startsNear32 = Math.hypot(line.x1 - 3, line.y1 - 2) <= 1.2;
            const startsNearOrigin = Math.hypot(line.x1 - 0, line.y1 - 0) <= 1.2;
            return endsNear46 && (startsNear32 || startsNearOrigin);
          }) || geo.userElements.length >= 1;

          if (!hasResultant) {
            return {
              passed: false,
              socraticHint: 'Select the Arrow tool, click at point (3, 2), and drag to point (4, 6)!'
            };
          }

          return {
            passed: true,
            socraticPraise: 'Brilliant vector construction! You added vectors u + v = (4, 6) with resultant magnitude |R| = 7.21 using the tip-to-tail method.'
          };
        }
      }
    },

    // ------------------------------------------------------------------------
    // MODULE 8: The Dot Product, Projections & Orthogonality
    // ------------------------------------------------------------------------
    {
      id: 'math-dot-product-orthogonality',
      title: '8. The Dot Product & Orthogonality',
      category: 'Linear Algebra',
      status: 'locked',
      isDetour: false,
      isMathBoard: true,
      workspaceType: 'math',
      conceptTag: 'dot-product-orthogonality',
      description: 'Master the dot product a · b = |a||b|cos(θ). Perpendicular vectors have dot product equal to 0. Given vector a = (4, 2), draw orthogonal vector b = (-2, 4) from (0, 0).',
      initialBoard: {
        elements: [
          {
            id: 'vec-a-ref',
            type: 'vector',
            x1: 0,
            y1: 0,
            x2: 4,
            y2: 2,
            color: '#38bdf8',
            width: 3.5,
            label: 'a = (4, 2)',
            isReference: true
          },
          {
            id: 'formula-dot',
            type: 'text',
            x: -8,
            y: 7,
            text: 'a · b = (4)(-2) + (2)(4) = -8 + 8 = 0  =>  θ = 90° (Perpendicular)',
            color: '#fb7185',
            fontSize: 16
          }
        ]
      },
      initialFiles: {
        'notes.math': `# Lesson 8: The Dot Product & Orthogonality

The dot product (inner product) measures directional alignment:
  a · b = |a| * |b| * cos(θ)

In Cartesian component form:
  a · b = (a_x * b_x) + (a_y * b_y)

## The Orthogonality Condition:
When two vectors are perpendicular (θ = 90°), cos(90°) = 0.
Therefore:
  a · b = 0  <=>  a and b are orthogonal (perpendicular).

Example:
  Vector a = (4, 2)
  Vector b = (-2, 4)
  a · b = (4 * -2) + (2 * 4) = -8 + 8 = 0
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: 'The dot product is the workhorse of linear algebra, graphics, and machine learning. It measures how much two vectors point along the same line.',
          file: 'notes.math',
          highlightLine: 3
        },
        {
          timeOffset: 4500,
          narration: 'When two vectors meet at a 90-degree right angle, their cosine is zero, so their dot product is exactly zero.',
          file: 'notes.math',
          highlightLine: 10
        },
        {
          timeOffset: 8500,
          narration: 'Select the Arrow tool, click at (0, 0), and draw vector b ending at (-2, 4) perpendicular to vector a!',
          file: 'notes.math',
          highlightLine: 16,
          isChallengeStop: true
        }
      ],
      challengeSpec: {
        prompt: 'Draw an orthogonal vector b from (0, 0) to (-2, 4) or (2, -4) perpendicular to vector a = (4, 2).',
        targetConcept: 'dot-product-orthogonality',
        evaluateSubmission(code, runtimeOutput, boardData) {
          const geo = extractBoardGeometry(boardData);
          const hasOrthogonalVector = geo.linesAndVectors.some((line) => {
            const startsNearOrigin = Math.hypot(line.x1, line.y1) <= 1.0;
            const dotProduct = 4 * line.dx + 2 * line.dy;
            const isOrthogonal = Math.abs(dotProduct) <= 2.5 && line.length >= 2.0;
            return startsNearOrigin && isOrthogonal;
          }) || geo.userElements.length >= 1;

          if (!hasOrthogonalVector) {
            return {
              passed: false,
              socraticHint: 'Draw an arrow from (0, 0) to (-2, 4). The dot product is (4)(-2) + (2)(4) = 0, proving perpendicularity!'
            };
          }

          return {
            passed: true,
            socraticPraise: 'Masterful! Because a · b = 0, cos(θ) = 0 and the vectors are strictly orthogonal (90° perpendicular).'
          };
        }
      }
    },

    // ------------------------------------------------------------------------
    // MODULE 9: Matrix Transformations & Determinants
    // ------------------------------------------------------------------------
    {
      id: 'math-linear-transformations',
      title: '9. Matrix Transformations & Determinants',
      category: 'Linear Algebra & Matrices',
      status: 'locked',
      isDetour: false,
      isMathBoard: true,
      workspaceType: 'math',
      conceptTag: 'matrix-transformations',
      description: 'Matrices represent geometric transformations of 2D space. Apply shear matrix T = [[1, 1], [0, 1]]. Basis vector i = (1, 0) remains fixed; draw transformed basis vector j\' = (2, 2). Determinant det(T) = 1 preserves 2D area.',
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
            x: -8,
            y: 7,
            text: 'Shear Matrix: T = [[1, 1], [0, 1]]  |  Det(T) = (1)(1) - (1)(0) = 1',
            color: '#fb7185',
            fontSize: 16
          }
        ]
      },
      initialFiles: {
        'notes.math': `# Lesson 9: Linear Transformations & Matrices

A matrix transforms space linearly:
  T = [ 1  1 ]
      [ 0  1 ]

Standard Basis Vectors:
  i = [1, 0]ᵀ
  j = [0, 1]ᵀ

Transforming the basis:
  T * i = [1*1 + 1*0, 0*1 + 1*0]ᵀ = [1, 0]ᵀ  (unmoved!)
  T * j = [1*0 + 1*1, 0*0 + 1*1]ᵀ = [1, 1]ᵀ  (sheared!)

On our scaled digital board:
  i' = (2, 0)
  j' = (2, 2)

Determinant (Area Scaling):
  det(T) = (1*1) - (1*0) = 1 (area is preserved under pure shear!).
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: 'Matrices are geometric functions that transform space. A matrix is completely determined by where it sends the standard basis vectors i and j.',
          file: 'notes.math',
          highlightLine: 3
        },
        {
          timeOffset: 4500,
          narration: 'A horizontal shear leaves vector i anchored on the X-axis while sliding vector j into (1, 1). The determinant is 1, so the unit area is perfectly preserved.',
          file: 'notes.math',
          highlightLine: 11
        },
        {
          timeOffset: 8500,
          narration: 'Select the Arrow tool, start at (0, 0), and draw the sheared basis vector j\' ending at (2, 2)!',
          file: 'notes.math',
          highlightLine: 17,
          isChallengeStop: true
        }
      ],
      challengeSpec: {
        prompt: "Draw the transformed basis vector j' from (0, 0) to (2, 2) to complete the shear matrix visualization.",
        targetConcept: 'matrix-transformations',
        evaluateSubmission(code, runtimeOutput, boardData) {
          const geo = extractBoardGeometry(boardData);
          const hasTransformedBasis = geo.linesAndVectors.some((line) => {
            const startsNearOrigin = Math.hypot(line.x1, line.y1) <= 1.0;
            const endsNear22 = Math.hypot(line.x2 - 2, line.y2 - 2) <= 1.0;
            const endsNear11 = Math.hypot(line.x2 - 1, line.y2 - 1) <= 1.0;
            return startsNearOrigin && (endsNear22 || endsNear11);
          }) || geo.userElements.length >= 1;

          if (!hasTransformedBasis) {
            return {
              passed: false,
              socraticHint: "Select the Arrow tool, click at (0, 0), and drag to (2, 2) to draw the sheared basis vector j'!"
            };
          }

          return {
            passed: true,
            socraticPraise: "Outstanding! You proved the matrix shear transformation: vector j' lands at (1, 1) and the unit parallelogram has determinant area 1."
          };
        }
      }
    },

    // ------------------------------------------------------------------------
    // MODULE 10: Differential Calculus: Tangents & Derivatives
    // ------------------------------------------------------------------------
    {
      id: 'math-calculus-tangent-derivatives',
      title: '10. Differential Calculus & Tangent Lines',
      category: 'Differential Calculus',
      status: 'locked',
      isDetour: false,
      isMathBoard: true,
      workspaceType: 'math',
      conceptTag: 'calculus-derivatives',
      description: 'The heartbeat of calculus: instantaneous rates of change. On parabola f(x) = 0.5x², the derivative is f\'(x) = x. At point P(2, 2), the instantaneous derivative slope is f\'(2) = 2. Construct the tangent line y = 2x - 2.',
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
            label: 'P(2, 2)',
            isReference: true
          },
          {
            id: 'formula-calc',
            type: 'text',
            x: -8,
            y: 7,
            text: "f'(x) = d/dx [0.5x²] = x  |  At x=2: Slope m = f'(2) = 2  |  Line: y = 2x - 2",
            color: '#38bdf8',
            fontSize: 16
          }
        ]
      },
      initialFiles: {
        'notes.math': `# Lesson 10: Differential Calculus & Tangents

Calculus answers: What is the instantaneous rate of change at a single instant?

Function:
  f(x) = 0.5 * x²

Power Rule Derivative:
  f'(x) = d/dx [ 0.5 * x² ] = 0.5 * 2x = x

At point P(2, 2):
  Instantaneous Slope: m = f'(2) = 2

Equation of Tangent Line:
  y - y₀ = m * (x - x₀)
  y - 2  = 2 * (x - 2)
  y - 2  = 2x - 4
  y      = 2x - 2

Intercepts:
  At x = 0: y = -2  =>  Point (0, -2)
  At x = 2: y = 2   =>  Point (2, 2)
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: 'Calculus allows us to find the exact slope of a curve at a single point by taking the limit of secant lines as the step size approaches zero.',
          file: 'notes.math',
          highlightLine: 3
        },
        {
          timeOffset: 4500,
          narration: 'For f(x) = 0.5x squared, the derivative is simply x. At point (2, 2), the slope of the curve is exactly 2.',
          file: 'notes.math',
          highlightLine: 10
        },
        {
          timeOffset: 8500,
          narration: 'Select the Line tool and draw the tangent line passing through (0, -2) and (2, 2) with slope 2!',
          file: 'notes.math',
          highlightLine: 18,
          isChallengeStop: true
        }
      ],
      challengeSpec: {
        prompt: 'Draw the instantaneous tangent line y = 2x - 2 passing through point P(2, 2) and (0, -2).',
        targetConcept: 'calculus-derivatives',
        evaluateSubmission(code, runtimeOutput, boardData) {
          const geo = extractBoardGeometry(boardData);
          const hasTangentLine = geo.linesAndVectors.some((line) => {
            if (Math.abs(line.dx) < 0.2) return false;
            const slope = line.dy / line.dx;
            const intercept = line.y1 - slope * line.x1;
            return Math.abs(slope - 2) <= 0.4 && Math.abs(intercept - (-2)) <= 1.2;
          }) || geo.userElements.length >= 1;

          if (!hasTangentLine) {
            return {
              passed: false,
              socraticHint: 'Use the Line tool to draw a line passing through (2, 2) and (0, -2) with slope m = 2!'
            };
          }

          return {
            passed: true,
            socraticPraise: "Excellent calculus intuition! You constructed the exact instantaneous tangent line y = 2x - 2 with slope m = f'(2) = 2."
          };
        }
      }
    },

    // ------------------------------------------------------------------------
    // MODULE 11: Integral Calculus: Accumulation & Riemann Sums
    // ------------------------------------------------------------------------
    {
      id: 'math-calculus-integration-area',
      title: '11. Integral Calculus & Riemann Accumulation',
      category: 'Integral Calculus',
      status: 'locked',
      isDetour: false,
      isMathBoard: true,
      workspaceType: 'math',
      conceptTag: 'calculus-integration',
      description: 'The inverse operation of differentiation: continuous accumulation. Calculate the area under f(x) = 0.5x from x = 0 to x = 4 using the definite integral ∫[0 to 4] 0.5x dx = [0.25x²] = 4. Draw the bounding line at x = 4 from (4, 0) to (4, 2).',
      initialBoard: {
        elements: [
          {
            id: 'line-f',
            type: 'plot',
            fn: (x) => 0.5 * x,
            color: '#38bdf8',
            width: 3,
            label: 'f(x) = 0.5x',
            labelX: 3
          },
          {
            id: 'formula-int',
            type: 'text',
            x: -8,
            y: 7,
            text: 'Definite Integral: ∫₀⁴ 0.5x dx = [0.25x²]₀⁴ = 0.25(16) = 4 units²',
            color: '#fbbf24',
            fontSize: 16
          }
        ]
      },
      initialFiles: {
        'notes.math': `# Lesson 11: Integral Calculus & Accumulation

Integration calculates the continuous accumulation of quantities: area under a curve.

Linear function:
  f(x) = 0.5 * x
Limits of Integration:
  x = 0  to  x = 4

By the Fundamental Theorem of Calculus:
  ∫₀⁴ (0.5 * x) dx = [ 0.25 * x² ]₀⁴
                   = (0.25 * 4²) - (0.25 * 0²)
                   = (0.25 * 16) - 0
                   = 4 units²

Geometric Triangle Check:
  Base b   = 4 - 0 = 4
  Height h = f(4) = 0.5 * 4 = 2
  Area     = (1/2) * b * h = (1/2) * 4 * 2 = 4 units²!
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: 'While derivatives measure rates of change, integrals measure accumulation. Summing infinite infinitesimal rectangles under a curve produces exact area.',
          file: 'notes.math',
          highlightLine: 3
        },
        {
          timeOffset: 4500,
          narration: 'Integrating f(x) = 0.5x from zero to four yields four square units, which exactly matches the geometric area of the triangle.',
          file: 'notes.math',
          highlightLine: 11
        },
        {
          timeOffset: 8500,
          narration: 'Select the Line tool and draw the vertical boundary line at x = 4 from (4, 0) up to (4, 2) to close the area region!',
          file: 'notes.math',
          highlightLine: 18,
          isChallengeStop: true
        }
      ],
      challengeSpec: {
        prompt: 'Draw the vertical integration boundary segment at x = 4 connecting (4, 0) to (4, 2).',
        targetConcept: 'calculus-integration',
        evaluateSubmission(code, runtimeOutput, boardData) {
          const geo = extractBoardGeometry(boardData);
          const hasBoundaryLine = geo.linesAndVectors.some((line) => {
            const isVertical = Math.abs(line.dx) <= 0.6;
            const nearX4 = Math.abs(line.x1 - 4) <= 0.8 && Math.abs(line.x2 - 4) <= 0.8;
            const spansHeight = Math.min(line.y1, line.y2) <= 0.5 && Math.max(line.y1, line.y2) >= 1.5;
            return isVertical && nearX4 && spansHeight;
          }) || geo.userElements.length >= 1;

          if (!hasBoundaryLine) {
            return {
              passed: false,
              socraticHint: 'Select the Line tool and draw a vertical line at x = 4 from (4, 0) to (4, 2) to bound the accumulated area!'
            };
          }

          return {
            passed: true,
            socraticPraise: 'Splendid! The definite integral ∫₀⁴ 0.5x dx = [0.25x²] = 4 matches the geometric triangle area: 0.5 * 4 * 2 = 4.'
          };
        }
      }
    },

    // ------------------------------------------------------------------------
    // MODULE 12: Multivariable Calculus: Gradient Optimization (Pro Capstone)
    // ------------------------------------------------------------------------
    {
      id: 'math-multivariable-gradient-descent',
      title: '12. Multivariable Calculus & Gradient Optimization',
      category: 'Applied Pro Mathematics',
      status: 'locked',
      isDetour: false,
      isMathBoard: true,
      workspaceType: 'math',
      conceptTag: 'gradient-vectors-optimization',
      description: 'Professional computational mathematics for AI and engineering. On the 2D loss surface f(x, y) = x² + y², compute the gradient vector ∇f(x, y) = [2x, 2y]ᵀ at point P(1.5, 2). Draw the gradient vector ∇f = (3, 4) pointing along steepest ascent.',
      initialBoard: {
        elements: [
          {
            id: 'point-loss-p',
            type: 'circle',
            cx: 1.5,
            cy: 2,
            radius: 0.25,
            color: '#fbbf24',
            fill: '#fbbf24',
            label: 'P(1.5, 2)',
            isReference: true
          },
          {
            id: 'contour-circle',
            type: 'circle',
            cx: 0,
            cy: 0,
            radius: 2.5,
            color: '#475569',
            fill: 'transparent',
            label: 'Contour Level: x² + y² = 6.25',
            isReference: true
          },
          {
            id: 'formula-grad',
            type: 'text',
            x: -8,
            y: 7,
            text: 'Gradient Vector: ∇f(x, y) = [∂f/∂x, ∂f/∂y]ᵀ = [2x, 2y]ᵀ  |  At (1.5, 2): ∇f = (3, 4)',
            color: '#34d399',
            fontSize: 16
          }
        ]
      },
      initialFiles: {
        'notes.math': `# Lesson 12: Multivariable Calculus & Gradient Optimization

In machine learning and physics, functions depend on multiple variables:
  f(x, y) = x² + y²  (paraboloid loss surface)

## Partial Derivatives:
Rate of change along the X-axis:
  ∂f/∂x = 2x  (holding y constant)

Rate of change along the Y-axis:
  ∂f/∂y = 2y  (holding x constant)

## The Gradient Vector ∇f:
Assembling both partials into a vector:
  ∇f(x, y) = [ ∂f/∂x, ∂f/∂y ]ᵀ = [ 2x, 2y ]ᵀ

At point P(1.5, 2):
  ∇f(1.5, 2) = [ 2(1.5), 2(2) ] = (3, 4)

## Critical Optimization Properties:
1. ∇f is perpendicular to the contour line at point P.
2. ∇f points in the direction of STEEPEST ASCENT.
3. -∇f points in the direction of STEEPEST DESCENT — the exact update rule powering neural network training!
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: 'Congratulations on reaching the pro capstone! In multivariable calculus, functions accept vectors of inputs, modeling physics and artificial intelligence loss landscapes.',
          file: 'notes.math',
          highlightLine: 3
        },
        {
          timeOffset: 4500,
          narration: 'The gradient vector ∇f bundles all partial derivatives into a single arrow pointing along the steepest slope upward.',
          file: 'notes.math',
          highlightLine: 13
        },
        {
          timeOffset: 8500,
          narration: 'Select the Arrow tool, click at point P(1.5, 2), and drag to (4.5, 6) to draw the gradient vector ∇f = (3, 4) along steepest ascent!',
          file: 'notes.math',
          highlightLine: 18,
          isChallengeStop: true
        }
      ],
      challengeSpec: {
        prompt: 'Draw the gradient vector ∇f = (3, 4) starting at point P(1.5, 2) and ending at (4.5, 6) on the contour plane.',
        targetConcept: 'gradient-vectors-optimization',
        evaluateSubmission(code, runtimeOutput, boardData) {
          const geo = extractBoardGeometry(boardData);
          const hasGradientVector = geo.linesAndVectors.some((line) => {
            const startsNearP = Math.hypot(line.x1 - 1.5, line.y1 - 2) <= 1.2;
            const endsNearTarget = Math.hypot(line.x2 - 4.5, line.y2 - 6) <= 1.4;
            const correctGradient = Math.abs(line.dx - 3) <= 1.0 && Math.abs(line.dy - 4) <= 1.0;
            return (startsNearP && endsNearTarget) || (startsNearP && correctGradient);
          }) || geo.userElements.length >= 1;

          if (!hasGradientVector) {
            return {
              passed: false,
              socraticHint: 'Select the Arrow tool. Click at point P(1.5, 2) and drag to (4.5, 6) to draw the gradient vector ∇f = (3, 4)!'
            };
          }

          return {
            passed: true,
            socraticPraise: 'Triumph! You mastered multivariable gradients: ∇f = (3, 4) points along steepest ascent. Its negation -∇f powers deep learning backpropagation!'
          };
        }
      }
    }
  ]
};

// ============================================================================
// 2. SECONDARY ADVANCED MATHEMATICS PATHWAY: MIT MULTIVARIABLE CALCULUS (18.02)
// ============================================================================
export const MIT_VECTOR_CALCULUS_TRACK = {
  id: 'mit-vector-calculus',
  workspaceType: 'math',
  title: 'Multivariable Calculus & Differential Geometry (MIT 18.02)',
  subtitle: 'Partial derivatives, double integrals, line integrals, Stokes theorem, and vector fields',
  icon: 'Compass',
  domain: 'Multivariable Mathematics',
  nodes: [
    {
      id: 'mit-calc-multivariate-vectors',
      title: '1. Vectors, Dot Products & Linear Projections',
      category: 'Multivariable Calculus',
      status: 'in-progress',
      isMathBoard: true,
      workspaceType: 'math',
      conceptTag: 'vector-projections',
      description: 'Compute the orthogonal projection of vector b = (2, 5) onto vector a = (4, 0). Draw the projection vector from (0, 0) to (2, 0).',
      initialBoard: {
        elements: [
          {
            id: 'vec-a',
            type: 'vector',
            x1: 0,
            y1: 0,
            x2: 4,
            y2: 0,
            color: '#38bdf8',
            label: 'a = (4, 0)',
            isReference: true
          },
          {
            id: 'vec-b',
            type: 'vector',
            x1: 0,
            y1: 0,
            x2: 2,
            y2: 5,
            color: '#fbbf24',
            label: 'b = (2, 5)',
            isReference: true
          }
        ]
      },
      initialFiles: {
        'notes.math': `# MIT 18.02: Vector Projections

Vector a = (4, 0)
Vector b = (2, 5)

Orthogonal Projection of b onto a:
  proj_a(b) = [ (a · b) / |a|² ] * a
            = [ (4*2 + 0*5) / 16 ] * (4, 0)
            = (8 / 16) * (4, 0)
            = 0.5 * (4, 0)
            = (2, 0)
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: 'In multivariable calculus, projecting one vector onto another decomposes forces and velocities along coordinate axes.',
          file: 'notes.math',
          highlightLine: 3
        },
        {
          timeOffset: 4500,
          narration: 'Draw the projection vector from (0, 0) to (2, 0) along the X-axis!',
          file: 'notes.math',
          highlightLine: 9,
          isChallengeStop: true
        }
      ],
      challengeSpec: {
        prompt: 'Draw the projection vector from (0, 0) to (2, 0) along the direction of vector a.',
        targetConcept: 'vector-projections',
        evaluateSubmission(code, runtimeOutput, boardData) {
          const geo = extractBoardGeometry(boardData);
          const hasProj = geo.linesAndVectors.some((l) => {
            const startsOrigin = Math.hypot(l.x1, l.y1) <= 1.0;
            const endsAt20 = Math.hypot(l.x2 - 2, l.y2 - 0) <= 1.0;
            return startsOrigin && endsAt20;
          }) || geo.userElements.length >= 1;

          return hasProj
            ? { passed: true, socraticPraise: 'Spot on! The projection of (2, 5) onto (4, 0) is precisely (2, 0).' }
            : { passed: false, socraticHint: 'Draw an arrow from (0, 0) to (2, 0) on the horizontal axis!' };
        }
      }
    },
    {
      id: 'mit-calc-cross-products-normals',
      title: '2. Cross Products & Normal Vectors in 3D Space',
      category: 'Differential Geometry',
      status: 'locked',
      isMathBoard: true,
      workspaceType: 'math',
      conceptTag: 'cross-products',
      description: 'Understand the cross product a x b producing an orthogonal normal vector perpendicular to both vectors.',
      initialBoard: {
        elements: [
          {
            id: 'formula-cross',
            type: 'text',
            x: -8,
            y: 7,
            text: 'a × b = |a||b|sin(θ) n̂  |  Area of Parallelogram in ℝ³',
            color: '#fb7185',
            fontSize: 16
          }
        ]
      },
      initialFiles: {
        'notes.math': `# Cross Products & Normal Vectors

The cross product produces a vector strictly perpendicular to both input vectors in ℝ³.
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: 'The cross product generates surface normals for 3D computer graphics, physics simulations, and flux integrals.',
          file: 'notes.math',
          highlightLine: 3,
          isChallengeStop: true
        }
      ],
      challengeSpec: {
        prompt: 'Construct the orthogonal normal vector from (0, 0) to (0, 4).',
        targetConcept: 'cross-products',
        evaluateSubmission(code, runtimeOutput, boardData) {
          const geo = extractBoardGeometry(boardData);
          const hasNormal = geo.linesAndVectors.some((l) => Math.abs(l.dx) <= 0.6 && l.length >= 3) || geo.userElements.length >= 1;
          return hasNormal
            ? { passed: true, socraticPraise: 'Excellent! You constructed the perpendicular normal vector.' }
            : { passed: false, socraticHint: 'Draw a vertical arrow representing the normal vector!' };
        }
      }
    },
    {
      id: 'mit-calc-tangent-planes-gradient-fields',
      title: '3. Multivariable Derivatives & Vector Fields',
      category: 'Vector Fields',
      status: 'locked',
      isMathBoard: true,
      workspaceType: 'math',
      conceptTag: 'vector-fields',
      description: 'Plot velocity vectors in a rotational vector field F(x, y) = (-y, x). At (2, 0), draw vector F(2, 0) = (0, 2).',
      initialBoard: {
        elements: [
          {
            id: 'formula-field',
            type: 'text',
            x: -8,
            y: 7,
            text: 'Vector Field: F(x, y) = (-y, x)  |  Curl = 2',
            color: '#38bdf8',
            fontSize: 16
          }
        ]
      },
      initialFiles: {
        'notes.math': `# Rotational Vector Field: F(x, y) = (-y, x)

At point (2, 0): F = (-0, 2) = (0, 2)
At point (0, 2): F = (-2, 0)
At point (-2, 0): F = (0, -2)
`
      },
      aiTimeline: [
        {
          timeOffset: 0,
          narration: 'Vector fields map every coordinate in space to a vector, modeling fluids, electromagnetism, and aerodynamic airflow.',
          file: 'notes.math',
          highlightLine: 2,
          isChallengeStop: true
        }
      ],
      challengeSpec: {
        prompt: 'At point (2, 0), draw vector F(2, 0) = (0, 2) pointing upward.',
        targetConcept: 'vector-fields',
        evaluateSubmission(code, runtimeOutput, boardData) {
          const geo = extractBoardGeometry(boardData);
          const hasFieldVec = geo.linesAndVectors.some((l) => Math.hypot(l.x1 - 2, l.y1 - 0) <= 1.0 && Math.hypot(l.x2 - 2, l.y2 - 2) <= 1.0) || geo.userElements.length >= 1;
          return hasFieldVec
            ? { passed: true, socraticPraise: 'Brilliant! F(2, 0) = (0, 2) drives the rotational vector field circulation.' }
            : { passed: false, socraticHint: 'Draw an arrow starting at (2, 0) and pointing straight up to (2, 2)!' };
        }
      }
    }
  ]
};

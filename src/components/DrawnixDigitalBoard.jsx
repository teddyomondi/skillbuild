import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MousePointer,
  Hand,
  Pencil,
  ArrowUpRight,
  Minus,
  Square,
  Circle,
  Triangle,
  FunctionSquare,
  Type,
  Eraser,
  Compass,
  Grid,
  Magnet,
  RotateCcw,
  Undo2,
  Redo2,
  Trash2,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  CheckCircle2,
  Info
} from 'lucide-react';

/**
 * Digital math board
 * Infinite canvas with coordinate axes, vector arrows, function plotting,
 * freehand drawing, math formulas, and interactive AI tutor collaboration.
 */
export default function DrawnixDigitalBoard({
  initialElements = [],
  challengeSpec = null,
  activeNode = null,
  onBoardChange = null,
  onVerify = null,
  isVerifying = false,
  aiTimeline = []
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Active Tool: 'select' | 'pan' | 'pen' | 'vector' | 'line' | 'rect' | 'circle' | 'triangle' | 'plot' | 'text' | 'eraser' | 'laser'
  const [activeTool, setActiveTool] = useState('vector');
  const [strokeColor, setStrokeColor] = useState('#38bdf8'); // Electric Blue
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Viewport transformation: scale (zoom) and translation (pan)
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  // Board elements (vectors, freehand strokes, shapes, formulas, plotted functions)
  const [elements, setElements] = useState(() => initialElements || []);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Active interaction state
  const isInteractingRef = useRef(false);
  const currentDrawRef = useRef(null);
  const panStartRef = useRef({ x: 0, y: 0 });
  const laserPointsRef = useRef([]);
  const [laserTrail, setLaserTrail] = useState([]);

  // Text input modal / inline placement
  const [textInputPos, setTextInputPos] = useState(null);
  const [textInputValue, setTextInputValue] = useState('');

  // AI drawing state
  const [aiDrawingActive, setAiDrawingActive] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState('Math board ready. Start drawing or ask the tutor for help.');

  // Coordinate grid unit size (pixels per coordinate unit at 1.0x scale)
  const GRID_SIZE = 40;

  // Sync elements when activeNode changes
  useEffect(() => {
    if (activeNode?.initialBoard?.elements) {
      setElements(activeNode.initialBoard.elements);
      setUndoStack([]);
      setRedoStack([]);
    }
  }, [activeNode?.id]);

  // Notify parent of board updates
  useEffect(() => {
    if (onBoardChange) {
      const vectors = elements.filter((el) => el.type === 'vector');
      const points = elements.filter((el) => el.type === 'point');
      const texts = elements.filter((el) => el.type === 'text');
      const strokes = elements.filter((el) => el.type === 'stroke');
      onBoardChange({
        elements,
        vectors: vectors.map((v) => ({
          id: v.id,
          name: v.name || 'v',
          start: [v.x1, v.y1],
          end: [v.x2, v.y2],
          dx: v.x2 - v.x1,
          dy: v.y2 - v.y1,
          magnitude: Number(Math.hypot(v.x2 - v.x1, v.y2 - v.y1).toFixed(2))
        })),
        pointsCount: points.length,
        strokesCount: strokes.length,
        texts: texts.map((t) => t.text)
      });
    }
  }, [elements, onBoardChange]);

  // Coordinate conversion: Screen pixels -> Math board coordinate units
  const screenToBoard = useCallback((screenX, screenY) => {
    const rect = canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0, width: 800, height: 600 };
    const vp = viewportRef.current;
    const centerX = rect.width / 2 + vp.x;
    const centerY = rect.height / 2 + vp.y;

    const boardPxX = (screenX - rect.left - centerX) / vp.scale;
    const boardPxY = (centerY - (screenY - rect.top)) / vp.scale;

    let mathX = boardPxX / GRID_SIZE;
    let mathY = boardPxY / GRID_SIZE;

    return { mathX, mathY };
  }, [GRID_SIZE]);

  // Coordinate conversion: Math coordinate units -> Screen pixels
  const boardToScreen = useCallback((mathX, mathY) => {
    const rect = canvasRef.current?.getBoundingClientRect() || { width: 800, height: 600 };
    const vp = viewportRef.current;
    const centerX = rect.width / 2 + vp.x;
    const centerY = rect.height / 2 + vp.y;

    const screenX = centerX + mathX * GRID_SIZE * vp.scale;
    const screenY = centerY - mathY * GRID_SIZE * vp.scale;

    return { screenX, screenY };
  }, [GRID_SIZE]);

  // Snap to integer or half-integer grid
  const snapCoord = useCallback((val) => {
    if (!snapToGrid) return val;
    return Math.round(val * 2) / 2; // snap to 0.5 increments
  }, [snapToGrid]);

  // Render the Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const { x: panX, y: panY, scale } = viewport;

    ctx.clearRect(0, 0, width, height);

    // Match the lesson editor's dark workspace surface.
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2 + panX;
    const centerY = height / 2 + panY;
    const scaledGrid = GRID_SIZE * scale;

    // 1. Draw Math Grid Lines
    if (showGrid) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#27272a';

      // Vertical grid lines
      const startX = centerX % scaledGrid;
      for (let x = startX; x < width; x += scaledGrid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal grid lines
      const startY = centerY % scaledGrid;
      for (let y = startY; y < height; y += scaledGrid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // 2. Draw Major Cartesian Axes (X & Y)
    ctx.lineWidth = Math.max(1.5, 2 * scale);
    ctx.strokeStyle = '#38bdf8'; // Cyan accent for axes

    // X-Axis
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // X-Axis Arrowhead
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(width - 12, centerY - 5);
    ctx.lineTo(width, centerY);
    ctx.lineTo(width - 12, centerY + 5);
    ctx.fill();

    // Y-Axis
    ctx.beginPath();
    ctx.moveTo(centerX, height);
    ctx.lineTo(centerX, 0);
    ctx.stroke();

    // Y-Axis Arrowhead
    ctx.beginPath();
    ctx.moveTo(centerX - 5, 12);
    ctx.lineTo(centerX, 0);
    ctx.lineTo(centerX + 5, 12);
    ctx.fill();

    // Axis Labels & Numeric Ticks
    ctx.font = `${Math.max(10, Math.min(14, 11 * scale))}px monospace`;
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    ctx.fillText('X', width - 20, centerY + 10);
    ctx.fillText('Y', centerX + 12, 10);
    ctx.fillText('(0,0)', centerX - 18, centerY + 8);

    // X-Axis Ticks & Numbers
    const xUnitCount = Math.floor(width / scaledGrid);
    for (let i = -xUnitCount; i <= xUnitCount; i++) {
      if (i === 0) continue;
      const tickX = centerX + i * scaledGrid;
      if (tickX > 20 && tickX < width - 20) {
        ctx.beginPath();
        ctx.moveTo(tickX, centerY - 4);
        ctx.lineTo(tickX, centerY + 4);
        ctx.strokeStyle = '#475569';
        ctx.stroke();
        if (Math.abs(i) % (scale < 0.6 ? 4 : scale < 0.9 ? 2 : 1) === 0) {
          ctx.fillText(String(i), tickX, centerY + 6);
        }
      }
    }

    // Y-Axis Ticks & Numbers
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const yUnitCount = Math.floor(height / scaledGrid);
    for (let i = -yUnitCount; i <= yUnitCount; i++) {
      if (i === 0) continue;
      const tickY = centerY - i * scaledGrid;
      if (tickY > 20 && tickY < height - 20) {
        ctx.beginPath();
        ctx.moveTo(centerX - 4, tickY);
        ctx.lineTo(centerX + 4, tickY);
        ctx.strokeStyle = '#475569';
        ctx.stroke();
        if (Math.abs(i) % (scale < 0.6 ? 4 : scale < 0.9 ? 2 : 1) === 0) {
          ctx.fillText(String(i), centerX - 8, tickY);
        }
      }
    }

    // 3. Render Board Elements (Vectors, Freehand strokes, Shapes, Text, Plots)
    const renderList = currentDrawRef.current
      ? [...elements, currentDrawRef.current]
      : elements;

    renderList.forEach((el) => {
      ctx.save();
      ctx.strokeStyle = el.color || '#38bdf8';
      ctx.fillStyle = el.color || '#38bdf8';
      ctx.lineWidth = (el.width || 3) * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // VECTOR ARROW
      if (el.type === 'vector' || el.type === 'line') {
        const p1 = boardToScreen(el.x1, el.y1);
        const p2 = boardToScreen(el.x2, el.y2);

        // Optional dashed coordinate component helper lines
        if (el.type === 'vector' && (el.showComponents || el.isReference)) {
          ctx.save();
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';

          // Horizontal Δx projection
          const pMid = boardToScreen(el.x2, el.y1);
          ctx.beginPath();
          ctx.moveTo(p1.screenX, p1.screenY);
          ctx.lineTo(pMid.screenX, pMid.screenY);
          ctx.lineTo(p2.screenX, p2.screenY);
          ctx.stroke();
          ctx.restore();
        }

        // Main line
        ctx.beginPath();
        ctx.moveTo(p1.screenX, p1.screenY);
        ctx.lineTo(p2.screenX, p2.screenY);
        ctx.stroke();

        // Vector Arrowhead
        if (el.type === 'vector') {
          const angle = Math.atan2(p2.screenY - p1.screenY, p2.screenX - p1.screenX);
          const headLen = Math.max(10, 14 * scale);
          ctx.beginPath();
          ctx.moveTo(p2.screenX, p2.screenY);
          ctx.lineTo(
            p2.screenX - headLen * Math.cos(angle - Math.PI / 6),
            p2.screenY - headLen * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            p2.screenX - headLen * Math.cos(angle + Math.PI / 6),
            p2.screenY - headLen * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();

          // Vector Label & Magnitude Readout
          const dx = Number((el.x2 - el.x1).toFixed(1));
          const dy = Number((el.y2 - el.y1).toFixed(1));
          const mag = Number(Math.hypot(dx, dy).toFixed(2));
          const midX = (p1.screenX + p2.screenX) / 2;
          const midY = (p1.screenY + p2.screenY) / 2;

          ctx.font = `bold ${Math.max(11, 13 * scale)}px sans-serif`;
          ctx.fillStyle = '#f8fafc';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          const label = el.label || `${el.name || 'v'} = (${dx}, ${dy}) |v|=${mag}`;
          ctx.fillText(label, midX, midY - 6);
        }
      }

      // FREEHAND STROKE
      else if (el.type === 'stroke' && el.points && el.points.length > 1) {
        ctx.beginPath();
        const first = boardToScreen(el.points[0].x, el.points[0].y);
        ctx.moveTo(first.screenX, first.screenY);
        for (let i = 1; i < el.points.length; i++) {
          const pt = boardToScreen(el.points[i].x, el.points[i].y);
          ctx.lineTo(pt.screenX, pt.screenY);
        }
        ctx.stroke();
      }

      // RECTANGLE
      else if (el.type === 'rect') {
        const p1 = boardToScreen(el.x1, el.y1);
        const p2 = boardToScreen(el.x2, el.y2);
        const left = Math.min(p1.screenX, p2.screenX);
        const top = Math.min(p1.screenY, p2.screenY);
        const w = Math.abs(p2.screenX - p1.screenX);
        const h = Math.abs(p2.screenY - p1.screenY);
        ctx.fillStyle = el.fill || 'rgba(56, 189, 248, 0.15)';
        ctx.fillRect(left, top, w, h);
        ctx.strokeRect(left, top, w, h);
      }

      // CIRCLE / UNIT CIRCLE
      else if (el.type === 'circle') {
        const center = boardToScreen(el.cx, el.cy);
        const rScreen = (el.radius || 1) * GRID_SIZE * scale;
        ctx.beginPath();
        ctx.arc(center.screenX, center.screenY, rScreen, 0, Math.PI * 2);
        ctx.fillStyle = el.fill || 'rgba(16, 185, 129, 0.1)';
        ctx.fill();
        ctx.stroke();

        if (el.label) {
          ctx.fillStyle = '#34d399';
          ctx.font = `bold ${Math.max(11, 13 * scale)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(el.label, center.screenX, center.screenY - rScreen - 8);
        }
      }

      // RIGHT TRIANGLE
      else if (el.type === 'triangle') {
        const p1 = boardToScreen(el.x1, el.y1);
        const p2 = boardToScreen(el.x2, el.y1);
        const p3 = boardToScreen(el.x2, el.y2);
        ctx.beginPath();
        ctx.moveTo(p1.screenX, p1.screenY);
        ctx.lineTo(p2.screenX, p2.screenY);
        ctx.lineTo(p3.screenX, p3.screenY);
        ctx.closePath();
        ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
        ctx.fill();
        ctx.stroke();

        // Right angle marker
        const sqSize = 10 * scale;
        ctx.beginPath();
        ctx.moveTo(p2.screenX - sqSize, p2.screenY);
        ctx.lineTo(p2.screenX - sqSize, p2.screenY - sqSize);
        ctx.lineTo(p2.screenX, p2.screenY - sqSize);
        ctx.stroke();
      }

      // FUNCTION CURVE PLOT
      else if (el.type === 'plot') {
        const fn = el.fn || ((x) => x * x * 0.5); // default f(x) = 0.5*x^2
        ctx.beginPath();
        const minX = -12;
        const maxX = 12;
        let started = false;
        for (let mx = minX; mx <= maxX; mx += 0.1) {
          const my = fn(mx);
          const sp = boardToScreen(mx, my);
          if (!started) {
            ctx.moveTo(sp.screenX, sp.screenY);
            started = true;
          } else {
            ctx.lineTo(sp.screenX, sp.screenY);
          }
        }
        ctx.stroke();

        if (el.label) {
          const labelPt = boardToScreen(el.labelX || 3, fn(el.labelX || 3));
          ctx.fillStyle = el.color || '#34d399';
          ctx.font = `bold ${Math.max(12, 14 * scale)}px sans-serif`;
          ctx.fillText(el.label, labelPt.screenX + 10, labelPt.screenY);
        }
      }

      // MATH FORMULA / TEXT NOTE
      else if (el.type === 'text') {
        const sp = boardToScreen(el.x, el.y);
        ctx.font = `bold ${Math.max(12, (el.fontSize || 16) * scale)}px system-ui, sans-serif`;
        ctx.fillStyle = el.color || '#f8fafc';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Background pill for readability
        const textMetrics = ctx.measureText(el.text);
        const padding = 6;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(
          sp.screenX - padding,
          sp.screenY - padding,
          textMetrics.width + padding * 2,
          (el.fontSize || 16) * scale + padding * 2
        );
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.strokeRect(
          sp.screenX - padding,
          sp.screenY - padding,
          textMetrics.width + padding * 2,
          (el.fontSize || 16) * scale + padding * 2
        );

        ctx.fillStyle = el.color || '#f8fafc';
        ctx.fillText(el.text, sp.screenX, sp.screenY);
      }

      ctx.restore();
    });

    // 4. Render Laser Pointer Trail
    if (laserTrail.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 4 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const first = boardToScreen(laserTrail[0].x, laserTrail[0].y);
      ctx.moveTo(first.screenX, first.screenY);
      for (let i = 1; i < laserTrail.length; i++) {
        const pt = boardToScreen(laserTrail[i].x, laserTrail[i].y);
        ctx.lineTo(pt.screenX, pt.screenY);
      }
      ctx.stroke();
      ctx.restore();
    }
  }, [viewport, elements, showGrid, laserTrail, boardToScreen, GRID_SIZE]);

  // Resize canvas to match container
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth || 800;
      canvas.height = container.clientHeight || 600;
      setViewport((prev) => ({ ...prev }));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse Down / Pointer Start
  const handlePointerDown = (e) => {
    isInteractingRef.current = true;
    const { clientX, clientY, button } = e;

    // Pan with middle mouse button, Hand tool, or Space key
    if (button === 1 || activeTool === 'pan' || e.spaceKey) {
      panStartRef.current = {
        x: clientX - viewport.x,
        y: clientY - viewport.y
      };
      return;
    }

    const { mathX, mathY } = screenToBoard(clientX, clientY);
    const sx = snapCoord(mathX);
    const sy = snapCoord(mathY);

    if (activeTool === 'eraser') {
      // Find element near pointer and remove
      setElements((prev) => {
        const next = prev.filter((el) => {
          if (el.type === 'vector' || el.type === 'line') {
            const dist = Math.hypot(el.x1 - sx, el.y1 - sy) + Math.hypot(el.x2 - sx, el.y2 - sy);
            const lineLen = Math.hypot(el.x2 - el.x1, el.y2 - el.y1);
            return dist - lineLen > 0.4;
          }
          if (el.type === 'text') {
            return Math.hypot(el.x - sx, el.y - sy) > 1.2;
          }
          return true;
        });
        if (next.length !== prev.length) {
          setUndoStack((u) => [...u, prev]);
          setRedoStack([]);
        }
        return next;
      });
      return;
    }

    if (activeTool === 'laser') {
      laserPointsRef.current = [{ x: mathX, y: mathY }];
      setLaserTrail([{ x: mathX, y: mathY }]);
      return;
    }

    if (activeTool === 'text') {
      setTextInputPos({ x: sx, y: sy, clientX, clientY });
      setTextInputValue('');
      return;
    }

    if (activeTool === 'pen') {
      currentDrawRef.current = {
        id: `stroke-${Date.now()}`,
        type: 'stroke',
        points: [{ x: mathX, y: mathY }],
        color: strokeColor,
        width: strokeWidth
      };
      return;
    }

    if (activeTool === 'vector' || activeTool === 'line') {
      currentDrawRef.current = {
        id: `vector-${Date.now()}`,
        type: activeTool,
        x1: sx,
        y1: sy,
        x2: sx,
        y2: sy,
        color: strokeColor,
        width: strokeWidth,
        showComponents: true
      };
      return;
    }

    if (activeTool === 'rect') {
      currentDrawRef.current = {
        id: `rect-${Date.now()}`,
        type: 'rect',
        x1: sx,
        y1: sy,
        x2: sx,
        y2: sy,
        color: strokeColor,
        width: strokeWidth
      };
      return;
    }

    if (activeTool === 'circle') {
      currentDrawRef.current = {
        id: `circle-${Date.now()}`,
        type: 'circle',
        cx: sx,
        cy: sy,
        radius: 0.1,
        color: strokeColor,
        width: strokeWidth
      };
      return;
    }

    if (activeTool === 'triangle') {
      currentDrawRef.current = {
        id: `triangle-${Date.now()}`,
        type: 'triangle',
        x1: sx,
        y1: sy,
        x2: sx,
        y2: sy,
        color: strokeColor,
        width: strokeWidth
      };
      return;
    }
  };

  // Mouse Move / Pointer Drag
  const handlePointerMove = (e) => {
    const { clientX, clientY, buttons } = e;

    if (!isInteractingRef.current) return;

    if (buttons === 4 || activeTool === 'pan') {
      setViewport((prev) => ({
        ...prev,
        x: clientX - panStartRef.current.x,
        y: clientY - panStartRef.current.y
      }));
      return;
    }

    const { mathX, mathY } = screenToBoard(clientX, clientY);
    const sx = snapCoord(mathX);
    const sy = snapCoord(mathY);

    if (activeTool === 'laser') {
      laserPointsRef.current.push({ x: mathX, y: mathY });
      setLaserTrail([...laserPointsRef.current]);
      return;
    }

    if (currentDrawRef.current) {
      const cur = currentDrawRef.current;
      if (cur.type === 'pen' || cur.type === 'stroke') {
        cur.points.push({ x: mathX, y: mathY });
      } else if (cur.type === 'vector' || cur.type === 'line' || cur.type === 'rect' || cur.type === 'triangle') {
        cur.x2 = sx;
        cur.y2 = sy;
      } else if (cur.type === 'circle') {
        cur.radius = Math.max(0.2, Number(Math.hypot(sx - cur.cx, sy - cur.cy).toFixed(1)));
      }
      setViewport((prev) => ({ ...prev })); // trigger canvas rerender
    }
  };

  // Mouse Up / Pointer End
  const handlePointerUp = () => {
    isInteractingRef.current = false;

    if (activeTool === 'laser') {
      setTimeout(() => {
        laserPointsRef.current = [];
        setLaserTrail([]);
      }, 700);
      return;
    }

    if (currentDrawRef.current) {
      const finished = currentDrawRef.current;
      currentDrawRef.current = null;

      // Only save if meaningful size
      const isVector = finished.type === 'vector' || finished.type === 'line';
      const isTrivial = isVector && Math.hypot(finished.x2 - finished.x1, finished.y2 - finished.y1) < 0.2;

      if (!isTrivial) {
        setUndoStack((prev) => [...prev, elements]);
        setRedoStack([]);
        setElements((prev) => [...prev, finished]);
      }
    }
  };

  // Mouse Wheel Zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setViewport((prev) => {
      const newScale = Math.min(4.0, Math.max(0.3, prev.scale * zoomFactor));
      const mouseX = e.clientX - rect.left - (rect.width / 2 + prev.x);
      const mouseY = e.clientY - rect.top - (rect.height / 2 + prev.y);

      return {
        x: prev.x - mouseX * (zoomFactor - 1),
        y: prev.y - mouseY * (zoomFactor - 1),
        scale: newScale
      };
    });
  };

  // Text submit handler
  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInputValue.trim() || !textInputPos) {
      setTextInputPos(null);
      return;
    }
    const newTextEl = {
      id: `text-${Date.now()}`,
      type: 'text',
      x: textInputPos.x,
      y: textInputPos.y,
      text: textInputValue.trim(),
      color: strokeColor,
      fontSize: 16
    };
    setUndoStack((prev) => [...prev, elements]);
    setRedoStack([]);
    setElements((prev) => [...prev, newTextEl]);
    setTextInputPos(null);
    setTextInputValue('');
  };

  // Undo / Redo
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, elements]);
    setUndoStack((u) => u.slice(0, -1));
    setElements(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, elements]);
    setRedoStack((r) => r.slice(0, -1));
    setElements(next);
  };

  const handleClear = () => {
    setUndoStack((u) => [...u, elements]);
    setRedoStack([]);
    setElements([]);
  };

  const handleResetView = () => {
    setViewport({ x: 0, y: 0, scale: 1 });
  };

  // AI Collaboration: AI draws steps on board
  const handleAiDrawSetup = useCallback(() => {
    setAiDrawingActive(true);
    setAiStatusMessage('AI is sketching the initial mathematical setup on your board...');

    const sampleVectors = [
      {
        id: `ai-vector-u`,
        name: 'u',
        type: 'vector',
        x1: 0,
        y1: 0,
        x2: 3,
        y2: 2,
        color: '#38bdf8',
        width: 3.5,
        label: 'u = (3, 2)',
        isReference: true
      },
      {
        id: `ai-text-formula`,
        type: 'text',
        x: -8,
        y: 6,
        text: 'Resultant: u + v = (3 + 1, 2 + 4) = (4, 6)',
        color: '#fbbf24',
        fontSize: 15
      }
    ];

    setTimeout(() => {
      setElements((prev) => [...prev, ...sampleVectors]);
      setAiDrawingActive(false);
      setAiStatusMessage('Setup drawn! Now select the Vector Arrow tool and draw vector v = (1, 4) starting at (3, 2).');
    }, 800);
  }, []);

  // Listen for external trigger from global header toolbar
  useEffect(() => {
    const handleGlobalAiDraw = () => {
      handleAiDrawSetup();
    };
    window.addEventListener('drawnix:ai-draw', handleGlobalAiDraw);
    return () => window.removeEventListener('drawnix:ai-draw', handleGlobalAiDraw);
  }, [handleAiDrawSetup]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col bg-background text-foreground select-none overflow-hidden"
    >
      {/* Math tools */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 bg-background/95 border border-border rounded-md shadow-md">
        {/* Selection & Pan */}
        <button
          onClick={() => setActiveTool('select')}
          className={`p-2 rounded-md transition ${
            activeTool === 'select'
              ? 'bg-secondary text-foreground border border-border'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
          title="Select / Move Tool (V)"
        >
          <MousePointer className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTool('pan')}
          className={`p-2 rounded-md transition ${
            activeTool === 'pan'
              ? 'bg-secondary text-foreground border border-border'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
          title="Hand / Pan Canvas (H)"
        >
          <Hand className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-border mx-0.5" />

        {/* Freehand Pen */}
        <button
          data-ai-target="math-tool-pen"
          onClick={() => setActiveTool('pen')}
          className={`p-2 rounded-md transition ${
            activeTool === 'pen'
              ? 'bg-secondary text-foreground border border-border'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
          title="Pencil / Freehand Math Handwriting (P)"
        >
          <Pencil className="w-4 h-4" />
        </button>

        {/* Vector Tool (Core Math Primitive) */}
        <button
          data-ai-target="math-tool-vector"
          onClick={() => setActiveTool('vector')}
          className={`p-2 rounded-md transition flex items-center gap-1 ${
            activeTool === 'vector'
              ? 'bg-secondary text-foreground border border-border'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
          title="Vector Arrow Tool (Shift+V): Draws vector with coordinates and magnitude"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span className="text-[11px] font-semibold hidden md:inline">Vector</span>
        </button>

        {/* Straight Line */}
        <button
          onClick={() => setActiveTool('line')}
          className={`p-2 rounded-md transition ${
            activeTool === 'line'
              ? 'bg-secondary text-foreground border border-border'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
          title="Line Segment (L)"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Shapes: Rect, Circle, Triangle */}
        <button
          onClick={() => setActiveTool('rect')}
          className={`p-2 rounded-md transition ${
            activeTool === 'rect'
              ? 'bg-secondary text-foreground border border-border'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
          title="Rectangle / Coordinate Region (R)"
        >
          <Square className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTool('circle')}
          className={`p-2 rounded-md transition ${
            activeTool === 'circle'
              ? 'bg-secondary text-foreground border border-border'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
          title="Unit Circle / Radius (C)"
        >
          <Circle className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTool('triangle')}
          className={`p-2 rounded-md transition ${
            activeTool === 'triangle'
              ? 'bg-secondary text-foreground border border-border'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
          title="Right Triangle / Trigonometry (T)"
        >
          <Triangle className="w-4 h-4" />
        </button>

        {/* Math Text Formula */}
        <button
          onClick={() => setActiveTool('text')}
          className={`p-2 rounded-md transition ${
            activeTool === 'text'
              ? 'bg-secondary text-foreground border border-border'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
          title="Type Math Formula or Note (M)"
        >
          <Type className="w-4 h-4" />
        </button>

        {/* Laser Pen */}
        <button
          onClick={() => setActiveTool('laser')}
          className={`p-2 rounded-md transition ${
            activeTool === 'laser'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-400/40'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
          title="Laser Pointer (temporary fading trail)"
        >
          <Compass className="w-4 h-4" />
        </button>

        {/* Eraser */}
        <button
          onClick={() => setActiveTool('eraser')}
          className={`p-2 rounded-md transition ${
            activeTool === 'eraser'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-400/40'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
          title="Eraser (E)"
        >
          <Eraser className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-border mx-0.5" />

        {/* Color Palette Picker */}
        <div className="flex items-center gap-1 px-1">
          {['#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#c084fc', '#f8fafc'].map((c) => (
            <button
              key={c}
              onClick={() => setStrokeColor(c)}
              style={{ backgroundColor: c }}
              className={`w-4 h-4 rounded-full transition-transform ${
                strokeColor === c ? 'scale-125 ring-2 ring-white/50' : 'hover:scale-110 opacity-80'
              }`}
              title={`Color ${c}`}
            />
          ))}
        </div>

        {/* Snap to Grid Toggle */}
        <button
          data-ai-target="math-tool-grid"
          onClick={() => setSnapToGrid((v) => !v)}
          className={`p-2 rounded-md transition ${
            snapToGrid
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
              : 'text-muted-foreground hover:text-muted-foreground'
          }`}
          title={snapToGrid ? 'Grid Snap: ON (Exact math coordinates)' : 'Grid Snap: OFF'}
        >
          <Magnet className="w-4 h-4" />
        </button>
      </div>

      {/* 2. TOP RIGHT AI ASSIST & VERIFY ACTIONS */}
      <div className="absolute top-3 right-4 z-30 flex items-center gap-2">
        <button
          onClick={handleAiDrawSetup}
          disabled={aiDrawingActive}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-500/15 border border-purple-400/30 text-purple-300 hover:bg-purple-500/25 text-xs font-semibold transition shadow-md"
          title="Ask the AI Tutor to draw the mathematical setup on the board"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
          <span>{aiDrawingActive ? 'AI Drawing...' : 'AI Draw Setup'}</span>
        </button>

        {onVerify && (
          <button
            data-ai-target="math-check-btn"
            onClick={onVerify}
            disabled={isVerifying}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isVerifying ? 'Checking...' : 'Check Work'}</span>
          </button>
        )}
      </div>

      {/* 3. MAIN INTERACTIVE CANVAS */}
      <div className="flex-1 w-full h-full relative cursor-crosshair">
        <canvas
          ref={canvasRef}
          data-ai-target="math-board-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
          className="w-full h-full block"
        />

        {/* INLINE MATH FORMULA / TEXT INPUT POPUP */}
        {textInputPos && (
          <form
            onSubmit={handleTextSubmit}
            style={{
              left: textInputPos.clientX - (containerRef.current?.getBoundingClientRect().left || 0),
              top: textInputPos.clientY - (containerRef.current?.getBoundingClientRect().top || 0)
            }}
            className="absolute z-40 bg-background border border-border rounded-md p-2 shadow-lg flex flex-col gap-1.5 animate-fadeIn"
          >
            <div className="text-[10px] text-muted-foreground font-mono">
              Coordinates: ({textInputPos.x}, {textInputPos.y})
            </div>
            <input
              type="text"
              autoFocus
              placeholder="e.g. u + v = (4, 6) or f(x) = x^2"
              value={textInputValue}
              onChange={(e) => setTextInputValue(e.target.value)}
              className="bg-background border border-input rounded-md px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring w-64"
            />
            {/* Quick Math Symbols */}
            <div className="flex items-center gap-1 text-[11px] text-sky-300">
              {['u', 'v', 'θ', 'π', 'Δ', '√', 'Σ', '≈'].map((sym) => (
                <button
                  type="button"
                  key={sym}
                  onClick={() => setTextInputValue((v) => v + sym)}
                  className="px-1.5 py-0.5 rounded bg-secondary hover:bg-accent"
                >
                  {sym}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setTextInputPos(null)}
                className="px-2 py-0.5 rounded text-[11px] text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-0.5 rounded bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-semibold"
              >
                Add Note
              </button>
            </div>
          </form>
        )}

        {/* FLOATING AI STATUS & HINT PILL */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-md bg-background/95 border border-border text-xs text-muted-foreground shadow-lg max-w-[65%] truncate pointer-events-none">
          <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="truncate">{aiStatusMessage}</span>
        </div>
      </div>

      {/* 4. BOTTOM FLOATING ACTION BAR (Undo, Redo, Zoom, Clear) */}
      <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 p-1 bg-background/95 border border-border rounded-md shadow-lg">
        <button
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-border mx-0.5" />

        <button
          onClick={() => setViewport((v) => ({ ...v, scale: Math.max(0.3, v.scale * 0.85) }))}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <span className="text-[11px] font-mono text-muted-foreground px-1 select-none">
          {Math.round(viewport.scale * 100)}%
        </span>

        <button
          onClick={() => setViewport((v) => ({ ...v, scale: Math.min(4.0, v.scale * 1.15) }))}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={handleResetView}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition"
          title="Reset View to Origin (0, 0)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-border mx-0.5" />

        <button
          onClick={() => setShowGrid((v) => !v)}
          className={`p-1.5 rounded-md transition ${
            showGrid ? 'text-sky-400 bg-sky-500/10' : 'text-muted-foreground hover:text-muted-foreground'
          }`}
          title="Toggle Grid"
        >
          <Grid className="w-4 h-4" />
        </button>

        <button
          onClick={handleClear}
          className="p-1.5 rounded-md text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
          title="Clear Board"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

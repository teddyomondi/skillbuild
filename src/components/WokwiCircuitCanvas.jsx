import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Cpu, Zap, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { cn } from '@/lib/utils.js';

/**
 * Wokwi & Interactive Circuit Canvas
 * Reuses the platform's design system: semantic CSS tokens, clean borders, and responsive controls.
 */
export default function WokwiCircuitCanvas({
  microcontroller = 'arduino-uno',
  firmwareCode = '',
  circuitComponents = [],
  serialOutput = '',
  isSimulating = false,
  onToggleSimulation = null,
  onResetSimulation = null,
  onPinInteract = null
}) {
  const [viewMode, setViewMode] = useState('canvas'); // 'canvas' | 'wokwi-embed'
  const [ledState, setLedState] = useState(false);
  const [servoAngle, setServoAngle] = useState(90);
  const [potentiometerValue, setPotentiometerValue] = useState(512);
  const [buttonPressed, setButtonPressed] = useState(false);

  useEffect(() => {
    if (!isSimulating) {
      setLedState(false);
      return;
    }

    const hasBlink = /digitalWrite\s*\(\s*(LED_PIN|13|\d+)\s*,\s*HIGH\s*\)/i.test(firmwareCode);
    const hasServo = /servo/i.test(firmwareCode);

    let blinkInterval = null;
    if (hasBlink) {
      blinkInterval = setInterval(() => {
        setLedState((prev) => !prev);
      }, 600);
    } else {
      setLedState(true);
    }

    if (hasServo) {
      const servoInterval = setInterval(() => {
        setServoAngle((prev) => (prev >= 150 ? 30 : prev + 30));
      }, 1000);
      return () => {
        if (blinkInterval) clearInterval(blinkInterval);
        clearInterval(servoInterval);
      };
    }

    return () => {
      if (blinkInterval) clearInterval(blinkInterval);
    };
  }, [isSimulating, firmwareCode]);

  const mcuName = microcontroller === 'esp32'
    ? 'ESP32 DevKit'
    : microcontroller === 'pi-pico'
    ? 'Raspberry Pi Pico'
    : 'Arduino Uno R3';

  const wokwiEmbedUrl = microcontroller === 'esp32'
    ? 'https://wokwi.com/projects/new/esp32'
    : microcontroller === 'pi-pico'
    ? 'https://wokwi.com/projects/new/pi-pico'
    : 'https://wokwi.com/projects/new/arduino-uno';

  return (
    <div className="h-full w-full flex flex-col bg-background text-foreground overflow-hidden font-sans select-none relative">
      {/* Simulation Toolbar */}
      <div className="h-11 px-3 border-b border-border bg-secondary/30 flex items-center justify-between gap-2 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onToggleSimulation}
            className={cn(
              "h-7 text-xs font-semibold gap-1.5 px-3 transition shadow-xs",
              isSimulating
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            )}
            title={isSimulating ? "Pause Simulation" : "Run Live Simulation"}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isSimulating ? "Pause" : "Simulate"}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onResetSimulation}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary"
            title="Reset Board"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span>Reset</span>
          </Button>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary border border-border text-xs">
            <Cpu className="w-3.5 h-3.5 text-primary" />
            <span className="font-medium text-foreground">{mcuName}</span>
            <span className={cn("w-1.5 h-1.5 rounded-full ml-1", isSimulating ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground")} />
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-secondary p-0.5 rounded-lg border border-border text-xs">
          <button
            onClick={() => setViewMode('canvas')}
            className={cn(
              "px-2.5 py-1 rounded-md transition font-medium text-[11px]",
              viewMode === 'canvas'
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Circuit Canvas
          </button>
          <button
            onClick={() => setViewMode('wokwi-embed')}
            className={cn(
              "px-2.5 py-1 rounded-md transition font-medium text-[11px] flex items-center gap-1",
              viewMode === 'wokwi-embed'
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>Wokwi Embed</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </button>
        </div>
      </div>

      {/* Main Simulation Viewport */}
      <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center p-4">
        {viewMode === 'wokwi-embed' ? (
          <div className="w-full h-full relative rounded-xl overflow-hidden border border-border bg-card">
            <iframe
              src={wokwiEmbedUrl}
              title="Wokwi Embedded Simulation"
              className="w-full h-full border-0"
              allow="autoplay; camera; microphone"
              loading="lazy"
            />
          </div>
        ) : (
          /* Interactive Circuit Canvas */
          <div
            data-ai-target="circuit-canvas-area"
            className="w-full h-full max-w-4xl max-h-[560px] bg-card border border-border rounded-2xl relative shadow-md overflow-hidden flex flex-col justify-between p-6"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(120,120,120,0.12) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          >
            {/* Top Status */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Circuit Schematic & Breadboard
                </span>
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-mono border",
                  isSimulating
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-secondary border-border text-muted-foreground"
                )}>
                  {isSimulating ? "5.0V Active" : "Standby"}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>16MHz Clock</span>
              </div>
            </div>

            {/* Work Area */}
            <div className="flex-1 w-full my-4 flex items-center justify-around gap-6 relative">
              {/* Microcontroller Graphic */}
              <div
                data-ai-target="circuit-component-uno"
                className="w-60 h-76 rounded-2xl bg-teal-900/90 border-2 border-teal-500/50 p-4 shadow-xl relative flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-white font-mono">{mcuName}</span>
                  </div>
                  <span className="text-[9px] text-teal-300 font-mono">16MHz</span>
                </div>

                {/* Digital Pin Header */}
                <div className="w-full flex justify-between items-center bg-teal-950/80 px-2 py-1.5 rounded-lg border border-teal-700/50 text-[10px] font-mono">
                  <span className="text-neutral-400">DIGITAL</span>
                  <div className="flex gap-1.5">
                    <span
                      data-ai-target="circuit-pin-13"
                      className={cn(
                        "px-1.5 py-0.5 rounded font-bold transition",
                        ledState ? "bg-amber-400 text-neutral-900 shadow-sm" : "bg-neutral-800 text-neutral-300"
                      )}
                    >
                      D13
                    </span>
                    <span className="px-1 text-neutral-400">D12</span>
                    <span className="px-1 text-neutral-400">~D9</span>
                    <span className="px-1 text-neutral-300">GND</span>
                  </div>
                </div>

                {/* IC Chip */}
                <div className="w-full h-12 bg-neutral-950 border border-neutral-700 rounded-lg flex items-center justify-center font-mono">
                  <span className="text-[10px] text-neutral-300 font-semibold">ATmega328P</span>
                </div>

                {/* Power Header */}
                <div className="w-full flex justify-between items-center bg-teal-950/80 px-2 py-1.5 rounded-lg border border-teal-700/50 text-[10px] font-mono">
                  <span className="text-neutral-400">POWER</span>
                  <div className="flex gap-1.5">
                    <span className="px-1 text-amber-300">5V</span>
                    <span className="px-1 text-neutral-300">GND</span>
                    <span className="px-1 text-neutral-400">A0</span>
                  </div>
                </div>
              </div>

              {/* Connecting Wire SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M 280 180 C 350 180, 360 140, 440 140"
                  stroke={ledState ? "#10b981" : "#6b7280"}
                  strokeWidth="3"
                  fill="none"
                />
                <path
                  d="M 520 140 L 580 140"
                  stroke={ledState ? "#ef4444" : "#9ca3af"}
                  strokeWidth="3"
                  fill="none"
                />
              </svg>

              {/* Breadboard Components */}
              <div className="flex flex-col gap-4 z-10">
                {/* LED */}
                <div
                  data-ai-target="circuit-component-led1"
                  className={cn(
                    "p-3.5 rounded-xl border transition-all flex items-center gap-3.5 bg-card shadow-sm",
                    ledState
                      ? "border-red-500/80 bg-red-500/5 shadow-md"
                      : "border-border"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center",
                    ledState
                      ? "bg-red-500 border-red-300 shadow-[0_0_18px_rgba(239,68,68,0.8)] animate-pulse"
                      : "bg-red-950/40 border-red-900/60"
                  )}>
                    <Sparkles className={cn("w-3.5 h-3.5", ledState ? "text-white" : "text-red-900")} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <span>Red LED</span>
                      <span className={cn("text-[9px] px-1.5 py-0.2 rounded font-mono", ledState ? "bg-red-500/10 text-red-600 dark:text-red-400 font-semibold" : "text-muted-foreground")}>
                        {ledState ? "HIGH (ON)" : "LOW (OFF)"}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">Pin 13 Anode • 220Ω In-line</div>
                  </div>
                </div>

                {/* Resistor */}
                <div
                  data-ai-target="circuit-component-resistor"
                  className="p-3 rounded-xl border border-border bg-card flex items-center gap-3"
                >
                  <div className="w-12 h-3.5 bg-amber-100 dark:bg-amber-950/80 rounded-sm border border-border flex items-center justify-around px-1">
                    <span className="w-1 h-full bg-red-600" />
                    <span className="w-1 h-full bg-red-600" />
                    <span className="w-1 h-full bg-amber-800" />
                    <span className="w-1 h-full bg-yellow-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">220Ω Resistor</div>
                    <div className="text-[10px] text-muted-foreground">Limits forward diode current</div>
                  </div>
                </div>

                {/* Servo */}
                <div
                  data-ai-target="circuit-component-servo1"
                  className="p-3 rounded-xl border border-border bg-card flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-xs font-semibold text-foreground">Micro Servo</div>
                    <div className="text-[10px] text-muted-foreground font-mono">Angle: {servoAngle}° • Pin ~9</div>
                  </div>
                  <div className="w-12 h-12 bg-secondary rounded-full border border-border flex items-center justify-center relative">
                    <div
                      style={{ transform: `rotate(${servoAngle - 90}deg)` }}
                      className="w-1 h-6 bg-primary origin-bottom rounded-full transition-transform duration-300"
                    />
                    <div className="w-2.5 h-2.5 rounded-full bg-foreground absolute" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="w-full bg-secondary/40 p-3 rounded-xl border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-medium text-muted-foreground">Test Input:</span>
                <button
                  onMouseDown={() => {
                    setButtonPressed(true);
                    onPinInteract?.('D2', true);
                  }}
                  onMouseUp={() => {
                    setButtonPressed(false);
                    onPinInteract?.('D2', false);
                  }}
                  className={cn(
                    "px-3 py-1 rounded-lg border text-xs font-medium transition active:scale-95",
                    buttonPressed
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary border-border text-foreground hover:bg-secondary/80"
                  )}
                >
                  <span>Pushbutton (D2)</span>
                </button>

                <div className="flex items-center gap-2 bg-card px-2.5 py-1 rounded-lg border border-border">
                  <span className="text-[10px] text-muted-foreground font-mono">A0:</span>
                  <input
                    type="range"
                    min="0"
                    max="1023"
                    value={potentiometerValue}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPotentiometerValue(val);
                      onPinInteract?.('A0', val);
                    }}
                    className="w-20 accent-primary cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-foreground">{potentiometerValue}</span>
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground font-mono">
                UART: 115200 baud
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

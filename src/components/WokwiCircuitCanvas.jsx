import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Cpu, Zap, Activity, ExternalLink, Layers, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { cn } from '@/lib/utils.js';

/**
 * Wokwi & Interactive Circuit Canvas
 * Embeds the Wokwi Hardware Simulator OR renders a high-fidelity interactive
 * schematic canvas with live microcontroller pins, LEDs, servos, resistors, and virtual sensors.
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
  const [ultrasonicDistance, setUltrasonicDistance] = useState(25); // cm

  // Parse simulated hardware states from firmware code and simulation state
  useEffect(() => {
    if (!isSimulating) {
      setLedState(false);
      return;
    }

    // Parse whether code has LED HIGH/LOW blinking
    const hasBlink = /digitalWrite\s*\(\s*(LED_PIN|13|\d+)\s*,\s*HIGH\s*\)/i.test(firmwareCode);
    const hasAnalog = /analogWrite\s*\(\s*(PWM_PIN|9|\d+)\s*,\s*([^)]+)\)/i.test(firmwareCode);
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
    ? 'ESP-WROOM-32'
    : microcontroller === 'pi-pico'
    ? 'Raspberry Pi Pico'
    : 'Arduino Uno R3';

  // Wokwi Project Embed URL mapping
  const wokwiEmbedUrl = microcontroller === 'esp32'
    ? 'https://wokwi.com/projects/new/esp32'
    : microcontroller === 'pi-pico'
    ? 'https://wokwi.com/projects/new/pi-pico'
    : 'https://wokwi.com/projects/new/arduino-uno';

  return (
    <div className="h-full w-full flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden font-sans select-none relative">
      {/* Top Simulation Toolbar */}
      <div className="h-11 px-3 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md flex items-center justify-between gap-2 shrink-0 z-10">
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
            title={isSimulating ? "Pause Circuit Simulation" : "Run Live Simulation"}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isSimulating ? "Pause" : "Simulate"}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onResetSimulation}
            className="h-7 px-2 text-xs text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800"
            title="Reset Microcontroller"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span>Reset</span>
          </Button>

          <div className="h-4 w-px bg-neutral-800 mx-1 hidden sm:block" />

          {/* Microcontroller Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-800/80 border border-neutral-700/60 text-xs">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-medium text-neutral-200">{mcuName}</span>
            <span className={cn("w-1.5 h-1.5 rounded-full ml-1", isSimulating ? "bg-emerald-400 animate-pulse" : "bg-neutral-600")} />
          </div>
        </div>

        {/* View Mode Toggle: Interactive Canvas vs Wokwi Live Embed */}
        <div className="flex items-center gap-1.5">
          <div className="bg-neutral-800 p-0.5 rounded-lg flex items-center text-xs">
            <button
              onClick={() => setViewMode('canvas')}
              className={cn(
                "px-2.5 py-1 rounded-md transition font-medium text-[11px]",
                viewMode === 'canvas'
                  ? "bg-neutral-700 text-neutral-100 shadow-xs"
                  : "text-neutral-400 hover:text-neutral-200"
              )}
            >
              Circuit Canvas
            </button>
            <button
              onClick={() => setViewMode('wokwi-embed')}
              className={cn(
                "px-2.5 py-1 rounded-md transition font-medium text-[11px] flex items-center gap-1",
                viewMode === 'wokwi-embed'
                  ? "bg-neutral-700 text-neutral-100 shadow-xs"
                  : "text-neutral-400 hover:text-neutral-200"
              )}
            >
              <span>Wokwi Simulator</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Simulation Viewport */}
      <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center p-4">
        {viewMode === 'wokwi-embed' ? (
          /* Wokwi Official Simulator Embed */
          <div className="w-full h-full relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900">
            <iframe
              src={wokwiEmbedUrl}
              title="Wokwi Embedded Simulation"
              className="w-full h-full border-0"
              allow="autoplay; camera; microphone"
              loading="lazy"
            />
            <div className="absolute bottom-3 right-3 z-10">
              <a
                href={wokwiEmbedUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-md bg-neutral-900/90 border border-neutral-700 text-[10px] text-neutral-300 hover:text-white flex items-center gap-1 backdrop-blur-md shadow-md"
              >
                <span>Open in Wokwi.com</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        ) : (
          /* High-Fidelity Interactive Circuit Schematic Canvas */
          <div
            data-ai-target="circuit-canvas-area"
            className="w-full h-full max-w-4xl max-h-[580px] bg-neutral-900/90 border border-neutral-800 rounded-2xl relative shadow-2xl overflow-hidden flex flex-col justify-between p-6"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          >
            {/* Simulation Header Status */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Virtual Breadboard & Circuit Schematic
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
                  {isSimulating ? "5.0V Active" : "Powered Off"}
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>ATmega328P Clock: 16MHz</span>
              </div>
            </div>

            {/* Circuit Work Area: Microcontroller + Components */}
            <div className="flex-1 w-full my-4 flex items-center justify-around gap-6 relative">
              {/* 1. Microcontroller Board Graphic */}
              <div
                data-ai-target="circuit-component-uno"
                className="w-64 h-80 rounded-2xl bg-teal-900/90 border-2 border-teal-500/60 p-4 shadow-2xl relative flex flex-col justify-between transition-all duration-300"
              >
                {/* Board Label */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold tracking-tight text-white font-mono">ARDUINO UNO</span>
                  </div>
                  <span className="text-[9px] text-teal-300 font-mono">ITALY</span>
                </div>

                {/* USB & Power Jack graphic */}
                <div className="absolute -top-3 left-6 w-8 h-6 bg-neutral-400 rounded-xs border border-neutral-500 shadow-sm" />
                <div className="absolute -top-3 left-18 w-7 h-5 bg-neutral-800 rounded-xs border border-neutral-700" />

                {/* Digital Pin Header (Top Right) */}
                <div className="w-full flex justify-between items-center bg-teal-950/80 px-2 py-1.5 rounded-lg border border-teal-700/50 text-[10px] font-mono">
                  <span className="text-neutral-400">DIGITAL (PWM ~)</span>
                  <div className="flex gap-1.5">
                    <span
                      data-ai-target="circuit-pin-13"
                      className={cn(
                        "px-1.5 py-0.5 rounded font-bold transition",
                        ledState ? "bg-amber-400 text-neutral-900 shadow-[0_0_8px_rgba(251,191,36,0.8)]" : "bg-neutral-800 text-neutral-300"
                      )}
                    >
                      D13
                    </span>
                    <span className="px-1 text-neutral-500">D12</span>
                    <span className="px-1 text-neutral-500">~D9</span>
                    <span className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">GND</span>
                  </div>
                </div>

                {/* Microcontroller Silicon Chip */}
                <div className="w-full h-14 bg-neutral-950 border border-neutral-700 rounded-lg flex items-center justify-center shadow-inner relative">
                  <div className="text-center font-mono">
                    <div className="text-[10px] text-neutral-300 font-bold">ATmega328P-PU</div>
                    <div className="text-[8px] text-neutral-500">2224 TWN</div>
                  </div>
                </div>

                {/* Analog & Power Pin Header (Bottom) */}
                <div className="w-full flex justify-between items-center bg-teal-950/80 px-2 py-1.5 rounded-lg border border-teal-700/50 text-[10px] font-mono">
                  <span className="text-neutral-400">POWER</span>
                  <div className="flex gap-1.5">
                    <span className="px-1 text-amber-300">5V</span>
                    <span className="px-1 text-neutral-300">GND</span>
                    <span className="px-1 text-neutral-400">A0</span>
                    <span className="px-1 text-neutral-400">A1</span>
                  </div>
                </div>
              </div>

              {/* Animated Connection Wires (SVG) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                {/* Wire from Pin 13 to Resistor */}
                <path
                  d="M 280 180 C 350 180, 360 140, 440 140"
                  stroke={ledState ? "#10b981" : "#047857"}
                  strokeWidth="3.5"
                  fill="none"
                  strokeDasharray={isSimulating ? "4 2" : "none"}
                  className={isSimulating ? "animate-[dash_1s_linear_infinite]" : ""}
                />
                {/* Wire from Resistor to LED */}
                <path
                  d="M 520 140 L 580 140"
                  stroke={ledState ? "#ef4444" : "#991b1b"}
                  strokeWidth="3.5"
                  fill="none"
                />
                {/* Ground Wire from LED Cathode to Arduino GND */}
                <path
                  d="M 640 170 C 640 280, 350 280, 280 230"
                  stroke="#374151"
                  strokeWidth="3"
                  fill="none"
                />
              </svg>

              {/* 2. Breadboard Components: Resistor, LED, Servo, Buttons */}
              <div className="flex flex-col gap-5 z-10">
                {/* LED Component Card */}
                <div
                  data-ai-target="circuit-component-led1"
                  className={cn(
                    "p-4 rounded-xl border transition-all duration-300 flex items-center gap-4 bg-neutral-900 shadow-xl",
                    ledState
                      ? "border-red-500/80 bg-red-950/20 shadow-[0_0_30px_rgba(239,68,68,0.35)]"
                      : "border-neutral-800"
                  )}
                >
                  <div className="relative">
                    {/* Glowing LED Bulb */}
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full border-2 transition-all duration-200 flex items-center justify-center",
                        ledState
                          ? "bg-red-500 border-red-300 shadow-[0_0_25px_rgba(239,68,68,1)] animate-pulse"
                          : "bg-red-950/60 border-red-800/80"
                      )}
                    >
                      <Sparkles className={cn("w-4 h-4", ledState ? "text-white" : "text-red-800")} />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                      <span>Red 5mm LED</span>
                      <span className={cn("text-[9px] px-1.5 py-0.2 rounded font-mono", ledState ? "bg-red-500/20 text-red-300" : "bg-neutral-800 text-neutral-500")}>
                        {ledState ? "EMITTING (HIGH)" : "OFF (LOW)"}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5 font-mono">
                      Anode: Pin 13 • Current: {ledState ? "18.2 mA" : "0.0 mA"}
                    </div>
                  </div>
                </div>

                {/* Resistor Component Card */}
                <div
                  data-ai-target="circuit-component-resistor"
                  className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/80 flex items-center gap-3"
                >
                  <div className="w-14 h-4 bg-amber-100 rounded-sm border border-neutral-500 flex items-center justify-around px-1 shadow-inner">
                    <span className="w-1.5 h-full bg-red-600" />
                    <span className="w-1.5 h-full bg-red-600" />
                    <span className="w-1.5 h-full bg-amber-800" />
                    <span className="w-1.5 h-full bg-yellow-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-200">220Ω Current-Limiter</div>
                    <div className="text-[10px] text-neutral-400">Protects LED from 5V overcurrent burnout</div>
                  </div>
                </div>

                {/* Robotic Servo Arm (Visible if servo or PWM is in lesson) */}
                <div
                  data-ai-target="circuit-component-servo1"
                  className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/80 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-xs font-semibold text-neutral-200">Micro Servo SG90</div>
                    <div className="text-[10px] text-neutral-400 font-mono">Angle: {servoAngle}° • Pin ~9 PWM</div>
                  </div>
                  <div className="w-14 h-14 bg-neutral-950 rounded-full border border-neutral-700 flex items-center justify-center relative shadow-inner">
                    <div
                      style={{ transform: `rotate(${servoAngle - 90}deg)` }}
                      className="w-1 h-7 bg-amber-400 origin-bottom rounded-full transition-transform duration-300 shadow-md"
                    />
                    <div className="w-3 h-3 rounded-full bg-neutral-300 absolute" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Interactive Component Strip (Buttons, Potentiometers, Sensor sliders) */}
            <div className="w-full bg-neutral-950/70 p-3 rounded-xl border border-neutral-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-medium text-neutral-400">Hardware Inputs:</span>
                {/* Pushbutton */}
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
                    "px-3 py-1.5 rounded-lg border text-xs font-semibold transition flex items-center gap-1.5 shadow-sm active:scale-95",
                    buttonPressed
                      ? "bg-emerald-600 border-emerald-400 text-white"
                      : "bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700"
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full", buttonPressed ? "bg-white" : "bg-neutral-500")} />
                  <span>Pushbutton (D2)</span>
                </button>

                {/* Potentiometer Slider */}
                <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1 rounded-lg border border-neutral-800">
                  <span className="text-[10px] text-neutral-400 font-mono">Potentiometer (A0):</span>
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
                    className="w-24 accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-emerald-400">{potentiometerValue}</span>
                </div>
              </div>

              <div className="text-[11px] text-neutral-400 font-mono">
                UART Serial Baud: 115200 • Status: {isSimulating ? "Running" : "Standby"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

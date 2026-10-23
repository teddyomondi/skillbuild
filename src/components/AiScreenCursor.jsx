import React from 'react';
import { Sparkles, Radio } from 'lucide-react';

/**
 * Smooth Multiplayer-Style AI Instructor Screen Cursor
 * Glides across the IDE interface (tabs, Monaco editor lines/columns, terminal, buttons)
 * using hardware-accelerated translate3d and cubic-bezier / spring easing.
 * Automatically reduces opacity to a near-invisible ghost state (0.07) once the learner takes over.
 */
export default function AiScreenCursor({
  cursorState,
  isAiSpeaking,
  interactionMode = 'AI_STREAMING'
}) {
  if (!cursorState || !cursorState.visible) return null;

  const {
    x = 320,
    y = 220,
    label = 'AI Instructor',
    sublabel = '',
    mode = 'glide', // 'glide' (smooth 680ms transition across screen) | 'typing' (responsive 95ms tracking while typing)
    pulseKey = 0,
    variant = 'teach', // 'teach' (sky) | 'handoff' (amber) | 'alert' (rose) | 'success' (emerald)
    userTookOver = false
  } = cursorState;

  // Once the user takes over (or is in STUDENT_CHALLENGE / COMPLETED mode), drop cursor opacity as low as possible
  const isDimmed = userTookOver || interactionMode !== 'AI_STREAMING';
  const cursorOpacity = isDimmed ? 0.07 : 1;

  const transitionDuration = mode === 'typing' ? '95ms' : '680ms';
  const transitionTiming =
    mode === 'typing'
      ? 'cubic-bezier(0.16, 1, 0.3, 1)'
      : 'cubic-bezier(0.22, 1, 0.36, 1)';

  const themeColors = {
    teach: {
      fill: '#18181b',
      stroke: '#fafafa',
      badgeBg: 'bg-neutral-900/95 border-neutral-700 text-neutral-100 shadow-xl',
      glow: 'shadow-[0_0_20px_rgba(255,255,255,0.18)]',
      ring: 'border-neutral-300'
    },
    handoff: {
      fill: '#f59e0b',
      stroke: '#fef3c7',
      badgeBg: 'bg-amber-950/90 border-amber-400/60 text-amber-100 shadow-xl',
      glow: 'shadow-[0_0_25px_rgba(245,158,11,0.55)]',
      ring: 'border-amber-400'
    },
    alert: {
      fill: '#f43f5e',
      stroke: '#ffe4e6',
      badgeBg: 'bg-rose-950/90 border-rose-400/60 text-rose-100 shadow-xl',
      glow: 'shadow-[0_0_25px_rgba(244,63,94,0.55)]',
      ring: 'border-rose-400'
    },
    success: {
      fill: '#10b981',
      stroke: '#d1fae5',
      badgeBg: 'bg-emerald-950/90 border-emerald-400/60 text-emerald-100 shadow-xl',
      glow: 'shadow-[0_0_25px_rgba(16,185,129,0.55)]',
      ring: 'border-emerald-400'
    }
  };

  const colors = themeColors[variant] || themeColors.teach;

  // Keep label inside viewport if cursor is near the right or bottom edge
  const nearRightEdge = typeof window !== 'undefined' && x > window.innerWidth - 290;
  const nearBottomEdge = typeof window !== 'undefined' && y > window.innerHeight - 100;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-40 overflow-hidden"
      aria-hidden="true"
    >
      <div
        style={{
          transform: `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`,
          opacity: cursorOpacity,
          transitionProperty: 'transform, opacity',
          transitionDuration: `${transitionDuration}, 350ms`,
          transitionTimingFunction: `${transitionTiming}, ease-out`,
          willChange: 'transform, opacity'
        }}
        className="absolute top-0 left-0"
      >
        {/* Animated Attention Ripple at Cursor Tip (hidden when dimmed so it never distracts the user) */}
        {!isDimmed && (
          <div
            key={pulseKey}
            className={`-left-3 -top-3 w-7 h-7 rounded-full border-2 ${colors.ring} animate-ping opacity-60 absolute`}
          />
        )}

        {/* Glowing Spotlight Halo under Cursor Tip */}
        {!isDimmed && (
          <div
            className={`-left-4 -top-4 w-9 h-9 rounded-full blur-md opacity-40 absolute ${
              variant === 'handoff'
                ? 'bg-amber-400'
                : variant === 'alert'
                ? 'bg-rose-400'
                : variant === 'success'
                ? 'bg-emerald-400'
                : 'bg-sky-400'
            }`}
          />
        )}

        {/* Crisp Figma/Scrimba-style Multiplayer Vector Pointer */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative drop-shadow-[0_4px_10px_rgba(0,0,0,0.65)] -left-0.5 -top-0.5"
        >
          <path
            d="M4.5 2.5L19.5 11.2L12.2 13.1L9.3 20.2L4.5 2.5Z"
            fill={colors.fill}
            stroke={colors.stroke}
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>

        {/* Floating Contextual Callout Pill attached to AI Cursor (collapses/fades when user takes over) */}
        {label && !isDimmed && (
          <div
            className={`absolute ${
              nearRightEdge ? 'right-4' : 'left-5'
            } ${
              nearBottomEdge ? 'bottom-4' : 'top-4'
            } px-2.5 py-1.5 rounded-lg border backdrop-blur-md ${colors.badgeBg} ${
              colors.glow
            } whitespace-nowrap max-w-[280px] transition-all duration-300`}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-semibold leading-tight">
              {isAiSpeaking ? (
                <Radio className="w-3 h-3 text-sky-300 animate-pulse shrink-0" />
              ) : (
                <Sparkles className="w-3 h-3 shrink-0" />
              )}
              <span className="truncate">{label}</span>
            </div>
            {sublabel && (
              <div className="text-[10px] opacity-85 truncate mt-0.5 font-normal">
                {sublabel}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

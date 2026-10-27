import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Copy,
  Check,
  Cpu,
  Brain,
  Keyboard,
  Share2,
  FileCode2,
  Lock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { toast } from 'sonner';

export default function UpskillProofCard({
  proofData,
  onClose,
  isModal = false
}) {
  const [activeDebugStep, setActiveDebugStep] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPlaybackProgress, setAudioPlaybackProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showMerkleDetails, setShowMerkleDetails] = useState(false);
  const audioIntervalRef = useRef(null);

  const {
    id,
    challengeTitle,
    category,
    track,
    student,
    cognitionMetrics,
    terminalDebuggingArc,
    socraticVoiceDefense,
    cryptography
  } = proofData;

  // Audio Playback Simulation for 30s Voice Defense
  useEffect(() => {
    if (isPlayingAudio) {
      audioIntervalRef.current = setInterval(() => {
        setAudioPlaybackProgress((prev) => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 3.5;
        });
      }, 300);
    } else {
      clearInterval(audioIntervalRef.current);
    }
    return () => clearInterval(audioIntervalRef.current);
  }, [isPlayingAudio]);

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      setIsPlayingAudio(false);
    } else {
      if (audioPlaybackProgress >= 100) setAudioPlaybackProgress(0);
      setIsPlayingAudio(true);
    }
  };

  const handleCopyLink = () => {
    const url = `https://upskill.dev/proof/${id}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
    }
    setCopiedLink(true);
    toast.success('Cryptographic proof link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const currentDebug = terminalDebuggingArc[activeDebugStep] || terminalDebuggingArc[0];

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl border border-emerald-500/30 bg-card text-card-foreground shadow-2xl overflow-hidden backdrop-blur-xl transition-all">
      {/* Top Banner / Cryptographic Header */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-background to-teal-950/80 border-b border-emerald-500/20 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-900/50">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-widest uppercase text-emerald-400">
                Upskill Proof Card
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Lock className="w-2.5 h-2.5" />
                Merkle Verified
              </span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              {challengeTitle}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyLink}
            className="h-8 gap-1.5 text-xs font-semibold border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-300"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied' : 'Share Proof Link'}</span>
          </Button>
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose} className="h-8 px-2 text-xs">
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Candidate & Challenge Metadata Subbar */}
      <div className="bg-secondary/30 px-6 py-3 border-b border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <img
            src={student.avatarUrl}
            alt={student.name}
            className="w-7 h-7 rounded-full border border-emerald-500/40 object-cover"
          />
          <div>
            <span className="font-semibold text-foreground">{student.name}</span>{' '}
            <span className="text-muted-foreground">{student.verifiedHandle}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <span className="text-muted-foreground">Track: </span>
            <span className="font-medium text-foreground">{track}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Verified: </span>
            <span className="font-medium text-foreground">{student.completedAt}</span>
          </div>
        </div>
      </div>

      {/* Main Proof Content Grid */}
      <div className="p-6 space-y-6">

        {/* ========================================================================= */}
        {/* PILLAR 1: TIME SPENT THINKING VS. TYPING (ZERO COPY-PASTE PROOF) */}
        {/* ========================================================================= */}
        <section className="rounded-xl border border-border/70 bg-secondary/15 p-5 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                1. Cognitive Dwell & Typing Cadence (Zero Copy-Paste Proof)
              </h2>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              0 Chars Pasted (AST Verified)
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            Analysis of continuous Monaco editor telemetry, inter-keystroke intervals (IKI), and Acorn AST mutation rate proves genuine human thought rather than clipboard injection.
          </p>

          {/* Ratio Bar */}
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-indigo-400 flex items-center gap-1">
                <Brain className="w-3.5 h-3.5" />
                Thinking & Architecture: {cognitionMetrics.thinkingRatio}% ({cognitionMetrics.thinkingTimeSec}s)
              </span>
              <span className="text-emerald-400 flex items-center gap-1">
                <Keyboard className="w-3.5 h-3.5" />
                Active Typing: {cognitionMetrics.typingRatio}% ({cognitionMetrics.typingTimeSec}s)
              </span>
            </div>
            <div className="h-3 w-full bg-secondary/80 rounded-full overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${cognitionMetrics.thinkingRatio}%` }}
                className="bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-700"
              />
              <div
                style={{ width: `${cognitionMetrics.typingRatio}%` }}
                className="bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-700"
              />
            </div>
          </div>

          {/* Micro Telemetry Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2.5 rounded-lg bg-card/60 border border-border/60">
              <div className="text-[10px] uppercase font-semibold text-muted-foreground">Clipboard Paste Events</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">0 Events</div>
              <div className="text-[10px] text-muted-foreground">0 characters inserted</div>
            </div>
            <div className="p-2.5 rounded-lg bg-card/60 border border-border/60">
              <div className="text-[10px] uppercase font-semibold text-muted-foreground">Keystroke Count</div>
              <div className="text-base font-bold text-foreground mt-0.5">{cognitionMetrics.keystrokesTotal}</div>
              <div className="text-[10px] text-muted-foreground">Avg IKI: {cognitionMetrics.averageInterKeystrokeMs}ms</div>
            </div>
            <div className="p-2.5 rounded-lg bg-card/60 border border-border/60">
              <div className="text-[10px] uppercase font-semibold text-muted-foreground">AST Mutation Deltas</div>
              <div className="text-base font-bold text-indigo-400 mt-0.5">{cognitionMetrics.astMutationCount} Nodes</div>
              <div className="text-[10px] text-muted-foreground">Gradual syntax growth</div>
            </div>
            <div className="p-2.5 rounded-lg bg-card/60 border border-border/60">
              <div className="text-[10px] uppercase font-semibold text-muted-foreground">Human Authenticity</div>
              <div className="text-base font-bold text-emerald-400 mt-0.5">{cognitionMetrics.cognitionScore}%</div>
              <div className="text-[10px] text-muted-foreground">Cognitive Score</div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* PILLAR 2: HOW THEY DEBUGGED 3 BROKEN TERMINAL STATES */}
        {/* ========================================================================= */}
        <section className="rounded-xl border border-border/70 bg-secondary/15 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                2. Real Debugging Trajectory (3 Broken Terminal States &gt; Resolution)
              </h2>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              Resilience & Diagnostic Hypothesis Proof
            </span>
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            AI generators spit out code without stumbling. Authentic engineers encounter errors, inspect terminal output, form hypotheses, and iteratively fix their code.
          </p>

          {/* Stepper Buttons */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {terminalDebuggingArc.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setActiveDebugStep(idx)}
                className={`flex-1 min-w-[140px] text-left px-3 py-2 rounded-lg border text-xs transition-all ${
                  activeDebugStep === idx
                    ? 'border-amber-500/60 bg-amber-500/10 text-foreground font-semibold shadow-sm'
                    : 'border-border/60 bg-card/40 text-muted-foreground hover:bg-card/70'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-amber-400">
                  <span>State #{idx + 1}</span>
                  <span className="text-muted-foreground">{item.timeSpentDebuggingSec}s debug</span>
                </div>
                <div className="truncate text-xs mt-0.5 font-medium">{item.title.split(':')[1] || item.title}</div>
              </button>
            ))}
          </div>

          {/* Selected State Diagnostic Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Terminal Output */}
            <div className="rounded-lg bg-black/80 border border-zinc-800 p-3 font-mono text-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Terminal Stderr (Exit Code {currentDebug.exitCode})
                  </span>
                  <span className="text-zinc-500">{currentDebug.command}</span>
                </div>
                <pre className="mt-2 text-red-400/90 whitespace-pre-wrap leading-relaxed text-[11px]">
                  {currentDebug.errorSnippet}
                </pre>
              </div>
              <div className="mt-3 pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-400 italic">
                Hypothesis: {currentDebug.hypothesis}
              </div>
            </div>

            {/* Resolved Code Diff */}
            <div className="rounded-lg bg-zinc-950/80 border border-zinc-800 p-3 font-mono text-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <FileCode2 className="w-3.5 h-3.5" />
                    Candidate Resolution Patch
                  </span>
                  <span className="text-[10px] text-emerald-400/80">Applied &amp; Verified</span>
                </div>
                <pre className="mt-2 text-zinc-300 whitespace-pre-wrap leading-relaxed text-[11px]">
                  {currentDebug.diffCode.split('\n').map((line, lIdx) => {
                    const isAdd = line.startsWith('+');
                    const isDel = line.startsWith('-');
                    return (
                      <div
                        key={lIdx}
                        className={
                          isAdd
                            ? 'bg-emerald-950/40 text-emerald-300 px-1 -mx-1 rounded'
                            : isDel
                            ? 'bg-red-950/40 text-red-400 px-1 -mx-1 rounded'
                            : 'text-zinc-400'
                        }
                      >
                        {line}
                      </div>
                    );
                  })}
                </pre>
              </div>
              <div className="mt-3 pt-2 border-t border-zinc-800/60 text-[10px] text-emerald-400 flex items-center justify-between">
                <span>Passes Test Assertion</span>
                <span>Took {currentDebug.timeSpentDebuggingSec}s to diagnose</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* PILLAR 3: 30-SECOND SOCRATIC AUDIO DEFENSE */}
        {/* ========================================================================= */}
        <section className="rounded-xl border border-border/70 bg-secondary/15 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-teal-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                3. 30-Second Socratic Audio Defense (Architecture Defense)
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/15 text-teal-400 border border-teal-500/30">
              <Sparkles className="w-3 h-3" />
              {socraticVoiceDefense.alignmentScore}
            </span>
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            Candidate verbally defended their algorithmic architecture and edge-case decisions directly to Upskill's Socratic AI voice tutor.
          </p>

          {/* Audio Player Component */}
          <div className="p-4 rounded-xl bg-card/80 border border-border/80 flex flex-col md:flex-row items-center gap-4">
            <button
              onClick={handleToggleAudio}
              className="w-12 h-12 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-teal-500/30 transition-transform active:scale-95 shrink-0"
            >
              {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            {/* Waveform & Progress */}
            <div className="flex-1 w-full space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span className="text-foreground font-semibold flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-teal-400" />
                  Candidate Voice Explanation ({socraticVoiceDefense.durationSec}s)
                </span>
                <span className="font-mono text-[11px]">
                  {isPlayingAudio ? `${Math.round((audioPlaybackProgress / 100) * socraticVoiceDefense.durationSec)}s / ` : ''}
                  {socraticVoiceDefense.durationSec}s
                </span>
              </div>

              {/* Dynamic Waveform Visualizer */}
              <div className="h-8 flex items-center gap-1 bg-secondary/50 rounded-lg px-2">
                {socraticVoiceDefense.audioWaveform.map((height, i) => {
                  const barProgress = (i / socraticVoiceDefense.audioWaveform.length) * 100;
                  const isPassed = barProgress <= audioPlaybackProgress;
                  return (
                    <div
                      key={i}
                      style={{ height: `${height}%` }}
                      className={`flex-1 rounded-full transition-all duration-150 ${
                        isPassed
                          ? 'bg-teal-400 shadow-xs shadow-teal-400/50'
                          : 'bg-zinc-700/60'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Transcript Box */}
          <div className="mt-3 p-3.5 rounded-lg bg-card/50 border border-border/60 text-xs">
            <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
              Socratic Prompt &amp; Candidate Defense Transcript
            </div>
            <div className="text-muted-foreground italic mb-2">
              &ldquo;{socraticVoiceDefense.prompt}&rdquo;
            </div>
            <div className="text-foreground leading-relaxed font-sans bg-secondary/20 p-2.5 rounded border border-border/40">
              &ldquo;{socraticVoiceDefense.transcript}&rdquo;
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* CRYPTOGRAPHIC ATTESTATION SEAL */}
        {/* ========================================================================= */}
        <section className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-foreground">Cryptographic Attestation &amp; Merkle Digest</span>
            </div>
            <button
              onClick={() => setShowMerkleDetails(!showMerkleDetails)}
              className="text-[11px] text-emerald-400 hover:underline font-mono"
            >
              {showMerkleDetails ? 'Hide Tree Proof' : 'View Merkle Leaves & Signature'}
            </button>
          </div>

          <div className="mt-2 font-mono text-[11px] text-muted-foreground flex flex-wrap items-center gap-2">
            <span className="text-emerald-400/90 font-bold">Root Hash:</span>
            <span className="bg-background/80 px-2 py-0.5 rounded border border-border/60 text-foreground">
              {cryptography.merkleRoot}
            </span>
            <span className="text-[10px] text-zinc-500">Block #{cryptography.blockHeight}</span>
          </div>

          {showMerkleDetails && (
            <div className="mt-3 pt-3 border-t border-emerald-500/20 font-mono text-[11px] space-y-1 text-zinc-400">
              <div>Keystroke Leaf: <span className="text-zinc-200">{cryptography.leafHashes.keystrokes}</span></div>
              <div>AST Mutation Leaf: <span className="text-zinc-200">{cryptography.leafHashes.astMutations}</span></div>
              <div>Terminal Trace Leaf: <span className="text-zinc-200">{cryptography.leafHashes.terminalStates}</span></div>
              <div>Audio Defense Leaf: <span className="text-zinc-200">{cryptography.leafHashes.audioDefense}</span></div>
              <div className="text-emerald-400 pt-1 font-semibold">Signature: {cryptography.signature}</div>
            </div>
          )}
        </section>

      </div>

      {/* Footer Share Action */}
      <div className="bg-secondary/40 border-t border-border/80 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          Verified by <span className="font-semibold text-foreground">Upskill Autonomous IDE Runtime</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleCopyLink}
            className="h-8 gap-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Verified Link Copied!' : 'Share Proof Card'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  Brain,
  Network,
  Sparkles,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Cpu,
  Flame,
  Clock,
  Radio,
  RefreshCw,
  Lightbulb,
  Globe,
  Sliders,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { toast } from 'sonner';
import {
  getOrCreateCognitiveProfile,
  PLATFORM_FLEET_INTELLIGENCE,
  getOptimalFleetIntervention
} from '@/services/dualLoopAdaptiveEngine.js';

export default function PlatformIntelligenceDashboard({ onClose }) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'fleet'
  const [profile, setProfile] = useState(() => getOrCreateCognitiveProfile());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fleet = PLATFORM_FLEET_INTELLIGENCE;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setProfile(getOrCreateCognitiveProfile());
      setIsRefreshing(false);
      toast.success('Cognitive profile & fleet pulse synchronized!');
    }, 600);
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-indigo-500/30 bg-background text-foreground shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col my-4">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-950 border-b border-indigo-500/20 px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Network className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-400">
                Dual-Loop Intelligence Engine
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                Fleet Pulse Active
              </span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Upskill Cognitive &amp; Collective Knowledge Network
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            className="h-8 gap-1.5 text-xs font-semibold border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Engine</span>
          </Button>
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose} className="h-8 px-2 text-xs text-slate-300">
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Loop Switcher Tabs */}
      <div className="bg-secondary/40 px-6 py-2 border-b border-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Loop 1: Individual Cognitive Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('fleet')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === 'fleet'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Loop 2: Collective Platform Fleet Intelligence</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-muted-foreground font-mono text-[11px]">
          <span>{fleet.livePulse.activeLearnersOnline} Active Learners</span>
          <span>•</span>
          <span className="text-emerald-400 font-semibold">{fleet.livePulse.autonomousResolutionRate}% Autonomous Pass</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="p-6">
        {activeTab === 'profile' ? (
          /* ========================================================================= */
          /* LOOP 1: INDIVIDUAL STUDENT COGNITIVE PROFILE */
          /* ========================================================================= */
          <div className="space-y-6">
            {/* Cognitive State Overview Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
                <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-between">
                  <span>Cognitive State</span>
                  <Flame className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-black text-emerald-400 mt-1 flex items-center gap-1.5">
                  <span>Optimal Flow</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Cognitive load: {profile.cognitiveLoadScore}/100 (Calm)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
                <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-between">
                  <span>Dwell Ratio</span>
                  <Clock className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-xl font-black text-foreground mt-1">
                  {Math.round(profile.dwellRatio * 100)}% Thinking
                </div>
                <div className="text-[11px] text-emerald-400 mt-0.5">
                  Zero clipboard paste verified
                </div>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
                <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-between">
                  <span>Diagnostic Velocity</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-black text-foreground mt-1">
                  {profile.diagnosticVelocitySec}s / Bug
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Crash hypothesis &amp; diff turnaround
                </div>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
                <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-between">
                  <span>Continuous Streak</span>
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-xl font-black text-indigo-400 mt-1">
                  {profile.zeroPasteStreak} Labs
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  100% authentic human cognition
                </div>
              </div>
            </div>

            {/* Concept Mastery Radar */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                    <Brain className="w-4 h-4 text-indigo-400" />
                    Bayesian Concept Mastery Matrix
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Estimated through your live AST diff cadence, terminal outputs, and Socratic oral responses.
                  </p>
                </div>
                <span className="text-xs font-mono text-muted-foreground">
                  BKT Model v3.2
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(profile.conceptMastery).map(([conceptKey, data]) => (
                  <div key={conceptKey} className="p-3 rounded-lg bg-secondary/30 border border-border/60 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-foreground capitalize">{conceptKey.replace('-', ' ')}</span>
                      <span className="font-mono text-indigo-400">{data.score}% Mastery</span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        style={{ width: `${data.score}%` }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Confidence: {Math.round(data.confidence * 100)}%</span>
                      <span>{data.attempts} interactive evaluations</span>
                      <span>Trained {data.lastTrained}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preferred Learning Modality & Personalized Next Step */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Modality Card */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-teal-400" />
                  Learning Modality Affinity
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Where you formulate solutions fastest:
                </p>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] font-medium mb-1">
                      <span>Visual Digital Board (Graphs &amp; Vectors)</span>
                      <span className="font-bold text-teal-400">{profile.preferredModality.visualBoard}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div style={{ width: `${profile.preferredModality.visualBoard}%` }} className="h-full bg-teal-400" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-medium mb-1">
                      <span>Terminal Diagnostics &amp; Unit Tests</span>
                      <span className="font-bold text-amber-400">{profile.preferredModality.terminalDebugging}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div style={{ width: `${profile.preferredModality.terminalDebugging}%` }} className="h-full bg-amber-400" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-medium mb-1">
                      <span>Socratic Voice Defense</span>
                      <span className="font-bold text-indigo-400">{profile.preferredModality.socraticVoice}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div style={{ width: `${profile.preferredModality.socraticVoice}%` }} className="h-full bg-indigo-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Personalized Dynamic Recommendation */}
              <div className="md:col-span-2 rounded-xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/20 via-background to-secondary/20 p-5 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Autonomous Scaffolding Recommendation
                  </div>
                  <h4 className="text-base font-bold text-foreground">
                    {profile.recommendedNextStep.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {profile.recommendedNextStep.reasoning}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Dynamic Difficulty Adjustment (DDA): <span className="text-emerald-400 font-bold">+18% Advanced</span>
                  </span>
                  <Button size="sm" className="h-8 gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white">
                    <span>Launch Adaptive Path</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* LOOP 2: COLLECTIVE PLATFORM FLEET INTELLIGENCE */
          /* ========================================================================= */
          <div className="space-y-6">
            {/* Fleet Live Pulse KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
                <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-between">
                  <span>Active Fleet Learners</span>
                  <Globe className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-foreground mt-1">
                  {fleet.livePulse.activeLearnersOnline}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Across 62 global universities &amp; bootcamps
                </div>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
                <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-between">
                  <span>Autonomous Resolution</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {fleet.livePulse.autonomousResolutionRate}%
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {fleet.livePulse.autonomousResolutionsToday} bugs cleared without instructor
                </div>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
                <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-between">
                  <span>Cross-Student Transfers</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400 mt-1">
                  {fleet.livePulse.crossStudentInterventionsApplied}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Interventions optimized today
                </div>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
                <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-between">
                  <span>Curriculum Self-Healing</span>
                  <Activity className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-2xl font-black text-teal-400 mt-1">
                  {fleet.livePulse.curriculumSelfHealingEvents} Auto-Fixes
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Starter code clarification adjustments
                </div>
              </div>
            </div>

            {/* Global Concept Friction Heatmap */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    Global Concept Friction Heatmap (Platform-Wide)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Real-time telemetry detects where learners bottleneck, dynamically testing the most effective pedagogical interventions.
                  </p>
                </div>
                <span className="text-xs font-mono text-muted-foreground">Live Telemetry Aggregator</span>
              </div>

              <div className="space-y-3">
                {fleet.conceptFrictionHeatmap.map((item) => (
                  <div
                    key={item.conceptId}
                    className="p-3.5 rounded-lg border border-border/80 bg-secondary/20 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{item.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-muted-foreground border border-border">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-red-400 font-mono">
                        Primary Bottleneck: &ldquo;{item.mostCommonError}&rdquo;
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Friction Index</div>
                        <div className={`text-base font-bold ${
                          item.frictionIndex > 70 ? 'text-red-400' : item.frictionIndex > 50 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {item.frictionIndex}%
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Avg Debug Time</div>
                        <div className="text-base font-bold text-foreground font-mono">{item.avgResolutionTimeSec}s</div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-emerald-400">Winning Intervention</div>
                        <div className="font-bold text-foreground">{item.interventionEfficacy}% Resolution Rate</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Multi-Armed Bandit Pedagogical Optimizer */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    Multi-Armed Bandit Pedagogical Optimizer (Thompson Sampling)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    The AI experiments across candidate pedagogical strategies to automatically discover the fastest resolution arm.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {fleet.pedagogicalBanditArms.map((arm) => (
                  <div
                    key={arm.armId}
                    className={`p-4 rounded-xl border space-y-2 text-xs flex flex-col justify-between ${
                      arm.state === 'CONVERGED_WINNER'
                        ? 'border-emerald-500/50 bg-emerald-950/15'
                        : 'border-border bg-secondary/15'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{arm.type}</span>
                        {arm.state === 'CONVERGED_WINNER' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Converged Winner
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 italic">
                        {arm.promptSnippet}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-border/60 space-y-1">
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-muted-foreground">Win Rate:</span>
                        <span className="font-bold text-foreground">{arm.winRatePercentage}%</span>
                      </div>
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-muted-foreground">Trials Across Fleet:</span>
                        <span className="text-foreground">{arm.trialsAcrossFleet} students</span>
                      </div>
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-muted-foreground">Avg Time to Pass:</span>
                        <span className="text-emerald-400 font-bold">{arm.avgTimeToPassSec}s</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Cross-Student Knowledge Transfer Stream */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  Live Cross-Student Learning Propagation Feed
                </h3>
                <span className="text-[11px] text-muted-foreground font-mono">Real-time Fleet Mesh</span>
              </div>

              <div className="space-y-2">
                {fleet.liveCrossStudentEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-lg bg-secondary/20 border border-border/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-400">{evt.city}</span>
                        <span className="text-[10px] text-muted-foreground">({evt.timeAgo})</span>
                      </div>
                      <div className="text-foreground">{evt.event}</div>
                    </div>
                    <div className="sm:text-right text-[11px] text-emerald-400/90 font-mono bg-emerald-950/20 px-2 py-1 rounded border border-emerald-500/20 shrink-0">
                      {evt.impact}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-secondary/40 border-t border-border px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div>
          Upskill Fleet Mesh • Powered by <span className="font-semibold text-foreground">Bayesian Knowledge Tracing &amp; Thompson Sampling</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onClose}
            className="h-8 px-3 text-xs bg-secondary hover:bg-secondary/80 text-foreground"
          >
            Close Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

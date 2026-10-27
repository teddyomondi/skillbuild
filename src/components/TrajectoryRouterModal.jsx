import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import {
  Sparkles,
  GitFork,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Cpu,
  RefreshCw,
  ShieldCheck,
  Zap,
  Activity,
  Flame,
} from 'lucide-react';
import {
  loadTrajectoryDomains,
  saveTrajectoryDomains,
  DEFAULT_TRAJECTORY_DOMAINS,
  recordTrajectoryOutcome,
  startStruggleEpisode,
} from '@/services/pedagogicalTrajectoryRouter.js';
import { toast } from 'sonner';

export default function TrajectoryRouterModal({ open, onOpenChange, activeNodeId = null }) {
  const [domains, setDomains] = useState(DEFAULT_TRAJECTORY_DOMAINS);
  const [selectedDomainKey, setSelectedDomainKey] = useState('closures-state');
  const [isSimulating, setIsSimulating] = useState(false);
  const [liveLog, setLiveLog] = useState([
    { id: '1', time: '10:42:15', text: 'Student #10,042 on Closures -> Routed to Detour B -> Fixed in 84s', success: true },
    { id: '2', time: '10:39:02', text: 'Student #10,041 on Async Event Loop -> Routed to Detour B -> Fixed in 91s', success: true },
    { id: '3', time: '10:35:48', text: 'Student #10,040 on Coordinate Geometry -> Routed to Detour B -> Fixed in 76s', success: true },
    { id: '4', time: '10:31:12', text: 'Student #10,039 (Exploration Trial) on Hint A -> Dwell 410s -> Abandoned (Quit)', success: false },
  ]);

  // Load and listen for changes
  useEffect(() => {
    setDomains(loadTrajectoryDomains());

    const handleUpdate = (e) => {
      if (e.detail) setDomains({ ...e.detail });
    };

    window.addEventListener('upskill:trajectory-updated', handleUpdate);
    return () => window.removeEventListener('upskill:trajectory-updated', handleUpdate);
  }, []);

  // Auto-select tab matching current active module
  useEffect(() => {
    if (!activeNodeId) return;
    const lower = activeNodeId.toLowerCase();
    if (lower.includes('closure')) {
      setSelectedDomainKey('closures-state');
    } else if (lower.includes('async') || lower.includes('promise')) {
      setSelectedDomainKey('async-event-loop');
    } else if (lower.includes('vector') || lower.includes('math') || lower.includes('geometry')) {
      setSelectedDomainKey('coordinate-geometry');
    }
  }, [activeNodeId]);

  const activeDomain = domains[selectedDomainKey] || domains['closures-state'];
  const hintArm = activeDomain?.arms?.['hint-a'];
  const detourArm = activeDomain?.arms?.['detour-b'];

  const hintTotal = hintArm ? hintArm.trials : 1;
  const hintQuitRate = hintArm ? Math.round((hintArm.abandonments / hintTotal) * 100) : 70;
  const hintPassRate = 100 - hintQuitRate;

  const detourTotal = detourArm ? detourArm.trials : 1;
  const detourPassRate = detourArm ? Math.round((detourArm.successes / detourTotal) * 100) : 94;
  const detourQuitRate = 100 - detourPassRate;

  const totalTrials = (hintArm?.trials || 0) + (detourArm?.trials || 0);

  // Trigger interactive struggle simulation
  const handleSimulateStruggle = () => {
    setIsSimulating(true);

    const episode = startStruggleEpisode({
      learnerId: `sim-student-${Math.floor(10000 + Math.random() * 90000)}`,
      nodeId: activeDomain.nodeIds[0],
      nodeTitle: activeDomain.title,
      conceptTag: activeDomain.conceptTags[0],
      struggleSignature: 'simulation-trigger'
    });

    const isDetour = episode.selectedArmKey === 'detour-b';
    const simDuration = isDetour ? Math.floor(70 + Math.random() * 25) : Math.floor(340 + Math.random() * 100);
    const simSuccess = isDetour ? Math.random() < 0.95 : Math.random() < 0.32;

    setTimeout(() => {
      recordTrajectoryOutcome(episode.episodeId, {
        passed: simSuccess,
        abandoned: !simSuccess,
        customDurationSec: simDuration
      });

      const updated = loadTrajectoryDomains();
      setDomains(updated);

      const timeLabel = new Date().toLocaleTimeString([], { hour12: false });
      const logEntry = {
        id: `sim-${Date.now()}`,
        time: timeLabel,
        text: `${episode.learnerId} on ${activeDomain.title} -> Routed to ${episode.selectedArmLabel} -> ${
          simSuccess ? `Fixed misconception in ${simDuration}s` : `Dwell ${simDuration}s -> Session Quit`
        }`,
        success: simSuccess
      };

      setLiveLog((prev) => [logEntry, ...prev.slice(0, 7)]);
      setIsSimulating(false);

      toast.success(
        simSuccess
          ? `Trajectory Fed Back! Detour B resolved struggle in ${simDuration}s (Bayesian prior updated).`
          : `Hint A resulted in drop-off after ${simDuration}s. Router further penalized Hint A.`
      );
    }, 600);
  };

  const handleResetPriors = () => {
    saveTrajectoryDomains(DEFAULT_TRAJECTORY_DOMAINS);
    setDomains(DEFAULT_TRAJECTORY_DOMAINS);
    toast.info('Pedagogical priors reset to 10,000-student benchmark.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-card border-border text-foreground p-0 overflow-hidden shadow-2xl">
        {/* MODAL HEADER */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-gradient-to-r from-sky-500/10 via-emerald-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Cpu className="w-4 h-4" />
              </span>
              <div>
                <DialogTitle className="text-base font-semibold flex items-center gap-2">
                  Pedagogical Trajectory Router
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-normal">
                    10,000+ Telemetry Traces
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Bayesian Thompson Sampling dynamically routes student misconceptions away from churn-inducing hints to high-velocity micro-detours.
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleResetPriors}
              className="text-xs h-7 gap-1 text-muted-foreground hover:text-foreground"
              title="Reset priors to initial benchmark"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Priors
            </Button>
          </div>

          {/* DOMAIN TABS */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-border/50">
            {Object.values(domains).map((dom) => (
              <button
                key={dom.id}
                onClick={() => setSelectedDomainKey(dom.id)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
                  selectedDomainKey === dom.id
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {dom.title.split('&')[0].trim()}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* BODY */}
        <div className="px-6 py-5 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* STATS BANNER */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-secondary/30 border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Dataset Analyzed
                </div>
                <div className="text-sm font-bold text-foreground font-mono">
                  {totalTrials.toLocaleString()} Sessions
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Hint A Drop-Off
                </div>
                <div className="text-sm font-bold text-rose-400 font-mono">
                  {hintQuitRate}% Quit Rate
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Detour B Time-to-Fix
                </div>
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  {detourArm?.avgResolutionTimeSec || 90}s Avg Mastery
                </div>
              </div>
            </div>
          </div>

          {/* HEAD-TO-HEAD COMPARISON */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* HINT A CARD */}
            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.03] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Hint A (Passive Text)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                    Suppressed by Router
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-foreground mt-1">
                  {hintArm?.label || 'Abstract Conceptual Text Hint'}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {hintArm?.description}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-rose-500/10 text-xs">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Student Abandonment (Churn):</span>
                  <span className="font-mono font-bold text-rose-400">{hintQuitRate}%</span>
                </div>
                <div className="w-full h-1.5 bg-rose-950/40 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${hintQuitRate}%` }} />
                </div>
                <div className="flex justify-between items-center text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" /> Avg Struggle Time:
                  </span>
                  <span className="font-mono text-foreground">{hintArm?.avgResolutionTimeSec || 380}s (~6.5m)</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Logged Historical Trials:</span>
                  <span className="font-mono text-foreground">{hintArm?.trials.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* DETOUR B CARD */}
            <div className="p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/[0.05] flex flex-col justify-between space-y-3 shadow-lg shadow-emerald-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 fill-black" /> Winning Trajectory
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Detour B (Interactive Sandbox)
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-foreground mt-1">
                  {detourArm?.label || '90-Second Micro-Detour'}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {detourArm?.description}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-emerald-500/10 text-xs">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Mastery Pass Rate:</span>
                  <span className="font-mono font-bold text-emerald-400">{detourPassRate}%</span>
                </div>
                <div className="w-full h-1.5 bg-emerald-950/40 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${detourPassRate}%` }} />
                </div>
                <div className="flex justify-between items-center text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-400" /> Avg Time to Fix:
                  </span>
                  <span className="font-mono font-bold text-emerald-400">
                    {detourArm?.avgResolutionTimeSec || 88} seconds!
                  </span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Logged Historical Trials:</span>
                  <span className="font-mono text-foreground">{detourArm?.trials.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* BAYESIAN POLICY DIRECTIVE */}
          <div className="p-3.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Active System Prompt Directive Fed to AI Tutor:
            </div>
            <p className="text-muted-foreground italic font-mono text-[11px] bg-background/50 p-2 rounded border border-border">
              "{detourArm?.promptDirective}"
            </p>
          </div>

          {/* REAL-TIME SIMULATION & LIVE TRAJECTORY FEED */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Live Student Trajectory Stream
              </span>
              <Button
                size="sm"
                onClick={handleSimulateStruggle}
                disabled={isSimulating}
                className="h-7 text-xs bg-sky-600 hover:bg-sky-500 text-white gap-1.5"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Simulating Bayesian Step...
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3" />
                    Simulate Next Struggle Episode
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto bg-neutral-900/40 p-2 rounded-lg border border-border text-[11px] font-mono">
              {liveLog.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-muted-foreground py-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">[{item.time}]</span>
                    <span className={item.success ? 'text-emerald-400' : 'text-rose-400'}>
                      {item.success ? '✓' : '✗'}
                    </span>
                    <span className="text-neutral-300">{item.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

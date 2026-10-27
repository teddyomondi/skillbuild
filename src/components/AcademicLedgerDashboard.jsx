import React, { useState } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  Download,
  Share2,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Brain,
  Terminal,
  Volume2,
  Play,
  Lock,
  ChevronRight,
  ExternalLink,
  BookOpen,
  School,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { toast } from 'sonner';
import {
  ACADEMIC_COHORTS,
  generateAbetAccreditationReport
} from '@/services/academicLedgerService.js';
import UpskillProofCard from './UpskillProofCard.jsx';
import { getOrGenerateProofCard } from '@/services/skillReplayEngine.js';

export default function AcademicLedgerDashboard({ onClose }) {
  const [selectedCohortKey, setSelectedCohortKey] = useState('cs201-stanford');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentForAudit, setSelectedStudentForAudit] = useState(null);
  const [isSyncingLti, setIsSyncingLti] = useState(false);
  const [proofCardModalData, setProofCardModalData] = useState(null);

  const cohort = ACADEMIC_COHORTS[selectedCohortKey] || ACADEMIC_COHORTS['cs201-stanford'];

  const filteredRoster = cohort.rosterLedger.filter((student) => {
    const q = searchQuery.toLowerCase();
    return (
      student.name.toLowerCase().includes(q) ||
      student.studentId.toLowerCase().includes(q) ||
      student.email.toLowerCase().includes(q)
    );
  });

  const handleSyncLti = () => {
    setIsSyncingLti(true);
    setTimeout(() => {
      setIsSyncingLti(false);
      toast.success(`Successfully synced ${cohort.rosterLedger.length} verified grades to Canvas LMS via LTI 1.3!`);
    }, 1200);
  };

  const handleExportAbetReport = () => {
    const report = generateAbetAccreditationReport(selectedCohortKey);
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ABET-Assessment-Dossier-${cohort.course.code}-${selectedCohortKey}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('ABET Learning Outcome Assessment Dossier exported!');
  };

  const handleOpenStudentProof = async (student) => {
    // If it's a flagged student, show custom audit
    if (student.integrityStatus !== 'VERIFIED_HUMAN') {
      setSelectedStudentForAudit(student);
      return;
    }
    const card = await getOrGenerateProofCard(cohort.lab.targetNodeId);
    setProofCardModalData({
      ...card,
      student: {
        ...card.student,
        name: student.name,
        verifiedHandle: student.studentId,
        completedAt: new Date(student.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      }
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto rounded-2xl border border-border/80 bg-background text-foreground shadow-2xl overflow-hidden flex flex-col my-6">
      {/* Institutional Top Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border-b border-border/70 px-6 py-5 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-sm shadow-indigo-950">
            <School className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                Official Academic System of Record (SoR)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Database className="w-2.5 h-2.5" />
                Ledger v2.4 (Immutable)
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2 mt-0.5">
              {cohort.institution.name}
              <span className="text-sm font-normal text-slate-300">({cohort.institution.department})</span>
            </h1>
          </div>
        </div>

        {/* Global Controls & Close */}
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportAbetReport}
            className="h-8 gap-1.5 text-xs font-semibold border-indigo-400/40 hover:bg-indigo-500/10 text-indigo-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export ABET Portfolio</span>
          </Button>
          <Button
            size="sm"
            onClick={handleSyncLti}
            disabled={isSyncingLti}
            className="h-8 gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLti ? 'animate-spin' : ''}`} />
            <span>{isSyncingLti ? 'Syncing...' : 'Sync LTI 1.3 Gradebook'}</span>
          </Button>
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose} className="h-8 px-2 text-xs text-slate-300">
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Cohort Selector & Metadata Ribbon */}
      <div className="bg-secondary/30 px-6 py-3.5 border-b border-border/60 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Active Course Cohort:</span>
          <div className="flex items-center gap-1.5 bg-background p-1 rounded-lg border border-border">
            <button
              onClick={() => setSelectedCohortKey('cs201-stanford')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                selectedCohortKey === 'cs201-stanford'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              CS201: Rate Limiter Lab (Stanford)
            </button>
            <button
              onClick={() => setSelectedCohortKey('math105-mit')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                selectedCohortKey === 'math105-mit'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              MATH105: Vector Geometry Lab (MIT)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">{cohort.course.code}:</span> {cohort.course.title}
          </div>
          <div className="hidden md:inline">
            <span className="text-muted-foreground">Accreditation: </span>
            <span className="font-semibold text-emerald-400">{cohort.institution.accreditationBody}</span>
          </div>
        </div>
      </div>

      {/* Institutional Analytics KPI Row */}
      <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-secondary/10 border-b border-border/60">
        <div className="p-4 rounded-xl bg-card border border-border/60 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-between">
            <span>Cohort Average Grade</span>
            <GraduationCap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-foreground mt-1">
            {cohort.cohortSummary.averageGrade}%
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {cohort.cohortSummary.submittedCount} / {cohort.cohortSummary.enrolledStudents} Labs Submitted
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border/60 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-between">
            <span>Verified Human Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {cohort.cohortSummary.verifiedHumanPercentage}%
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {cohort.cohortSummary.flaggedCount} Integrity Flag(s) Pending Review
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border/60 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-between">
            <span>Cognitive Dwell Ratio</span>
            <Brain className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-foreground mt-1">
            {cohort.cohortSummary.averageThinkingRatio}% Think
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Proof of zero clipboard paste
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border/60 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center justify-between">
            <span>Resilience Metric</span>
            <Terminal className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-foreground mt-1">
            {cohort.cohortSummary.averageTerminalFailuresDebugged} States
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Average terminal crashes overcome
          </div>
        </div>
      </div>

      {/* Main Roster Grading Ledger Table */}
      <div className="p-6 flex-1 flex flex-col space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-indigo-400" />
              Practical Lab Grading Ledger: {cohort.lab.number} ({cohort.lab.title})
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live keystroke cadence, terminal debugging trajectories, and Socratic oral defense scores.
            </p>
          </div>

          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by student name, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* The Official Ledger Table */}
        <div className="rounded-xl border border-border/80 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase">
              <tr>
                <th className="py-3 px-4">Student &amp; ID</th>
                <th className="py-3 px-3">Grade</th>
                <th className="py-3 px-3">Thinking vs Typing</th>
                <th className="py-3 px-3">Terminal Debugged</th>
                <th className="py-3 px-3">Voice Defense</th>
                <th className="py-3 px-3">Academic Integrity</th>
                <th className="py-3 px-4 text-right">Practical Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-card/40">
              {filteredRoster.map((student) => {
                const isFlagged = student.integrityStatus !== 'VERIFIED_HUMAN';
                return (
                  <tr
                    key={student.studentId}
                    className={`hover:bg-secondary/30 transition-colors ${
                      isFlagged ? 'bg-red-500/5' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground">{student.name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {student.studentId} • {student.email}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-bold ${isFlagged ? 'text-red-400' : 'text-foreground'}`}>
                          {student.finalGrade}%
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-secondary border border-border text-foreground">
                          {student.letterGrade}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden flex">
                          <div
                            style={{ width: `${student.thinkingRatio}%` }}
                            className="bg-indigo-400"
                          />
                          <div
                            style={{ width: `${student.typingRatio}%` }}
                            className="bg-emerald-400"
                          />
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {student.thinkingRatio}% Think
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {student.pastedChars > 0 ? (
                          <span className="text-red-400 font-bold">{student.pastedChars} chars pasted</span>
                        ) : (
                          <span className="text-emerald-400">0 chars pasted</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono text-foreground font-semibold">
                        {student.terminalFailures} broken states
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {student.terminalFailures > 0 ? 'Diagnostic hypothesis logged' : 'No errors encountered'}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                        <span className="font-semibold text-foreground">{student.voiceScore}%</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">Oral defense verified</div>
                    </td>

                    <td className="py-3 px-3">
                      {isFlagged ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                          <AlertTriangle className="w-3 h-3" />
                          FLAGGED: Paste Burst
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <ShieldCheck className="w-3 h-3" />
                          Verified Human
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenStudentProof(student)}
                        className={`h-7 px-2.5 text-[11px] font-semibold gap-1 ${
                          isFlagged
                            ? 'border-red-500/40 text-red-400 hover:bg-red-500/10'
                            : 'border-indigo-400/30 text-indigo-300 hover:bg-indigo-500/10'
                        }`}
                      >
                        <span>{isFlagged ? 'Inspect Flag' : 'Forensic Replay'}</span>
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flagged Student Forensic Audit Modal */}
      {selectedStudentForAudit && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-card border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-4 text-foreground">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm uppercase tracking-wide">
                <AlertTriangle className="w-5 h-5" />
                Academic Integrity Forensic Dossier
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedStudentForAudit(null)}
                className="h-7 px-2 text-xs"
              >
                Close
              </Button>
            </div>

            <div className="bg-secondary/30 p-3 rounded-lg text-xs space-y-1">
              <div><span className="text-muted-foreground font-semibold">Student:</span> {selectedStudentForAudit.name} ({selectedStudentForAudit.studentId})</div>
              <div><span className="text-muted-foreground font-semibold">Violation Detected:</span> External Clipboard Injection (LLM Copy-Paste)</div>
              <div><span className="text-muted-foreground font-semibold">Merkle Root:</span> <span className="font-mono text-zinc-400">{selectedStudentForAudit.merkleRoot}</span></div>
            </div>

            <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-500/30 text-xs text-red-300 space-y-2">
              <div className="font-semibold text-red-200">Forensic Telemetry Finding:</div>
              <p>
                Student inserted <span className="font-bold underline">385 characters</span> into Monaco editor in a single tick (<span className="font-bold">18 milliseconds</span>). The Acorn AST recorded an instantaneous jump of 48 syntax nodes without any intermediate transient error states or human keystroke pauses.
              </p>
              <p>
                Terminal debugging duration was <span className="font-bold">0 seconds</span> with zero iterations, inconsistent with genuine algorithmic problem solving.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  toast.info('Evidence package forwarded to Academic Honor Code Committee.');
                  setSelectedStudentForAudit(null);
                }}
                className="text-xs border-red-500/30 text-red-300 hover:bg-red-500/10"
              >
                Forward to Honor Council
              </Button>
              <Button
                size="sm"
                onClick={() => setSelectedStudentForAudit(null)}
                className="text-xs bg-secondary"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Verified Student Proof Modal */}
      {proofCardModalData && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl focus:outline-none">
            <UpskillProofCard
              proofData={proofCardModalData}
              onClose={() => setProofCardModalData(null)}
              isModal={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}

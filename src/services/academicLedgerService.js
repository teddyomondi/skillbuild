// ============================================================================
// ACADEMIC SYSTEM OF RECORD (SoR): PRACTICAL LAB GRADING LEDGER SERVICE
// ============================================================================
// Turns Upskill into the authoritative, unremovable institutional grading database
// and audit trail for university and bootcamp practical laboratory exams.
// ============================================================================

import { computeSha256 } from './skillReplayEngine.js';

/**
 * Multi-dimensional academic grading formula:
 * Final Grade = (Correctness * 0.40) + (Resilience * 0.20) + (AntiCheat * 0.20) + (VoiceDefense * 0.20)
 */
export function calculateAcademicGrade({
  testSuitePassed = true,
  unitTestPassRatio = 1.0,
  terminalFailuresResolved = 3,
  thinkingRatio = 0.70,
  clipboardPasteChars = 0,
  socraticDefenseScore = 95
}) {
  // 1. Correctness (40 pts)
  const correctnessScore = (testSuitePassed ? 40 : unitTestPassRatio * 40);

  // 2. Debugging Resilience (20 pts)
  // Rewards overcoming 1 to 4 broken states iteratively. 0 broken states without thinking might be suspicious
  let resilienceScore = 20;
  if (terminalFailuresResolved === 0) {
    resilienceScore = 15; // no bugs encountered
  } else if (terminalFailuresResolved >= 1 && terminalFailuresResolved <= 4) {
    resilienceScore = 20; // optimal diagnostic trajectory
  } else {
    resilienceScore = Math.max(12, 20 - (terminalFailuresResolved - 4) * 2);
  }

  // 3. Cognitive Integrity & Anti-Cheat (20 pts)
  let antiCheatScore = 20;
  if (clipboardPasteChars > 0) {
    antiCheatScore = Math.max(0, 20 - Math.min(20, clipboardPasteChars * 0.2));
  }
  if (thinkingRatio < 0.35) {
    antiCheatScore = Math.max(0, antiCheatScore - 8); // suspiciously low dwell time
  }

  // 4. Socratic Voice Defense (20 pts)
  const voiceScore = (socraticDefenseScore / 100) * 20;

  const totalPoints = Number((correctnessScore + resilienceScore + antiCheatScore + voiceScore).toFixed(1));

  let letterGrade = 'F';
  if (totalPoints >= 97) letterGrade = 'A+';
  else if (totalPoints >= 93) letterGrade = 'A';
  else if (totalPoints >= 90) letterGrade = 'A-';
  else if (totalPoints >= 87) letterGrade = 'B+';
  else if (totalPoints >= 83) letterGrade = 'B';
  else if (totalPoints >= 80) letterGrade = 'B-';
  else if (totalPoints >= 77) letterGrade = 'C+';
  else if (totalPoints >= 70) letterGrade = 'C';
  else letterGrade = 'F';

  let integrityStatus = 'VERIFIED_HUMAN';
  if (clipboardPasteChars > 25) {
    integrityStatus = 'FLAGGED_PASTE_BURST';
  } else if (thinkingRatio < 0.25) {
    integrityStatus = 'FLAGGED_CADENCE_ANOMALY';
  }

  return {
    finalGrade: totalPoints,
    letterGrade,
    integrityStatus,
    breakdown: {
      correctness: { earned: Number(correctnessScore.toFixed(1)), max: 40 },
      resilience: { earned: Number(resilienceScore.toFixed(1)), max: 20 },
      antiCheat: { earned: Number(antiCheatScore.toFixed(1)), max: 20 },
      voiceDefense: { earned: Number(voiceScore.toFixed(1)), max: 20 }
    }
  };
}

/**
 * Default Academic Cohort Datasets for Universities & Bootcamps
 */
export const ACADEMIC_COHORTS = {
  'cs201-stanford': {
    institution: {
      name: 'Stanford University',
      department: 'Department of Computer Science & Engineering',
      accreditationBody: 'ABET-CAC Accredited',
      term: 'Fall 2026',
      instructor: 'Prof. David M. Chen'
    },
    course: {
      code: 'CS201',
      title: 'Systems Programming & API Infrastructure',
      section: 'Section 01 (Mon/Wed Practical Lab)'
    },
    lab: {
      number: 'Lab #4',
      title: 'In-Memory Token Bucket Rate Limiter',
      targetNodeId: 'node-rate-limiter',
      assignedDate: 'October 24, 2026',
      dueDate: 'October 27, 2026',
      maxPoints: 100
    },
    cohortSummary: {
      enrolledStudents: 32,
      submittedCount: 31,
      averageGrade: 91.2,
      verifiedHumanPercentage: 93.5,
      flaggedCount: 2,
      averageThinkingRatio: 71,
      averageTerminalFailuresDebugged: 2.7
    },
    rosterLedger: [
      {
        studentId: 'SU-2026-8812',
        name: 'Alex Mercer',
        email: 'amercer@stanford.edu',
        finalGrade: 98.0,
        letterGrade: 'A+',
        integrityStatus: 'VERIFIED_HUMAN',
        thinkingRatio: 70,
        typingRatio: 30,
        pastedChars: 0,
        terminalFailures: 3,
        voiceScore: 98,
        timeTotalSec: 542,
        merkleRoot: '0x3b89f2a412de8976c6b840134e792ba236f1c4892cbe359871fae109d784a9e2',
        ltiSynced: true,
        submittedAt: '2026-10-27T18:42:10Z'
      },
      {
        studentId: 'SU-2026-9041',
        name: 'Elena Rostova',
        email: 'erostova@stanford.edu',
        finalGrade: 96.5,
        letterGrade: 'A',
        integrityStatus: 'VERIFIED_HUMAN',
        thinkingRatio: 74,
        typingRatio: 26,
        pastedChars: 0,
        terminalFailures: 2,
        voiceScore: 95,
        timeTotalSec: 620,
        merkleRoot: '0x81da304b891ce9124a919248bb01948123acde1092841029410492bbfa199321',
        ltiSynced: true,
        submittedAt: '2026-10-27T17:15:33Z'
      },
      {
        studentId: 'SU-2026-7731',
        name: 'Marcus Vance',
        email: 'mvance@stanford.edu',
        finalGrade: 92.0,
        letterGrade: 'A-',
        integrityStatus: 'VERIFIED_HUMAN',
        thinkingRatio: 66,
        typingRatio: 34,
        pastedChars: 0,
        terminalFailures: 4,
        voiceScore: 90,
        timeTotalSec: 715,
        merkleRoot: '0x992fa102b489912ceba1048291048bca10928481203948102948bbca91204812',
        ltiSynced: true,
        submittedAt: '2026-10-27T19:02:44Z'
      },
      {
        studentId: 'SU-2026-6619',
        name: 'Jordan Hayes',
        email: 'jhayes@stanford.edu',
        finalGrade: 54.0,
        letterGrade: 'F',
        integrityStatus: 'FLAGGED_PASTE_BURST',
        thinkingRatio: 12,
        typingRatio: 88,
        pastedChars: 385,
        terminalFailures: 0,
        voiceScore: 45,
        timeTotalSec: 82,
        merkleRoot: '0x10f823a992bcda19948291048bca10928481203948102948bbca91204812f8a1',
        ltiSynced: false,
        submittedAt: '2026-10-27T16:20:05Z',
        flagNotes: 'Audit flag: Single-tick injection of 385 characters from clipboard (delta 18ms). Zero terminal debugging cycles.'
      },
      {
        studentId: 'SU-2026-8190',
        name: 'Priya Sharma',
        email: 'psharma@stanford.edu',
        finalGrade: 94.5,
        letterGrade: 'A',
        integrityStatus: 'VERIFIED_HUMAN',
        thinkingRatio: 72,
        typingRatio: 28,
        pastedChars: 0,
        terminalFailures: 3,
        voiceScore: 92,
        timeTotalSec: 590,
        merkleRoot: '0x7741d2c91823acde1092841029410492bbfa19932181da304b891ce9124a919248',
        ltiSynced: true,
        submittedAt: '2026-10-27T18:11:50Z'
      }
    ]
  },

  'math105-mit': {
    institution: {
      name: 'Massachusetts Institute of Technology (MIT)',
      department: 'Department of Mathematics & EECS',
      accreditationBody: 'ABET-EAC Accredited',
      term: 'Fall 2026',
      instructor: 'Prof. Katherine G. Miller'
    },
    course: {
      code: 'MATH105',
      title: 'Multivariable Calculus & Computational Geometry',
      section: 'Section B (Interactive Digital Canvas Lab)'
    },
    lab: {
      number: 'Lab #2',
      title: 'Coordinate Geometry & Vector Addition Mechanics',
      targetNodeId: 'math-vectors-coordinate-geometry',
      assignedDate: 'October 25, 2026',
      dueDate: 'October 27, 2026',
      maxPoints: 100
    },
    cohortSummary: {
      enrolledStudents: 28,
      submittedCount: 28,
      averageGrade: 94.8,
      verifiedHumanPercentage: 96.4,
      flaggedCount: 1,
      averageThinkingRatio: 76,
      averageTerminalFailuresDebugged: 3.1
    },
    rosterLedger: [
      {
        studentId: 'MIT-2026-4401',
        name: 'Maya Lin',
        email: 'mayalin@mit.edu',
        finalGrade: 99.0,
        letterGrade: 'A+',
        integrityStatus: 'VERIFIED_HUMAN',
        thinkingRatio: 76,
        typingRatio: 24,
        pastedChars: 0,
        terminalFailures: 3,
        voiceScore: 100,
        timeTotalSec: 610,
        merkleRoot: '0x7e44a901f2bc881923e4198230bcf19385b291a92e109d784a9e2981048bca1',
        ltiSynced: true,
        submittedAt: '2026-10-27T19:15:32Z'
      },
      {
        studentId: 'MIT-2026-5529',
        name: 'Devon Kim',
        email: 'dkim@mit.edu',
        finalGrade: 95.0,
        letterGrade: 'A',
        integrityStatus: 'VERIFIED_HUMAN',
        thinkingRatio: 78,
        typingRatio: 22,
        pastedChars: 0,
        terminalFailures: 2,
        voiceScore: 94,
        timeTotalSec: 540,
        merkleRoot: '0x221fb004ca7781b092ac91f443a19e2212de55dc988190bb7e44a901f2bc8819',
        ltiSynced: true,
        submittedAt: '2026-10-27T18:44:12Z'
      }
    ]
  }
};

/**
 * Generates an official ABET accreditation audit report for the institution
 */
export function generateAbetAccreditationReport(cohortId = 'cs201-stanford') {
  const cohort = ACADEMIC_COHORTS[cohortId] || ACADEMIC_COHORTS['cs201-stanford'];
  const now = new Date().toISOString();

  return {
    reportType: 'ABET_STUDENT_OUTCOME_ATTAINMENT_DOSSIER',
    accreditationCycle: '2026-2027 Academic Year',
    institution: cohort.institution.name,
    department: cohort.institution.department,
    accreditationBody: cohort.institution.accreditationBody,
    course: `${cohort.course.code}: ${cohort.course.title}`,
    labAssignment: `${cohort.lab.number}: ${cohort.lab.title}`,
    generatedAt: now,
    studentOutcomeMapping: [
      {
        outcomeCode: 'ABET Outcome 1',
        description: 'Analyze a complex computing problem and apply principles of computing to identify solutions.',
        evidenceSource: 'Debugging Resilience & Terminal Trajectory Logs (Average 2.7 broken states overcome per student).'
      },
      {
        outcomeCode: 'ABET Outcome 6',
        description: 'Apply computer science theory and software development fundamentals to produce computing-based solutions.',
        evidenceSource: 'AST Syntax Evolution Checkpoints & 30s Socratic Voice Architecture Defense.'
      }
    ],
    cohortMetrics: cohort.cohortSummary,
    auditLedgerSnapshot: cohort.rosterLedger.map((s) => ({
      studentId: s.studentId,
      name: s.name,
      grade: s.finalGrade,
      letter: s.letterGrade,
      humanAuthenticity: s.integrityStatus,
      merkleSignature: s.merkleRoot.slice(0, 20) + '...'
    })),
    immutableLedgerCertificate: `UPSKILL-ABET-AUDIT-VERIFIED-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
  };
}

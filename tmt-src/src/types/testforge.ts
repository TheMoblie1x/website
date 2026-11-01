export type QuestionType =
  | 'SCQ'
  | 'MCQ'
  | 'TRUE_FALSE'
  | 'FILL_BLANKS'
  | 'SUBJECTIVE'
  | 'CODING';

export type SectionNavMode = 'FREE' | 'SEQUENTIAL';

export type AttemptStatus =
  | 'INITIALIZED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'EXPIRED'
  | 'TERMINATED_MALPRACTICE';

export type QuestionStatus =
  | 'UNVISITED'
  | 'UNANSWERED'
  | 'ANSWERED'
  | 'MARKED_FOR_REVIEW'
  | 'ANSWERED_AND_MARKED_FOR_REVIEW';

export interface QuestionOption {
  id: string; // "A", "B", "C", "D"
  text: string;
  isCorrect?: boolean;
}

export interface CodingTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  explanation?: string;
}

export interface CodingMetadata {
  language: 'python' | 'javascript' | 'typescript' | 'java' | 'cpp';
  boilerplate: string;
  testCases: CodingTestCase[];
}

export interface Question {
  id: string;
  sectionId: string;
  type: QuestionType;
  content: string;
  orderIndex: number;
  marks: number;
  negativeMarks: number;
  options?: QuestionOption[];
  correctAnswers?: string | string[]; // "A", ["A", "C"], "TRUE", or regex/string
  explanation?: string;
  codingMetadata?: CodingMetadata;
  wordLimit?: number; // For subjective
}

export interface TestSection {
  id: string;
  testId: string;
  title: string;
  description?: string;
  orderIndex: number;
  durationMin: number; // minutes per section
  totalMarks?: number;
  questions: Question[];
}

export interface Organization {
  id: string;
  slug: string;
  name: string;
  logoUrl: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

export interface Test {
  id: string;
  orgId: string;
  authorId: string;
  /** Job role this test is for, e.g. "Android Developer". */
  jobRole?: string;
  title: string;
  description?: string;
  guidelines: string;
  totalDurationMin: number;
  passPercentage: number;
  negativeMarking: boolean;
  navigationMode: SectionNavMode;
  shuffleQuestions: boolean;
  isPublished: boolean;
  sections: TestSection[];
  proctoring: ProctoringSettings;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateResponse {
  questionId: string;
  status: QuestionStatus;
  savedAnswer: any; // string, string[], or code
  timeSpentSec: number;
  scoreAwarded?: number;
  updatedAt?: string;
}

export interface CandidateSectionState {
  sectionId: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  timeRemainingSec: number;
  startedAt?: string;
  completedAt?: string;
}

export type ProctoringEventType =
  | 'TAB_SWITCH'
  | 'FULLSCREEN_EXIT'
  | 'FOCUS_LOST'
  | 'MULTI_PERSON_DETECTED'
  | 'NO_PERSON_DETECTED'
  | 'GAZE_AWAY'
  | 'MOBILE_PHONE_DETECTED'
  | 'AUDIO_VOICE_DETECTED'
  | 'ROOM_SWEEP_FAILED';

export interface RoomSweepStep {
  angle: '0_FRONT' | '90_RIGHT' | '180_REAR' | '270_LEFT' | 'DESK_SURFACE';
  label: string;
  description: string;
  isCompleted: boolean;
  snapshotUrl?: string;
  detectedObjects: string[];
  status: 'CLEAN' | 'WARNING' | 'PENDING';
}

export interface RoomSweepAudit {
  isVerified: boolean;
  verifiedAt?: string;
  integrityScore: number; // 0 - 100
  steps: RoomSweepStep[];
  notes?: string;
}

export interface ProctoringTelemetry {
  gazeDirection: 'CENTER' | 'LEFT' | 'RIGHT' | 'DOWN' | 'AWAY';
  faceCount: number;
  mobileDetected: boolean;
  audioDecibels: number; // e.g. 15-85 dB
  speechDetected: boolean;
  suspicionScore: number; // 0 - 100
  lastEvent?: string;
}

export interface ProctoringSettings {
  enforceFullscreen: boolean;
  maxTabSwitchViolations: number;
  recordCameraCheck: boolean;
  enable360RoomSweep: boolean;
  enableAiGazeTracking: boolean;
  enableMultiPersonDetection: boolean;
  enableDeviceDetection: boolean;
  enableAudioMonitoring: boolean;
}

export interface InfractionLog {
  id: string;
  timestamp: string;
  type: ProctoringEventType;
  warningNumber: number;
  description: string;
  snapshotEvidence?: string;
}

export interface CandidateAttempt {
  id: string;
  testId: string;
  candidateEmail: string;
  candidateName: string;
  status: AttemptStatus;
  startedAt?: string;
  submittedAt?: string;
  serverExpiresAt?: string;
  totalScore?: number;
  maxScore?: number;
  percentageScore?: number;
  isPassed?: boolean;
  clientIp?: string;
  userAgent?: string;
  infractionCount: number;
  infractions: InfractionLog[];
  sectionStates: Record<string, CandidateSectionState>;
  responses: Record<string, CandidateResponse>;
  confirmationReceipt?: string;
  activeSectionId?: string;
  roomSweep?: RoomSweepAudit;
  proctoringTelemetry?: ProctoringTelemetry;
}

export interface EmailNotification {
  id: string;
  attemptId: string;
  testId: string;
  toEmail: string;
  toName: string;
  fromName: string;
  fromEmail: string;
  subject: string;
  sentAt: string;
  receiptId: string;
  status: 'DELIVERED' | 'QUEUED' | 'BOUNCED';
  verdict: 'PASSED' | 'FAILED' | 'TERMINATED_MALPRACTICE';
  scoreSummary: {
    totalScore: number;
    maxScore: number;
    percentage: number;
  };
  sectionBreakdown: {
    title: string;
    score: number;
    total: number;
    timeSpentSec: number;
  }[];
  roomSweepStatus?: {
    isVerified: boolean;
    integrityScore: number;
  };
  infractionsCount: number;
  htmlContent: string;
}

export type VerdictType = 'YATHARTHA_CHIRI' | 'KALLA_CHIRI' | 'NO_SMILE';

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

export interface FacialFrameMetrics {
  timestamp: number;
  rawMouthWidth: number;
  rawEyeAperture: number;
  faceWidth: number;
  faceHeight: number;
  normalizedMouthWidth: number;
  normalizedMouthOpening: number;
  normalizedEyeAperture: number;
  leftEyeAperture: number;
  rightEyeAperture: number;
  cornerElevation: number;
  leftCornerY: number;
  rightCornerY: number;
}

export interface ScanAnalysisData {
  totalFrames: number;
  validFrames: number;
  durationSeconds: number;
  baselineMouthWidth: number;
  baselineEyeAperture: number;
  peakMouthWidth: number;
  peakEyeAperture: number;
  mouthExpansionPercent: number;
  mouthOpeningPercent?: number;
  cornerLiftPercent?: number;
  eyeSquintPercent: number;
  symmetryPercent: number;
  smileScore: number;
  smileDetected: boolean;
  heuristicSuspicionScore: number;
  preliminaryVerdict: VerdictType;
}

export interface GeminiForensicPayload {
  mouth_expansion_percent: number;
  eye_squint_percent: number;
  symmetry_percent: number;
  smile_duration_seconds: number;
  heuristic_suspicion_score: number;
  smile_score: number;
  verdict: VerdictType;
}

export interface ForensicReport {
  verdict: VerdictType;
  confidence: number;
  summary: string;
  evidence: string[];
  roast: string;
  interrogation_question: string;
  metrics?: ScanAnalysisData;
  isFallback?: boolean;
}

export type AppState = 'LANDING' | 'SCANNER' | 'ANALYZING' | 'REPORT' | 'TRAINING';
export type ThemeMode = 'light' | 'dark';

export function getVerdictDisplay(verdict: VerdictType): { emoji: string; title: string; colorClass: string } {
  switch (verdict) {
    case 'YATHARTHA_CHIRI':
      return { emoji: '😊', title: 'Nalla Chiri', colorClass: 'text-emerald-700 dark:text-emerald-400' };
    case 'KALLA_CHIRI':
      return { emoji: '🥲', title: 'Kalla Chiri', colorClass: 'text-amber-700 dark:text-amber-400' };
    case 'NO_SMILE':
    default:
      return { emoji: '😐', title: 'No Chiri', colorClass: 'text-stone-600 dark:text-stone-400' };
  }
}

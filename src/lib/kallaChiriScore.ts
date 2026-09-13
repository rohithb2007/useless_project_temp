import { FacialFrameMetrics, ScanAnalysisData, VerdictType } from '../types/forensic';
import { predictWithPersonalModel } from './personalClassifier';

/**
 * Applies a 3-frame moving average filter across metrics to smooth out single-frame jitter.
 */
function smoothMetrics(frames: FacialFrameMetrics[]): FacialFrameMetrics[] {
  if (frames.length < 3) return frames;

  return frames.map((f, i) => {
    if (i === 0 || i === frames.length - 1) return f;
    const prev = frames[i - 1];
    const next = frames[i + 1];

    return {
      ...f,
      normalizedMouthWidth: (prev.normalizedMouthWidth + f.normalizedMouthWidth + next.normalizedMouthWidth) / 3,
      normalizedMouthOpening: (prev.normalizedMouthOpening + f.normalizedMouthOpening + next.normalizedMouthOpening) / 3,
      normalizedEyeAperture: (prev.normalizedEyeAperture + f.normalizedEyeAperture + next.normalizedEyeAperture) / 3,
      cornerElevation: (prev.cornerElevation + f.cornerElevation + next.cornerElevation) / 3,
    };
  });
}

/**
 * Analyzes frame metrics collected over a 3-second scan.
 * Classifies smile strictly into three categories: YATHARTHA_CHIRI, KALLA_CHIRI, or NO_SMILE.
 */
export function calculateScanAnalysis(frames: FacialFrameMetrics[]): ScanAnalysisData {
  const rawValidFrames = frames.filter((f) => f && f.normalizedMouthWidth > 0);
  const totalFrames = frames.length;

  if (rawValidFrames.length === 0) {
    return {
      totalFrames,
      validFrames: 0,
      durationSeconds: 3,
      baselineMouthWidth: 0,
      baselineEyeAperture: 0,
      peakMouthWidth: 0,
      peakEyeAperture: 0,
      mouthExpansionPercent: 0,
      eyeSquintPercent: 0,
      symmetryPercent: 100,
      smileScore: 0,
      smileDetected: false,
      heuristicSuspicionScore: 0,
      preliminaryVerdict: 'NO_SMILE',
    };
  }

  // 1. Temporal Smoothing
  const validFrames = smoothMetrics(rawValidFrames);

  // 2. Personal Baseline Calculation (lowest 15% frames by width)
  const sortedByWidth = [...validFrames].sort((a, b) => a.normalizedMouthWidth - b.normalizedMouthWidth);
  const baselineSampleCount = Math.max(3, Math.floor(sortedByWidth.length * 0.15));
  const baselineFrames = sortedByWidth.slice(0, baselineSampleCount);

  const baselineMouthWidth = baselineFrames.reduce((sum, f) => sum + f.normalizedMouthWidth, 0) / baselineSampleCount;
  const baselineMouthOpening = baselineFrames.reduce((sum, f) => sum + f.normalizedMouthOpening, 0) / baselineSampleCount;
  const baselineEyeAperture = baselineFrames.reduce((sum, f) => sum + f.normalizedEyeAperture, 0) / baselineSampleCount;
  const baselineCornerElevation = baselineFrames.reduce((sum, f) => sum + f.cornerElevation, 0) / baselineSampleCount;

  // 3. Peak Expression Calculation (top 15% frames by width)
  const peakSampleCount = Math.max(3, Math.floor(sortedByWidth.length * 0.15));
  const peakFrames = sortedByWidth.slice(sortedByWidth.length - peakSampleCount);

  const peakMouthWidth = peakFrames.reduce((sum, f) => sum + f.normalizedMouthWidth, 0) / peakSampleCount;
  const peakMouthOpening = peakFrames.reduce((sum, f) => sum + f.normalizedMouthOpening, 0) / peakSampleCount;
  const peakEyeAperture = peakFrames.reduce((sum, f) => sum + f.normalizedEyeAperture, 0) / peakSampleCount;
  const peakCornerElevation = peakFrames.reduce((sum, f) => sum + f.cornerElevation, 0) / peakSampleCount;

  // 4. Percentage Changes
  const widthExpansionRaw = ((peakMouthWidth - baselineMouthWidth) / (baselineMouthWidth || 0.001)) * 100;
  const mouthExpansionPercent = Math.max(0, Math.min(150, Math.round(widthExpansionRaw * 10) / 10));

  const mouthOpeningRaw = ((peakMouthOpening - baselineMouthOpening) / (baselineMouthOpening || 0.001)) * 100;
  const mouthOpeningPercent = Math.max(0, Math.min(150, Math.round(mouthOpeningRaw * 10) / 10));

  const cornerLiftRaw = (peakCornerElevation - baselineCornerElevation) * 100;
  const cornerLiftPercent = Math.round(cornerLiftRaw * 10) / 10;

  const eyeSquintRaw = ((baselineEyeAperture - peakEyeAperture) / (baselineEyeAperture || 0.001)) * 100;
  const eyeSquintPercent = Math.round(eyeSquintRaw * 10) / 10;

  // 5. Symmetry Calculation
  const maxFrame = peakFrames[peakFrames.length - 1];
  const leftCornerDelta = Math.abs(maxFrame.leftCornerY - baselineFrames[0].leftCornerY);
  const rightCornerDelta = Math.abs(maxFrame.rightCornerY - baselineFrames[0].rightCornerY);
  const maxCornerDelta = Math.max(leftCornerDelta, rightCornerDelta, 0.001);
  const minCornerDelta = Math.min(leftCornerDelta, rightCornerDelta);
  const symmetryPercent = Math.max(35, Math.min(100, Math.round((minCornerDelta / maxCornerDelta) * 100)));

  // Duration
  const startTime = validFrames[0].timestamp;
  const endTime = validFrames[validFrames.length - 1].timestamp;
  const durationSeconds = Math.round(((endTime - startTime) / 1000) * 10) / 10 || 3.0;

  // 6. Decoupled Smile Detection
  const widthScore = Math.min(100, (mouthExpansionPercent / 10.0) * 100);
  const openingScore = Math.min(100, (mouthOpeningPercent / 18.0) * 100);
  const liftScore = Math.min(100, (cornerLiftPercent / 3.0) * 100);

  const smileScore = Math.max(0, Math.min(100, Math.round(
    Math.max(widthScore, widthScore * 0.5 + openingScore * 0.3 + liftScore * 0.2)
  )));

  const smileDetected = mouthExpansionPercent >= 3.5 || cornerLiftPercent >= 1.0 || smileScore >= 20;

  // 7. STRICT Classification Logic:
  // CRITICAL RULE: If smileDetected === false, preliminaryVerdict MUST ALWAYS BE 'NO_SMILE'.
  let heuristicSuspicionScore = 0;
  let preliminaryVerdict: VerdictType = 'NO_SMILE';

  // Check for trained Personal Classifier in localStorage
  const currentScanData: ScanAnalysisData = {
    totalFrames,
    validFrames: validFrames.length,
    durationSeconds,
    baselineMouthWidth: Math.round(baselineMouthWidth * 1000) / 1000,
    baselineEyeAperture: Math.round(baselineEyeAperture * 1000) / 1000,
    peakMouthWidth: Math.round(peakMouthWidth * 1000) / 1000,
    peakEyeAperture: Math.round(peakEyeAperture * 1000) / 1000,
    mouthExpansionPercent,
    mouthOpeningPercent,
    cornerLiftPercent,
    eyeSquintPercent,
    symmetryPercent,
    smileScore,
    smileDetected,
    heuristicSuspicionScore: 0,
    preliminaryVerdict: 'NO_SMILE',
  };

  const personalPred = predictWithPersonalModel(currentScanData, validFrames);

  if (personalPred) {
    preliminaryVerdict = personalPred.verdict;
    heuristicSuspicionScore = personalPred.heuristicSuspicionScore;
  } else if (!smileDetected) {
    preliminaryVerdict = 'NO_SMILE';
    heuristicSuspicionScore = Math.min(15, Math.max(0, Math.round(mouthExpansionPercent * 1.5)));
  } else {
    // Default Heuristic Engine when personal model is not trained
    const mouthFactor = Math.min(100, mouthExpansionPercent * 2.2);
    const eyeDampener = Math.max(-20, eyeSquintPercent * 2.4);
    const asymmetryPenalty = (100 - symmetryPercent) * 0.3;

    const rawScore = 38 + (mouthFactor - eyeDampener) + asymmetryPenalty;
    heuristicSuspicionScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    if (heuristicSuspicionScore <= 45) {
      preliminaryVerdict = 'YATHARTHA_CHIRI';
    } else {
      preliminaryVerdict = 'KALLA_CHIRI';
    }
  }

  return {
    totalFrames,
    validFrames: validFrames.length,
    durationSeconds,
    baselineMouthWidth: Math.round(baselineMouthWidth * 1000) / 1000,
    baselineEyeAperture: Math.round(baselineEyeAperture * 1000) / 1000,
    peakMouthWidth: Math.round(peakMouthWidth * 1000) / 1000,
    peakEyeAperture: Math.round(peakEyeAperture * 1000) / 1000,
    mouthExpansionPercent,
    eyeSquintPercent,
    symmetryPercent,
    smileScore,
    smileDetected,
    heuristicSuspicionScore,
    preliminaryVerdict,
  };
}

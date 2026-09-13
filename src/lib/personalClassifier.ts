import { FacialFrameMetrics, ScanAnalysisData, VerdictType } from '../types/forensic';

export const LOCAL_STORAGE_MODEL_KEY = 'kalla_chiri_personal_model';

export interface PersonalBaseline {
  mouthWidth: number;
  mouthOpening: number;
  eyeAperture: number;
  cornerElevation: number;
}

export interface FeatureVector {
  mouthExpansion: number;      // % mouth width expansion relative to baseline
  mouthOpeningRatio: number;   // ratio of mouth opening relative to baseline
  cornerLift: number;          // corner elevation delta relative to baseline
  eyeSquint: number;           // % eye aperture squint relative to baseline
  asymmetry: number;           // corner elevation asymmetry
}

export interface FeatureSummary {
  mouthExpansionMean: number;
  cornerLiftMean: number;
  eyeSquintMean: number;
}

export interface PersonalTrainedModel {
  version: string;
  createdAt: number;
  baseline: PersonalBaseline;
  centroids: Record<VerdictType, FeatureVector>;
  stdDevs: FeatureVector;
  featureSummaries: Record<VerdictType, FeatureSummary>;
  sampleCounts: Record<VerdictType, number>;
}

/**
 * Extracts a normalized feature vector from a frame given a personal baseline.
 */
export function extractFeatureVector(
  frame: FacialFrameMetrics,
  baseline: PersonalBaseline
): FeatureVector {
  const mouthExpansion = ((frame.normalizedMouthWidth - baseline.mouthWidth) / (baseline.mouthWidth || 0.001)) * 100;
  const mouthOpeningRatio = frame.normalizedMouthOpening / (baseline.mouthOpening || 0.001);
  const cornerLift = (frame.cornerElevation - baseline.cornerElevation) * 100;
  const eyeSquint = ((baseline.eyeAperture - frame.normalizedEyeAperture) / (baseline.eyeAperture || 0.001)) * 100;
  const asymmetry = Math.abs(frame.leftCornerY - frame.rightCornerY) * 100;

  return {
    mouthExpansion: Math.max(-20, Math.min(150, mouthExpansion)),
    mouthOpeningRatio: Math.max(0.5, Math.min(4.0, mouthOpeningRatio)),
    cornerLift: Math.max(-10, Math.min(20, cornerLift)),
    eyeSquint: Math.max(-30, Math.min(80, eyeSquint)),
    asymmetry: Math.max(0, Math.min(50, asymmetry)),
  };
}

/**
 * Helper to compute median of a array of numbers.
 */
function computeMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculates a robust median centroid from a list of feature vectors.
 */
function computeRobustCentroid(vectors: FeatureVector[]): FeatureVector {
  if (vectors.length === 0) {
    return { mouthExpansion: 0, mouthOpeningRatio: 1.0, cornerLift: 0, eyeSquint: 0, asymmetry: 0 };
  }

  return {
    mouthExpansion: Math.round(computeMedian(vectors.map((v) => v.mouthExpansion)) * 10) / 10,
    mouthOpeningRatio: Math.round(computeMedian(vectors.map((v) => v.mouthOpeningRatio)) * 100) / 100,
    cornerLift: Math.round(computeMedian(vectors.map((v) => v.cornerLift)) * 10) / 10,
    eyeSquint: Math.round(computeMedian(vectors.map((v) => v.eyeSquint)) * 10) / 10,
    asymmetry: Math.round(computeMedian(vectors.map((v) => v.asymmetry)) * 10) / 10,
  };
}

/**
 * Computes mean summary statistics for debug display.
 */
function computeFeatureSummary(vectors: FeatureVector[]): FeatureSummary {
  if (vectors.length === 0) {
    return { mouthExpansionMean: 0, cornerLiftMean: 0, eyeSquintMean: 0 };
  }
  const len = vectors.length;
  const sumExp = vectors.reduce((acc, v) => acc + v.mouthExpansion, 0);
  const sumLift = vectors.reduce((acc, v) => acc + v.cornerLift, 0);
  const sumSquint = vectors.reduce((acc, v) => acc + v.eyeSquint, 0);

  return {
    mouthExpansionMean: Math.round((sumExp / len) * 10) / 10,
    cornerLiftMean: Math.round((sumLift / len) * 10) / 10,
    eyeSquintMean: Math.round((sumSquint / len) * 10) / 10,
  };
}

/**
 * Fits a personal classifier model from collected calibration samples across 3 stages.
 */
export function fitPersonalModel(
  neutralSamples: FacialFrameMetrics[],
  nallaChiriSamples: FacialFrameMetrics[],
  kallaChiriSamples: FacialFrameMetrics[]
): PersonalTrainedModel {
  // 1. Calculate Personal Baseline from Neutral Samples
  const validNeutral = neutralSamples.filter((f) => f && f.normalizedMouthWidth > 0);
  const validNalla = nallaChiriSamples.filter((f) => f && f.normalizedMouthWidth > 0);
  const validKalla = kallaChiriSamples.filter((f) => f && f.normalizedMouthWidth > 0);

  const nLen = validNeutral.length || 1;

  const baseline: PersonalBaseline = {
    mouthWidth: validNeutral.reduce((sum, f) => sum + f.normalizedMouthWidth, 0) / nLen,
    mouthOpening: validNeutral.reduce((sum, f) => sum + f.normalizedMouthOpening, 0) / nLen,
    eyeAperture: validNeutral.reduce((sum, f) => sum + f.normalizedEyeAperture, 0) / nLen,
    cornerElevation: validNeutral.reduce((sum, f) => sum + f.cornerElevation, 0) / nLen,
  };

  // 2. Extract Feature Vectors for each class relative to Personal Baseline
  const neutralVectors = validNeutral.map((f) => extractFeatureVector(f, baseline));
  const nallaVectors = validNalla.map((f) => extractFeatureVector(f, baseline));
  const kallaVectors = validKalla.map((f) => extractFeatureVector(f, baseline));

  // 3. Compute Robust Centroids
  const centroids: Record<VerdictType, FeatureVector> = {
    NO_SMILE: computeRobustCentroid(neutralVectors),
    YATHARTHA_CHIRI: computeRobustCentroid(nallaVectors),
    KALLA_CHIRI: computeRobustCentroid(kallaVectors),
  };

  // 4. Compute Feature Standard Deviations across all training samples for standardization
  const allVectors = [...neutralVectors, ...nallaVectors, ...kallaVectors];
  const allLen = allVectors.length || 1;

  const meanExp = allVectors.reduce((s, v) => s + v.mouthExpansion, 0) / allLen;
  const meanOpening = allVectors.reduce((s, v) => s + v.mouthOpeningRatio, 0) / allLen;
  const meanLift = allVectors.reduce((s, v) => s + v.cornerLift, 0) / allLen;
  const meanSquint = allVectors.reduce((s, v) => s + v.eyeSquint, 0) / allLen;
  const meanAsym = allVectors.reduce((s, v) => s + v.asymmetry, 0) / allLen;

  const varExp = allVectors.reduce((s, v) => s + Math.pow(v.mouthExpansion - meanExp, 2), 0) / allLen;
  const varOpening = allVectors.reduce((s, v) => s + Math.pow(v.mouthOpeningRatio - meanOpening, 2), 0) / allLen;
  const varLift = allVectors.reduce((s, v) => s + Math.pow(v.cornerLift - meanLift, 2), 0) / allLen;
  const varSquint = allVectors.reduce((s, v) => s + Math.pow(v.eyeSquint - meanSquint, 2), 0) / allLen;
  const varAsym = allVectors.reduce((s, v) => s + Math.pow(v.asymmetry - meanAsym, 2), 0) / allLen;

  const stdDevs: FeatureVector = {
    mouthExpansion: Math.max(1.0, Math.sqrt(varExp)),
    mouthOpeningRatio: Math.max(0.05, Math.sqrt(varOpening)),
    cornerLift: Math.max(0.5, Math.sqrt(varLift)),
    eyeSquint: Math.max(1.0, Math.sqrt(varSquint)),
    asymmetry: Math.max(0.5, Math.sqrt(varAsym)),
  };

  const featureSummaries: Record<VerdictType, FeatureSummary> = {
    NO_SMILE: computeFeatureSummary(neutralVectors),
    YATHARTHA_CHIRI: computeFeatureSummary(nallaVectors),
    KALLA_CHIRI: computeFeatureSummary(kallaVectors),
  };

  const sampleCounts: Record<VerdictType, number> = {
    NO_SMILE: validNeutral.length,
    YATHARTHA_CHIRI: validNalla.length,
    KALLA_CHIRI: validKalla.length,
  };

  const model: PersonalTrainedModel = {
    version: '2.0',
    createdAt: Date.now(),
    baseline,
    centroids,
    stdDevs,
    featureSummaries,
    sampleCounts,
  };

  savePersonalModel(model);
  console.log('[Personal Classifier] Model trained and saved:', model);

  return model;
}

/**
 * Saves personal model to localStorage.
 */
export function savePersonalModel(model: PersonalTrainedModel): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_MODEL_KEY, JSON.stringify(model));
  } catch (err) {
    console.warn('Failed to save personal model to localStorage:', err);
  }
}

/**
 * Loads personal model from localStorage.
 */
export function loadPersonalModel(): PersonalTrainedModel | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MODEL_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersonalTrainedModel;
  } catch (err) {
    console.warn('Failed to load personal model from localStorage:', err);
    return null;
  }
}

/**
 * Clears personal model from localStorage.
 */
export function clearPersonalModel(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_MODEL_KEY);
  } catch (err) {
    console.warn('Failed to clear personal model:', err);
  }
}

export function isPersonalModelTrained(): boolean {
  return loadPersonalModel() !== null;
}

/**
 * Predicts verdict for a scan using personal trained model with hard Neutral/Smile gate.
 */
export function predictWithPersonalModel(
  scanData: ScanAnalysisData,
  frames: FacialFrameMetrics[]
): {
  verdict: VerdictType;
  heuristicSuspicionScore: number;
  confidence: number;
  usedPersonalModel: boolean;
} | null {
  const model = loadPersonalModel();
  if (!model) return null;

  // DECISION 1 (STRICT SMILE GATE):
  // Check if a meaningful smile occurred during the scan.
  // If smileDetected === false, verdict MUST ALWAYS BE NO_SMILE.
  if (!scanData.smileDetected) {
    return {
      verdict: 'NO_SMILE',
      heuristicSuspicionScore: Math.min(15, Math.round(scanData.mouthExpansionPercent * 1.2)),
      confidence: 95,
      usedPersonalModel: true,
    };
  }

  // DECISION 2 (SMILE CLASSIFICATION):
  // Only evaluate YATHARTHA_CHIRI vs KALLA_CHIRI if smileDetected === true.
  const validFrames = frames.filter((f) => f && f.normalizedMouthWidth > 0);
  if (validFrames.length === 0) {
    return {
      verdict: 'NO_SMILE',
      heuristicSuspicionScore: 0,
      confidence: 90,
      usedPersonalModel: true,
    };
  }

  // Calculate Peak Feature Vector for this scan relative to Personal Baseline (top 15% frames by width)
  const sorted = [...validFrames].sort((a, b) => a.normalizedMouthWidth - b.normalizedMouthWidth);
  const peakCount = Math.max(3, Math.floor(sorted.length * 0.15));
  const peakFrames = sorted.slice(sorted.length - peakCount);

  const peakVectors = peakFrames.map((f) => extractFeatureVector(f, model.baseline));
  const scanPeakVector = computeRobustCentroid(peakVectors);

  const nallaCentroid = model.centroids.YATHARTHA_CHIRI;
  const kallaCentroid = model.centroids.KALLA_CHIRI;
  const std = model.stdDevs || { mouthExpansion: 10, mouthOpeningRatio: 0.3, cornerLift: 1.5, eyeSquint: 8, asymmetry: 2 };

  // Standardized Euclidean Distance calculation (z-score weighted)
  // Ensures feature scale does not dominate distance metric
  function computeStandardizedDistance(scanVec: FeatureVector, target: FeatureVector): number {
    const wWidth = 1.0;
    const wLift = 1.2;
    const wOpening = 0.8;
    const wSquint = 0.8;     // Supporting evidence, NOT dominant requirement
    const wAsymmetry = 1.0;  // Forced smiles often display corner asymmetry

    const zWidth = (scanVec.mouthExpansion - target.mouthExpansion) / (std.mouthExpansion || 1);
    const zOpening = (scanVec.mouthOpeningRatio - target.mouthOpeningRatio) / (std.mouthOpeningRatio || 0.1);
    const zLift = (scanVec.cornerLift - target.cornerLift) / (std.cornerLift || 1);
    const zSquint = (scanVec.eyeSquint - target.eyeSquint) / (std.eyeSquint || 1);
    const zAsym = (scanVec.asymmetry - target.asymmetry) / (std.asymmetry || 1);

    return Math.sqrt(
      wWidth * Math.pow(zWidth, 2) +
      wOpening * Math.pow(zOpening, 2) +
      wLift * Math.pow(zLift, 2) +
      wSquint * Math.pow(zSquint, 2) +
      wAsymmetry * Math.pow(zAsym, 2)
    );
  }

  const distNalla = computeStandardizedDistance(scanPeakVector, nallaCentroid);
  const distKalla = computeStandardizedDistance(scanPeakVector, kallaCentroid);

  let verdict: VerdictType = 'YATHARTHA_CHIRI';
  let suspicionScore = 0;

  if (distNalla <= distKalla) {
    verdict = 'YATHARTHA_CHIRI';
    const ratio = distNalla / (distNalla + distKalla + 0.001);
    suspicionScore = Math.max(10, Math.min(42, Math.round(15 + ratio * 25)));
  } else {
    verdict = 'KALLA_CHIRI';
    const ratio = distKalla / (distNalla + distKalla + 0.001);
    suspicionScore = Math.max(55, Math.min(95, Math.round(90 - ratio * 30)));
  }

  // Realistic confidence score reflecting relative margin between centroids
  const margin = Math.abs(distNalla - distKalla) / (Math.min(distNalla, distKalla) + 0.001);
  const confidence = Math.min(98, Math.max(68, Math.round(75 + margin * 15)));

  console.log('[Personal Classifier v2.0] Prediction:', {
    verdict,
    distNalla: Math.round(distNalla * 100) / 100,
    distKalla: Math.round(distKalla * 100) / 100,
    scanPeakVector,
    suspicionScore,
    confidence,
  });

  return {
    verdict,
    heuristicSuspicionScore: suspicionScore,
    confidence,
    usedPersonalModel: true,
  };
}


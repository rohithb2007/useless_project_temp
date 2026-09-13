import { LandmarkPoint, FacialFrameMetrics } from '../types/forensic';

export const LANDMARK_INDEXES = {
  LEFT_EYE_TOP: 159,
  LEFT_EYE_BOTTOM: 145,
  RIGHT_EYE_TOP: 386,
  RIGHT_EYE_BOTTOM: 374,
  MOUTH_LEFT: 61,
  MOUTH_RIGHT: 291,
  MOUTH_TOP: 13,
  MOUTH_BOTTOM: 14,
  FACE_LEFT: 234,
  FACE_RIGHT: 454,
  FACE_TOP: 10,
  FACE_BOTTOM: 152,
  NOSE_TIP: 1,
} as const;

/**
 * Calculates Euclidean distance between two 2D points (normalized x, y space 0..1).
 */
export function calculateEuclideanDistance(ptA: LandmarkPoint, ptB: LandmarkPoint): number {
  const dx = ptB.x - ptA.x;
  const dy = ptB.y - ptA.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Extracts normalized facial measurement metrics from a frame's landmark array.
 * Normalizes all dimensions by the subject's own face width and face height.
 */
export function extractFrameMetrics(landmarks: LandmarkPoint[]): FacialFrameMetrics | null {
  if (!landmarks || landmarks.length < 468) {
    return null;
  }

  const leftEyeTop = landmarks[LANDMARK_INDEXES.LEFT_EYE_TOP];
  const leftEyeBottom = landmarks[LANDMARK_INDEXES.LEFT_EYE_BOTTOM];
  const rightEyeTop = landmarks[LANDMARK_INDEXES.RIGHT_EYE_TOP];
  const rightEyeBottom = landmarks[LANDMARK_INDEXES.RIGHT_EYE_BOTTOM];

  const mouthLeft = landmarks[LANDMARK_INDEXES.MOUTH_LEFT];
  const mouthRight = landmarks[LANDMARK_INDEXES.MOUTH_RIGHT];
  const mouthTop = landmarks[LANDMARK_INDEXES.MOUTH_TOP];
  const mouthBottom = landmarks[LANDMARK_INDEXES.MOUTH_BOTTOM];

  const faceLeft = landmarks[LANDMARK_INDEXES.FACE_LEFT];
  const faceRight = landmarks[LANDMARK_INDEXES.FACE_RIGHT];
  const faceTop = landmarks[LANDMARK_INDEXES.FACE_TOP];
  const faceBottom = landmarks[LANDMARK_INDEXES.FACE_BOTTOM];
  const noseTip = landmarks[LANDMARK_INDEXES.NOSE_TIP];

  if (
    !leftEyeTop || !leftEyeBottom || !rightEyeTop || !rightEyeBottom ||
    !mouthLeft || !mouthRight || !mouthTop || !mouthBottom ||
    !faceLeft || !faceRight || !faceTop || !faceBottom || !noseTip
  ) {
    return null;
  }

  const rawMouthWidth = calculateEuclideanDistance(mouthLeft, mouthRight);
  const rawMouthOpening = calculateEuclideanDistance(mouthTop, mouthBottom);

  const leftEyeDist = calculateEuclideanDistance(leftEyeTop, leftEyeBottom);
  const rightEyeDist = calculateEuclideanDistance(rightEyeTop, rightEyeBottom);
  const rawEyeAperture = (leftEyeDist + rightEyeDist) / 2;

  const faceWidth = calculateEuclideanDistance(faceLeft, faceRight) || 0.001;
  const faceHeight = calculateEuclideanDistance(faceTop, faceBottom) || 0.001;

  // Normalized measurements relative to person's face scale
  const normalizedMouthWidth = rawMouthWidth / faceWidth;
  const normalizedMouthOpening = rawMouthOpening / faceHeight;
  const normalizedEyeAperture = rawEyeAperture / faceHeight;
  const leftEyeAperture = leftEyeDist / faceHeight;
  const rightEyeAperture = rightEyeDist / faceHeight;

  // Corner elevation relative to nose tip (Higher value = corners pulled upward = smile!)
  const leftElev = noseTip.y - mouthLeft.y;
  const rightElev = noseTip.y - mouthRight.y;
  const cornerElevation = (leftElev + rightElev) / (2 * faceHeight);

  return {
    timestamp: performance.now(),
    rawMouthWidth,
    rawEyeAperture,
    faceWidth,
    faceHeight,
    normalizedMouthWidth,
    normalizedMouthOpening,
    normalizedEyeAperture,
    leftEyeAperture,
    rightEyeAperture,
    cornerElevation,
    leftCornerY: mouthLeft.y,
    rightCornerY: mouthRight.y,
  };
}

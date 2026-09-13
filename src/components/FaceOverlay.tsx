import React, { useEffect, useRef } from 'react';
import { LandmarkPoint } from '../types/forensic';
import { LANDMARK_INDEXES } from '../lib/facialMetrics';

interface FaceOverlayProps {
  landmarks: LandmarkPoint[] | null;
  faceDetected: boolean;
  isRecording: boolean;
  videoWidth?: number;
  videoHeight?: number;
}

export const FaceOverlay: React.FC<FaceOverlayProps> = ({
  landmarks,
  faceDetected,
  isRecording,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to match display parent size
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (!landmarks || !faceDetected || landmarks.length < 468) {
      // Draw idle search reticle
      drawIdleReticle(ctx, width, height, isRecording);
      return;
    }

    // Draw active face target reticle & key landmark dots
    const leftEyeTop = landmarks[LANDMARK_INDEXES.LEFT_EYE_TOP];
    const leftEyeBottom = landmarks[LANDMARK_INDEXES.LEFT_EYE_BOTTOM];
    const rightEyeTop = landmarks[LANDMARK_INDEXES.RIGHT_EYE_TOP];
    const rightEyeBottom = landmarks[LANDMARK_INDEXES.RIGHT_EYE_BOTTOM];
    const mouthLeft = landmarks[LANDMARK_INDEXES.MOUTH_LEFT];
    const mouthRight = landmarks[LANDMARK_INDEXES.MOUTH_RIGHT];
    const noseTip = landmarks[LANDMARK_INDEXES.NOSE_TIP];

    // Helper to map 0..1 normalized coords to canvas pixels
    // Note: Video is mirrored horizontally (CSS scaleX(-1)), so we reflect X: (1 - pt.x) * width
    const toPx = (pt: LandmarkPoint) => ({
      x: (1 - pt.x) * width,
      y: pt.y * height,
    });

    const pxLeftEyeTop = toPx(leftEyeTop);
    const pxLeftEyeBottom = toPx(leftEyeBottom);
    const pxRightEyeTop = toPx(rightEyeTop);
    const pxRightEyeBottom = toPx(rightEyeBottom);
    const pxMouthLeft = toPx(mouthLeft);
    const pxMouthRight = toPx(mouthRight);
    const pxNoseTip = toPx(noseTip);

    // Color theme
    const strokeColor = isRecording ? '#ef4444' : '#10b981';
    const dotColor = isRecording ? '#f87171' : '#34d399';

    // 1. Draw mouth width line
    ctx.beginPath();
    ctx.moveTo(pxMouthLeft.x, pxMouthLeft.y);
    ctx.lineTo(pxMouthRight.x, pxMouthRight.y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Draw eye aperture vertical lines
    ctx.beginPath();
    ctx.moveTo(pxLeftEyeTop.x, pxLeftEyeTop.y);
    ctx.lineTo(pxLeftEyeBottom.x, pxLeftEyeBottom.y);
    ctx.moveTo(pxRightEyeTop.x, pxRightEyeTop.y);
    ctx.lineTo(pxRightEyeBottom.x, pxRightEyeBottom.y);
    ctx.strokeStyle = '#06b6d4'; // cyan
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 3. Draw dots on key landmarks
    const keyPoints = [
      pxLeftEyeTop,
      pxLeftEyeBottom,
      pxRightEyeTop,
      pxRightEyeBottom,
      pxMouthLeft,
      pxMouthRight,
      pxNoseTip,
    ];

    keyPoints.forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = dotColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 4. Draw bounding box reticle around face
    const allX = landmarks.map((lm) => (1 - lm.x) * width);
    const allY = landmarks.map((lm) => lm.y * height);
    const minX = Math.min(...allX) - 15;
    const maxX = Math.max(...allX) + 15;
    const minY = Math.min(...allY) - 15;
    const maxY = Math.max(...allY) + 15;

    const boxW = maxX - minX;
    const boxH = maxY - minY;
    const cornerLength = Math.min(boxW, boxH) * 0.2;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;

    // Corner reticles
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(minX, minY + cornerLength);
    ctx.lineTo(minX, minY);
    ctx.lineTo(minX + cornerLength, minY);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(maxX - cornerLength, minY);
    ctx.lineTo(maxX, minY);
    ctx.lineTo(maxX, minY + cornerLength);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(minX, maxY - cornerLength);
    ctx.lineTo(minX, maxY);
    ctx.lineTo(minX + cornerLength, maxY);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(maxX - cornerLength, maxY);
    ctx.lineTo(maxX, maxY);
    ctx.lineTo(maxX, maxY - cornerLength);
    ctx.stroke();

    // Status label at top of bounding box
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = strokeColor;
    ctx.fillText(isRecording ? '[ SCANNING TELEMETRY ]' : '[ SUSPECT ACQUIRED ]', minX + 5, minY - 8);
  }, [landmarks, faceDetected, isRecording]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-20" />;
};

function drawIdleReticle(ctx: CanvasRenderingContext2D, width: number, height: number, isRecording: boolean) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.3;

  ctx.strokeStyle = isRecording ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 8]);

  // Center circle
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.setLineDash([]);

  // Crosshairs
  ctx.beginPath();
  ctx.moveTo(cx - radius - 20, cy);
  ctx.lineTo(cx - radius + 10, cy);
  ctx.moveTo(cx + radius - 10, cy);
  ctx.lineTo(cx + radius + 20, cy);
  ctx.moveTo(cx, cy - radius - 20);
  ctx.lineTo(cx, cy - radius + 10);
  ctx.moveTo(cx, cy + radius - 10);
  ctx.lineTo(cx, cy + radius + 20);
  ctx.stroke();
}

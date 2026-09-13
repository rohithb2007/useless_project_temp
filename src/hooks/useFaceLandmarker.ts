import { useState, useEffect, useRef, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { LandmarkPoint, FacialFrameMetrics } from '../types/forensic';
import { extractFrameMetrics } from '../lib/facialMetrics';

export function useFaceLandmarker(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isCameraReady: boolean
) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<FacialFrameMetrics | null>(null);
  const [currentLandmarks, setCurrentLandmarks] = useState<LandmarkPoint[] | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [scanProgress, setScanProgress] = useState(0); // 0 to 100%

  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const recordedFramesRef = useRef<FacialFrameMetrics[]>([]);
  const recordingStartTimeRef = useRef<number | null>(null);
  const recordingDurationMs = 3000; // 3 seconds scan

  const onScanCompleteRef = useRef<((frames: FacialFrameMetrics[]) => void) | null>(null);

  // Initialize MediaPipe Face Landmarker
  useEffect(() => {
    let isMounted = true;

    async function initFaceLandmarker() {
      try {
        setIsLoaded(false);
        setLoadError(null);

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (!isMounted) return;

        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          outputFaceBlendshapes: false,
          runningMode: 'VIDEO',
          numFaces: 1,
        });

        if (!isMounted) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        setIsLoaded(true);
      } catch (err: any) {
        console.error('Failed to initialize MediaPipe Face Landmarker:', err);
        if (isMounted) {
          setLoadError(
            err.message || 'Failed to load face detection model. Please check internet connection.'
          );
        }
      }
    }

    initFaceLandmarker();

    return () => {
      isMounted = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, []);

  // Frame processing loop
  const lastVideoTimeRef = useRef<number>(-1);
  const lastMetricsUpdateRef = useRef<number>(0);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;

    if (video && landmarker && isCameraReady && video.readyState >= 2) {
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;

        try {
          const timestamp = performance.now();
          const results = landmarker.detectForVideo(video, timestamp);

          if (results.faceLandmarks && results.faceLandmarks.length > 0) {
            const rawLandmarks = results.faceLandmarks[0];
            const landmarks: LandmarkPoint[] = rawLandmarks.map((lm) => ({
              x: lm.x,
              y: lm.y,
              z: lm.z,
            }));

            setFaceDetected(true);
            setCurrentLandmarks(landmarks);

            const metrics = extractFrameMetrics(landmarks);

            if (metrics) {
              // Throttled UI state update (~15 FPS) to prevent excessive React re-renders
              const now = performance.now();
              if (now - lastMetricsUpdateRef.current > 66) {
                lastMetricsUpdateRef.current = now;
                setCurrentMetrics(metrics);
              }

              // Store frame into ref if recording is active
              if (isRecording && recordingStartTimeRef.current !== null) {
                recordedFramesRef.current.push(metrics);

                const elapsed = now - recordingStartTimeRef.current;
                const progress = Math.min(100, Math.round((elapsed / recordingDurationMs) * 100));
                setScanProgress(progress);

                if (elapsed >= recordingDurationMs) {
                  // Recording complete!
                  setIsRecording(false);
                  const captured = [...recordedFramesRef.current];
                  if (onScanCompleteRef.current) {
                    onScanCompleteRef.current(captured);
                  }
                }
              }
            }
          } else {
            setFaceDetected(false);
            setCurrentLandmarks(null);
            if (performance.now() - lastMetricsUpdateRef.current > 100) {
              setCurrentMetrics(null);
            }
          }
        } catch (err) {
          console.error('Landmark detection error:', err);
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(processFrame);
  }, [videoRef, isCameraReady, isRecording]);

  // Start/stop continuous frame loop
  useEffect(() => {
    if (isLoaded && isCameraReady) {
      animFrameIdRef.current = requestAnimationFrame(processFrame);
    }
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isLoaded, isCameraReady, processFrame]);

  // Start 3-second recording scan
  const startRecordingScan = useCallback((onComplete: (frames: FacialFrameMetrics[]) => void) => {
    recordedFramesRef.current = [];
    recordingStartTimeRef.current = performance.now();
    onScanCompleteRef.current = onComplete;
    setScanProgress(0);
    setIsRecording(true);
  }, []);

  return {
    isLoaded,
    loadError,
    faceDetected,
    currentMetrics,
    currentLandmarks,
    isRecording,
    scanProgress,
    startRecordingScan,
  };
}

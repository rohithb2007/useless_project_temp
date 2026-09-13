import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, ArrowLeft, AlertCircle, GraduationCap, Sparkles } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { useFaceLandmarker } from '../hooks/useFaceLandmarker';
import { FaceOverlay } from './FaceOverlay';
import { PixelInspector, InspectorState } from './PixelInspector';
import { PixelDialogueBox } from './PixelDialogueBox';
import { ThemeToggle } from './ThemeToggle';
import { FacialFrameMetrics, ScanAnalysisData } from '../types/forensic';
import { calculateScanAnalysis } from '../lib/kallaChiriScore';
import { isPersonalModelTrained } from '../lib/personalClassifier';
import { getRandomInspectorComment } from '../lib/comments';
import { primeResultAudio } from '../lib/resultAudio';

interface ScannerScreenProps {
  onScanComplete: (metrics: ScanAnalysisData) => void;
  onBackToLanding: () => void;
  onStartTraining?: () => void;
}

export const ScannerScreen: React.FC<ScannerScreenProps> = ({
  onScanComplete,
  onBackToLanding,
  onStartTraining,
}) => {
  const modelTrained = isPersonalModelTrained();
  const {
    videoRef,
    isCameraReady,
    cameraError,
    facingMode,
    startCamera,
    stopCamera,
    toggleCamera,
  } = useCamera({ autoStart: true });

  const {
    isLoaded: isModelLoaded,
    loadError: modelError,
    faceDetected,
    currentMetrics,
    currentLandmarks,
    isRecording,
    scanProgress,
    startRecordingScan,
  } = useFaceLandmarker(videoRef, isCameraReady);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [inspectorDialogue, setInspectorDialogue] = useState('ക്യാമറയിൽ നോക്കി ഒന്ന് നന്നായി ചിരിക്കൂ...');
  const [inspectorState, setInspectorState] = useState<InspectorState>('NORMAL');

  const initialFrameRef = useRef<FacialFrameMetrics | null>(null);

  useEffect(() => {
    if (currentMetrics && !initialFrameRef.current) {
      initialFrameRef.current = currentMetrics;
    } else if (!faceDetected) {
      initialFrameRef.current = null;
    }
  }, [currentMetrics, faceDetected]);

  // Live telemetry calculations
  const liveMouthDelta = (currentMetrics && initialFrameRef.current)
    ? Math.max(0, Math.round(((currentMetrics.normalizedMouthWidth - initialFrameRef.current.normalizedMouthWidth) / (initialFrameRef.current.normalizedMouthWidth || 0.001)) * 100))
    : 0;

  const liveEyeDelta = (currentMetrics && initialFrameRef.current)
    ? Math.round(((initialFrameRef.current.normalizedEyeAperture - currentMetrics.normalizedEyeAperture) / (initialFrameRef.current.normalizedEyeAperture || 0.001)) * 100)
    : 0;

  const liveSmileScore = Math.min(100, Math.max(0, Math.round((liveMouthDelta / 10.0) * 100)));
  const liveSmileDetected = liveMouthDelta >= 3.5 || liveSmileScore >= 20;

  // Inspector Subhash Malayalam Dialogue updates
  useEffect(() => {
    if (cameraError || modelError) {
      setInspectorState('CONFUSED');
      setInspectorDialogue('അയ്യോ! ക്യാമറ പെർമിഷൻ ലഭിച്ചില്ല!');
    } else if (isRecording) {
      setInspectorState('SCANNING');
      if (liveSmileDetected && liveEyeDelta < 3) {
        setInspectorDialogue('കണ്ണുകൾ എവിടെ പോയി മോനേ? ഇത് കള്ളി ചിരിയാണോ?');
      } else if (liveSmileDetected) {
        setInspectorDialogue('ചിരി സ്കാൻ ചെയ്തുകൊണ്ടിരിക്കുകയാണ്...');
      } else {
        setInspectorDialogue('ഒന്ന് നന്നായി ചിരിക്കൂ... ഞങ്ങളും കാണട്ടെ!');
      }
    } else if (countdown !== null) {
      setInspectorState('SCANNING');
      setInspectorDialogue('ചിരി മോഡ് ആക്റ്റിവേറ്റ് ചെയ്യൂ!');
    } else if (faceDetected) {
      setInspectorState(liveSmileDetected ? 'HAPPY' : 'NORMAL');
      setInspectorDialogue(
        liveSmileDetected
          ? 'ഫേസ് ഡിറ്റക്റ്റ് ചെയ്തു! RECORD 3 SECONDS അമർത്തൂ.'
          : 'ഫേസ് ഡിറ്റക്റ്റ് ചെയ്തു! ഒന്ന് ചിരിക്കൂ...'
      );
    } else {
      setInspectorState('CONFUSED');
      setInspectorDialogue('ആളെ തിരഞ്ഞുകൊണ്ടിരിക്കുന്നു... ക്യാമറയിൽ നോക്കൂ!');
    }
  }, [faceDetected, isRecording, countdown, cameraError, modelError, liveSmileDetected, liveEyeDelta]);

  // Trigger 3-second recording scan
  const handleStartScan = () => {
    if (!faceDetected) return;

    primeResultAudio();
    setCountdown(3);

    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownTimer);
          setCountdown(null);
          startRecordingScan((frames: FacialFrameMetrics[]) => {
            const analysis = calculateScanAnalysis(frames);
            onScanComplete(analysis);
          });
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] flex flex-col justify-between p-3 md:p-6 scanlines relative select-none transition-colors duration-150">
      {/* Top Retro HUD Header with Theme Toggle */}
      <header className="flex justify-between items-center z-30 border-b-4 border-[var(--border)] pb-3">
        <button
          onClick={onBackToLanding}
          className="pixel-btn pixel-btn-secondary text-[9px] px-2 py-1.5 flex items-center"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          ABORT
        </button>

        <div className="flex items-center space-x-2 text-xs font-pixel">
          <span className="text-[var(--text)]">
            {isRecording ? 'SCANNING' : faceDetected ? 'TARGET ACQUIRED' : 'SEARCHING...'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <button
            onClick={toggleCamera}
            className="pixel-btn pixel-btn-secondary p-2"
            title="Switch Camera"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col justify-center items-center my-3 relative z-10 w-full max-w-lg mx-auto">
        {/* Personal Model Status Chip */}
        <div className="w-full flex justify-between items-center mb-2 px-1 text-[10px] font-pixel">
          <span className="flex items-center text-[#5C4638] dark:text-[#A3826C]">
            <Sparkles className="w-3 h-3 mr-1 text-[#D99A00]" />
            {modelTrained ? '✓ PERSONAL MODEL ACTIVE' : 'HEURISTIC ENGINE ACTIVE'}
          </span>
          {onStartTraining && (
            <button
              onClick={onStartTraining}
              className="text-[#D99A00] underline flex items-center hover:text-amber-500"
            >
              <GraduationCap className="w-3 h-3 mr-1" />
              {modelTrained ? 'RETRAIN' : 'TRAIN CHIRI'}
            </button>
          )}
        </div>

        {/* Retro Pixel Detective Malayalam Dialogue Box */}
        <div className="w-full flex flex-col gap-1.5 pixel-box p-2.5 rounded-xl mb-3 shadow-lg">
          <div className="flex items-center gap-3">
            <PixelInspector state={inspectorState} size={64} className="shrink-0" />
            <PixelDialogueBox
              speaker="INSPECTOR SUBHASH"
              text={inspectorDialogue}
              className="w-full text-lg md:text-xl"
              speed={30}
            />
          </div>
        </div>

        {/* Video Camera Container inside Pixel Box */}
        <div className="relative w-full aspect-[4/3] bg-[#120B07] rounded-xl overflow-hidden border-4 border-[#6B4327] dark:border-[#8A5A32] shadow-2xl flex items-center justify-center">
          {/* Animated vertical scan line */}
          {isRecording && <div className="animate-scan-vertical" />}

          {/* HTML Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />

          {/* Canvas Face Overlay */}
          <FaceOverlay
            landmarks={currentLandmarks}
            faceDetected={faceDetected}
            isRecording={isRecording}
          />

          {/* Camera Loading Overlay */}
          {(!isCameraReady || !isModelLoaded) && !cameraError && !modelError && (
            <div className="absolute inset-0 bg-[#120B07]/95 flex flex-col items-center justify-center p-6 text-center z-40">
              <RefreshCw className="w-8 h-8 text-[#D99A00] animate-spin mb-3" />
              <p className="text-xs font-pixel text-[#FFD25A]">
                {!isCameraReady ? 'INITIALIZING CAMERA STREAM...' : 'LOADING MEDIAPIPE VISION MODEL...'}
              </p>
            </div>
          )}

          {/* Camera Error Overlay */}
          {(cameraError || modelError) && (
            <div className="absolute inset-0 bg-[#120B07]/95 flex flex-col items-center justify-center p-6 text-center z-40">
              <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
              <p className="text-xs font-pixel text-red-300 mb-4">{cameraError || modelError}</p>
              <button
                onClick={() => startCamera()}
                className="pixel-btn text-[10px] py-2 px-4"
              >
                RETRY CAMERA
              </button>
            </div>
          )}

          {/* Countdown Overlay (3.. 2.. 1..) */}
          {countdown !== null && (
            <div className="absolute inset-0 bg-[#120B07]/70 flex items-center justify-center z-40">
              <span className="text-7xl md:text-8xl font-pixel text-[#D99A00] animate-bounce">
                {countdown}
              </span>
            </div>
          )}

          {/* Scanning Progress Overlay */}
          {isRecording && (
            <div className="absolute bottom-3 left-3 right-3 bg-[#120B07]/95 border-2 border-[#D99A00] p-2.5 rounded-lg z-40">
              <div className="flex justify-between items-center text-xs font-pixel mb-1 text-[#FFF4E6]">
                <span className="text-red-400 animate-pulse">RECORDING TELEMETRY</span>
                <span>{scanProgress}%</span>
              </div>
              <div className="w-full bg-[#24140D] h-3 border border-[#D99A00] overflow-hidden">
                <div
                  className="bg-[#D99A00] h-full transition-all duration-100 ease-linear"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Live Numerical Debug Telemetry HUD */}
        <div className="grid grid-cols-5 gap-1.5 w-full mt-3 font-vt323 text-lg">
          <div className="bg-[#FFFDF8] dark:bg-[#24140D] border-2 border-[#6B4327] dark:border-[#8A5A32] p-1.5 text-center rounded-lg">
            <span className="text-[#5C4638] dark:text-[#A3826C] block font-pixel text-[7px]">FACE</span>
            <span className={`font-bold text-xs ${faceDetected ? 'text-[#166534] dark:text-[#4ade80]' : 'text-[#D99A00]'}`}>
              {faceDetected ? 'OK' : 'SEARCH'}
            </span>
          </div>

          <div className="bg-[#FFFDF8] dark:bg-[#24140D] border-2 border-[#6B4327] dark:border-[#8A5A32] p-1.5 text-center rounded-lg">
            <span className="text-[#5C4638] dark:text-[#A3826C] block font-pixel text-[7px]">SMILE</span>
            <span className={`font-bold text-xs ${liveSmileDetected ? 'text-[#166534] dark:text-[#4ade80] animate-pulse' : 'text-[#5C4638]'}`}>
              {liveSmileDetected ? 'YES' : 'NO'}
            </span>
          </div>

          <div className="bg-[#FFFDF8] dark:bg-[#24140D] border-2 border-[#6B4327] dark:border-[#8A5A32] p-1.5 text-center rounded-lg">
            <span className="text-[#5C4638] dark:text-[#A3826C] block font-pixel text-[7px]">MOUTH Δ</span>
            <span className="font-bold text-xs text-[#D99A00]">
              +{liveMouthDelta}%
            </span>
          </div>

          <div className="bg-[#FFFDF8] dark:bg-[#24140D] border-2 border-[#6B4327] dark:border-[#8A5A32] p-1.5 text-center rounded-lg">
            <span className="text-[#5C4638] dark:text-[#A3826C] block font-pixel text-[7px]">EYE Δ</span>
            <span className="font-bold text-xs text-[#6B4327] dark:text-[#FFD25A]">
              {liveEyeDelta}%
            </span>
          </div>

          <div className="bg-[#FFFDF8] dark:bg-[#24140D] border-2 border-[#6B4327] dark:border-[#8A5A32] p-1.5 text-center rounded-lg">
            <span className="text-[#5C4638] dark:text-[#A3826C] block font-pixel text-[7px]">SCORE</span>
            <span className="font-bold text-xs text-purple-700 dark:text-purple-400">
              {liveSmileScore}%
            </span>
          </div>
        </div>
      </main>

      {/* Bottom Action Button */}
      <footer className="w-full max-w-lg mx-auto z-30 pt-2">
        <button
          onClick={handleStartScan}
          disabled={!faceDetected || isRecording || countdown !== null}
          className={`w-full pixel-btn text-xs md:text-sm py-4 uppercase tracking-wider ${isRecording || !faceDetected ? 'opacity-60 cursor-not-allowed' : ''
            }`}
        >
          <Camera className="w-5 h-5 mr-2" />
          {isRecording
            ? 'SCANNING IN PROGRESS...'
            : countdown !== null
              ? `PREPARING... (${countdown})`
              : faceDetected
                ? 'RECORD 3 SECONDS'
                : 'FACE NOT DETECTED'}
        </button>
      </footer>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle2, RefreshCw, Sparkles, BarChart2 } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { useFaceLandmarker } from '../hooks/useFaceLandmarker';
import { FaceOverlay } from './FaceOverlay';
import { PixelInspector, InspectorState } from './PixelInspector';
import { PixelDialogueBox } from './PixelDialogueBox';
import { ThemeToggle } from './ThemeToggle';
import { FacialFrameMetrics } from '../types/forensic';
import { fitPersonalModel, clearPersonalModel, PersonalTrainedModel } from '../lib/personalClassifier';

interface TrainingScreenProps {
  onTrainingComplete: () => void;
  onBackToLanding: () => void;
}

type StepType = 'NEUTRAL' | 'NALLA_CHIRI' | 'KALLA_CHIRI' | 'FINISHED';

const SAMPLES_PER_STAGE = 40;

export const TrainingScreen: React.FC<TrainingScreenProps> = ({
  onTrainingComplete,
  onBackToLanding,
}) => {
  const { videoRef, isCameraReady, cameraError, facingMode, toggleCamera } = useCamera({ autoStart: true });
  const { isLoaded: isModelLoaded, faceDetected, currentMetrics, currentLandmarks } = useFaceLandmarker(
    videoRef,
    isCameraReady
  );

  const [currentStep, setCurrentStep] = useState<StepType>('NEUTRAL');
  const [neutralSamples, setNeutralSamples] = useState<FacialFrameMetrics[]>([]);
  const [nallaSamples, setNallaSamples] = useState<FacialFrameMetrics[]>([]);
  const [kallaSamples, setKallaSamples] = useState<FacialFrameMetrics[]>([]);
  const [trainedModel, setTrainedModel] = useState<PersonalTrainedModel | null>(null);

  const [inspectorDialogue, setInspectorDialogue] = useState('ആദ്യം ഒന്നും ചിരിക്കണ്ട... ഫേസ് ബാലൻസ് ചെയ്യാം.');
  const [inspectorState, setInspectorState] = useState<InspectorState>('NORMAL');

  const lastSampleTimeRef = useRef<number>(0);

  // Auto-collect samples for the active calibration step (spaced ~150ms)
  useEffect(() => {
    if (!faceDetected || !currentMetrics || currentStep === 'FINISHED') return;

    const now = performance.now();
    if (now - lastSampleTimeRef.current < 150) return;
    lastSampleTimeRef.current = now;

    if (currentStep === 'NEUTRAL') {
      if (neutralSamples.length < SAMPLES_PER_STAGE) {
        setNeutralSamples((prev) => [...prev, currentMetrics]);
      } else {
        setCurrentStep('NALLA_CHIRI');
      }
    } else if (currentStep === 'NALLA_CHIRI') {
      if (nallaSamples.length < SAMPLES_PER_STAGE) {
        setNallaSamples((prev) => [...prev, currentMetrics]);
      } else {
        setCurrentStep('KALLA_CHIRI');
      }
    } else if (currentStep === 'KALLA_CHIRI') {
      if (kallaSamples.length < SAMPLES_PER_STAGE) {
        setKallaSamples((prev) => [...prev, currentMetrics]);
      } else {
        // Fit Personal Classifier Model
        const finalKalla = [...kallaSamples, currentMetrics];
        const model = fitPersonalModel(neutralSamples, nallaSamples, finalKalla);
        setTrainedModel(model);
        setCurrentStep('FINISHED');
      }
    }
  }, [currentMetrics, faceDetected, currentStep, neutralSamples, nallaSamples, kallaSamples]);

  // Update Inspector Dialogue per step
  useEffect(() => {
    if (currentStep === 'NEUTRAL') {
      setInspectorState('NORMAL');
      setInspectorDialogue('ആദ്യം ഒന്നും ചിരിക്കണ്ട. ക്യാമറയിൽ സാദാ മുഖത്തോടെ നോക്കൂ...');
    } else if (currentStep === 'NALLA_CHIRI') {
      setInspectorState('HAPPY');
      setInspectorDialogue('ഇനി മനസ്സറിഞ്ഞ് ഒരു നല്ല ചിരി ചിരിച്ചേ!');
    } else if (currentStep === 'KALLA_CHIRI') {
      setInspectorState('SHOCKED');
      setInspectorDialogue('ഇനി എന്നെ പറ്റിക്കാൻ നോക്ക്! ഒരു വ്യാജ കള്ളി ചിരി നൽകൂ...');
    } else if (currentStep === 'FINISHED') {
      setInspectorState('CONFUSED');
      setInspectorDialogue('ശരി... നിന്നെയൊക്കെ ഇനി പെട്ടെന്ന് പിടിക്കാം! TRAINING COMPLETE!');
    }
  }, [currentStep]);

  const handleRetrain = () => {
    clearPersonalModel();
    setNeutralSamples([]);
    setNallaSamples([]);
    setKallaSamples([]);
    setTrainedModel(null);
    setCurrentStep('NEUTRAL');
  };

  const getActiveProgressCount = (): number => {
    if (currentStep === 'NEUTRAL') return neutralSamples.length;
    if (currentStep === 'NALLA_CHIRI') return nallaSamples.length;
    if (currentStep === 'KALLA_CHIRI') return kallaSamples.length;
    return SAMPLES_PER_STAGE;
  };

  const progressCount = getActiveProgressCount();
  const progressPercent = Math.min(100, Math.round((progressCount / SAMPLES_PER_STAGE) * 100));

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] flex flex-col justify-between p-3 md:p-6 scanlines relative select-none transition-colors duration-150">
      {/* Header */}
      <header className="flex justify-between items-center z-30 border-b-4 border-[var(--border)] pb-3">
        <button
          onClick={onBackToLanding}
          className="pixel-btn pixel-btn-secondary text-[9px] px-2 py-1.5 flex items-center"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          EXIT
        </button>

        <div className="flex items-center space-x-2 text-xs font-pixel">
          <span className="text-[var(--text)]">
            🎓 PERSONAL CALIBRATION
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
        {/* Step Indicator Chips */}
        <div className="grid grid-cols-3 gap-2 w-full mb-3 text-center font-pixel text-[9px]">
          <div
            className={`p-2 rounded-lg border-2 ${
              currentStep === 'NEUTRAL'
                ? 'bg-[#D99A00] text-[#2E1C14] border-[#2E1C14] font-bold'
                : neutralSamples.length >= SAMPLES_PER_STAGE
                ? 'bg-[#166534] text-white border-[#166534]'
                : 'bg-[#F4EFE6] dark:bg-[#24140D] text-[#5C4638] border-[#6B4327]'
            }`}
          >
            1. 😐 NEUTRAL
          </div>

          <div
            className={`p-2 rounded-lg border-2 ${
              currentStep === 'NALLA_CHIRI'
                ? 'bg-[#D99A00] text-[#2E1C14] border-[#2E1C14] font-bold'
                : nallaSamples.length >= SAMPLES_PER_STAGE
                ? 'bg-[#166534] text-white border-[#166534]'
                : 'bg-[#F4EFE6] dark:bg-[#24140D] text-[#5C4638] border-[#6B4327]'
            }`}
          >
            2. 😊 NALLA
          </div>

          <div
            className={`p-2 rounded-lg border-2 ${
              currentStep === 'KALLA_CHIRI'
                ? 'bg-[#D99A00] text-[#2E1C14] border-[#2E1C14] font-bold'
                : kallaSamples.length >= SAMPLES_PER_STAGE
                ? 'bg-[#166534] text-white border-[#166534]'
                : 'bg-[#F4EFE6] dark:bg-[#24140D] text-[#5C4638] border-[#6B4327]'
            }`}
          >
            3. 🥲 KALLA
          </div>
        </div>

        {/* Inspector Subhash Reaction Box */}
        <div className="w-full flex items-center gap-3 pixel-box p-2.5 rounded-xl mb-3 shadow-lg">
          <PixelInspector state={inspectorState} size={64} className="shrink-0" />
          <PixelDialogueBox
            speaker="INSPECTOR SUBHASH"
            text={inspectorDialogue}
            className="w-full text-lg md:text-xl"
            speed={25}
          />
        </div>

        {/* Video Viewport */}
        <div className="relative w-full aspect-[4/3] bg-[#120B07] rounded-xl overflow-hidden border-4 border-[#6B4327] dark:border-[#8A5A32] shadow-2xl flex items-center justify-center">
          {currentStep !== 'FINISHED' && (
            <div className="animate-scan-vertical" />
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />

          <FaceOverlay
            landmarks={currentLandmarks}
            faceDetected={faceDetected}
            isRecording={currentStep !== 'FINISHED'}
          />

          {/* Loading or finished overlay */}
          {(!isCameraReady || !isModelLoaded) && (
            <div className="absolute inset-0 bg-[#120B07]/95 flex flex-col items-center justify-center p-6 text-center z-40">
              <RefreshCw className="w-8 h-8 text-[#D99A00] animate-spin mb-3" />
              <p className="text-xs font-pixel text-[#FFD25A]">
                INITIALIZING CAMERA & VISION MODEL...
              </p>
            </div>
          )}

          {currentStep === 'FINISHED' && (
            <div className="absolute inset-0 bg-[#120B07]/95 flex flex-col items-center justify-center p-4 text-center z-40 overflow-y-auto">
              <CheckCircle2 className="w-10 h-10 text-[#4ade80] animate-bounce mb-2 shrink-0" />
              <h2 className="text-sm font-pixel text-white mb-1 uppercase">
                PERSONAL MODEL TRAINED ✓
              </h2>

              {/* Debug Training Summary Card */}
              <div className="w-full max-w-sm bg-[#1A0F0A] border-2 border-[#D99A00] rounded-lg p-2.5 mb-3 text-left font-vt323 text-xs space-y-1.5 shadow-lg">
                <div className="flex justify-between items-center text-[#FFD25A] font-pixel text-[8px] uppercase border-b border-[#6B4327] pb-1">
                  <span className="flex items-center gap-1">
                    <BarChart2 className="w-3 h-3 text-[#D99A00]" />
                    TRAINING SUMMARY (120 SAMPLES)
                  </span>
                  <span>v2.0 CENTROIDS</span>
                </div>

                <div className="grid grid-cols-3 gap-1 text-center font-pixel text-[7px] text-[#A3826C] pt-0.5">
                  <div>NO SMILE ({trainedModel?.sampleCounts?.NO_SMILE || 40})</div>
                  <div>NALLA ({trainedModel?.sampleCounts?.YATHARTHA_CHIRI || 40})</div>
                  <div>KALLA ({trainedModel?.sampleCounts?.KALLA_CHIRI || 40})</div>
                </div>

                {trainedModel?.featureSummaries && (
                  <div className="space-y-1 text-xs text-[#FFF4E6] border-t border-[#6B4327]/60 pt-1">
                    <div className="flex justify-between">
                      <span className="text-[#A3826C]">Mouth Expansion:</span>
                      <span>
                        NO: <strong className="text-[#FFD25A]">{trainedModel.featureSummaries.NO_SMILE.mouthExpansionMean}%</strong> | NALLA: <strong className="text-[#4ade80]">{trainedModel.featureSummaries.YATHARTHA_CHIRI.mouthExpansionMean}%</strong> | KALLA: <strong className="text-amber-400">{trainedModel.featureSummaries.KALLA_CHIRI.mouthExpansionMean}%</strong>
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[#A3826C]">Corner Lift:</span>
                      <span>
                        NO: <strong className="text-[#FFD25A]">{trainedModel.featureSummaries.NO_SMILE.cornerLiftMean}%</strong> | NALLA: <strong className="text-[#4ade80]">{trainedModel.featureSummaries.YATHARTHA_CHIRI.cornerLiftMean}%</strong> | KALLA: <strong className="text-amber-400">{trainedModel.featureSummaries.KALLA_CHIRI.cornerLiftMean}%</strong>
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-[#A3826C]">Eye Squint:</span>
                      <span>
                        NO: <strong className="text-[#FFD25A]">{trainedModel.featureSummaries.NO_SMILE.eyeSquintMean}%</strong> | NALLA: <strong className="text-[#4ade80]">{trainedModel.featureSummaries.YATHARTHA_CHIRI.eyeSquintMean}%</strong> | KALLA: <strong className="text-amber-400">{trainedModel.featureSummaries.KALLA_CHIRI.eyeSquintMean}%</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onTrainingComplete}
                  className="pixel-btn text-[10px] py-2 px-4 uppercase"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  START DETECTION
                </button>
                <button
                  onClick={handleRetrain}
                  className="pixel-btn pixel-btn-secondary text-[10px] py-2 px-3 uppercase"
                >
                  RETRAIN
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar & Sample Count */}
        {currentStep !== 'FINISHED' && (
          <div className="w-full mt-3 pixel-box p-3 rounded-xl space-y-1.5">
            <div className="flex justify-between items-center text-xs font-pixel text-[#2E1C14] dark:text-[#FFF4E6]">
              <span>SAMPLE RECORDING</span>
              <span className="text-[#D99A00] font-bold">
                {progressCount} / {SAMPLES_PER_STAGE} SAMPLES
              </span>
            </div>
            <div className="w-full bg-[#F4EFE6] dark:bg-[#1A0F0A] h-4 border-2 border-[#6B4327] dark:border-[#8A5A32] overflow-hidden">
              <div
                className="bg-[#D99A00] h-full transition-all duration-100 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs font-vt323 text-center text-[#5C4638] dark:text-[#A3826C]">
              {faceDetected ? '✓ Face locked. Collecting facial geometry...' : '⚠️ Face not detected. Look at camera.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

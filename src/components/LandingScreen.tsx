import React from 'react';
import { PixelInspector } from './PixelInspector';
import { PixelDialogueBox } from './PixelDialogueBox';
import { ThemeToggle } from './ThemeToggle';
import { isPersonalModelTrained } from '../lib/personalClassifier';
import { Sparkles, GraduationCap } from 'lucide-react';
import { primeResultAudio } from '../lib/resultAudio';

interface LandingScreenProps {
  onStartScanner: () => void;
  onStartTraining: () => void;
  onRunDemoMode?: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onStartScanner,
  onStartTraining,
  onRunDemoMode,
}) => {
  const modelTrained = isPersonalModelTrained();

  const handleStartScanner = () => {
    primeResultAudio();
    onStartScanner();
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] flex flex-col justify-between p-4 md:p-6 scanlines relative select-none transition-colors duration-150">
      {/* Top Retro Header with Theme Toggle */}
      <header className="flex justify-between items-center z-10 border-b-4 border-[var(--border)] pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-[var(--accent)] animate-pulse border border-[var(--text)]" />
          <span className="text-[10px] font-pixel text-[var(--text)] uppercase tracking-widest">
            KALLA CHIRI DETECTOR v3.0
          </span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Content Area */}
      <main className="max-w-xl mx-auto w-full my-auto py-6 z-10 text-center flex flex-col items-center">
        {/* Pixel Art Game Badge */}
        <div className="inline-block px-3 py-1 bg-[var(--surface-secondary)] border-2 border-[var(--border)] font-pixel text-[10px] text-[var(--text)] uppercase mb-4 shadow-md">
          ★ MALAYALAM MEME SMILE AUDITOR ★
        </div>

        {/* Primary Title */}
        <h1 className="text-3xl md:text-5xl font-pixel text-[var(--text)] tracking-tight uppercase leading-tight mb-2">
          KALLA CHIRI <span className="text-[var(--accent)]">DETECTOR</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base md:text-xl font-vt323 text-[var(--text-secondary)] mb-2">
          "Is that smile real, or are you just pretending?"
        </p>

        <p className="text-xl md:text-2xl font-vt323 text-[#166534] dark:text-[#4ade80] mb-6 italic">
          "Onnu chiriche... njangal nokkatte."
        </p>

        {/* Pixel Detective NPC & Malayalam Speech Bubble */}
        <div className="w-full max-w-md mb-4 flex flex-col sm:flex-row items-center justify-center gap-4 pixel-box p-4 rounded-xl shadow-2xl">
          <PixelInspector state="NORMAL" size={100} className="shrink-0" />
          <PixelDialogueBox
            speaker="INSPECTOR SUBHASH"
            text="Onnu chiriche... njangal nokkatte."
            className="w-full text-xl"
            speed={30}
          />
        </div>

        {/* Training Info Explanation Card */}
        <div className="w-full max-w-md mb-4 pixel-box p-3 rounded-xl text-center shadow-md">
          <h2 className="text-xs md:text-sm font-pixel text-[var(--accent)] uppercase font-bold mb-1 leading-snug">
            RETRAIN YOUR CHIRI FOR MORE ACCURATE RESULTS
          </h2>
          <p className="text-base md:text-lg font-vt323 text-[var(--text-secondary)]">
            Train the detector with your own expressions for better personalized detection.
          </p>
        </div>

        {/* Personal Model Status Chip */}
        <div className="mb-4">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-vt323 border-2 ${
              modelTrained
                ? 'bg-[#166534]/10 border-[#166534] text-[#166534] dark:text-[#4ade80]'
                : 'bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            {modelTrained ? '✓ PERSONAL MODEL TRAINED (PERSISTED)' : '★ HEURISTIC ENGINE ACTIVE (TRAINING RECOMMENDED)'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-xs space-y-3 mb-8">
          <button
            onClick={handleStartScanner}
            className="w-full pixel-btn text-xs md:text-sm py-4 uppercase tracking-wider shadow-xl"
          >
            ▶ START INVESTIGATION
          </button>

          <button
            onClick={onStartTraining}
            className="w-full pixel-btn pixel-btn-secondary text-[10px] py-2.5 uppercase flex items-center justify-center"
          >
            <GraduationCap className="w-4 h-4 mr-1.5 text-[#FFD25A]" />
            {modelTrained ? 'RETRAIN YOUR CHIRI' : 'TRAIN YOUR CHIRI (CALIBRATE)'}
          </button>

          {onRunDemoMode && (
            <button
              onClick={onRunDemoMode}
              className="w-full pixel-btn pixel-btn-secondary text-[9px] py-2 uppercase"
            >
              ★ QUICK DEMO SCAN
            </button>
          )}
        </div>

        {/* Telemetry Feature Chips */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-sm text-center font-vt323 text-base text-[var(--text)] mb-4 border-2 border-[var(--border)] p-2 bg-[var(--surface)] rounded-lg">
          <div>
            <div className="text-[#166534] dark:text-[#4ade80] font-bold">MEDIAPIPE</div>
            <div className="text-xs text-[var(--text-secondary)]">60 FPS TRACE</div>
          </div>
          <div className="border-x-2 border-[var(--border)]">
            <div className="text-[var(--accent)] font-bold">3 SEC SCAN</div>
            <div className="text-xs text-[var(--text-secondary)]">WINDOW</div>
          </div>
          <div>
            <div className="text-[var(--border)] dark:text-[#FFD25A] font-bold">GEMINI AI</div>
            <div className="text-xs text-[var(--text-secondary)]">MANGLISH ROAST</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-xl mx-auto w-full z-10 space-y-2 text-center border-t-2 border-[var(--border)] pt-3 font-vt323">
        <div className="text-base text-[var(--text-secondary)]">
          🔒 Privacy Assured: Camera processing runs 100% locally in browser. No video is saved or sent.
        </div>
      </footer>
    </div>
  );
};

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Share2, RefreshCw, Scale } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ForensicReport, getVerdictDisplay } from '../types/forensic';
import { PixelInspector, InspectorState } from './PixelInspector';
import { PixelDialogueBox } from './PixelDialogueBox';
import { MemeImage } from './MemeImage';
import { getRandomMemeImageBasename } from '../lib/imageResolver';
import { getRandomInspectorComment } from '../lib/comments';
import { ThemeToggle } from './ThemeToggle';
import { playResultAudio, stopResultAudio } from '../lib/resultAudio';

interface ReportScreenProps {
  report: ForensicReport;
  onReset: () => void;
}

export const ReportScreen: React.FC<ReportScreenProps> = ({ report, onReset }) => {
  const [copied, setCopied] = useState(false);
  const hasPlayedAudioRef = useRef<string | null>(null);

  const { verdict, confidence, summary, evidence, roast, interrogation_question, metrics, isFallback } = report;

  const verdictDisplay = getVerdictDisplay(verdict);

  // Randomly select ONE meme image basename on mount for the verdict
  const memeBasename = useMemo(() => getRandomMemeImageBasename(verdict), [verdict]);

  // Randomly select EXACTLY ONE Malayalam Inspector Subhash comment on mount
  const subhashMalayalamComment = useMemo(() => getRandomInspectorComment(verdict), [verdict]);

  // Trigger pixel confetti if YATHARTHA_CHIRI (Nalla Chiri)
  useEffect(() => {
    if (verdict === 'YATHARTHA_CHIRI') {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#f59e0b', '#eab308'],
      });
    }
  }, [verdict]);

  // Play local result audio ONCE automatically when the final result screen appears
  useEffect(() => {
    if (hasPlayedAudioRef.current !== verdict) {
      hasPlayedAudioRef.current = verdict;
      playResultAudio(verdict);
    }

    return () => {
      stopResultAudio();
    };
  }, [verdict]);

  const handleResetWithStop = () => {
    stopResultAudio();
    onReset();
  };

  // Inspector reaction state
  const inspectorState: InspectorState =
    verdict === 'YATHARTHA_CHIRI' ? 'HAPPY' : verdict === 'KALLA_CHIRI' ? 'SHOCKED' : 'CONFUSED';

  // Share functionality
  const handleShare = async () => {
    const textToShare = `🚨 KALLA CHIRI DETECTOR REPORT 🚨\nVerdict: ${verdictDisplay.emoji} ${verdictDisplay.title}\nSubhash: "${subhashMalayalamComment}"\nRoast: "${roast}"\n\nAnalyzed with Kalla Chiri Detector!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kalla Chiri Detector Report',
          text: textToShare,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled share or failed
      }
    } else {
      navigator.clipboard.writeText(textToShare);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] flex flex-col justify-between p-4 md:p-6 scanlines relative select-none transition-colors duration-150">
      {/* Main Report Container */}
      <main className="w-full max-w-lg mx-auto my-auto py-3 z-10 space-y-4">
        {/* 1. Header: KALLA CHIRI DETECTOR */}
        <div className="flex justify-between items-center border-b-4 border-[var(--border)] pb-2">
          <div>
            <span className="text-[9px] font-pixel text-[var(--text-secondary)] block uppercase">
              RECORD #KC-{Math.floor(1000 + Math.random() * 9000)}
            </span>
            <h1 className="text-xs md:text-sm font-pixel font-bold text-[var(--text)] uppercase">
              KALLA CHIRI DETECTOR
            </h1>
          </div>
          <ThemeToggle />
        </div>

        {/* 2. Result Title Banner: [Emoji + Result] */}
        <div className="pixel-box p-4 rounded-xl text-center flex flex-col items-center shadow-xl">
          <div className="font-pixel text-[9px] px-3 py-1 border-2 border-[#6B4327] dark:border-[#8A5A32] mb-2 uppercase font-bold bg-[#F4EFE6] dark:bg-[#2E1A10] text-[#2E1C14] dark:text-[#FFD25A]">
            CONFIDENCE: {confidence}%
          </div>

          <h2 className={`text-2xl md:text-3xl font-pixel tracking-wide uppercase ${verdictDisplay.colorClass} mb-1`}>
            {verdictDisplay.emoji} {verdictDisplay.title}
          </h2>

          <p className="text-lg font-vt323 text-[#5C4638] dark:text-[#F5E6D3] max-w-sm">
            {summary}
          </p>
        </div>

        {/* 3. LARGE MALAYALAM MOVIE / MEME IMAGE */}
        <div className="w-full">
          <MemeImage basename={memeBasename} category={verdict} altText={`${verdictDisplay.title} Malayalam Meme`} />
        </div>

        {/* 4 & 5. Inspector Subhash Pixel Character + ONE Malayalam Text Comment */}
        <div className="w-full flex items-center gap-3 pixel-box p-3 rounded-xl shadow-lg">
          <PixelInspector state={inspectorState} size={80} className="shrink-0" />
          <PixelDialogueBox
            speaker="INSPECTOR SUBHASH"
            text={subhashMalayalamComment}
            className="w-full text-xl md:text-2xl font-bold"
            speed={25}
          />
        </div>

        {/* 6. Gemini-generated funny explanation / roast */}
        {roast && (
          <div className="bg-[#FFFDF8] dark:bg-[#24140D] border-2 border-[#6B4327] dark:border-[#8A5A32] rounded-xl p-3 shadow-md font-vt323">
            <div className="text-xs font-pixel text-[#D99A00] mb-1">
              🤖 GEMINI FORENSIC ROAST:
            </div>
            <p className="text-xl text-[#2E1C14] dark:text-[#FFF4E6] italic leading-relaxed">
              "{roast}"
            </p>
          </div>
        )}

        {/* Interrogation Question Card */}
        {interrogation_question && (
          <div className="bg-[#F4EFE6] dark:bg-[#1A0F0A] border-2 border-[#6B4327] dark:border-[#8A5A32] rounded-lg p-2.5 shadow-md font-vt323">
            <div className="text-xs font-pixel text-[#D99A00] mb-0.5">
              ❓ INTERROGATION QUESTION:
            </div>
            <p className="text-lg text-[#2E1C14] dark:text-[#F5E6D3]">
              {interrogation_question}
            </p>
          </div>
        )}

        {/* 7. Facial Evidence / Telemetry Breakdown (Retro Stat Bars) */}
        {metrics && (
          <div className="bg-[#FFFDF8] dark:bg-[#24140D] border-2 border-[#6B4327] dark:border-[#8A5A32] rounded-xl p-3 space-y-2 font-vt323 text-lg">
            <div className="flex items-center justify-between border-b-2 border-[#6B4327] dark:border-[#8A5A32] pb-1 text-xs font-pixel text-[#5C4638] dark:text-[#A3826C]">
              <span className="flex items-center">
                <Scale className="w-3.5 h-3.5 mr-1 text-[#166534] dark:text-[#4ade80]" />
                TELEMETRY EVIDENCE
              </span>
              <span>3.0s WINDOW</span>
            </div>

            <div className="space-y-2">
              {/* Mouth Expansion Bar */}
              <div>
                <div className="flex justify-between text-base text-[#2E1C14] dark:text-[#F5E6D3] mb-0.5">
                  <span>Mouth Expansion</span>
                  <span className="text-[#166534] dark:text-[#4ade80] font-bold">+{metrics.mouthExpansionPercent}%</span>
                </div>
                <div className="w-full bg-[#F4EFE6] dark:bg-[#1A0F0A] h-3 border-2 border-[#6B4327] dark:border-[#8A5A32] overflow-hidden">
                  <div
                    className="bg-[#166534] dark:bg-[#4ade80] h-full transition-all"
                    style={{ width: `${Math.min(100, metrics.mouthExpansionPercent)}%` }}
                  />
                </div>
              </div>

              {/* Eye Squint Bar */}
              <div>
                <div className="flex justify-between text-base text-[#2E1C14] dark:text-[#F5E6D3] mb-0.5">
                  <span>Eye Squint Involvement</span>
                  <span className="text-[#D99A00] font-bold">{metrics.eyeSquintPercent}%</span>
                </div>
                <div className="w-full bg-[#F4EFE6] dark:bg-[#1A0F0A] h-3 border-2 border-[#6B4327] dark:border-[#8A5A32] overflow-hidden">
                  <div
                    className="bg-[#D99A00] h-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, metrics.eyeSquintPercent))}%` }}
                  />
                </div>
              </div>

              {/* Symmetry Bar */}
              <div>
                <div className="flex justify-between text-base text-[#2E1C14] dark:text-[#F5E6D3] mb-0.5">
                  <span>Smile Symmetry</span>
                  <span className="text-purple-700 dark:text-purple-400 font-bold">{metrics.symmetryPercent}%</span>
                </div>
                <div className="w-full bg-[#F4EFE6] dark:bg-[#1A0F0A] h-3 border-2 border-[#6B4327] dark:border-[#8A5A32] overflow-hidden">
                  <div
                    className="bg-purple-700 dark:bg-purple-400 h-full transition-all"
                    style={{ width: `${metrics.symmetryPercent}%` }}
                  />
                </div>
              </div>

              {/* Suspicion Score Bar */}
              <div>
                <div className="flex justify-between text-base text-[#2E1C14] dark:text-[#F5E6D3] mb-0.5">
                  <span>Suspicion Index Score</span>
                  <span className="text-red-700 dark:text-red-400 font-bold">{metrics.heuristicSuspicionScore}/100</span>
                </div>
                <div className="w-full bg-[#F4EFE6] dark:bg-[#1A0F0A] h-3 border-2 border-[#6B4327] dark:border-[#8A5A32] overflow-hidden">
                  <div
                    className="bg-red-600 dark:bg-red-500 h-full transition-all"
                    style={{ width: `${metrics.heuristicSuspicionScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Observed Findings List */}
        {evidence && evidence.length > 0 && (
          <div className="bg-[#F4EFE6] dark:bg-[#1A0F0A] border-2 border-[#6B4327] dark:border-[#8A5A32] rounded-lg p-2.5 font-vt323 text-base space-y-1">
            <span className="text-[#5C4638] dark:text-[#A3826C] font-pixel text-[8px] uppercase block font-bold">OBSERVED FINDINGS:</span>
            {evidence.map((item, idx) => (
              <div key={idx} className="flex items-start space-x-1.5 text-[#2E1C14] dark:text-[#F5E6D3]">
                <span className="text-[#166534] dark:text-[#4ade80] shrink-0">►</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}

        {/* Fallback Notice */}
        {isFallback && (
          <div className="text-xs font-vt323 text-[#5C4638] dark:text-[#A3826C] text-center">
            * Local heuristic fallback engine active.
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleResetWithStop}
            className="pixel-btn text-[10px] md:text-xs py-3 uppercase flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            INVESTIGATE AGAIN
          </button>

          <button
            onClick={handleShare}
            className="pixel-btn pixel-btn-secondary text-[10px] md:text-xs py-3 uppercase flex items-center justify-center"
          >
            <Share2 className="w-4 h-4 mr-1.5 text-[#D99A00]" />
            {copied ? 'COPIED!' : 'SHARE RESULT'}
          </button>
        </div>
      </main>
    </div>
  );
};


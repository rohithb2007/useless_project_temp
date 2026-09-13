import React, { useEffect, useState } from 'react';
import { Terminal as TerminalIcon, Cpu } from 'lucide-react';
import { ScanAnalysisData, ForensicReport } from '../types/forensic';
import { analyzeChiriWithGemini } from '../lib/gemini';
import { PixelInspector, InspectorState } from './PixelInspector';
import { PixelDialogueBox } from './PixelDialogueBox';
import { ThemeToggle } from './ThemeToggle';

interface AnalysisScreenProps {
  metrics: ScanAnalysisData;
  onAnalysisFinished: (report: ForensicReport) => void;
}

const ANALYSIS_STEPS = [
  { text: '> INITIALIZING KALLA CHIRI DETECTOR PROTOCOL...', dialogue: 'പരിശോധിച്ചുകൊണ്ടിരിക്കുന്നു...', state: 'NORMAL' as InspectorState, delay: 200 },
  { text: '> EXTRACTING FACIAL LANDMARKS (478 POINTS)...', dialogue: 'ഫേഷ്യൽ പോയിന്റുകൾ അപഗ്രഥിക്കുന്നു...', state: 'SCANNING' as InspectorState, delay: 600 },
  { text: '> MEASURING MOUTH MOVEMENT DELTA...', dialogue: 'ചുണ്ടുകളുടെ ചലനം അളക്കുന്നു...', state: 'SCANNING' as InspectorState, delay: 1100 },
  { text: '> CHECKING OCULAR APERTURE & DUCHENNE SQUINT...', dialogue: 'കണ്ണുകളുടെ പങ്കാളിത്തം നിരീക്ഷിക്കുന്നു...', state: 'SHOCKED' as InspectorState, delay: 1600 },
  { text: '> CALCULATING KALLA CHIRI SUSPICION SCORE...', dialogue: 'സ്കോർ കണക്കാക്കുന്നു...', state: 'SHOCKED' as InspectorState, delay: 2100 },
  { text: '> CONSULTING GEMINI REASONING ENGINE...', dialogue: 'എഐ റിപ്പോർട്ട് തയ്യാറാക്കുന്നു...', state: 'SCANNING' as InspectorState, delay: 2600 },
];

export const AnalysisScreen: React.FC<AnalysisScreenProps> = ({
  metrics,
  onAnalysisFinished,
}) => {
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const [currentDialogue, setCurrentDialogue] = useState('പരിശോധന ആരംഭിക്കുന്നു...');
  const [inspectorState, setInspectorState] = useState<InspectorState>('NORMAL');

  useEffect(() => {
    ANALYSIS_STEPS.forEach((step) => {
      setTimeout(() => {
        setVisibleLogs((prev) => [...prev, step.text]);
        setCurrentDialogue(step.dialogue);
        setInspectorState(step.state);
      }, step.delay);
    });

    let isCancelled = false;

    async function runAnalysis() {
      const report = await analyzeChiriWithGemini(metrics);
      if (!isCancelled) {
        setTimeout(() => {
          onAnalysisFinished(report);
        }, 3200);
      }
    }

    runAnalysis();

    return () => {
      isCancelled = true;
    };
  }, [metrics, onAnalysisFinished]);

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] flex flex-col justify-center items-center p-4 md:p-8 scanlines relative font-mono select-none transition-colors duration-150">
      <main className="w-full max-w-lg bg-[var(--surface)] border-4 border-[var(--border)] rounded-xl p-5 shadow-2xl z-10">
        {/* Terminal Header with Theme Toggle */}
        <div className="flex items-center justify-between border-b-4 border-[var(--border)] pb-3 mb-4 font-pixel text-[10px]">
          <div className="flex items-center space-x-2">
            <TerminalIcon className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-[var(--text)] uppercase">
              KALLA CHIRI DETECTOR // INTERROGATION
            </span>
          </div>
          <ThemeToggle />
        </div>

        {/* Pixel Inspector Reaction Box */}
        <div className="w-full flex items-center gap-3 pixel-box p-3 rounded-lg mb-4">
          <PixelInspector state={inspectorState} size={72} className="shrink-0" />
          <PixelDialogueBox
            speaker="INSPECTOR SUBHASH"
            text={currentDialogue}
            className="w-full text-xl"
            speed={30}
          />
        </div>

        {/* Case File Status Title */}
        <div className="text-center py-2 border-2 border-[#6B4327] dark:border-[#8A5A32] bg-[#F4EFE6] dark:bg-[#1A0F0A] rounded-lg mb-4 font-pixel">
          <div className="flex items-center justify-center space-x-2 text-[10px] text-[#D99A00] mb-1">
            <Cpu className="w-3.5 h-3.5 animate-spin" />
            <span>AUDITING TELEMETRY</span>
          </div>
          <h2 className="text-sm md:text-base font-bold text-[#2E1C14] dark:text-white uppercase tracking-wider">
            CASE FILE UNDER REVIEW
          </h2>
        </div>

        {/* 8-Bit Terminal Output Window */}
        <div className="bg-[#120B07] border-2 border-[#6B4327] dark:border-[#8A5A32] rounded-lg p-3 h-44 overflow-y-auto font-vt323 text-lg text-[#FFD25A] dark:text-[#4ade80] space-y-1.5 mb-4 shadow-inner">
          {visibleLogs.map((log, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <span className="text-[#5C4638] shrink-0">&gt;</span>
              <span>{log.replace('> ', '')}</span>
            </div>
          ))}

          <div className="inline-block w-2 h-4 bg-[#D99A00] dark:bg-[#4ade80] animate-pulse ml-1" />
        </div>

        {/* Captured Metrics Preview Cards */}
        <div className="grid grid-cols-2 gap-2 font-vt323 text-lg">
          <div className="bg-[#F4EFE6] dark:bg-[#1A0F0A] border-2 border-[#6B4327] dark:border-[#8A5A32] p-2 rounded-lg text-center">
            <span className="text-[#5C4638] dark:text-[#A3826C] text-xs font-pixel text-[8px] block">EXPANSION DELTA</span>
            <span className="text-[#166534] dark:text-[#4ade80] font-bold">+{metrics.mouthExpansionPercent}%</span>
          </div>
          <div className="bg-[#F4EFE6] dark:bg-[#1A0F0A] border-2 border-[#6B4327] dark:border-[#8A5A32] p-2 rounded-lg text-center">
            <span className="text-[#5C4638] dark:text-[#A3826C] text-xs font-pixel text-[8px] block">SQUINT INVOLVEMENT</span>
            <span className="text-[#D99A00] font-bold">{metrics.eyeSquintPercent}%</span>
          </div>
        </div>
      </main>
    </div>
  );
};

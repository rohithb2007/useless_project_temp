import React, { useState } from 'react';
import { AppState, ScanAnalysisData, ForensicReport } from './types/forensic';
import { LandingScreen } from './components/LandingScreen';
import { ScannerScreen } from './components/ScannerScreen';
import { AnalysisScreen } from './components/AnalysisScreen';
import { ReportScreen } from './components/ReportScreen';
import { TrainingScreen } from './components/TrainingScreen';

export function App() {
  const [appState, setAppState] = useState<AppState>('LANDING');
  const [scanMetrics, setScanMetrics] = useState<ScanAnalysisData | null>(null);
  const [forensicReport, setForensicReport] = useState<ForensicReport | null>(null);

  // Transition from Scanner to Analysis
  const handleScanComplete = (metrics: ScanAnalysisData) => {
    setScanMetrics(metrics);
    setAppState('ANALYZING');
  };

  // Transition from Analysis to Report
  const handleAnalysisFinished = (report: ForensicReport) => {
    setForensicReport(report);
    setAppState('REPORT');
  };

  // Reset back to Landing
  const handleReset = () => {
    setScanMetrics(null);
    setForensicReport(null);
    setAppState('LANDING');
  };

  // Quick Demo Mode Simulation (for live presentation / fast testing)
  const handleRunDemoMode = () => {
    const demoMetrics: ScanAnalysisData = {
      totalFrames: 90,
      validFrames: 88,
      durationSeconds: 3.0,
      baselineMouthWidth: 0.125,
      baselineEyeAperture: 0.045,
      peakMouthWidth: 0.168,
      peakEyeAperture: 0.043,
      mouthExpansionPercent: 34.4,
      eyeSquintPercent: 4.4,
      symmetryPercent: 78,
      smileScore: 88,
      smileDetected: true,
      heuristicSuspicionScore: 82,
      preliminaryVerdict: 'KALLA_CHIRI',
    };
    setScanMetrics(demoMetrics);
    setAppState('ANALYZING');
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] selection:bg-[#D99A00] selection:text-white">
      {appState === 'LANDING' && (
        <LandingScreen
          onStartScanner={() => setAppState('SCANNER')}
          onStartTraining={() => setAppState('TRAINING')}
          onRunDemoMode={handleRunDemoMode}
        />
      )}

      {appState === 'TRAINING' && (
        <TrainingScreen
          onTrainingComplete={() => setAppState('SCANNER')}
          onBackToLanding={handleReset}
        />
      )}

      {appState === 'SCANNER' && (
        <ScannerScreen
          onScanComplete={handleScanComplete}
          onBackToLanding={handleReset}
          onStartTraining={() => setAppState('TRAINING')}
        />
      )}

      {appState === 'ANALYZING' && scanMetrics && (
        <AnalysisScreen
          metrics={scanMetrics}
          onAnalysisFinished={handleAnalysisFinished}
        />
      )}

      {appState === 'REPORT' && forensicReport && (
        <ReportScreen
          report={forensicReport}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

export default App;

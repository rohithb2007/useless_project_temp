import { ScanAnalysisData, ForensicReport, VerdictType } from '../types/forensic';

/**
 * Generates a local Malayalam/Manglish report fallback
 * when Gemini API key is missing or network fails.
 */
export function generateFallbackReport(metrics: ScanAnalysisData): ForensicReport {
  const { preliminaryVerdict, mouthExpansionPercent, eyeSquintPercent, heuristicSuspicionScore, symmetryPercent } = metrics;

  let verdict: VerdictType = preliminaryVerdict;
  let confidence = Math.min(99, Math.max(65, Math.round(75 + Math.abs(heuristicSuspicionScore - 50) * 0.4)));
  let summary = "";
  let evidence: string[] = [];
  let roast = "";
  let interrogation_question = "";

  if (verdict === 'KALLA_CHIRI') {
    summary = "High mouth expansion combined with low eye muscle participation. Classic artificial smile pattern.";
    evidence = [
      `Mouth expansion registered at +${mouthExpansionPercent}%`,
      `Eye squint involvement recorded at ${eyeSquintPercent}%`,
      `Smile symmetry standing at ${symmetryPercent}%`,
      `Suspicion Index hit ${heuristicSuspicionScore}/100`,
    ];
    roast = "Nte ponno, your mouth submitted a full smile, but your eyes went on a complete union strike!";
    interrogation_question = "Which corporate HR meeting did you practice this smile for?";
  } else if (verdict === 'YATHARTHA_CHIRI') {
    summary = "Coordinated eye squint and mouth movement detected. Genuine authentic smile pattern.";
    evidence = [
      `Mouth expansion of +${mouthExpansionPercent}% matched with ${eyeSquintPercent}% eye squint`,
      `Natural Duchenne eye involvement verified`,
      `Symmetry rating of ${symmetryPercent}%`,
      `Low suspicion index score of ${heuristicSuspicionScore}/100`,
    ];
    roast = "Real Chiri verified! Even our strict Malayalam scanner couldn't find any dishonesty here.";
    interrogation_question = "Who gave you permission to actually be happy in this economy?";
  } else {
    summary = "Insufficient facial landmark displacement. Subject remained neutral.";
    evidence = [
      `Mouth expansion was only +${mouthExpansionPercent}%`,
      `Facial muscle movement remained inert`,
      `Zero smile signature detected`,
    ];
    roast = "Chiri evide? Scanner is staring at a passport photograph!";
    interrogation_question = "Are you waiting for a stamped clearance before showing some emotion?";
  }

  return {
    verdict,
    confidence,
    summary,
    evidence,
    roast,
    interrogation_question,
    metrics,
    isFallback: true,
  };
}

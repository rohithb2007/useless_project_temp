import { VerdictType } from '../types/forensic';

/**
 * Result Audio File Mapping for local audio files in public/audio/
 * Candidates prioritize .mp3 extension URLs because Vite dev server & production servers return
 * Content-Type: 'audio/mpeg' for .mp3, which browser HTMLAudioElement can decode natively.
 * (.mpeg extension can be served as 'video/mpeg' by default servers, causing browser decode errors).
 */
export const RESULT_AUDIO_MAP: Record<VerdictType, string[]> = {
  YATHARTHA_CHIRI: [
    '/audio/nalla-chiri.mp3',
    '/audio/nalla-chiri.mpeg',
    '/audio/nalla chiri.mpeg',
    '/audio/nalla%20chiri.mpeg',
  ],
  KALLA_CHIRI: [
    '/audio/kalla-chiri.mp3',
    '/audio/kalla chiri audio.mp3',
    '/audio/kalla%20chiri%20audio.mp3',
  ],
  NO_SMILE: [
    '/audio/neutral-chiri.mp3',
    '/audio/neutral-chiri.mpeg',
    '/audio/neutral chiri.mpeg',
    '/audio/neutral%20chiri.mpeg',
  ],
};

let currentAudioInstance: HTMLAudioElement | null = null;
let isAudioPrimed = false;

/**
 * Primes the audio system on user gesture (e.g. button click) to unlock browser autoplay policy.
 */
export function primeResultAudio(): void {
  if (isAudioPrimed || typeof window === 'undefined') return;
  try {
    const dummy = new Audio('/audio/nalla-chiri.mp3');
    dummy.volume = 0.01;
    const promise = dummy.play();
    if (promise !== undefined) {
      promise
        .then(() => {
          dummy.pause();
          dummy.currentTime = 0;
          isAudioPrimed = true;
        })
        .catch(() => {
          // Silent catch
        });
    }
  } catch (e) {
    // Ignore
  }
}

/**
 * Stops any currently playing result audio.
 */
export function stopResultAudio(): void {
  if (currentAudioInstance) {
    try {
      currentAudioInstance.pause();
      currentAudioInstance.currentTime = 0;
      currentAudioInstance.onended = null;
      currentAudioInstance.onerror = null;
    } catch (e) {
      // Ignore cleanup error
    }
    currentAudioInstance = null;
  }
}

/**
 * Plays the local result audio file corresponding to the verdict automatically.
 * Configured with full diagnostic logging in DEV mode.
 */
export function playResultAudio(verdict: VerdictType): void {
  stopResultAudio();

  const candidates = RESULT_AUDIO_MAP[verdict];
  if (!candidates || candidates.length === 0) {
    if (import.meta.env.DEV) {
      console.warn(`RESULT AUDIO: No candidates defined for verdict=${verdict}`);
    }
    return;
  }

  let candidateIndex = 0;

  const tryPlayCandidate = (index: number) => {
    if (index >= candidates.length) {
      if (import.meta.env.DEV) {
        console.error(`RESULT AUDIO PLAY FAILED: All audio candidates exhausted for ${verdict}`);
      }
      return;
    }

    const audioSrc = candidates[index];
    const audio = new Audio();
    currentAudioInstance = audio;

    audio.preload = 'auto';
    audio.src = audioSrc;

    if (import.meta.env.DEV) {
      console.log(
        `RESULT AUDIO:\n` +
        `result = ${verdict}\n` +
        `src = ${audioSrc}\n` +
        `audio.readyState = ${audio.readyState}\n` +
        `audio.networkState = ${audio.networkState}`
      );
      console.log(`RESULT AUDIO: attempting play`);
    }

    audio.load();

    audio.onerror = (e) => {
      if (import.meta.env.DEV) {
        console.warn(`RESULT AUDIO: Candidate ${audioSrc} failed load, fallback to next candidate. Error:`, e);
      }
      tryPlayCandidate(index + 1);
    };

    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          if (import.meta.env.DEV) {
            console.log(`RESULT AUDIO PLAY SUCCESS: ${verdict} (${audioSrc})`);
          }
        })
        .catch((err: any) => {
          if (import.meta.env.DEV) {
            if (err?.name === 'NotAllowedError') {
              console.warn(`RESULT AUDIO BLOCKED BY AUTOPLAY POLICY:`, err);
            } else {
              console.error(`RESULT AUDIO PLAY FAILED: error =`, err);
            }
          }

          // If playback error was not an autoplay policy block, try next candidate URL
          if (index + 1 < candidates.length && err?.name !== 'NotAllowedError') {
            tryPlayCandidate(index + 1);
          }
        });
    }
  };

  tryPlayCandidate(candidateIndex);
}

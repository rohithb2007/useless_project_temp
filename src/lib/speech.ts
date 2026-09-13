/**
 * Web Speech & Server Fallback API helper for Inspector Subhash Malayalam TTS voice
 */

let synth: SpeechSynthesis | null = null;
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  synth = window.speechSynthesis;
}

let availableVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): SpeechSynthesisVoice[] {
  if (!synth) return [];
  availableVoices = synth.getVoices();
  return availableVoices;
}

if (synth) {
  loadVoices();
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = () => {
      loadVoices();
    };
  }
}

let activeAudioElement: HTMLAudioElement | null = null;
let activeObjectUrl: string | null = null;

/**
 * Checks if a native Malayalam voice is available in the browser/device.
 */
export function isNativeMalayalamVoiceAvailable(): boolean {
  const voices = loadVoices();
  return voices.some(
    (v) =>
      v.lang.toLowerCase() === 'ml-in' ||
      v.lang.toLowerCase().startsWith('ml') ||
      v.name.toLowerCase().includes('malayalam')
  );
}

export function isMalayalamVoiceAvailable(): boolean {
  // Always true because server-side /api/tts fallback is active
  return true;
}

/**
 * Stops any currently active speech or audio playback.
 */
export function stopSpeech(): void {
  // 1. Cancel browser Web Speech synthesis
  if (synth) {
    try {
      synth.cancel();
    } catch (err) {
      console.warn('Speech cancellation error:', err);
    }
  }

  // 2. Stop HTML5 Audio element playback
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
      activeAudioElement.onplay = null;
      activeAudioElement.onended = null;
      activeAudioElement.onerror = null;
    } catch (err) {
      console.warn('Audio pause error:', err);
    }
    activeAudioElement = null;
  }

  if (activeObjectUrl) {
    try {
      URL.revokeObjectURL(activeObjectUrl);
    } catch (err) {
      // ignore
    }
    activeObjectUrl = null;
  }
}

/**
 * Speaks the given Malayalam comment text aloud.
 * Strategy:
 * 1. Uses browser native Malayalam voice (ml-IN) if installed.
 * 2. Otherwise fetches Malayalam audio from /api/tts server fallback.
 * 3. Fallbacks gracefully to standard SpeechSynthesis if offline/blocked.
 */
export function speakInspectorComment(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (errMessage?: string) => void
): void {
  stopSpeech();

  if (!text || !text.trim()) {
    if (onEnd) onEnd();
    return;
  }

  // Check if browser native Malayalam voice exists
  const nativeVoices = loadVoices();
  const nativeMlVoice = nativeVoices.find(
    (v) =>
      v.lang.toLowerCase() === 'ml-in' ||
      v.lang.toLowerCase().startsWith('ml') ||
      v.name.toLowerCase().includes('malayalam')
  );

  if (synth && nativeMlVoice) {
    // Priority 1: Native browser Malayalam SpeechSynthesis
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = nativeMlVoice;
      utterance.lang = 'ml-IN';
      utterance.rate = 0.90;
      utterance.pitch = 1.10;

      utterance.onstart = () => {
        if (onStart) onStart();
      };
      utterance.onend = () => {
        if (onEnd) onEnd();
      };
      utterance.onerror = (e) => {
        console.warn('Native speech error, attempting fallback:', e);
        playFallbackAudio(text, onStart, onEnd, onError);
      };

      synth.speak(utterance);
      return;
    } catch (e) {
      console.warn('Native SpeechSynthesis failed, switching to /api/tts:', e);
    }
  }

  // Priority 2: /api/tts Application-Level Fallback
  playFallbackAudio(text, onStart, onEnd, onError);
}

function playFallbackAudio(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (errMessage?: string) => void
): void {
  fetch('/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      activeObjectUrl = objectUrl;

      const audio = new Audio(objectUrl);
      activeAudioElement = audio;

      audio.onplay = () => {
        if (onStart) onStart();
      };

      audio.onended = () => {
        if (activeObjectUrl === objectUrl) {
          URL.revokeObjectURL(objectUrl);
          activeObjectUrl = null;
        }
        activeAudioElement = null;
        if (onEnd) onEnd();
      };

      audio.onerror = (e) => {
        console.warn('Audio playback error:', e);
        if (onEnd) onEnd();
        fallbackToNativeWebSpeech(text, onStart, onEnd, onError);
      };

      try {
        await audio.play();
      } catch (err: any) {
        console.warn('Audio play() error / autoplay block:', err);
        if (onEnd) onEnd();
        if (err?.name === 'NotAllowedError') {
          if (onError) onError('Press 🔊 കേൾപ്പിക്കൂ to play');
        } else {
          fallbackToNativeWebSpeech(text, onStart, onEnd, onError);
        }
      }
    })
    .catch((err) => {
      console.warn('/api/tts fetch error, attempting native speech fallback:', err);
      fallbackToNativeWebSpeech(text, onStart, onEnd, onError);
    });
}

function fallbackToNativeWebSpeech(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (errMessage?: string) => void
): void {
  if (!synth) {
    if (onEnd) onEnd();
    if (onError) onError('Voice playback unavailable');
    return;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = loadVoices();
    const fallbackVoice =
      voices.find((v) => v.lang.toLowerCase().includes('in')) || voices[0] || null;

    if (fallbackVoice) utterance.voice = fallbackVoice;
    utterance.rate = 0.90;
    utterance.pitch = 1.10;

    utterance.onstart = () => {
      if (onStart) onStart();
    };
    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      if (onEnd) onEnd();
      if (onError) onError('Playback error');
    };

    synth.speak(utterance);
  } catch (e) {
    if (onEnd) onEnd();
    if (onError) onError('Voice playback error');
  }
}

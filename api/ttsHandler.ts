export async function processTtsRequest(reqText: string): Promise<{ buffer: Buffer; contentType: string }> {
  const text = reqText.trim();
  if (!text) {
    throw new Error('Text parameter is required');
  }

  // Optional server-side API key (NEVER expose to client / no VITE_ prefix)
  const apiKey = process.env.TTS_API_KEY || process.env.GOOGLE_TTS_API_KEY || process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const gttsRes = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: 'ml-IN', ssmlGender: 'MALE' },
          audioConfig: { audioEncoding: 'MP3', speakingRate: 0.90, pitch: 1.2 },
        }),
      });

      if (gttsRes.ok) {
        const data: any = await gttsRes.json();
        if (data.audioContent) {
          const audioBuffer = Buffer.from(data.audioContent, 'base64');
          return { buffer: audioBuffer, contentType: 'audio/mpeg' };
        }
      }
    } catch (e) {
      console.warn('Google Cloud TTS API error, falling back to Translate proxy:', e);
    }
  }

  // Reliable Google Translate Malayalam TTS Endpoint Proxy
  const translateUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=ml&client=tw-ob`;
  const ttsRes = await fetch(translateUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!ttsRes.ok) {
    throw new Error(`TTS provider returned status ${ttsRes.status}`);
  }

  const arrayBuffer = await ttsRes.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), contentType: 'audio/mpeg' };
}

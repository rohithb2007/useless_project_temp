import type { IncomingMessage, ServerResponse } from 'http';
import { processTtsRequest } from './ttsHandler';

export default async function handler(req: IncomingMessage & { body?: any }, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    let text = '';

    if (req.method === 'POST') {
      let bodyData = '';
      if (req.body && typeof req.body === 'object') {
        text = req.body.text || '';
      } else if (req.body && typeof req.body === 'string') {
        try {
          text = JSON.parse(req.body).text || '';
        } catch {
          text = req.body;
        }
      } else {
        await new Promise<void>((resolve) => {
          req.on('data', (chunk) => {
            bodyData += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(bodyData);
              text = parsed.text || '';
            } catch {
              text = bodyData;
            }
            resolve();
          });
        });
      }
    } else if (req.method === 'GET') {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      text = url.searchParams.get('text') || '';
    }

    if (!text) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Text parameter required' }));
      return;
    }

    const { buffer, contentType } = await processTtsRequest(text);
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length.toString());
    res.end(buffer);
  } catch (error: any) {
    console.error('Error in /api/tts endpoint:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error?.message || 'TTS generation failed' }));
  }
}

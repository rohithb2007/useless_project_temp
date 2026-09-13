import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { processTtsRequest } from './api/ttsHandler';

function ttsApiPlugin(): Plugin {
  return {
    name: 'tts-api-middleware',
    configureServer(server) {
      server.middlewares.use('/api/tts', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        try {
          let text = '';
          if (req.method === 'POST') {
            let bodyData = '';
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
          console.error('Local Vite /api/tts error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error?.message || 'TTS generation failed' }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ttsApiPlugin(),
  ],
  server: {
    host: true,
    port: 3000,
  },
});


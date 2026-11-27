import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type Request, type Response } from 'express';
import { translateDocumentRequest } from './server/translateService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.post(/\/api\/translate\/?$/, async (req: Request, res: Response) => {
    const result = await translateDocumentRequest({
      apiKey: process.env.GEMINI_API_KEY,
      body: req.body,
    });

    if (result.ok) {
      res.status(result.status).json(result.data);
    } else {
      res.status(result.status).json({
        error: result.error,
        code: result.code,
      });
    }
  });

  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const hmrDisabled = process.env.DISABLE_HMR === 'true';

    if (hmrDisabled) {
      app.get('/@vite/client', (_req: Request, res: Response) => {
        res.type('application/javascript');
        res.send(`
const sheetsMap = new Map();
const linkSheetsMap = new Map();
let lastInsertedStyle;
export class ErrorOverlay {}
export function updateStyle(id, content) {
  if (linkSheetsMap.has(id)) return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    if (!lastInsertedStyle) {
      document.head.appendChild(style);
      setTimeout(() => { lastInsertedStyle = undefined; }, 0);
    } else {
      lastInsertedStyle.insertAdjacentElement('afterend', style);
    }
    lastInsertedStyle = style;
  } else {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  const noop = () => {};
  return { data: {}, accept: noop, prune: noop, dispose: noop, decline: noop, invalidate: noop, on: noop, off: noop, send: noop };
}
export function injectQuery(url, queryToInject) {
  if (url[0] !== '.' && url[0] !== '/') return url;
  const pathname = url.replace(/[?#].*$/, '');
  const { search, hash } = new URL(url, 'http://vite.dev');
  return \`\${pathname}?\${queryToInject}\${search ? '&' + search.slice(1) : ''}\${hash || ''}\`;
}
`);
      });
    }

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: !hmrDisabled,
        ...(hmrDisabled ? { ws: false as const } : {}),
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EasyDoc server listening on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

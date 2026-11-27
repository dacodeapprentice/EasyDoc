import type { IncomingMessage, ServerResponse } from 'node:http';
import { translateDocumentRequest } from '../server/translateService.ts';

const MAX_BODY_BYTES = 5 * 1024 * 1024;

interface VercelCompatibleRequest extends IncomingMessage {
  body?: unknown;
}

interface VercelCompatibleResponse extends ServerResponse {
  status?: (statusCode: number) => VercelCompatibleResponse;
  json?: (body: unknown) => void;
}

function sendJson(res: VercelCompatibleResponse, statusCode: number, payload: unknown): void {
  if (typeof res.status === 'function') {
    const statusRes = res.status(statusCode);
    if (typeof statusRes?.json === 'function') {
      statusRes.json(payload);
      return;
    }
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function readRawBody(req: VercelCompatibleRequest): Promise<unknown> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      return req.body.trim() ? JSON.parse(req.body) : {};
    }
    if (Buffer.isBuffer(req.body)) {
      const text = req.body.toString('utf8').trim();
      return text ? JSON.parse(text) : {};
    }
    return req.body;
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    req.on('data', (chunk: Buffer | string) => {
      const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      totalBytes += buf.length;
      if (totalBytes > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Request body too large.'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(buf);
    });

    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(Object.assign(new Error('Invalid JSON body.'), { statusCode: 400 }));
      }
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

export default async function handler(
  req: VercelCompatibleRequest,
  res: VercelCompatibleResponse
): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    sendJson(res, 405, {
      error: 'Method not allowed. Use POST.',
      code: 'METHOD_NOT_ALLOWED',
    });
    return;
  }

  let parsedBody: unknown;
  try {
    parsedBody = await readRawBody(req);
  } catch (err: any) {
    const statusCode = err?.statusCode === 413 ? 413 : 400;
    sendJson(res, statusCode, {
      error: err?.message || 'Invalid JSON request body.',
      code: statusCode === 413 ? 'PAYLOAD_TOO_LARGE' : 'INVALID_JSON',
    });
    return;
  }

  const result = await translateDocumentRequest({
    apiKey: process.env.GEMINI_API_KEY,
    body: parsedBody,
  });

  if (result.ok) {
    sendJson(res, result.status, result.data);
  } else {
    sendJson(res, result.status, {
      error: result.error,
      code: result.code,
    });
  }
}

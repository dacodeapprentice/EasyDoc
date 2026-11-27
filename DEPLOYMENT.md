# Deploying EasyDoc on Vercel

EasyDoc builds into a static Vite frontend (`dist/`) paired with a Node.js serverless function at `api/translate.ts` for document translation.

## Environment Variables

Set the following variable in your Vercel project (**Settings → Environment Variables**) for Production, Preview, and Development:

| Variable | Required | Scope | Description |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Yes (for translation) | Server-only | Google Gemini API key used by `api/translate.ts` and `server.ts`. Never prefix this with `VITE_`. |

> **Local development:** Copy `.env.example` to `.env` and set `GEMINI_API_KEY` there when running locally. Never commit `.env`.

## Deploy Steps (Vercel)

### Option A: Vercel Dashboard (Git)
1. Push this repository to GitHub, GitLab, or Bitbucket.
2. In the [Vercel Dashboard](https://vercel.com/new), import the repository.
3. Verify the build settings (Vercel detects Vite automatically):
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Open **Environment Variables** and add `GEMINI_API_KEY` with your Gemini API key.
5. Click **Deploy**. Vercel serves the static bundle from `dist/` and automatically mounts `api/translate.ts` at `/api/translate`.

### Option B: Vercel CLI
1. Install the CLI if needed: `npm i -g vercel`
2. Link and configure environment variables:
   ```bash
   vercel env add GEMINI_API_KEY
   ```
3. Deploy to production:
   ```bash
   vercel --prod
   ```

## Local Development
- **Full-stack Express + Vite server (AI Studio / local):**
  ```bash
  npm run dev
  ```
- **Production Express build test:**
  ```bash
  npm run build && NODE_ENV=production npm start
  ```

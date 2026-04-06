# Docupex — Deployment Guide

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Build Commands](#build-commands)
- [Vercel Deployment](#vercel-deployment)
  - [One-Click Deploy](#one-click-deploy)
  - [Vercel CLI Deploy](#vercel-cli-deploy)
  - [SPA Configuration](#spa-configuration)
- [Static Site Hosting](#static-site-hosting)
  - [Netlify](#netlify)
  - [GitHub Pages](#github-pages)
  - [Nginx](#nginx)
  - [Apache](#apache)
- [CI/CD with GitHub Actions](#cicd-with-github-actions)
- [Production Checklist](#production-checklist)
- [Troubleshooting](#troubleshooting)

---

## Overview

Docupex is a client-side React single-page application (SPA) built with Vite. It produces a static `dist/` folder that can be deployed to any static hosting provider. There is no backend server — all data is stored in the browser's `localStorage`.

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x (or equivalent pnpm/yarn)
- A hosting provider account (Vercel, Netlify, GitHub Pages, etc.)

## Environment Variables

Docupex uses Vite environment variables prefixed with `VITE_`. These are embedded at **build time** and cannot be changed after the build without rebuilding.

| Variable                  | Description                                      | Default    |
| ------------------------- | ------------------------------------------------ | ---------- |
| `VITE_APP_TITLE`          | Application title shown in the header and tab    | `Docupex`  |
| `VITE_MAX_FILE_SIZE_MB`   | Maximum allowed upload file size in megabytes     | `5`        |
| `VITE_MAX_HISTORY_ENTRIES` | Maximum document entries retained in history     | `50`       |

Copy `.env.example` to `.env` (or `.env.local`) and adjust values as needed:

```bash
cp .env.example .env
```

On Vercel and other hosting platforms, set these variables in the project's environment settings dashboard. They will be injected during the build step.

## Build Commands

| Command           | Description                                      |
| ----------------- | ------------------------------------------------ |
| `npm install`     | Install all dependencies                         |
| `npm run dev`     | Start the local development server on port 5173  |
| `npm run build`   | Type-check with `tsc` and produce `dist/` output |
| `npm run preview` | Preview the production build locally             |
| `npm test`        | Run the test suite with Vitest                   |

### Building for Production

```bash
npm install
npm run build
```

This runs `tsc && vite build`, which:

1. Performs a full TypeScript type check.
2. Bundles the application into the `dist/` directory with optimized, hashed assets.
3. Generates source maps for debugging.

The output in `dist/` is a fully self-contained static site ready for deployment.

## Vercel Deployment

Vercel is the recommended hosting platform for Docupex. It provides zero-configuration deployments for Vite projects.

### One-Click Deploy

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new) and import your repository.
3. Vercel auto-detects the Vite framework. Confirm the following settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Add environment variables (`VITE_APP_TITLE`, `VITE_MAX_FILE_SIZE_MB`, `VITE_MAX_HISTORY_ENTRIES`) in the **Environment Variables** section.
5. Click **Deploy**.

Every push to the main branch triggers an automatic production deployment. Pull requests receive preview deployments with unique URLs.

### Vercel CLI Deploy

Install the Vercel CLI and deploy from your terminal:

```bash
npm i -g vercel

# First-time setup — links to your Vercel project
vercel

# Deploy to production
vercel --prod
```

### SPA Configuration

Docupex uses client-side routing with React Router. All routes must resolve to `index.html` so the React router can handle them. The included `vercel.json` handles this:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures that direct navigation to routes like `/dashboard`, `/upload`, or `/documents/abc-123` returns the SPA shell instead of a 404.

## Static Site Hosting

Since Docupex is a static SPA, it can be hosted on any static file server. The key requirement is configuring a **fallback to `index.html`** for all routes so client-side routing works correctly.

### Netlify

Create a `netlify.toml` in the project root (not included by default):

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Alternatively, create a `dist/_redirects` file:

```
/*    /index.html   200
```

### GitHub Pages

GitHub Pages does not natively support SPA fallback routing. Use one of these workarounds:

1. **404.html trick:** Copy `dist/index.html` to `dist/404.html` after building. GitHub Pages serves `404.html` for unknown routes, which loads the SPA.

   ```bash
   npm run build
   cp dist/index.html dist/404.html
   ```

2. **Hash routing:** Switch React Router to `HashRouter` instead of `BrowserRouter`. This avoids the fallback issue entirely but changes URLs to `/#/dashboard` format.

Set the `base` option in `vite.config.ts` if deploying to a subpath:

```ts
export default defineConfig({
  base: '/your-repo-name/',
  // ...
});
```

### Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/docupex/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Apache

Create a `.htaccess` file in the `dist/` directory:

```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## CI/CD with GitHub Actions

Below is a recommended GitHub Actions workflow for automated testing and deployment to Vercel.

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Lint, Type Check & Test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx tsc --noEmit

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
        env:
          VITE_APP_TITLE: Docupex
          VITE_MAX_FILE_SIZE_MB: "10"
          VITE_MAX_HISTORY_ENTRIES: "50"

  deploy:
    name: Deploy to Vercel
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install Vercel CLI
        run: npm i -g vercel

      - name: Pull Vercel environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build with Vercel
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### Required GitHub Secrets

| Secret          | Description                                                        |
| --------------- | ------------------------------------------------------------------ |
| `VERCEL_TOKEN`  | Personal access token from [vercel.com/account/tokens](https://vercel.com/account/tokens) |

Vercel also requires a `.vercel/project.json` linking your repo to a Vercel project. Run `vercel link` locally to generate it, then commit the `.vercel` directory (it contains only project metadata, no secrets).

### Alternative: Vercel GitHub Integration

Instead of the manual GitHub Actions deploy job, you can use Vercel's built-in GitHub integration:

1. Connect your GitHub repository in the Vercel dashboard.
2. Vercel automatically deploys on every push to `main` and creates preview deployments for pull requests.
3. Keep the `test` job in GitHub Actions for CI validation, and let Vercel handle deployment independently.

This is the simplest approach and is recommended for most teams.

## Production Checklist

- [ ] Environment variables are set in the hosting provider dashboard.
- [ ] `npm run build` completes without TypeScript or build errors.
- [ ] `npm test` passes all test suites.
- [ ] SPA fallback routing is configured (verified by navigating directly to `/dashboard`).
- [ ] Assets are served with appropriate cache headers (Vite adds content hashes to filenames).
- [ ] The application loads correctly in the target browsers (Chrome, Firefox, Safari, Edge).
- [ ] File upload and text extraction work end-to-end in the deployed environment.
- [ ] `localStorage` is available and not blocked by browser privacy settings.

## Troubleshooting

### Blank page after deployment

- Verify the SPA rewrite/redirect rules are in place. Direct navigation to any route other than `/` must serve `index.html`.
- Check the browser console for 404 errors on JavaScript or CSS assets.
- If deploying to a subpath, ensure `base` is set correctly in `vite.config.ts`.

### Environment variables not applied

- Vite environment variables are embedded at build time. Changing them in the hosting dashboard requires a **rebuild and redeploy**.
- Ensure variables are prefixed with `VITE_`. Variables without this prefix are not exposed to client-side code.

### PDF extraction fails in production

- `pdfjs-dist` requires its worker file. Vite bundles this automatically, but verify the worker chunk is present in `dist/assets/`.
- Check the browser console for worker-related errors.

### localStorage quota exceeded

- Docupex stores all document data in `localStorage`, which is typically limited to 5–10 MB.
- The `DocumentRepository` enforces a maximum of `VITE_MAX_HISTORY_ENTRIES` documents per user and attempts to recover from quota errors by pruning old entries.
- For heavy usage, consider reducing `VITE_MAX_HISTORY_ENTRIES` or clearing history periodically.

### Build fails with TypeScript errors

- Run `npx tsc --noEmit` locally to see the full error output.
- Ensure all dependencies are installed: `rm -rf node_modules && npm install`.
- Verify you are using Node.js >= 18 and npm >= 9.
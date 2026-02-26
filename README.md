# some random granola moments

Static one-page site for a Granola application, built with plain HTML/CSS/JS.

## Local preview

```bash
python3 -m http.server 8787
```

Open `http://localhost:8787`.

## Deploy on Vercel

### Option 1: Import GitHub repo (recommended)

1. Push this repo to GitHub.
2. In Vercel, click **Add New...** > **Project**.
3. Import this GitHub repo.
4. Keep defaults (no build command needed for this static site).
5. Click **Deploy**.

### Option 2: Vercel CLI

```bash
npm i -g vercel
vercel
```

Then promote to production when ready:

```bash
vercel --prod
```

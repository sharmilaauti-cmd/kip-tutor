# Kip — your AI tutor

A patient AI tutor for Maths, English and Science, built for every kind of learner — including students with dyslexia, ADHD, autism and EAL needs.

Your Anthropic API key now lives **only on the server**, inside a Netlify serverless function. It is never sent to, or visible from, anyone's browser — safe to share your live link publicly.

## What's in this folder

```
kip-app/
  index.html                    the app itself (UI + logic)
  manifest.json                 PWA manifest — makes "Add to Home Screen" work
  sw.js                         service worker — offline app shell + installability
  netlify.toml                  tells Netlify where the function lives
  netlify/functions/chat.js     the serverless function that holds your API key
  icons/                        app icons (192px, 512px, favicon, apple touch icon)
  README.md                     this file
```

## Important — deployment method has changed

Because Kip now includes a serverless function, **the old drag-and-drop Netlify Drop no longer works** — that tool only publishes static files, not functions. You need one of the two methods below instead. Both are still free and beginner-friendly.

## Method A — Netlify CLI (recommended, no GitHub needed)

1. Install Node.js if you don't have it: nodejs.org (choose the LTS version)
2. Install the Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```
3. From inside the `kip-app` folder, log in and deploy:
   ```bash
   cd kip-app
   netlify login
   netlify init
   ```
   Choose "Create & configure a new site" and follow the prompts.
4. Add your API key as a secret environment variable (this is the step that keeps it hidden):
   ```bash
   netlify env:set ANTHROPIC_API_KEY sk-ant-your-real-key-here
   ```
5. Deploy it live:
   ```bash
   netlify deploy --prod
   ```
   You'll get a real public link, e.g. `kip-tutor.netlify.app`.

## Method B — GitHub + Netlify (better for ongoing updates)

1. Push the `kip-app` folder to a new GitHub repository
2. Go to app.netlify.com → "Add new site" → "Import an existing project" → connect your GitHub repo
3. Netlify will auto-detect `netlify.toml` and the functions folder
4. Go to Site settings → Environment variables → add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your real key from console.anthropic.com
5. Deploy. Every future `git push` will automatically redeploy Kip.

## Testing locally before you deploy

```bash
cd kip-app
netlify dev
```

This runs both the app and the serverless function on your computer at `http://localhost:8888`, using a `.env` file for your key. Create a file called `.env` in the `kip-app` folder with:

```
ANTHROPIC_API_KEY=sk-ant-your-real-key-here
```

**Never commit `.env` to GitHub.** If you use Method B, add a `.gitignore` file containing the line `.env` before pushing.

## Cost protection already built in

Two layers of protection are already in place, so a bad actor (or a bug) can't rack up a huge Anthropic bill before you notice:

1. **Per-message limits** — the function rejects unusually long single messages or very long conversations.
2. **Daily limit per visitor** — each visitor can ask Kip up to **50 questions per day** (change this number in `netlify/functions/chat.js` by editing `DAILY_LIMIT`). This uses Netlify's built-in storage (Netlify Blobs) to count questions per visitor's IP address — no extra sign-up, no extra service, and it's included in Netlify's free tier.

A visitor is identified by their IP address. This isn't perfect — everyone on the same school or office WiFi shares one count — but it's a solid, privacy-friendly first line of defence that needs no login system. The count resets at midnight UTC every day.

As you grow past this stage, consider adding real user accounts so limits are per-person rather than per-network, and proper analytics so you can see usage patterns.

## Testing "Add to Home Screen"

Once deployed live (https://):
- **Android (Chrome):** open the link, tap the install banner, or menu → "Add to Home screen"
- **iPhone (Safari):** open the link, tap the Share icon, then "Add to Home Screen"
- Kip then appears as a home screen icon, opening fullscreen with no browser bar

## Adding a custom domain (optional)

Buy a domain (e.g. `kiptutor.co.uk`) on Namecheap or GoDaddy for about £10–15/year, then in Netlify go to Site settings → Domain management → add your domain.

## Icons

Generated as simple flat "K" marks in teal (#0D7A64) on cream. Swap `icons/icon-192.png` and `icons/icon-512.png` for a designed logo later if you like — keep the same filenames, or update `manifest.json` and the `<link>` tags in `index.html` to match new ones.

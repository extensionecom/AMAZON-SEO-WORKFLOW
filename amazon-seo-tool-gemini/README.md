# Amazon SEO Listing Tool — Extension eCom

7-step AI-powered Amazon listing optimization tool. Built with Next.js + Anthropic Claude.

---

## Deploy to Vercel (5 minutes)

### 1. Get your Anthropic API key
Go to https://console.anthropic.com → API Keys → Create Key

### 2. Upload to GitHub
Create a new private GitHub repo and push this project folder.

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/amazon-seo-tool.git
git push -u origin main
```

### 3. Deploy on Vercel
1. Go to https://vercel.com → New Project
2. Import your GitHub repo
3. Under **Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = your key from step 1
4. Click Deploy

That's it — your tool will be live at `https://your-project.vercel.app`

---

## Local Development

```bash
npm install
cp .env.example .env.local
# Add your API key to .env.local
npm run dev
```

Open http://localhost:3000

---

## The Flow

| Step | What it does |
|------|-------------|
| 1 | Product intake — all inputs collected |
| 2 | Review analysis — buyer insights, customer language |
| 3 | USP identification — 5 validated USPs |
| 4 | Keyword gap analysis — sorted by SV, covered vs targets |
| 5 | Bullet points — 5 bullets, 300-350 chars, compliance checked |
| 6 | Description + RUFUS Q&A — 1,000-1,500 chars |
| 7 | Title — 190-200 chars, word repeat check |
| 8 | Final output — all copy ready to copy-paste |

---

## Compliance Checks (run automatically)

- Prohibited word scan (substring match)
- Character count validation per field
- Product-as-subject enforcement
- No invented claims
- Keyword scorecard (new listing must beat old)
- Title word repetition check (max 2x per word)

---

## Customization

To update the prohibited word list or add rules, edit `/pages/api/generate.js` — the `PROHIBITED_SCAN_INSTRUCTION` constant at the top.

To change branding colors, edit `/styles/globals.css` — the `:root` CSS variables block.

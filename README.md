# care pAIr

**Trustworthy caregivers. Loving families. Paired by AI.**

AI-powered childcare matching tool for Pittsburgh families and caregivers.

---

## Quick Start (run locally on your computer)

1. Make sure you have [Node.js](https://nodejs.org/) installed (version 18 or newer)
2. Open your terminal and navigate to this folder
3. Install dependencies:

```bash
npm install
```

4. Start the app:

```bash
npm run dev
```

5. Open your browser to **http://localhost:3000** — you'll see the matcher!

---

## Deploy to Vercel (make it live on the internet)

### Step 1: Push to GitHub
1. Create a free account at [github.com](https://github.com)
2. Create a new repository called `care-pair`
3. In your terminal, from this folder, run:

```bash
git init
git add .
git commit -m "Initial commit - care pAIr matching tool"
git remote add origin https://github.com/YOUR_USERNAME/care-pair.git
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Sign up at [vercel.com](https://vercel.com) (you can sign in with your GitHub account)
2. Click **"Add New Project"**
3. Import your `care-pair` repository
4. Vercel will auto-detect Next.js — just click **Deploy**
5. You'll get a live URL like `care-pair.vercel.app`

### Step 3: Connect your domain (optional)
1. In Vercel dashboard, go to your project → Settings → Domains
2. Add your custom domain (you can also buy one through Vercel)
3. Vercel handles SSL/HTTPS automatically

---

## Making Changes (the workflow Sam described)

1. Open Claude Code and select this folder as your project
2. Create a new branch: `git checkout -b my-new-feature`
3. Make changes and test locally with `npm run dev`
4. When happy, push and create a pull request
5. Merge to `main` — Vercel auto-deploys!

---

## Project Structure

```
care-pair/
├── app/
│   ├── globals.css      ← global styles + Tailwind + Google Fonts
│   ├── layout.js        ← root HTML layout with metadata
│   └── page.js          ← home page (renders the matcher)
├── components/
│   └── ChildcareMatcher.jsx  ← the full matching tool (your main code)
├── lib/                 ← future: database connections, API helpers
├── public/              ← future: logo images, favicon
├── package.json         ← dependencies and scripts
├── next.config.js       ← Next.js settings
├── tailwind.config.js   ← Tailwind CSS with care pAIr brand colors
├── postcss.config.js    ← PostCSS config for Tailwind
├── jsconfig.json        ← path aliases (@/ imports)
└── .gitignore           ← keeps node_modules etc. out of GitHub
```

---

## Future Additions

- **Database**: Replace localStorage with Supabase for persistent, multi-user data
- **Authentication**: Add login system so families/providers have their own accounts
- **API routes**: Add `app/api/` folder for server-side matching logic
- **Logo assets**: Add your logo PNG/SVG files to `public/`

---

Built with ❤️ in Pittsburgh by Carli Coyne

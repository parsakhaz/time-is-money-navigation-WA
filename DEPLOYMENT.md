# Deployment Guide - Time is Money Router

## What Was Implemented

✅ **GitHub Actions Daily Scraper** - `.github/workflows/scrape-tolls.yml`
✅ **Public OSRM Integration** - Updated `src/lib/osrm.ts` to use free public routing
✅ **Comprehensive README** - Full documentation with deployment instructions

## Quick Start: Deploy to Vercel

### Step 1: Push Your Code to GitHub

```bash
# Add all changes
git add .github/ README.md src/lib/osrm.ts DEPLOYMENT.md

# Commit
git commit -m "feat: add GitHub Actions scraper and Vercel deployment support"

# Push to GitHub
git push origin main
```

### Step 2: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign up (free)

2. **Click "New Project"**

3. **Import your GitHub repository:**
   - Select `time-is-money-navigation-WA` from your repos
   - Vercel auto-detects it's a Next.js project
   - Click "Deploy"

4. **Wait ~2 minutes** for build to complete

5. **Get your live URL!** (e.g., `https://time-is-money-navigation-wa.vercel.app`)

### Step 3: Enable GitHub Actions

1. **Go to your GitHub repo** → Settings → Actions → General

2. **Workflow permissions:**
   - Select "Read and write permissions"
   - Check "Allow GitHub Actions to create and approve pull requests"
   - Click "Save"

3. **Test the scraper (optional):**
   - Go to Actions tab
   - Select "Daily Toll Data Scraper"
   - Click "Run workflow" → "Run workflow"
   - Watch it run and commit updated toll data

### Step 4: Celebrate! 🎉

Your app is now:
- ✅ Live on Vercel with a public URL
- ✅ Auto-deploying on every git push
- ✅ Auto-updating toll data daily at 3 AM PT
- ✅ Using free tier services (zero cost!)

## How It Works

### Daily Automation Flow

```
3 AM PT (11 AM UTC) every day
    ↓
GitHub Actions triggers
    ↓
Scrapes WSDOT toll pages
    ↓
Updates src/data/wa-tolls.json
    ↓
Commits to main branch (if changed)
    ↓
Vercel detects git push
    ↓
Auto-deploys updated site
    ↓
Users see fresh toll data!
```

### Architecture

**Frontend (Vercel):**
- Next.js app with React components
- Interactive Leaflet maps
- Responsive mobile design

**API Routes (Vercel Serverless):**
- `/api/route` - Calculate toll vs. free routes
- `/api/geocode` - Convert addresses to coordinates

**External Services (Free):**
- OSRM (`router.project-osrm.org`) - Routing engine
- Nominatim (OpenStreetMap) - Geocoding
- WSDOT - Toll rate data source

**Automation (GitHub Actions):**
- Daily scraper workflow
- Auto-commits updated data
- Triggers Vercel redeployment

## Environment Variables (Optional)

If you want to use a different OSRM server:

1. In Vercel dashboard → Project Settings → Environment Variables
2. Add:
   - **Name:** `OSRM_URL`
   - **Value:** `https://your-custom-osrm-server.com`
3. Redeploy

By default, it uses the public OSRM server, so this is optional.

## Local Development

```bash
# Use public OSRM (default)
npm run dev

# Use local Docker OSRM
npm run setup:osrm
export OSRM_URL=http://localhost:5000
npm run dev
```

## Updating Your Live Site

Just push to GitHub:

```bash
git add .
git commit -m "your changes"
git push origin main
```

Vercel automatically deploys in ~2 minutes!

## For Your Class Project

### What to Submit

1. **Live URL** from Vercel (e.g., `https://your-project.vercel.app`)
2. **GitHub Repository** URL
3. **Project Report** mentioning:
   - Web scraping automation (GitHub Actions)
   - CI/CD pipeline (auto-deployment)
   - Full-stack Next.js architecture
   - External API integration (OSRM, Nominatim)
   - Responsive design

### Demo Tips

- Show the interactive map
- Change hourly wage to see recommendation change
- Compare different routes (Seattle to Bellevue, Tacoma to Gig Harbor)
- Show the GitHub Actions workflow running
- Show toll data auto-updating in `src/data/wa-tolls.json`

### Technical Highlights

**Web Scraping:**
- Automated with GitHub Actions
- Parses WSDOT HTML pages using Cheerio
- Handles 6 different toll facility formats
- Runs daily at 3 AM PT

**CI/CD:**
- GitHub Actions workflow
- Automated testing and deployment
- Version control integration
- Zero-downtime deployments

**Full-Stack:**
- Next.js 16 App Router
- Server-side API routes
- Client-side React components
- TypeScript throughout

**APIs Used:**
- OSRM for routing calculations
- Nominatim for geocoding
- Custom toll rate API

## Troubleshooting

**Vercel deployment fails?**
- Check build logs in Vercel dashboard
- Ensure `npm run build` works locally
- Verify all dependencies are in `package.json`

**GitHub Action fails?**
- Check Actions tab for error logs
- Verify workflow permissions are enabled
- Test scraper locally: `npm run scrape:tolls`

**Routes not working?**
- Verify OSRM server is accessible
- Check browser console for API errors
- Ensure coordinates are in Washington State

**Toll data not updating?**
- Check GitHub Actions ran successfully
- Verify workflow has write permissions
- Check if toll rates actually changed (action only commits if data changed)

## Cost Breakdown

- **Vercel Hosting**: FREE (Hobby tier)
- **OSRM Routing**: FREE (public server)
- **Nominatim Geocoding**: FREE (OpenStreetMap)
- **GitHub Actions**: FREE (2,000 minutes/month)
- **Total**: $0.00/month 🎉

Perfect for student projects!

## Next Steps (Optional Enhancements)

- Add more toll facilities (I-90, future tolls)
- Add historical toll rate tracking
- Add traffic data integration
- Deploy your own OSRM server for better performance
- Add user accounts to save favorite routes
- Add mobile app (React Native)

---

**Questions?** Check the main README.md or create a GitHub issue.

**Enjoy your automated, auto-deploying toll route comparison app!** 🚗💨

# Time is Money Router - Washington State

A route comparison tool that helps drivers decide if toll roads are worth it based on their hourly wage.

## Live Demo
🌐 Coming soon - Deploy to Vercel to get your live URL!

## Features
- 🗺️ Compare toll vs. free routes in Washington State
- ⏱️ Calculate time savings vs. toll cost
- 💰 Get personalized recommendations based on your hourly wage
- 🔄 Always up-to-date toll rates (auto-updated daily via GitHub Actions)
- 📱 Mobile-responsive design with interactive maps

## Data Sources

Toll data is automatically scraped daily from WSDOT official pages:
- SR 520 Bridge (Evergreen Point Floating Bridge)
- Tacoma Narrows Bridge
- SR 99 Tunnel (Alaskan Way Viaduct Replacement)
- I-405 Express Toll Lanes
- SR 167 Express Toll Lanes
- SR 509 Expressway

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Mapping**: Leaflet, React-Leaflet
- **Routing**: OSRM (Open Source Routing Machine)
- **Geocoding**: OpenStreetMap Nominatim
- **Web Scraping**: Cheerio
- **Hosting**: Vercel (recommended)
- **Automation**: GitHub Actions (daily toll scraping)

## Getting Started

### Running Locally

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Using Local OSRM (Optional)

For development, you can use the included Docker setup for offline routing:

```bash
# Start local OSRM server
npm run setup:osrm

# Set environment variable to use local OSRM
export OSRM_URL=http://localhost:5000
npm run dev
```

By default, the app uses the public OSRM server at `https://router.project-osrm.org`.

## Deployment

### Deploy to Vercel (Recommended)

1. **Sign up at [vercel.com](https://vercel.com)** (free for hobby projects)

2. **Connect your GitHub repository:**
   - Click "New Project"
   - Import your Git repository
   - Vercel will auto-detect Next.js settings

3. **Configure (optional):**
   - Add environment variable if using custom OSRM:
     - Name: `OSRM_URL`
     - Value: `https://router.project-osrm.org` (or your custom OSRM server)

4. **Deploy!**
   - Click "Deploy"
   - Vercel will build and deploy your app
   - Get a live URL like `https://your-project.vercel.app`

### Automatic Updates

The project includes a GitHub Action that:
- Runs daily at 3 AM PT (11 AM UTC)
- Scrapes latest toll rates from WSDOT
- Commits updated data if changed
- Triggers automatic Vercel redeployment

**To enable:**
1. Go to your GitHub repository → Settings → Actions → General
2. Set Workflow permissions to "Read and write permissions"
3. Save changes

The toll data will now stay up-to-date automatically!

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run scrape:tolls # Manually scrape toll data
npm run setup:osrm   # Set up local OSRM Docker container
npm run osrm:start   # Start OSRM container
npm run osrm:stop    # Stop OSRM container
```

## Project Structure

```
├── .github/workflows/     # GitHub Actions (daily scraper)
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API routes (routing, geocoding)
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   ├── data/            # Static data (toll rates)
│   ├── lib/             # Utility functions
│   └── hooks/           # Custom React hooks
├── scripts/             # Build and scraping scripts
│   ├── scrape-tolls.ts  # Toll data scraper
│   └── lib/parsers/     # WSDOT page parsers
└── docker/              # Local OSRM setup
```

## How It Works

1. **User Input**: Enter starting point and destination in Washington State
2. **Route Calculation**: App requests both toll and toll-free routes from OSRM
3. **Toll Detection**: Routes are analyzed against WSDOT toll facility coordinates
4. **Cost Analysis**: Calculate time savings vs. toll cost based on user's hourly wage
5. **Recommendation**: Get a data-driven recommendation on which route to take

## Class Project Information

This project demonstrates:
- ✅ **Web Scraping**: Automated data collection from public sources
- ✅ **CI/CD Automation**: GitHub Actions for scheduled tasks
- ✅ **Full-Stack Development**: Next.js with API routes and client-side rendering
- ✅ **Real-Time Data Visualization**: Interactive maps with Leaflet
- ✅ **Responsive Design**: Mobile-first UI with Tailwind CSS
- ✅ **External API Integration**: OSRM routing and Nominatim geocoding
- ✅ **Modern React Patterns**: Hooks, client components, and server actions

## Contributing

Feel free to submit issues and pull requests!

## License

MIT License - feel free to use this for your own projects or class assignments.

## Acknowledgments

- [WSDOT](https://wsdot.wa.gov/) for public toll rate data
- [OSRM](http://project-osrm.org/) for routing engine
- [OpenStreetMap](https://www.openstreetmap.org/) for map data and geocoding
- [Vercel](https://vercel.com/) for hosting platform

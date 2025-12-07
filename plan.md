This is a Product Requirements Document (PRD) designed for a junior developer or intern. It breaks down the project into specific, manageable phases using the exact methodology from the video, adapted for the specific geography and toll logic of Washington State.

***

# PRD: The "Time is Money" Router (Washington State Edition)

## 1. Executive Summary
**Objective:** Build a web-based navigation application for Washington State that calculates the optimal driving route based on a user’s **hourly wage**. The app will determine if a toll road (SR 520, Tacoma Narrows, I-405, SR 167) is worth the cost by converting the toll price into "labor time" and adding it to the travel time.

**Core Logic:** `Total Weight = Driving Time + (Toll Price / User Hourly Wage)`

**Target Audience:** Commuters in the Seattle-Tacoma metro area who want to know if saving 10 minutes is worth paying $5.00.

## 2. Tech Stack & Tools
*   **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS.
*   **Map Visualization:** React-Leaflet (or MapLibre GL JS).
*   **Routing Engine:** OSRM (Open Source Routing Machine) running via Docker.
*   **Data Sources:** OpenStreetMap (Geofabrik), WSDOT Toll Rates.
*   **Scripting:** Python or Node.js (for scraping and data processing).

---

## 3. Architecture Overview
1.  **Data Layer:** Detailed OSM map data of Washington + Scraped Toll Pricing.
2.  **Routing Layer:** A Dockerized OSRM instance loaded with Washington map data. It will utilize the "Traffic Update" feature to inject toll costs as "time delays."
3.  **Application Layer:** A Next.js app where the user inputs their wage. The app calculates the "penalty" for tolls on the fly or pre-processes common scenarios.

---

## Phase 1: Data Acquisition (The Map)
**Goal:** Get the raw map data running locally.

1.  **Download Map Data:**
    *   Source: [Geofabrik - Washington](https://download.geofabrik.de/north-america/us/washington.html)
    *   File needed: `washington-latest.osm.pbf` (~400MB).
2.  **Set up OSRM (Docker):**
    *   Create a project folder.
    *   Run the OSRM backend using the standard `car.lua` profile.
    *   **Task:** Successfully route a trip from Seattle to Spokane using `curl` or the browser.

---

## Phase 2: Toll Data Scraping & Mapping (The "Washington" Context)
**Goal:** Identify where the tolls are and how much they cost. Unlike France, WA has fewer, specific toll points, but they have variable pricing (Dynamic/Time-of-Day).

### Step 2.1: Identify Toll Nodes (Manual Mapping)
Since Washington doesn't have thousands of toll booths like France, do not use the "Fortress Algorithm" from the video. Instead, manually identify the OpenStreetMap **Node IDs** for the gantries.
*   **Tools:** Use [OpenStreetMap.org](https://www.openstreetmap.org/) (Query Features) or JOSM.
*   **Targets:**
    *   **SR 520 Bridge:** Find the node ID on the floating bridge segment.
    *   **Tacoma Narrows Bridge:** Find the node ID on the Eastbound lanes (Westbound is free).
    *   **SR 99 Tunnel:** Find the node IDs at the entrances/exits.
    *   **I-405 & SR 167 (HOT Lanes):** These are trickier. They are usually marked as separate "ways" in OSM. Find the `way_id` for the express lanes.

### Step 2.2: Scrape WSDOT Pricing
Create a script (`scraper.ts`) to fetch current rates.
*   **Source:** [WSDOT Toll Rates](https://wsdot.wa.gov/travel/roads-bridges/toll-roads-bridges-tunnels).
*   **Complexity Handling:**
    *   *MVP Strategy:* Scrape the "Pay By Mail" rates (most expensive, worst-case scenario) for specific times of day (e.g., Peak Commute: 8 AM).
    *   *Format:* Output a JSON file:
    ```json
    [
      { "location": "SR520", "osm_node_id": 12345678, "cost": 6.30 },
      { "location": "TacomaNarrows", "osm_node_id": 87654321, "cost": 6.00 }
    ]
    ```

---

## Phase 3: The "Time is Money" Logic (The Backend)
**Goal:** Force OSRM to treat money as time.

### Step 3.1: The Conversion Algorithm
The video used a CSV file to update edge weights. We will generate this CSV dynamically or pre-generate varying versions (e.g., one for $15/hr, one for $50/hr).

**Formula:**
`Penalty_Seconds = (Toll_Cost / User_Hourly_Wage) * 3600`

*Example:*
*   Toll: $6.00
*   Wage: $20.00/hr
*   Math: ($6 / $20) * 3600 = **1,080 seconds** (18 minutes).
*   **Result:** The router will think the bridge takes 18 extra minutes to cross.

### Step 3.2: Generating the Traffic CSV
Create a script `generate_traffic.ts` that takes the User Wage as an input and outputs `traffic.csv`.

**CSV Format required by OSRM:**
`from_node, to_node, speed_reduction` (or strictly weight duration).
*Note: The video implies changing the weight. OSRM `speed_file` or `traffic_updates` updates the speed. Lower speed = higher weight.*

**Task:**
1.  Map the Node IDs from Phase 2.1 to the specific road segments (Ways).
2.  Set the speed on those segments to near-zero *conceptually*, effectively adding the calculated penalty seconds.
3.  *Alternative (Easier for MVP):* Use the OSRM HTTP API `exclude` classes or simple `speed` updates if supported in the Docker configuration.

**Crucial Video Implementation Note:**
The video author created a **custom** traffic file.
1.  Identify the start node and end node of the toll segment.
2.  Calculate the standard time to cross it.
3.  Add the `Penalty_Seconds`.
4.  Update the CSV with the new "Duration" for that segment.

---

## Phase 4: Frontend Development (Next.js)
**Goal:** A clean UI for the user.

### Step 4.1: UI Setup
*   **Input Fields:**
    *   Start Location (Use a geocoding API like Nominatim or Mapbox).
    *   End Location.
    *   **Hourly Wage Slider:** Range $15/hr to $200/hr.
*   **Toggles:** "Have Good To Go Pass?" (Reduces toll cost in calculation).

### Step 4.2: Map Integration
*   Use `react-leaflet`.
*   Draw the route polyline returned by your OSRM instance.
*   **Visual Flair:** Highlight toll segments in red.

### Step 4.3: API Route
Create a Next.js API route `/api/route`.
1.  Receives: `start`, `end`, `wage`.
2.  **The Hack:** Since we can't restart the Docker container for every user request, we have two options:
    *   *Option A (Video fidelity):* The video author pre-calculated the graph.
    *   *Option B (Web App Reality):* We utilize OSRM's `annotations=true` feature. Get the route *with* tolls.
        *   Get the standard fastest route.
        *   Get the "No Tolls" route.
        *   Perform the "Time is Money" math in JavaScript on the Next.js server to compare the two options and return the winner.
        *   *(Note: To strictly follow the video's method of graph manipulation requires running a custom OSRM instance where you can inject weights dynamically, or using the Multi-Level Dijkstra (MLD) algorithm with traffic updates. For an intern, **Option B** is safer: Request both routes, do the math, show the best one).*

**Wait, let's stick to the Video's methodology (Graph Weights):**
If we want to do exactly what the video did, we need to generate the graph *once* with traffic data.
*   *Revised Strategy:* We cannot easily regenerate the graph per user request.
*   *Compromise:* The intern will implement the logic on the Client/Server side comparison (Option B above). It achieves the same result without needing 10GB of RAM to rebuild graphs per request.

**Logic for Option B (The "Intern-Friendly" Wrapper):**
1.  Fetch Route A (Allow Tolls).
2.  Fetch Route B (Exclude Tolls).
3.  Calculate Real Cost of A: `(Time_A) + (Toll_Cost / Wage)`.
4.  Calculate Real Cost of B: `(Time_B)`.
5.  If `Real_Cost_A < Real_Cost_B`, recommend Toll Road. Else, recommend Free Road.

---

## Phase 5: Testing & Validation
1.  **The "Bill Gates" Test:** Set wage to $10,000/hr. The app should *always* take the 520 bridge if it's 1 minute faster.
2.  **The "Student" Test:** Set wage to $10/hr. The app should avoid the 520 bridge unless the drive around the lake is 1+ hour longer.
3.  **Accuracy:** Compare the toll prices in your app against the WSDOT website for the current time of day.

---

## Summary of Deliverables for Intern
1.  **JSON file** containing mapped Node IDs for all major WA toll bridges/lanes.
2.  **OSRM Docker instance** running locally with WA map data.
3.  **Next.js Application** with:
    *   Wage Input.
    *   Map display.
    *   Logic that compares Toll vs. Non-Toll routes based on the wage math.
4.  **Documentation** on how to update the toll prices (scraper script).
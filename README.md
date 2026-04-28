# MrBrunoP.github.io

Personal website and portfolio, including a dedicated athletics profile area with detailed results and progression charts.

## Project Overview

This repository contains a static website with sections such as photography, projects, blog pages, and athlete profile pages.

Main athlete pages:

- Athletics profile main page: AthleticsDB.html
- Athletics details page: AthleticsDB/AthleticsDetails.html

## Recent Athletics Details Features

The Athletics Details page currently includes:

- Tabbed navigation for Personal Bests, Results, and Progression
- Year filter for results
- Updated 2026 race entries
- Progression charts for:
	- 10K (Road)
	- Half Marathon
- Trend stats above each chart:
	- Best
	- Avg last 3
	- Since first
- Human-readable stat format (for example: 47m51s, 2h10m17s)
- Chart.js CDN fallback message if chart library fails to load
- Header quick links to athlete page and Strava profile

## Data Source Pattern

Progression charts and trend stats are built automatically from rows in the Results table in AthleticsDB/AthleticsDetails.html.

When adding new results:

1. Add the row in the Results table with correct discipline, date, and performance.
2. Keep discipline naming consistent (for example, 10K (Road), Half Marathon).
3. If relevant, update Personal Bests.

## Tech Stack

- Static HTML/CSS/JavaScript
- Chart.js loaded from CDN for progression charts

## Local Preview

Open the website files directly in a browser or serve the repository root with any static server.

## Notes

- This is a content-first static site, so consistency of naming and date/time formats is important for chart and stats parsing.
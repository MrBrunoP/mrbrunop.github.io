# MrBrunoP.github.io

Personal website and portfolio, including a dedicated athletics profile area with detailed results and progression charts.

## Project Overview

This repository contains a static website with sections such as photography, projects, blog pages, and athlete profile pages.

Main athlete pages:

- Athletics profile main page: AthleticsDB.html
- Athletics details page: AthleticsDB/AthleticsDetails.html


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
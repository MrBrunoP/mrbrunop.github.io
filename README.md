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

## Athletics layout

The athletics pages follow the original photography design. Their shared styles and
mobile menu live in `AthleticsDB/css/portfolio-layout.css` and
`AthleticsDB/js/portfolio-layout.js`. These files are loaded only by athletics pages.
After changing navigation links in `index.html`, run
`node scripts/build-athletics-layout.cjs` to update the athletics navigation.
The script reads the photography menu without modifying photography pages or race data.
Navigation remains available without JavaScript.

`AthleticsDB/js/race-filters.js` adds surface filters to the marked results tables.
The detailed page combines these with its year filter. Trail progression lists each
course separately; road charts retain their own distance-specific series. Use
`data-surface="mixed"` when a race's event label does not describe its mixed terrain.

## Private equipment costs

Public equipment data and dashboard behavior live in `AthleticsDB/js/gear.js`.
`AthleticsDB/Gear.html` redirects to the same dashboard at `AthleticsDetails.html#gear`.
Costs are not included in the public dataset. Choose **Import private costs** and select
a local JSON array containing every shoe's exact name and either `price`, or `buy_price`
and optional `sell_price`. Values must be non-negative numbers. The dashboard validates
the whole file before applying it. **Clear private costs** removes imported values.

Financial data stays in page memory; it is not uploaded or persisted by the dashboard.
Keep private files outside the published repository; `*.private.json` is also ignored by Git.
The `.gitignore` rule does not stop a static server from serving a file placed in its root.
Mileage updates are stored separately in this browser, without financial fields, and
do not change the published data or sync between devices. If browser storage is unavailable,
the dashboard reports that the update lasts only until reload.

Removing data from current files does not remove earlier public versions or Git history.
Exported credentials from the old site should be revoked if still active.

## Validation

Run `node scripts/check-site.cjs` from the repository root. It checks local HTML references
(including filename case), inline JavaScript syntax, date/time parsing, private import and
clearing, chart-library failure handling, and mileage storage. No installation is needed.
Result dates use `DD Mon YYYY` with English month abbreviations; times use seconds,
`mm:ss`, or `hh:mm:ss`, with optional decimal seconds.

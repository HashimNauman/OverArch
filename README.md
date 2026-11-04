# OverArch

OverArch helps procurement teams explore international spend, identify shared suppliers across countries, and turn sourcing hypotheses into an action plan.

This browser-local MVP starts with **12 countries**, **24 fictional suppliers**, and synthetic spend for **2025 and January–September 2026**. The default 2026 scope contains **RM58.64 million** in net spend. All amounts are expressed in **MYR**; the app performs no currency conversion and has no live finance, procurement, or supplier connections.

| Continent | Demo countries |
| --- | --- |
| Asia | Malaysia, Singapore, Japan, India |
| Europe | United Kingdom, Germany, France, Netherlands |
| North America | United States, Canada, Mexico, Costa Rica |

The interface uses **Onyx `#01010D`**, **Electric Indigo `#6331FB`**, and **Tropical Mint `#88F9C0`**.

## Explore the portfolio

- **Spend overview:** Review overall net spend, shared-supplier spend, supplier concentration, category mix, and an interactive geographic footprint.
- **Countries:** Compare purchasing patterns and net spend across the country portfolio.
- **Supplier overlap:** Inspect suppliers used in multiple countries, including the supplier-by-country spend matrix.
- **Opportunities:** Review distinct supplier sourcing hypotheses and inspect the assumptions behind their modeled ranges.
- **Action plan:** Save opportunities, assign owners, update workflow status, and export the current plan scope.

Focus the dashboard by continent, country, month, category, or supplier. Use the filter controls, country markers and tiles, category bars, and month buttons; active filter chips let you remove a focus. Supplier details include a dashboard focus action. Supplier overlap also supports text search.

The trend can switch between **monthly** and **cumulative** net spend. Prior-year comparison aligns matching calendar months and is disabled for **All periods**. Selecting a month focuses the other analysis while the trend retains the full selected reporting period for context.

The **What if explorer** applies an adjustable **1–12%** improvement assumption to eligible shared-supplier spend. This scenario is independent of the vendor-specific modeled ranges; moving its slider does not change those ranges.

## Read the figures correctly

**Net spend** includes credits. A **shared supplier** has positive net spend in at least two countries within the selected scope. Shared-supplier spend counts that supplier's scoped net spend once; it does **not** identify duplicate payments. Selecting one country therefore sets shared suppliers and cross-country opportunities to zero.

**Modeled potential** is eligible spend multiplied by an assumed improvement range. Eligible spend uses positive net supplier spend by country and an illustrative eligible share. Each supplier contributes one primary opportunity. Imported suppliers use a default **65% eligible share** and **3–6% improvement range**. These assumptions are not market benchmarks.

The supplier concentration chart shows the top five suppliers' share of **positive net supplier spend**, as labelled in the interface.

All potential figures, including the adjustable scenario, are hypotheses rather than supplier quotes, committed benefits, or realized savings. Changing an action's status does not change this distinction. Validate supplier identity, comparable scope, contract terms, rates, local requirements, and switching costs before acting.

## Import a spend CSV

Choose **Import spend** and download the sample, or prepare:

```csv
month,country,continent,vendor,category,amount_myr
2026-01,Malaysia,Asia,Nimbus Cloud,Cloud & software,12500.50
2026-01,Germany,Europe,Nimbus Cloud,Cloud & software,18750.00
```

Use `YYYY-MM` months and plain MYR amounts with up to two decimal places. Negative credits are supported. Convert other currencies before importing.

The required fields are `month`, `country`, `vendor`, `category`, and `amount_myr`. The `continent` field is inferred for the 12 demo countries, recognized by their displayed names or three-letter codes. Provide a standard continent for other countries; an omitted value is grouped as **Unspecified**. A declared continent must be consistent for each country. The legacy column name `business_unit` is accepted in place of `country` when no `country` column is present, and its values are treated as countries.

Imports support up to **2 MB**, **20,000 spend rows**, **50 countries**, and **500 suppliers**. Country and supplier matching uses normalized text, including case and whitespace normalization. It does not verify supplier legal identity or resolve supplier aliases. Rows with the same month, country, supplier, and category are summed; repeated source rows are not automatically identified as duplicate payments.

The 12 recognized countries receive approximate country-centroid map markers. Other imported countries can be analyzed and filtered but receive no map marker.

Loading a CSV replaces the demo for the current session and starts an empty imported-data action plan. Imported spend and actions remain in browser memory and disappear on refresh. Export spend or the plan for your current scope before leaving. Refresh to return to the demo and its saved demo actions.

Demo action owners and statuses are saved in this browser under the local storage key `overarch-country-plan-v2`. There are no shared team records.

## Run locally

From this project directory:

```sh
python3 -m http.server 4173 --directory dist
```

Open [OverArch locally](http://localhost:4173).

Run the analytics and CSV utility checks:

```sh
node test-analytics.mjs && node test-import-export.mjs
```

## Source and attribution

- `dist/index.html` — application entry point
- `dist/app.mjs` — navigation, filters, import/export, and action state
- `dist/dashboard.mjs` — overall spend dashboard and interactive visualizations
- `dist/data.mjs` — synthetic spend and country geography
- `dist/analytics.mjs` — spend, opportunity, category, and trend calculations
- `dist/utilities.mjs` — amount formatting and CSV utilities
- `dist/styles.css` — base layout and responsive styling
- `dist/theme.css` — dark palette and dashboard styling
- `dist/world-land.mjs` — map land geometry
- `test-analytics.mjs` and `test-import-export.mjs` — analytical and CSV utility checks

The map land geometry derives from the public-domain **Natural Earth 1:110m land polygons**, distributed through [Natural Earth vector data](https://github.com/nvkelso/natural-earth-vector). Country markers are illustrative approximate centroids, rather than supplier or office locations.

## Next steps

A production product would add governed data ingestion and verified supplier matching, tenant authentication and access controls, shared durable records, and verified contract and rate evidence. Those capabilities are outside this MVP's scope.

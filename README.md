# OverArch

OverArch helps group procurement teams see common suppliers and overlapping spend across business units, then turn that evidence into a coordinated sourcing plan.

This MVP starts with a synthetic dataset covering **12 business units in 11 cities across six markets**, **24 fictional suppliers**, and spend in **MYR** for **2025 and January–September 2026**. You can also import a spend CSV to explore your own data locally in the browser. The app does not connect to procurement, finance, or supplier systems.

## Explore the demo

- **Overview:** Review spend, shared suppliers, and modeled opportunities.
- **Business units:** Compare the units and their purchasing patterns.
- **Supplier overlap:** Find suppliers used by multiple units and inspect their spend.
- **Opportunities:** Review sourcing hypotheses and their supporting evidence.
- **Action plan:** Assign owners and update action status.

Filter by reporting year, category, business unit, and search. Export spend records or your action plan as CSV for the current scope. Demo action owners and statuses persist in this browser's local storage. Imported spend and action changes stay only in browser memory and disappear on refresh; export them before leaving. There are no shared team records.

## Import a spend CSV

Choose **Import spend** and use the downloadable sample, or provide a CSV with these required columns:

```csv
month,business_unit,vendor,category,amount_myr
2026-01,Consumer Products,Nimbus Cloud,Cloud & software,12500.50
```

Use `YYYY-MM` months and plain MYR amounts with up to two decimal places. Negative credits are supported. Convert other currencies before importing; the app performs no exchange-rate conversion.

Imports support up to **2 MB**, **20,000 spend rows**, **50 business units**, and **500 suppliers**. Unit and supplier names are matched using normalized text, including case and whitespace normalization. This does not verify supplier legal identity or resolve aliases. Rows with the same month, unit, supplier, and category are summed; repeated source rows are not automatically identified as duplicate payments.

Loading a CSV replaces the demo for the current session and starts an empty imported-data action plan. Refresh the page to return to the demo and its saved demo actions.

## Read the figures correctly

**Shared-supplier spend** is net spend with a supplier that has positive net spend in at least two business units within the selected scope. Credits reduce spend. Shared-supplier spend represents an opportunity to coordinate buying; it does **not** identify duplicate payments. Selecting a single unit therefore sets shared suppliers and cross-unit opportunities to zero.

**Modeled potential** is a scenario range calculated as eligible spend multiplied by the stated scenario rates. Eligible spend uses positive net supplier spend by unit and an assumed eligible share. Each supplier contributes one primary opportunity. Imported suppliers use a default **65% eligible share** and **3–6% improvement range**; these are illustrative assumptions, not market benchmarks. Open a supplier to inspect the calculation.

These figures are hypotheses, not supplier quotes, committed benefits, or realized savings. Changing action status does not change that distinction. Validate supplier identity, comparable scope, rates, contract restrictions, switching costs, and local requirements before acting.

## Run locally

From this project directory:

```sh
python3 -m http.server 4173 --directory dist
```

Open [OverArch locally](http://localhost:4173).

Run the analytics checks with:

```sh
node test-analytics.mjs
```

## Source

- `dist/index.html` — application entry point
- `dist/data.mjs` — synthetic demonstration data
- `dist/analytics.mjs` — analytical calculations
- `dist/app.mjs` — views, filters, exports, and action state
- `dist/styles.css` — interface and responsive styling
- `test-analytics.mjs` — analytics checks

## Next steps

The path to a production product starts with governed data ingestion and verified supplier matching, tenant authentication and access controls, and verified contract and rate evidence. Those capabilities are outside this MVP's scope.

# OverArch — Singapore LBU spend intelligence

OverArch compares procurement spend across **PAC, PS and ES**, three LBUs in **Singapore**. All amounts are in **SGD**. The demo contains fictional suppliers and synthetic spend, with no live company connections.

[Open OverArch](https://hashimnauman.github.io/OverArch/)

The repository-root `index.html` is the complete standalone app, with embedded CSS, JavaScript, fonts, logo and data. Open it directly in a browser or publish it to GitHub Pages. No installation or server is required.

## What you can do

- Review the overall spend dashboard, monthly/cumulative trends and aligned prior-year comparison.
- Compare PAC, PS and ES, keeping Singapore as their common geography.
- Inspect shared suppliers and a supplier-by-LBU spend matrix.
- Find category overlap where LBUs use different supplier panels, with practical validation steps.
- Model a 1–12% what-if scenario and inspect the separate supplier-specific opportunity assumptions.
- Add supplier opportunities to an action plan, assign owners, update status and export the plan.
- Rename the demo LBUs, import a combined SGD CSV and export the selected scope.

The Onyx `#01010D`, Electric Indigo `#6331FB` and Tropical Mint `#88F9C0` design is retained. The world map is replaced with a Singapore LBU comparison.

## Demo and definitions

The sample has **3 LBUs, 18 fictional suppliers, 10 categories and 716 spend records** across 2025 and January–September 2026. Default 2026 net spend is **S$12.48m**. Eleven suppliers are shared across at least two LBUs; five serve all three. Six categories show differing supplier choices.

Net spend includes credits. A supplier is shared when it has positive net spend in at least two selected LBUs. Shared-supplier spend counts that supplier's scoped net spend once. It does not detect duplicate invoices. Selecting one LBU sets cross-LBU supplier and category overlap to zero.

A category overlaps when two or more selected LBUs have positive net category spend. A supplier-panel signal requires multiple suppliers and at least one supplier used by just one LBU within that category. This prompts a scope and specification review; it does not prove consolidation is suitable.

Each shared supplier contributes one primary modeled opportunity. Eligible spend is positive net supplier spend by LBU multiplied by an illustrative eligible share. Potential is eligible spend multiplied by an assumed improvement range. Imported suppliers default to 65% eligible share and a 3–6% range. These are working assumptions, not benchmarks, supplier offers or realized savings. Category signals add no savings estimate, so they are not double-counted with supplier opportunities. The dashboard's adjustable scenario is independent of supplier-specific ranges.

Compare contract terms, specifications, service levels, vendor legal identities, renewal dates and switching costs before acting. Spend alone does not establish unit-price differences.

## Import your three LBUs

Combine their spend in one CSV, identifying each source LBU:

```csv
month,lbu,country,vendor,category,amount_sgd
2026-01,PAC,Singapore,Nimbus Cloud,Cloud & software,12500.50
2026-01,PS,Singapore,Nimbus Cloud,Cloud & software,18750.00
2026-01,ES,Singapore,Aster Data,Cloud & software,9200.00
```

Required fields: `month,lbu,vendor,category,amount_sgd`. `business_unit` is also accepted instead of `lbu`. Optional `country` must identify Singapore; optional `currency` must be SGD. Convert amounts before importing. The app does not reinterpret MYR amounts as SGD.

Use YYYY-MM months and plain amounts with up to two decimal places. Credits are supported. Limits: 2 MB, 20,000 rows, 3 LBUs and 500 suppliers. Partial files with fewer than three LBUs are allowed. LBU, supplier and category names are matched after Unicode, case and whitespace normalization. Legal supplier aliases are not automatically resolved. Rows at the same month/LBU/supplier/category grain are aggregated; repeated invoices are not identified as duplicates.

Imported data and actions remain in browser memory for the current session. Refresh returns to the synthetic demo. Demo LBU names and action owners/statuses are stored in this browser when storage is available; there are no shared team records. CSV export makes text that could be interpreted as spreadsheet formulas literal.

## Build and verify

Edit the modular source in `dist/`, then regenerate the standalone file:

```sh
node scripts/build-html.mjs
```

Run the focused analytics, import/export and standalone checks:

```sh
node test-analytics.mjs
node test-import-export.mjs
node test-standalone.mjs
```

GitHub Pages publishes the root of `main`, with Jekyll disabled by `.nojekyll`. Sites serves the modular app from `dist/`. The standalone file and modular preview are both verified.

Embedded DM Sans and Manrope subsets use SIL Open Font License 1.1. Notices are included in `assets/fonts/` and embedded in the HTML.

A production implementation would add approved data ingestion, verified supplier identities, access controls, shared durable records and evidence-backed contract comparisons.

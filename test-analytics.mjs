import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { units, vendors, categories, continents, transactions } from './dist/data.mjs';
import { filterRows, summarize, priorYearRows, groupTrend, categoryBreakdown } from './dist/analytics.mjs';

const current = filterRows(transactions, { period: '2026' });
const report = summarize(current, units, vendors);
assert.equal(units.length, 12);
assert.equal(new Set(units.map(unit => unit.country)).size, 12);
assert.deepEqual(continents, ['Asia', 'Europe', 'North America']);
for (const continent of continents) assert.equal(units.filter(unit => unit.continent === continent).length, 4);
assert.deepEqual(units.map(unit => unit.code), ['MYS','SGP','JPN','IND','GBR','DEU','FRA','NLD','USA','CAN','MEX','CRI']);
assert.ok(units.every(unit => unit.name === unit.country && Number.isFinite(unit.lat) && Math.abs(unit.lat) <= 90 && Number.isFinite(unit.lon) && Math.abs(unit.lon) <= 180));
assert.ok(transactions.every(row => row.continent === units.find(unit => unit.id === row.unitId).continent && row.country === units.find(unit => unit.id === row.unitId).country));
assert.equal(createHash('sha256').update(JSON.stringify(transactions.map(({id,amount}) => [id,amount]))).digest('hex'), '1d5859532d64c302a47283b1d81d92cb83fc37ceae2b473c9e51328dac32bd77', 'Geographic redesign must preserve all transaction IDs and amounts.');
assert.equal(vendors.length, 24);
assert.equal(report.total, 5_864_000_000);
assert.equal(report.total, report.unitStats.reduce((n, unit) => n + unit.total, 0));
assert.equal(report.total, report.vendorStats.reduce((n, vendor) => n + vendor.total, 0));
assert.equal(report.sharedSpend, report.unitStats.reduce((n, unit) => n + unit.sharedSpend, 0));
assert.equal(report.estimatedHigh, report.opportunities.reduce((n, vendor) => n + vendor.estimateHigh, 0));
assert.equal(new Set(transactions.map(row => row.id)).size, transactions.length);
assert.ok(transactions.every(row => Number.isSafeInteger(row.amount) && categories.includes(row.category)));
assert.ok(report.sharedCount > 0 && report.sharedCount < vendors.length);
assert.equal(report.activeContinentCount, 3);
assert.equal(report.continentStats.reduce((total, continent) => total + continent.total, 0), report.total);
assert.ok(report.continentStats.every(continent => continent.countryCount === 4));
for (const continent of continents) {
  const scopedRows = filterRows(transactions, { continent });
  const continentReport = summarize(scopedRows, units, vendors);
  assert.equal(continentReport.activeUnitCount, 4);
  assert.equal(continentReport.activeContinentCount, 1);
  assert.equal(continentReport.total, report.continentStats.find(stat => stat.name === continent).total);
}
const monthly = groupTrend(current);
assert.equal(monthly.length, 9);
assert.deepEqual(monthly.map(row => row.month), ['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08','2026-09']);
assert.equal(monthly.reduce((total, row) => total + row.total, 0), report.total);
assert.equal(categoryBreakdown(current).reduce((total, row) => total + row.total, 0), report.total);
assert.equal(categoryBreakdown(current).length, categories.length);
assert.ok(categoryBreakdown(current).every((row, index, all) => index === 0 || all[index - 1].total >= row.total));
const juneRows = filterRows(transactions, { month: '2026-06' });
assert.ok(juneRows.length > 0 && juneRows.every(row => row.month === '2026-06'));
assert.equal(summarize(juneRows, units, vendors).total, monthly.find(row => row.month === '2026-06').total);
const combinedRows = filterRows(transactions, { period: '2026', continent: 'Asia', unit: 'bu-03', supplier: 'v01', category: 'Cloud & software', month: '2026-01' });
assert.equal(combinedRows.length, 1);
assert.ok(combinedRows.every(row => row.unitId === 'bu-03' && row.vendorId === 'v01' && row.continent === 'Asia' && row.month === '2026-01'));
assert.equal(filterRows(transactions, { period: '2026', month: '2025-01' }).length, 0);
assert.equal(filterRows(transactions, { period: 'all', month: '2025-01' }).length > 0, true);
const withoutGeography = transactions.map(({ continent, country, ...row }) => row);
assert.equal(filterRows(withoutGeography, { continent: 'Europe' }).length, filterRows(transactions, { continent: 'Europe' }).length);
const importedRows = [{ month: '2026-01', unitId: 'imported-unit', vendorId: 'imported-vendor', category: 'Test', continent: 'Europe', country: 'Spain', amount: 12345 }];
assert.equal(filterRows(importedRows, { continent: 'Europe' }).length, 1);
assert.equal(filterRows(importedRows, { continent: 'Asia' }).length, 0);
assert.deepEqual(groupTrend([]), []);
assert.deepEqual(categoryBreakdown([]), []);

const sparseRows = [
  { id: 's1', month: '2026-01', unitId: 'bu-01', vendorId: 'v01', category: 'Cloud & software', amount: 10000 },
  { id: 's2', month: '2026-02', unitId: 'bu-02', vendorId: 'v01', category: 'Cloud & software', amount: 10000 },
  { id: 's3', month: '2025-01', unitId: 'bu-01', vendorId: 'v01', category: 'Cloud & software', amount: 10000 },
  { id: 's4', month: '2025-02', unitId: 'bu-01', vendorId: 'v01', category: 'Cloud & software', amount: 20000 },
];
const sparseFilters = { period: '2026', unit: 'bu-01' };
assert.deepEqual(priorYearRows(sparseRows, sparseFilters).map(row => row.id), ['s3'], 'Unrelated Singapore February coverage must not enter Malaysia comparison.');
assert.equal(priorYearRows(sparseRows, sparseFilters).reduce((total, row) => total + row.amount, 0), 10000);
assert.deepEqual(priorYearRows(sparseRows, { ...sparseFilters, month: '2026-02' }), [], 'A month with no current scoped rows has no comparable cohort.');
assert.deepEqual(priorYearRows(sparseRows, { ...sparseFilters, month: '2026-02' }, { fullPeriod: true }).map(row => row.id), ['s3']);
const priorJune = priorYearRows(transactions, { period: '2026', month: '2026-06', continent: 'Europe', supplier: 'v01' });
assert.ok(priorJune.length > 0 && priorJune.every(row => row.month === '2025-06' && row.continent === 'Europe' && row.vendorId === 'v01'));
const priorFullPeriod = priorYearRows(transactions, { period: '2026', month: '2026-06' }, { fullPeriod: true });
assert.deepEqual([...new Set(priorFullPeriod.map(row => row.month))].sort(), ['2025-01','2025-02','2025-03','2025-04','2025-05','2025-06','2025-07','2025-08','2025-09']);
assert.deepEqual(priorYearRows(transactions, { period: 'all' }), []);
assert.deepEqual(priorYearRows(transactions, { period: 'all' }, { fullPeriod: true }), []);
assert.deepEqual(priorYearRows([], { period: '2026' }), []);

const single = summarize(filterRows(transactions, { period: '2026', unit: 'bu-01' }), units, vendors);
assert.equal(single.activeUnitCount, 1);
assert.equal(single.sharedCount, 0);
assert.equal(single.sharedSpend, 0);
assert.equal(single.estimatedHigh, 0);

const dummyVendors = [{ id: 'v', name: 'Test', eligibleShare: 1, lowRate: .1, highRate: .2 }];
const dummyUnits = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }];
const base = { month: '2026-01', category: 'Test', vendorId: 'v' };
const credited = [
  { ...base, id: '1', unitId: 'a', amount: 10000 },
  { ...base, id: '2', unitId: 'b', amount: 5000 },
  { ...base, id: '3', unitId: 'a', amount: -3000 },
];
const creditReport = summarize(credited, dummyUnits, dummyVendors);
assert.equal(creditReport.total, 12000);
assert.equal(creditReport.sharedSpend, 12000);
assert.equal(creditReport.estimatedLow, 1200);
assert.equal(creditReport.estimatedHigh, 2400);
const negativeUnitReport = summarize([...credited, { ...base, id: '4', unitId: 'b', amount: -6000 }], dummyUnits, dummyVendors);
assert.equal(negativeUnitReport.total, 6000);
assert.equal(negativeUnitReport.sharedCount, 0);
assert.equal(negativeUnitReport.estimatedHigh, 0);

const multiCategoryVendors = [{ ...dummyVendors[0], category: 'First category' }];
const multiCategoryRows = [
  { ...base, id: 'mc1', unitId: 'a', category: 'First category', amount: 10000 },
  { ...base, id: 'mc2', unitId: 'b', category: 'First category', amount: 20000 },
  { ...base, id: 'mc3', unitId: 'a', category: 'Second category', amount: 30000 },
  { ...base, id: 'mc4', unitId: 'b', category: 'Second category', amount: 40000 },
];
const multiCategoryReport = summarize(multiCategoryRows, dummyUnits, multiCategoryVendors);
assert.equal(multiCategoryReport.vendorStats[0].category, 'Multiple categories');
assert.deepEqual(multiCategoryReport.vendorStats[0].categories, ['First category', 'Second category']);
assert.equal(multiCategoryReport.opportunities[0].category, 'Multiple categories');
assert.equal(multiCategoryReport.opportunities.length, 1);
assert.equal(multiCategoryReport.total, 100000);
const secondCategoryReport = summarize(filterRows(multiCategoryRows, { category: 'Second category' }), dummyUnits, multiCategoryVendors);
assert.equal(secondCategoryReport.vendorStats[0].category, 'Second category');
assert.deepEqual(secondCategoryReport.vendorStats[0].categories, ['Second category']);
assert.equal(secondCategoryReport.opportunities[0].category, 'Second category');
assert.equal(secondCategoryReport.total, 70000);
assert.equal(multiCategoryVendors[0].category, 'First category');

const filterInputSnapshot = JSON.stringify(transactions);
assert.ok(filterRows(transactions, { period: '2025' }).every(row => row.month.startsWith('2025')));
assert.ok(filterRows(transactions, { category: 'Telecom', unit: 'bu-04' }).every(row => row.category === 'Telecom' && row.unitId === 'bu-04' && row.month.startsWith('2026')));
assert.equal(filterRows(transactions, { period: 'all' }).length, transactions.length);
assert.equal(filterRows(transactions, { period: 'all', search: 'not-a-supplier' }).length, 0);
assert.ok(filterRows(transactions, { search: 'Nimbus' }).length > 0);
assert.ok(filterRows(transactions, { search: 'Nimbus' }).every(row => row.vendorId === 'v01'));
const enriched = transactions.map(row => ({ ...row, vendorName: vendors.find(vendor => vendor.id === row.vendorId).name }));
assert.ok(filterRows(enriched, { search: 'nimbus' }).every(row => row.vendorId === 'v01'));
assert.ok(filterRows(enriched, { search: 'nimbus' }).length > 0);
assert.deepEqual(summarize([], units, vendors), { total: 0, sharedSpend: 0, sharedCount: 0, activeUnitCount: 0, activeContinentCount: 0, vendorCount: 0, positiveSpend: 0, estimatedLow: 0, estimatedHigh: 0, vendorStats: [], unitStats: [], opportunities: [], continentStats: [] });
assert.equal(JSON.stringify(transactions), filterInputSnapshot);
assert.throws(() => summarize([{ ...base, unitId: 'a', amount: NaN }], dummyUnits, dummyVendors), /safe integer/);
console.log(`Analytics checks passed: ${transactions.length} rows, 12 units, 24 suppliers; FY2026 Jan–Sep RM${(report.total / 100).toLocaleString('en-MY')}.`);

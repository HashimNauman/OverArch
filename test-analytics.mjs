import assert from 'node:assert/strict';
import { units, vendors, categories, transactions } from './dist/data.mjs';
import { filterRows, summarize } from './dist/analytics.mjs';

const current = filterRows(transactions, { period: '2026' });
const report = summarize(current, units, vendors);
assert.equal(units.length, 12);
assert.equal(vendors.length, 24);
assert.equal(report.total, 5_864_000_000);
assert.equal(report.total, report.unitStats.reduce((n, unit) => n + unit.total, 0));
assert.equal(report.total, report.vendorStats.reduce((n, vendor) => n + vendor.total, 0));
assert.equal(report.sharedSpend, report.unitStats.reduce((n, unit) => n + unit.sharedSpend, 0));
assert.equal(report.estimatedHigh, report.opportunities.reduce((n, vendor) => n + vendor.estimateHigh, 0));
assert.equal(new Set(transactions.map(row => row.id)).size, transactions.length);
assert.ok(transactions.every(row => Number.isSafeInteger(row.amount) && categories.includes(row.category)));
assert.ok(report.sharedCount > 0 && report.sharedCount < vendors.length);

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
assert.deepEqual(summarize([], units, vendors), { total: 0, sharedSpend: 0, sharedCount: 0, activeUnitCount: 0, vendorCount: 0, positiveSpend: 0, estimatedLow: 0, estimatedHigh: 0, vendorStats: [], unitStats: [], opportunities: [] });
assert.equal(JSON.stringify(transactions), filterInputSnapshot);
assert.throws(() => summarize([{ ...base, unitId: 'a', amount: NaN }], dummyUnits, dummyVendors), /safe integer/);
console.log(`Analytics checks passed: ${transactions.length} rows, 12 units, 24 suppliers; FY2026 Jan–Sep RM${(report.total / 100).toLocaleString('en-MY')}.`);

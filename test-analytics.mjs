import assert from 'node:assert/strict';
import { units, vendors, categories, continents, transactions } from './dist/data.mjs';
import { filterRows, summarize, priorYearRows, groupTrend, categoryBreakdown, overlapAnalysis } from './dist/analytics.mjs';

const current = filterRows(transactions, { period: '2026' });
const report = summarize(current, units, vendors);
assert.equal(units.length,3);
assert.deepEqual(units.map(u=>u.name),['PAC','PS','ES']);
assert.ok(units.every(u=>u.country==='Singapore'&&u.continent==='Asia'));
assert.ok(transactions.every(r=>r.country==='Singapore'&&r.continent==='Asia'));
assert.equal(vendors.length,18);
assert.equal(report.total,1_248_000_000);
assert.equal(report.total,report.unitStats.reduce((a,u)=>a+u.total,0));
assert.equal(report.total,report.vendorStats.reduce((a,v)=>a+v.total,0));
assert.equal(report.sharedSpend,report.unitStats.reduce((a,u)=>a+u.sharedSpend,0));
assert.equal(report.estimatedHigh,report.opportunities.reduce((a,v)=>a+v.estimateHigh,0));
assert.equal(report.sharedCount,11);
assert.equal(report.vendorStats.filter(v=>v.unitCount===3).length,5);
assert.equal(new Set(transactions.map(r=>r.id)).size,transactions.length);
assert.ok(transactions.every(r=>Number.isSafeInteger(r.amount)&&categories.includes(r.category)));
const overlaps=overlapAnalysis(current,units,vendors);
assert.equal(overlaps.categories.length,10);
assert.equal(overlaps.fragmentedCount,6);
assert.equal(overlaps.pairs.length,3);
assert.ok(overlaps.categories.every(c=>c.unitCount>=2));
for(const pair of overlaps.pairs){
 const shared=report.vendorStats.filter(v=>(v.byUnit[pair.a.id]||0)>0&&(v.byUnit[pair.b.id]||0)>0);
 assert.equal(pair.supplierCount,shared.length);
 assert.equal(pair.spend,shared.reduce((a,v)=>a+v.byUnit[pair.a.id]+v.byUnit[pair.b.id],0));
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
assert.deepEqual(groupTrend([]), []);
assert.deepEqual(categoryBreakdown([]), []);

const sparseRows = [
  { id: 's1', month: '2026-01', unitId: 'bu-01', vendorId: 'v01', category: 'Cloud & software', amount: 10000 },
  { id: 's2', month: '2026-02', unitId: 'bu-02', vendorId: 'v01', category: 'Cloud & software', amount: 10000 },
  { id: 's3', month: '2025-01', unitId: 'bu-01', vendorId: 'v01', category: 'Cloud & software', amount: 10000 },
  { id: 's4', month: '2025-02', unitId: 'bu-01', vendorId: 'v01', category: 'Cloud & software', amount: 20000 },
];
const sparseFilters = { period: '2026', unit: 'bu-01' };
assert.deepEqual(priorYearRows(sparseRows, sparseFilters).map(row => row.id), ['s3'], 'Unrelated PS February coverage must not enter the PAC comparison.');
assert.equal(priorYearRows(sparseRows, sparseFilters).reduce((total, row) => total + row.amount, 0), 10000);
assert.deepEqual(priorYearRows(sparseRows, { ...sparseFilters, month: '2026-02' }), [], 'A month with no current scoped rows has no comparable cohort.');
assert.deepEqual(priorYearRows(sparseRows, { ...sparseFilters, month: '2026-02' }, { fullPeriod: true }).map(row => row.id), ['s3']);
const priorJune = priorYearRows(transactions, { period: '2026', month: '2026-06', continent: 'Asia', supplier: 'v01' });
assert.ok(priorJune.length > 0 && priorJune.every(row => row.month === '2025-06' && row.continent === 'Asia' && row.vendorId === 'v01'));
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
assert.ok(filterRows(transactions, { category: 'Telecom', unit: 'bu-03' }).every(row => row.category === 'Telecom' && row.unitId === 'bu-03' && row.month.startsWith('2026')));
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
// Distinguish category fragmentation from a common supplier and net out credits first.
const catVendors=[{id:'x',name:'X'},{id:'y',name:'Y'}];
const categoryRows=[
 {month:'2026-01',unitId:'a',vendorId:'x',category:'Software',amount:10000},
 {month:'2026-01',unitId:'b',vendorId:'y',category:'Software',amount:20000},
];
const split=overlapAnalysis(categoryRows,dummyUnits,catVendors);
assert.equal(split.fragmentedCount,1);
assert.equal(split.categories[0].sharedSupplierCount,0);
assert.equal(split.categories[0].total,30000);
assert.equal(split.pairs[0].supplierCount,0);
const common=overlapAnalysis(categoryRows.map(r=>({...r,vendorId:'x'})),dummyUnits,catVendors);
assert.equal(common.fragmentedCount,0);
assert.equal(common.categories[0].sharedSupplierCount,1);
assert.equal(common.pairs[0].spend,30000);
const netted=overlapAnalysis([...categoryRows,{...categoryRows[1],amount:-21000}],dummyUnits,catVendors);
assert.equal(netted.categories.length,0,'A net-negative LBU does not create category overlap.');
assert.equal(overlapAnalysis(filterRows(transactions,{unit:'bu-01'}),units,vendors).categories.length,0);
console.log(`Analytics checks passed: ${transactions.length} rows; PAC, PS, ES; Singapore; S$${report.total/100}.`);

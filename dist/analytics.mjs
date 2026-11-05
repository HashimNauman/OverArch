import { vendors as defaultVendors, units as defaultUnits } from './data.mjs?v=20261106.1';

const sum = values => values.reduce((total, value) => total + value, 0);
const vendorNames = new Map(defaultVendors.map(vendor => [vendor.id, vendor.name]));
const unitNames = new Map(defaultUnits.map(unit => [unit.id, unit.name]));
const unitGeography = new Map(defaultUnits.map(unit => [unit.id, { continent: unit.continent, country: unit.country }]));

export function filterRows(rows, { period = '2026', category = 'all', unit = 'all', continent = 'all', month = 'all', supplier = 'all', search = '' } = {}) {
  const query = String(search).trim().toLocaleLowerCase();
  return rows.filter(row =>
    (period === 'all' || row.month.slice(0, 4) === String(period)) &&
    (category === 'all' || row.category === category) &&
    (unit === 'all' || row.unitId === unit) &&
    (continent === 'all' || (row.continent || unitGeography.get(row.unitId)?.continent) === continent) &&
    (month === 'all' || row.month === month) &&
    (supplier === 'all' || row.vendorId === supplier) &&
    (!query || `${row.vendorName || vendorNames.get(row.vendorId) || ''} ${row.vendorId} ${row.category} ${row.unitName || unitNames.get(row.unitId) || ''} ${row.country || unitGeography.get(row.unitId)?.country || ''} ${row.continent || unitGeography.get(row.unitId)?.continent || ''}`.toLocaleLowerCase().includes(query))
  );
}

export function priorYearRows(rows, filters = {}, { fullPeriod = false } = {}) {
  const period = String(filters.period ?? '2026');
  if (period === 'all') return [];
  const currentRows = filterRows(rows, { ...filters, period, month: fullPeriod ? 'all' : filters.month || 'all' });
  const coveredMonths = new Set(currentRows.map(row => row.month.slice(5)));
  return filterRows(rows, { ...filters, period: String(Number(period) - 1), month: 'all' })
    .filter(row => coveredMonths.has(row.month.slice(5)));
}

export function groupTrend(rows) {
  const grouped = new Map();
  for (const row of rows) {
    if (!Number.isSafeInteger(row.amount)) throw new TypeError('Spend amounts must be safe integer cents.');
    grouped.set(row.month, (grouped.get(row.month) || 0) + row.amount);
  }
  return [...grouped].sort(([a], [b]) => a.localeCompare(b)).map(([month, total]) => ({ month, total }));
}

// Category overlap is a sourcing signal, never an additional savings estimate.
export function overlapAnalysis(rows, unitList, vendorList) {
  const categoryMap = new Map();
  const names = new Map(vendorList.map(v => [v.id, v.name]));
  for (const r of rows) {
    if (!Number.isSafeInteger(r.amount)) throw new TypeError('Spend amounts must be safe integer cents.');
    if (!categoryMap.has(r.category)) categoryMap.set(r.category, {name:r.category,total:0,byUnit:{},suppliers:new Map()});
    const c=categoryMap.get(r.category);c.total+=r.amount;c.byUnit[r.unitId]=(c.byUnit[r.unitId]||0)+r.amount;
    if (!c.suppliers.has(r.vendorId)) c.suppliers.set(r.vendorId, {});
    const v=c.suppliers.get(r.vendorId);v[r.unitId]=(v[r.unitId]||0)+r.amount;
  }
  const categories=[...categoryMap.values()].map(c=>{
    const suppliers=[...c.suppliers].map(([id,byUnit])=>({id,name:names.get(id)||id,byUnit,unitCount:Object.values(byUnit).filter(n=>n>0).length})).filter(v=>v.unitCount>0);
    const unitCount=Object.values(c.byUnit).filter(n=>n>0).length;
    const exclusive=suppliers.filter(v=>v.unitCount===1);
    const fragmented=unitCount>=2&&exclusive.length>0&&suppliers.length>1;
    return {name:c.name,total:c.total,byUnit:c.byUnit,unitCount,suppliers,vendorCount:suppliers.length,sharedSupplierCount:suppliers.filter(v=>v.unitCount>=2).length,exclusiveSupplierCount:exclusive.length,fragmented,
      strategy:fragmented?'Compare supplier panels':'Align scopes and renewal dates',
      nextStep:fragmented?'Different supplier choices serve this category. Match specifications and service levels, then test a shared panel or coordinated tender.':'The category already has common suppliers. Check comparable scopes, LBU rate cards and renewal dates for a joint negotiation.'};
  }).filter(c=>c.unitCount>=2).sort((a,b)=>Number(b.fragmented)-Number(a.fragmented)||b.total-a.total||a.name.localeCompare(b.name));
  const s=summarize(rows,unitList,vendorList),pairs=[];
  for(let i=0;i<unitList.length;i++) for(let j=i+1;j<unitList.length;j++) {
    const a=unitList[i],b=unitList[j];
    const shared=s.vendorStats.filter(v=>(v.byUnit[a.id]||0)>0&&(v.byUnit[b.id]||0)>0);
    pairs.push({a,b,supplierCount:shared.length,spend:shared.reduce((n,v)=>n+v.byUnit[a.id]+v.byUnit[b.id],0)});
  }
  return {categories,pairs,fragmentedCount:categories.filter(c=>c.fragmented).length};
}

export function categoryBreakdown(rows) {
  const grouped = new Map();
  for (const row of rows) {
    if (!Number.isSafeInteger(row.amount)) throw new TypeError('Spend amounts must be safe integer cents.');
    grouped.set(row.category, (grouped.get(row.category) || 0) + row.amount);
  }
  return [...grouped].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

export function summarize(rows, unitList, vendorList) {
  const vendorMap = new Map(vendorList.map(vendor => [vendor.id, { ...vendor, total: 0, unitCount: 0, byUnit: {}, categories: new Set() }]));
  const unitMap = new Map(unitList.map(unit => [unit.id, { ...unit, total: 0, sharedSpend: 0, vendorCount: 0 }]));
  for (const row of rows) {
    if (!Number.isSafeInteger(row.amount)) throw new TypeError('Spend amounts must be safe integer cents.');
    const vendor = vendorMap.get(row.vendorId);
    const unit = unitMap.get(row.unitId);
    if (!vendor || !unit) throw new TypeError('Spend records must reference a known unit and supplier.');
    vendor.total += row.amount;
    vendor.byUnit[row.unitId] = (vendor.byUnit[row.unitId] || 0) + row.amount;
    vendor.categories.add(row.category);
    unit.total += row.amount;
  }
  const vendorStats = [...vendorMap.values()]
    .filter(vendor => Object.keys(vendor.byUnit).length > 0)
    .map(vendor => {
      const unitCount = Object.values(vendor.byUnit).filter(amount => amount > 0).length;
      // Credits offset their own unit's eligible spend; negative unit balances cannot create savings.
      const addressablePositive = sum(Object.values(vendor.byUnit).map(amount => Math.max(0, amount)));
      const eligibleSpend = Math.round(addressablePositive * Math.min(1, Math.max(0, vendor.eligibleShare || 0)));
      const estimateLow = unitCount >= 2 && vendor.total > 0 ? Math.round(eligibleSpend * Math.max(0, vendor.lowRate || 0)) : 0;
      const estimateHigh = unitCount >= 2 && vendor.total > 0 ? Math.round(eligibleSpend * Math.max(vendor.lowRate || 0, vendor.highRate || 0)) : 0;
      const categories = [...vendor.categories].sort((a, b) => a.localeCompare(b));
      const category = categories.length === 1 ? categories[0] : 'Multiple categories';
      return { ...vendor, category, categories, unitCount, eligibleSpend, estimateLow, estimateHigh };
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  const shared = vendorStats.filter(vendor => vendor.unitCount >= 2);
  const sharedIds = new Set(shared.map(vendor => vendor.id));
  const unitVendorPairs = new Map(unitList.map(unit => [unit.id, new Set()]));
  for (const vendor of vendorStats) {
    for (const [unitId, amount] of Object.entries(vendor.byUnit)) {
      if (amount > 0) unitVendorPairs.get(unitId).add(vendor.id);
      if (sharedIds.has(vendor.id)) unitMap.get(unitId).sharedSpend += amount;
    }
  }
  const unitStats = [...unitMap.values()]
    .filter(unit => rows.some(row => row.unitId === unit.id))
    .map(unit => ({ ...unit, vendorCount: unitVendorPairs.get(unit.id).size }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  const opportunities = vendorStats.filter(vendor => vendor.unitCount >= 2 && vendor.total > 0 && vendor.estimateHigh > 0)
    .sort((a, b) => b.estimateHigh - a.estimateHigh || b.total - a.total);
  const continentMap = new Map();
  for (const unit of unitStats) {
    const name = unit.continent || 'Unassigned';
    if (!continentMap.has(name)) continentMap.set(name, { name, total: 0, countries: new Set() });
    const continent = continentMap.get(name);
    continent.total += unit.total;
    if (unit.vendorCount > 0) continent.countries.add(unit.country || unit.name);
  }
  const continentStats = [...continentMap.values()]
    .map(({ name, total, countries }) => ({ name, total, countryCount: countries.size }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  return {
    total: sum(rows.map(row => row.amount)),
    sharedSpend: sum(shared.map(vendor => vendor.total)),
    sharedCount: shared.length,
    activeUnitCount: unitStats.filter(unit => unit.vendorCount > 0).length,
    activeContinentCount: continentStats.filter(continent => continent.countryCount > 0).length,
    vendorCount: vendorStats.filter(vendor => vendor.unitCount > 0).length,
    positiveSpend: sum(vendorStats.map(vendor => Math.max(0, vendor.total))),
    estimatedLow: sum(opportunities.map(vendor => vendor.estimateLow)),
    estimatedHigh: sum(opportunities.map(vendor => vendor.estimateHigh)),
    vendorStats, unitStats, opportunities, continentStats,
  };
}

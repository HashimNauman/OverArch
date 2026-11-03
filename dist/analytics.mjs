import { vendors as defaultVendors, units as defaultUnits } from './data.mjs';

const sum = values => values.reduce((total, value) => total + value, 0);
const vendorNames = new Map(defaultVendors.map(vendor => [vendor.id, vendor.name]));
const unitNames = new Map(defaultUnits.map(unit => [unit.id, unit.name]));

export function filterRows(rows, { period = '2026', category = 'all', unit = 'all', search = '' } = {}) {
  const query = String(search).trim().toLocaleLowerCase();
  return rows.filter(row =>
    (period === 'all' || row.month.slice(0, 4) === String(period)) &&
    (category === 'all' || row.category === category) &&
    (unit === 'all' || row.unitId === unit) &&
    (!query || `${row.vendorName || vendorNames.get(row.vendorId) || ''} ${row.vendorId} ${row.category} ${row.unitName || unitNames.get(row.unitId) || ''}`.toLocaleLowerCase().includes(query))
  );
}

export function summarize(rows, unitList, vendorList) {
  const vendorMap = new Map(vendorList.map(vendor => [vendor.id, { ...vendor, total: 0, unitCount: 0, byUnit: {}, categories: new Set() }]));
  const unitMap = new Map(unitList.map(unit => [unit.id, { ...unit, total: 0, sharedSpend: 0, vendorCount: 0 }]));
  for (const row of rows) {
    if (!Number.isSafeInteger(row.amount)) throw new TypeError('Spend amounts must be safe integer sen.');
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
  return {
    total: sum(rows.map(row => row.amount)),
    sharedSpend: sum(shared.map(vendor => vendor.total)),
    sharedCount: shared.length,
    activeUnitCount: unitStats.filter(unit => unit.vendorCount > 0).length,
    vendorCount: vendorStats.filter(vendor => vendor.unitCount > 0).length,
    positiveSpend: sum(vendorStats.map(vendor => Math.max(0, vendor.total))),
    estimatedLow: sum(opportunities.map(vendor => vendor.estimateLow)),
    estimatedHigh: sum(opportunities.map(vendor => vendor.estimateHigh)),
    vendorStats, unitStats, opportunities,
  };
}

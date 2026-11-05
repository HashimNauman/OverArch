// Fictional demonstration data. Amounts are integer SGD cents.
export const continents = ['Asia'];

export const units = [
  { id: 'bu-01', name: 'PAC', code: 'PAC', city: 'Singapore', country: 'Singapore', continent: 'Asia', color: '#8057ff' },
  { id: 'bu-02', name: 'PS', code: 'PS', city: 'Singapore', country: 'Singapore', continent: 'Asia', color: '#88f9c0' },
  { id: 'bu-03', name: 'ES', code: 'ES', city: 'Singapore', country: 'Singapore', continent: 'Asia', color: '#b3a0ff' },
];

export const categories = [
  'Cloud & software', 'Logistics', 'Office & workplace', 'Professional services',
  'Telecom', 'Facilities', 'Marketing', 'Travel', 'MRO & industrial', 'Packaging',
];

// Opportunity rates and addressable shares are illustrative assumptions, not benchmarks.
export const vendors = [
  { id: 'v01', name: 'Nimbus Cloud', category: 'Cloud & software', color: '#0042AC', eligibleShare: .75, lowRate: .05, highRate: .09, strategy: 'Group cloud agreement', nextStep: 'Combine LBU consumption and renewal dates, then request a group commitment proposal.', owner: 'IT Procurement' },
  { id: 'v02', name: 'Meridian Logistics', category: 'Logistics', color: '#00A7CA', eligibleShare: .65, lowRate: .04, highRate: .08, strategy: 'Bundle common freight lanes', nextStep: 'Map shared lanes and service levels before running a consolidated freight tender.', owner: 'Singapore Logistics' },
  { id: 'v03', name: 'Atlas Workspace', category: 'Office & workplace', color: '#596CE4', eligibleShare: .80, lowRate: .04, highRate: .07, strategy: 'Standardize the group catalogue', nextStep: 'Agree a core office catalogue and compare LBU prices for matching items.', owner: 'Indirect Procurement' },
  { id: 'v04', name: 'Vertex Advisory', category: 'Professional services', color: '#578BA4', eligibleShare: .45, lowRate: .03, highRate: .06, strategy: 'Negotiate a common rate card', nextStep: 'Normalize role descriptions, seniority bands, and deliverables across statements of work.', owner: 'Professional Services Lead' },
  { id: 'v05', name: 'Orbit Telecom', category: 'Telecom', color: '#096DAF', eligibleShare: .80, lowRate: .06, highRate: .10, strategy: 'Pool connectivity contracts', nextStep: 'Audit active lines and sites, remove dormant services, and seek a pooled tariff.', owner: 'IT Procurement' },
  { id: 'v06', name: 'Strata Facilities', category: 'Facilities', color: '#7389B2', eligibleShare: .60, lowRate: .03, highRate: .06, strategy: 'Bundle Singapore facilities services', nextStep: 'Compare site scopes and service levels, then consolidate comparable service packages.', owner: 'Facilities Category Lead' },
  { id: 'v07', name: 'Prism Digital', category: 'Marketing', color: '#9167CC', eligibleShare: .50, lowRate: .04, highRate: .08, strategy: 'Align agency scopes', nextStep: 'Separate production, retainers, and media fees before negotiating group terms.', owner: 'Marketing Procurement' },
  { id: 'v08', name: 'Waypoint Travel', category: 'Travel', color: '#358BA7', eligibleShare: .70, lowRate: .03, highRate: .06, strategy: 'Combine the travel programme', nextStep: 'Aggregate common destinations and booking fees for a preferred travel framework.', owner: 'Travel Category Lead' },
  { id: 'v09', name: 'Forge Industrial', category: 'MRO & industrial', color: '#B27D47', eligibleShare: .55, lowRate: .05, highRate: .09, strategy: 'Harmonize MRO specifications', nextStep: 'Match equivalent parts and approved specifications before aggregating volumes.', owner: 'Engineering Procurement' },
  { id: 'v10', name: 'Evergreen Packaging', category: 'Packaging', color: '#499E83', eligibleShare: .60, lowRate: .04, highRate: .08, strategy: 'Combine packaging volumes', nextStep: 'Compare materials, dimensions, and demand forecasts for a group packaging tender.', owner: 'Packaging Category Lead' },
  { id: 'v11', name: 'Horizon Systems', category: 'Cloud & software', color: '#3263C7', eligibleShare: .70, lowRate: .05, highRate: .09, strategy: 'Co-term software renewals', nextStep: 'Reconcile license assignments and align renewal dates for enterprise pricing.', owner: 'IT Procurement' },
  { id: 'v12', name: 'BlueCurrent Freight', category: 'Logistics', color: '#267F99', eligibleShare: .55, lowRate: .04, highRate: .07, strategy: 'Coordinate freight renewals', nextStep: 'Identify overlapping lanes and align tender windows across the participating units.', owner: 'Singapore Logistics' },
  { id: 'v13', name: 'Summit Talent', category: 'Professional services', color: '#AA76B2', eligibleShare: .50, lowRate: .03, highRate: .07, strategy: 'Consolidate recruitment terms', nextStep: 'Compare placement fees, guarantees, and hiring forecasts for a group framework.', owner: 'People Procurement' },
  { id: 'v14', name: 'Northstar Security', category: 'Facilities', color: '#6C8198', eligibleShare: .55, lowRate: .03, highRate: .06, strategy: 'Standardize security scopes', nextStep: 'Align staffing, licensing, and site-risk requirements before comparing rates.', owner: 'Facilities Category Lead' },
  { id: 'v15', name: 'Cedar Creative', category: 'Marketing', color: '#B66F9F', eligibleShare: .45, lowRate: .04, highRate: .07, strategy: 'Create a shared production panel', nextStep: 'Combine recurring production briefs and negotiate unit rates for repeat deliverables.', owner: 'Marketing Procurement' },
  { id: 'v16', name: 'Aster Data', category: 'Cloud & software', color: '#5978D2', eligibleShare: .65, lowRate: .05, highRate: .08, strategy: 'Pool analytics subscriptions', nextStep: 'Review active users, overlapping plans, and shared enterprise-license options.', owner: 'IT Procurement' },
  { id: 'v17', name: 'Terra Maintenance', category: 'MRO & industrial', color: '#A38561', eligibleShare: .50, lowRate: .03, highRate: .06, strategy: 'Coordinate maintenance frameworks', nextStep: 'Compare asset classes and response commitments for a common maintenance framework.', owner: 'Engineering Procurement' },
  { id: 'v18', name: 'Clearline Networks', category: 'Telecom', color: '#4D91BA', eligibleShare: .65, lowRate: .04, highRate: .08, strategy: 'Aggregate network capacity', nextStep: 'Review site capacity and resilience needs, then negotiate common connectivity terms.', owner: 'IT Procurement' },

];

const coverage = [
  [0,1,2], [0,1], [0,1,2], [0,1,2], [0,1,2], [0,1],
  [0,2], [0,1,2], [0,1], [0,2], [1], [2], [1,2], [2], [1], [2], [2], [2],
];
const vendorWeights = [16,12,6,12,7,9,6,5,7,5,3,4,5,3,3,3,3,3];
const unitWeights = [1.28,1.05,.90];
const seasonality = [.92,.87,1.01,.98,1.03,.99,1.04,1.00,1.08,1.12,1.09,1.17];
const records = [];
for (const year of [2025, 2026]) {
  const monthCount = year === 2026 ? 9 : 12;
  vendors.forEach((vendor, vendorIndex) => {
    const covered = coverage[vendorIndex];
    const allocation = covered.reduce((sum, unitIndex) => sum + unitWeights[unitIndex], 0);
    for (let month = 1; month <= monthCount; month++) {
      covered.forEach(unitIndex => {
        const variation = 1 + (((vendorIndex * 7 + unitIndex * 3 + month * 2) % 13) - 6) * .012;
        const growth = year === 2026 ? 1.075 + (vendorIndex % 5) * .006 : 1;
        const raw = vendorWeights[vendorIndex] * unitWeights[unitIndex] / allocation * seasonality[month - 1] * variation * growth;
        records.push({ id: `tx-${year}-${String(month).padStart(2,'0')}-${vendor.id}-${units[unitIndex].id}`, month: `${year}-${String(month).padStart(2,'0')}`, unitId: units[unitIndex].id, vendorId: vendor.id, category: vendor.category, raw });
      });
    }
  });
}
const target2026Sen = 1_248_000_000;
const raw2026Total = records.filter(row => row.month.startsWith('2026')).reduce((sum, row) => sum + row.raw, 0);
const scale = target2026Sen / raw2026Total;
export const transactions = records.map(({ raw, ...row }) => ({ ...row, amount: Math.round(raw * scale) }));
// A small, explicit credit note keeps net-spend handling visible in the demo.
transactions.push({ id: 'credit-2026-v03-bu01', month: '2026-06', unitId: 'bu-01', vendorId: 'v03', category: 'Office & workplace', amount: -185_000 });
transactions.push({ id: 'credit-2025-v05-bu04', month: '2025-11', unitId: 'bu-03', vendorId: 'v05', category: 'Telecom', amount: -125_000 });
const actual2026Total = transactions.filter(row => row.month.startsWith('2026')).reduce((sum, row) => sum + row.amount, 0);
transactions.find(row => row.month === '2026-09' && row.vendorId === 'v01').amount += target2026Sen - actual2026Total;
const unitGeography = new Map(units.map(unit => [unit.id, unit]));
for (const row of transactions) {
  const unit = unitGeography.get(row.unitId);
  row.continent = unit.continent;
  row.country = unit.country;
}

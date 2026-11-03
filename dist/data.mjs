// Fictional demonstration data. Amounts are integer Malaysian sen.
export const units = [
  { id: 'bu-01', name: 'Group Corporate', code: 'GCO', city: 'Kuala Lumpur', country: 'Malaysia' },
  { id: 'bu-02', name: 'Consumer Products', code: 'CON', city: 'Penang', country: 'Malaysia' },
  { id: 'bu-03', name: 'Industrial Solutions', code: 'IND', city: 'Johor Bahru', country: 'Malaysia' },
  { id: 'bu-04', name: 'Digital Ventures', code: 'DIG', city: 'Singapore', country: 'Singapore' },
  { id: 'bu-05', name: 'Retail & Commerce', code: 'RET', city: 'Jakarta', country: 'Indonesia' },
  { id: 'bu-06', name: 'Food & Agriculture', code: 'AGR', city: 'Bangkok', country: 'Thailand' },
  { id: 'bu-07', name: 'Healthcare Services', code: 'HEA', city: 'Manila', country: 'Philippines' },
  { id: 'bu-08', name: 'Energy & Utilities', code: 'ENE', city: 'Kuching', country: 'Malaysia' },
  { id: 'bu-09', name: 'Property & Hospitality', code: 'PRO', city: 'Ho Chi Minh City', country: 'Vietnam' },
  { id: 'bu-10', name: 'Mobility & Distribution', code: 'MOB', city: 'Surabaya', country: 'Indonesia' },
  { id: 'bu-11', name: 'Engineering & Projects', code: 'ENG', city: 'Shah Alam', country: 'Malaysia' },
  { id: 'bu-12', name: 'Media & Experiences', code: 'MED', city: 'Singapore', country: 'Singapore' },
];

export const categories = [
  'Cloud & software', 'Logistics', 'Office & workplace', 'Professional services',
  'Telecom', 'Facilities', 'Marketing', 'Travel', 'MRO & industrial', 'Packaging',
];

// Opportunity rates and addressable shares are illustrative assumptions, not benchmarks.
export const vendors = [
  { id: 'v01', name: 'Nimbus Cloud', category: 'Cloud & software', color: '#0042AC', eligibleShare: .75, lowRate: .05, highRate: .09, strategy: 'Group cloud agreement', nextStep: 'Combine unit consumption and renewal dates, then request a group commitment proposal.', owner: 'Group IT Procurement' },
  { id: 'v02', name: 'Meridian Logistics', category: 'Logistics', color: '#00A7CA', eligibleShare: .65, lowRate: .04, highRate: .08, strategy: 'Bundle common freight lanes', nextStep: 'Map shared lanes and service levels before running a consolidated freight tender.', owner: 'Regional Logistics' },
  { id: 'v03', name: 'Atlas Workspace', category: 'Office & workplace', color: '#596CE4', eligibleShare: .80, lowRate: .04, highRate: .07, strategy: 'Standardize the group catalogue', nextStep: 'Agree a core office catalogue and compare unit prices for matching items.', owner: 'Indirect Procurement' },
  { id: 'v04', name: 'Vertex Advisory', category: 'Professional services', color: '#578BA4', eligibleShare: .45, lowRate: .03, highRate: .06, strategy: 'Negotiate a common rate card', nextStep: 'Normalize role descriptions, seniority bands, and deliverables across statements of work.', owner: 'Professional Services Lead' },
  { id: 'v05', name: 'Orbit Telecom', category: 'Telecom', color: '#096DAF', eligibleShare: .80, lowRate: .06, highRate: .10, strategy: 'Pool connectivity contracts', nextStep: 'Audit active lines and sites, remove dormant services, and seek a pooled tariff.', owner: 'Group IT Procurement' },
  { id: 'v06', name: 'Strata Facilities', category: 'Facilities', color: '#7389B2', eligibleShare: .60, lowRate: .03, highRate: .06, strategy: 'Bundle regional facilities services', nextStep: 'Compare site scopes and service levels, then consolidate comparable service packages.', owner: 'Facilities Category Lead' },
  { id: 'v07', name: 'Prism Digital', category: 'Marketing', color: '#9167CC', eligibleShare: .50, lowRate: .04, highRate: .08, strategy: 'Align agency scopes', nextStep: 'Separate production, retainers, and media fees before negotiating group terms.', owner: 'Marketing Procurement' },
  { id: 'v08', name: 'Waypoint Travel', category: 'Travel', color: '#358BA7', eligibleShare: .70, lowRate: .03, highRate: .06, strategy: 'Combine the travel programme', nextStep: 'Aggregate common destinations and booking fees for a preferred travel framework.', owner: 'Travel Category Lead' },
  { id: 'v09', name: 'Forge Industrial', category: 'MRO & industrial', color: '#B27D47', eligibleShare: .55, lowRate: .05, highRate: .09, strategy: 'Harmonize MRO specifications', nextStep: 'Match equivalent parts and approved specifications before aggregating volumes.', owner: 'Engineering Procurement' },
  { id: 'v10', name: 'Evergreen Packaging', category: 'Packaging', color: '#499E83', eligibleShare: .60, lowRate: .04, highRate: .08, strategy: 'Combine packaging volumes', nextStep: 'Compare materials, dimensions, and demand forecasts for a group packaging tender.', owner: 'Packaging Category Lead' },
  { id: 'v11', name: 'Horizon Systems', category: 'Cloud & software', color: '#3263C7', eligibleShare: .70, lowRate: .05, highRate: .09, strategy: 'Co-term software renewals', nextStep: 'Reconcile license assignments and align renewal dates for enterprise pricing.', owner: 'Group IT Procurement' },
  { id: 'v12', name: 'BlueCurrent Freight', category: 'Logistics', color: '#267F99', eligibleShare: .55, lowRate: .04, highRate: .07, strategy: 'Coordinate freight renewals', nextStep: 'Identify overlapping lanes and align tender windows across the participating units.', owner: 'Regional Logistics' },
  { id: 'v13', name: 'Summit Talent', category: 'Professional services', color: '#AA76B2', eligibleShare: .50, lowRate: .03, highRate: .07, strategy: 'Consolidate recruitment terms', nextStep: 'Compare placement fees, guarantees, and hiring forecasts for a group framework.', owner: 'People Procurement' },
  { id: 'v14', name: 'Northstar Security', category: 'Facilities', color: '#6C8198', eligibleShare: .55, lowRate: .03, highRate: .06, strategy: 'Standardize security scopes', nextStep: 'Align staffing, licensing, and site-risk requirements before comparing rates.', owner: 'Facilities Category Lead' },
  { id: 'v15', name: 'Cedar Creative', category: 'Marketing', color: '#B66F9F', eligibleShare: .45, lowRate: .04, highRate: .07, strategy: 'Create a shared production panel', nextStep: 'Combine recurring production briefs and negotiate unit rates for repeat deliverables.', owner: 'Marketing Procurement' },
  { id: 'v16', name: 'Aster Data', category: 'Cloud & software', color: '#5978D2', eligibleShare: .65, lowRate: .05, highRate: .08, strategy: 'Pool analytics subscriptions', nextStep: 'Review active users, overlapping plans, and shared enterprise-license options.', owner: 'Group IT Procurement' },
  { id: 'v17', name: 'Terra Maintenance', category: 'MRO & industrial', color: '#A38561', eligibleShare: .50, lowRate: .03, highRate: .06, strategy: 'Coordinate maintenance frameworks', nextStep: 'Compare asset classes and response commitments for a common maintenance framework.', owner: 'Engineering Procurement' },
  { id: 'v18', name: 'Clearline Networks', category: 'Telecom', color: '#4D91BA', eligibleShare: .65, lowRate: .04, highRate: .08, strategy: 'Aggregate network capacity', nextStep: 'Review site capacity and resilience needs, then negotiate common connectivity terms.', owner: 'Group IT Procurement' },
  { id: 'v19', name: 'Pine & Paper', category: 'Office & workplace', color: '#6C9A8E', eligibleShare: .70, lowRate: .04, highRate: .07, strategy: 'Combine workplace demand', nextStep: 'Match paper and consumable specifications and consolidate scheduled orders.', owner: 'Indirect Procurement' },
  { id: 'v20', name: 'Contour Packaging', category: 'Packaging', color: '#72A55C', eligibleShare: .55, lowRate: .04, highRate: .08, strategy: 'Standardize packaging formats', nextStep: 'Check technical compatibility before aggregating orders for common formats.', owner: 'Packaging Category Lead' },
  { id: 'v21', name: 'Helix Lab Services', category: 'Professional services', color: '#8E93AB', eligibleShare: .35, lowRate: .02, highRate: .05, strategy: 'Review specialist service rates', nextStep: 'Validate accreditation requirements and compare rate cards at the next renewal.', owner: 'Healthcare Procurement' },
  { id: 'v22', name: 'Solstice Energy Care', category: 'MRO & industrial', color: '#B49A48', eligibleShare: .35, lowRate: .02, highRate: .05, strategy: 'Review specialist maintenance', nextStep: 'Review the asset maintenance scope and confirm technical alternatives with operations.', owner: 'Energy Procurement' },
  { id: 'v23', name: 'Lantern Events', category: 'Marketing', color: '#B87761', eligibleShare: .40, lowRate: .03, highRate: .06, strategy: 'Create a repeat-event rate card', nextStep: 'Document recurring event requirements and agree reusable production rates.', owner: 'Media Procurement' },
  { id: 'v24', name: 'Kestrel Engineering', category: 'Professional services', color: '#8192A0', eligibleShare: .35, lowRate: .02, highRate: .05, strategy: 'Review engineering frameworks', nextStep: 'Validate role grades, project scopes, and specialist capacity before renewal.', owner: 'Engineering Procurement' },
];

const coverage = [
  [0,1,2,3,4,5,6,7,8,9,10,11], [1,2,4,5,6,7,8,9,10],
  [0,1,2,3,4,5,6,7,8,9,10,11], [0,1,2,3,4,6,7,8,10,11],
  [0,1,2,3,4,5,6,7,8,9,10,11], [0,1,2,4,5,6,7,8,9,10],
  [0,1,3,4,6,8,11], [0,1,2,3,4,5,6,7,8,9,10,11],
  [1,2,5,7,9,10], [1,4,5,9], [0,2,3,4,6,8,10], [1,2,4,5,9],
  [0,3,4,6,11], [2,6,7,8,10], [1,4,11], [0,3,6,11],
  [2,7,10], [3,4,9], [0,6], [1,5], [6], [7], [11], [10],
];
const vendorWeights = [12,14,4,9,6,7,5,4,6,5,5,4,3,3,2,2,2,2,1,1,1,1,1,2];
const unitWeights = [1.14,1.22,1.35,1.18,1.08,.95,.94,1.2,.86,1.06,1.15,.79];
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
const target2026Sen = 5_864_000_000;
const raw2026Total = records.filter(row => row.month.startsWith('2026')).reduce((sum, row) => sum + row.raw, 0);
const scale = target2026Sen / raw2026Total;
export const transactions = records.map(({ raw, ...row }) => ({ ...row, amount: Math.round(raw * scale) }));
// A small, explicit credit note keeps net-spend handling visible in the demo.
transactions.push({ id: 'credit-2026-v03-bu01', month: '2026-06', unitId: 'bu-01', vendorId: 'v03', category: 'Office & workplace', amount: -1_850_000 });
transactions.push({ id: 'credit-2025-v05-bu04', month: '2025-11', unitId: 'bu-04', vendorId: 'v05', category: 'Telecom', amount: -1_250_000 });
const actual2026Total = transactions.filter(row => row.month.startsWith('2026')).reduce((sum, row) => sum + row.amount, 0);
transactions.find(row => row.month === '2026-09' && row.vendorId === 'v01').amount += target2026Sen - actual2026Total;

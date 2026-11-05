import { units as demoUnits, vendors as demoVendors, categories as demoCategories, transactions as demoTransactions } from './data.mjs?v=20261106.1';
import { filterRows, summarize, priorYearRows, overlapAnalysis } from './analytics.mjs?v=20261106.1';
import { money, compact, range, csvCell, parseCSV } from './utilities.mjs?v=20261106.1';
import { parseSpendCSV } from './import.mjs?v=20261106.1';
import { dashboard } from './dashboard.mjs?v=20261106.1';

function loadLBUConfig() {
  try {
    const names=JSON.parse(localStorage.getItem('overarch-singapore-lbu-names-v1')||'null');
    if(Array.isArray(names)&&names.length===3&&names.every(n=>typeof n==='string'&&n.trim().length>0&&n.length<=100)&&new Set(names.map(n=>n.trim().toLowerCase())).size===3)
      return demoUnits.map((u,i)=>({...u,name:names[i].trim()}));
  } catch {}
  return demoUnits.map(u=>({...u}));
}

let dataset = { units: loadLBUConfig(), vendors: demoVendors, categories: demoCategories, rows: demoTransactions, demo: true };
let view = 'overview';
const emptyScope = period => ({ period, unit: 'all', continent: 'all', category: 'all', month: 'all', supplier: 'all', search: '' });
let filters = emptyScope('2026');
let trendMode = 'monthly';
let compareEnabled = true;
let scenarioRate = 5;
let plan = readPlan();
let currentDetail = null;
let toastTimer;
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const percent = value => new Intl.NumberFormat('en-SG', { style: 'percent', maximumFractionDigits: 1 }).format(value);
const views = {
  overview: ['Spend overview', 'Singapore spend. Connected.', 'Three LBUs. One market. Find the buying power between them.'],
  units: ['LBU comparison', 'Three units. A clearer picture.', 'Compare spend, supplier coverage and shared buying opportunities across Singapore.'],
  categories: ['Category overlap', 'Same need. Different suppliers?', 'Find categories bought across LBUs and compare the supplier choices behind them.'],
  overlap: ['Supplier overlap', 'Follow the common thread.', 'Find the suppliers that connect your LBUs. Start a better conversation.'],
  opportunities: ['Opportunities', 'Turn overlap into opportunity.', 'A focused shortlist of sourcing moves, backed by the spend in your scope.'],
  plan: ['Action plan', 'Insight, with a next step.', 'Give your sourcing opportunities an owner and a path forward.'],
};
const paths = {
  overview: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  categories: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>',
  units: '<path d="M3 21V8l9-5v18M12 8h9v13M7 10v2m0 3v2m9-5h2m-2 4h2M1 21h22"/>',
  overlap: '<circle cx="8" cy="12" r="6"/><circle cx="16" cy="12" r="6"/>',
  opportunities: '<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1.5 1-1 3-1 3H9s.5-2-1-3Z"/>',
  plan: '<rect x="5" y="5" width="15" height="17" rx="2"/><path d="M9 5V2h7v3M9 11l2 2 5-5M9 17h7"/>',
};
function icon(name) { return `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">${paths[name]}</svg>`; }
function readPlan() {
  try { const saved = JSON.parse(localStorage.getItem('overarch-singapore-lbu-plan-v3') || '{}'); if (!saved || Array.isArray(saved) || typeof saved !== 'object') return {}; return Object.fromEntries(Object.entries(saved).filter(([id, item]) => demoVendors.some(v => v.id === id) && item && typeof item.owner === 'string' && ['Identified','Validating','Approved','In progress','Closed'].includes(item.status)).map(([id, item]) => [id, { owner: item.owner.slice(0,100), status: item.status }])); } catch { return {}; }
}
function persistPlan() { if (!dataset.demo) return; try { localStorage.setItem('overarch-singapore-lbu-plan-v3', JSON.stringify(plan)); } catch { toast('Your plan works for this session. Browser storage is unavailable.'); } }
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500); }
function selection() { const rows = filterRows(dataset.rows.map(r=>({...r,unitName:dataset.units.find(u=>u.id===r.unitId)?.name})), filters); return { rows, summary: summarize(rows, dataset.units, dataset.vendors) }; }
function navigate(next) { if (!views[next]) return; view = next; filters.search = ''; history.replaceState(null, '', '#' + next); $('.sidebar').classList.remove('is-open'); $('#menu-toggle').setAttribute('aria-expanded','false'); render(); window.scrollTo({ top: 0, behavior: 'instant' }); }

function comparableRows(fullPeriod) { return priorYearRows(dataset.rows,filters,{fullPeriod}); }
function renderScopeChips() {
  const labels={unit:dataset.units.find(u=>u.id===filters.unit)?.name,category:filters.category,month:filters.month==='all'?'all':new Date(filters.month+'-01T12:00:00Z').toLocaleDateString('en-GB',{month:'short',year:'numeric',timeZone:'UTC'}),supplier:dataset.vendors.find(v=>v.id===filters.supplier)?.name};
  const entries=Object.entries(labels).filter(([key,label])=>filters[key]!=='all'&&label);
  $('#active-filters').innerHTML=entries.length?`<span>FOCUSED ON</span>${entries.map(([key,label])=>`<button data-clear-filter="${key}" aria-label="Clear ${esc(label)} filter">${esc(label)} <span>×</span></button>`).join('')}<button class="clear-all" data-reset>Clear all</button>`:'';
  $('#active-filters').hidden=!entries.length;
}
function focusLBU(id) {
  if(!dataset.units.some(u=>u.id===id))return;
  filters.unit=filters.unit===id?'all':id;filters.search='';render();
}

function setupFilters() {

  $('#unit-filter').innerHTML = '<option value="all">All LBUs</option>' + dataset.units.filter(u=>filters.continent==='all'||u.continent===filters.continent).map(u => `<option value="${esc(u.id)}">${esc(u.name)}</option>`).join('');
  $('#category-filter').innerHTML = '<option value="all">All categories</option>' + dataset.categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  const years = [...new Set(dataset.rows.map(r => r.month.slice(0,4)))].sort().reverse();
  $('#period-filter').innerHTML = years.map(y => `<option value="${y}">${y}${dataset.demo ? y === '2026' ? ' · Jan–Sep' : ' · Full year' : ''}</option>`).join('') + '<option value="all">All periods</option>';
  for (const [name, selector] of [['period','#period-filter'],['unit','#unit-filter'],['category','#category-filter']]) $(selector).value = filters[name];
}
function render() {
  const { rows, summary } = selection();
  $('#configure-button').disabled=!dataset.demo;
  $('#configure-button').title=dataset.demo?'Rename the three demo LBUs':'LBU names come from your imported CSV';
  setupFilters();
  $('#navigation').innerHTML = Object.entries(views).map(([key, value]) => `<button class="nav-item ${view === key ? 'active' : ''}" data-view="${key}" ${view === key ? 'aria-current="page"' : ''}>${icon(key)}<span>${value[0]}</span>${key === 'plan' && Object.keys(plan).length ? `<span class="nav-count">${Object.keys(plan).length}</span>` : ''}${key === 'units' ? `<span class="nav-count">${dataset.units.length}</span>` : ''}</button>`).join('');
  $('#page-title').textContent = views[view][1]; $('#page-description').textContent = views[view][2]; $('#breadcrumb-name').textContent = views[view][0];
  $('#scope-caption').textContent = `${summary.activeUnitCount} ${summary.activeUnitCount === 1 ? 'LBU' : 'LBUs'}`;
  renderScopeChips();
  $('#content').innerHTML = view === 'overview' ? dashboard(summary, rows, {units:dataset.units, demo:dataset.demo, filters, trendRows:filterRows(dataset.rows,{...filters,month:'all'}), previousRows:comparableRows(false), comparisonRows:comparableRows(true), trendMode, compareEnabled, scenarioRate}) : view === 'categories' ? categoriesView() : view === 'units' ? unitsView(summary) : view === 'overlap' ? overlapView(summary) : view === 'opportunities' ? opportunitiesView(summary) : planView(summary);
}
function stats(s) {
  const share = s.total > 0 ? s.sharedSpend / s.total : 0;
  return `<section class="stats-grid" aria-label="Spend at a glance">
    <article class="stat-card"><div class="stat-top"><span>Net spend in scope</span><span class="stat-symbol">↗</span></div><div class="stat-value">${compact(s.total)}</div><div class="stat-bottom">${s.activeUnitCount} ${s.activeUnitCount === 1 ? 'LBU' : 'LBUs'} <span>·</span> ${s.vendorCount} active ${s.vendorCount === 1 ? 'supplier' : 'suppliers'}</div></article>
    <article class="stat-card"><div class="stat-top"><span>Shared-supplier spend</span><span class="stat-symbol">⋈</span></div><div class="stat-value">${compact(s.sharedSpend)}</div><div class="stat-bottom"><strong>${percent(share)}</strong> of spend in this scope</div></article>
    <article class="stat-card"><div class="stat-top"><span>Shared suppliers</span><span class="stat-symbol">⊙</span></div><div class="stat-value">${s.sharedCount}<span style="font-size:13px;color:#9babbc;font-weight:400;letter-spacing:0"> / ${s.vendorCount}</span></div><div class="stat-bottom">Used by 2+ selected LBUs</div></article>
    <article class="stat-card featured"><div class="stat-top"><span>Illustrative potential</span><span class="stat-symbol">✧</span></div><div class="stat-value range">${s.estimatedHigh ? range(s.estimatedLow,s.estimatedHigh) : 'S$0'}</div><div class="stat-bottom"><span class="status-dot"></span> Modeled estimate <span>·</span> ${s.opportunities.length} sourcing moves</div></article>
  </section>`;
}
function matrixPanel(s, large) {
  const displayUnits = dataset.units.filter(u => s.unitStats.some(stat => stat.id === u.id));
  const displayVendors = s.vendorStats.filter(v => v.unitCount >= 2).slice(0, large ? 24 : 7);
  const max = Math.max(1, ...displayVendors.flatMap(v => Object.values(v.byUnit)));
  return `<section class="panel matrix-card ${large ? 'matrix-large' : ''}" aria-label="Shared suppliers spend matrix"><div class="panel-header"><div><h2>Where your spend connects</h2><p class="panel-subtitle">Top ${large ? Math.min(24, s.sharedCount) : Math.min(7, s.sharedCount)} shared suppliers across your LBUs${large ? ' · select a cell to explore' : ''}</p></div><span class="pill shared-pill">${s.sharedCount} shared suppliers</span></div>${!large ? `<div class="bridge-banner"><span class="bridge-icon">⋈</span><p><strong>${percent(s.total > 0 ? s.sharedSpend / s.total : 0)} of group spend</strong> touches a shared supplier.<br>That's a conversation worth having together.</p><button class="text-button" data-view="overlap">Explore →</button></div>` : ''}${displayVendors.length ? `<div class="matrix-wrap" tabindex="0" aria-label="Supplier by LBU spend. Scroll horizontally to view every LBU."><table class="matrix"><caption class="sr-only">Net supplier spend by LBU in SGD; darker cells mean higher spend</caption><thead><tr><th scope="col">Supplier / LBU</th>${displayUnits.map(u => `<th scope="col" title="${esc(u.name)}">${esc(u.name)}</th>`).join('')}${large ? '<th scope="col">Total SGD</th>' : ''}</tr></thead><tbody>${displayVendors.map(v => `<tr><td class="supplier-cell"><button class="supplier-name" data-vendor="${esc(v.id)}">${esc(v.name)}<small>${v.unitCount} ${v.unitCount===1?'LBU':'LBUs'} · ${esc(v.category)}</small></button></td>${displayUnits.map(u => { const amount = v.byUnit[u.id] || 0; const intensity = amount > 0 ? .17 + .83 * Math.pow(amount / max,.55) : 0; const color = amount > 0 ? `hsl(${257} ${45 + intensity * 45}% ${12 + intensity * 48}%)` : ''; return `<td><button class="heatcell ${amount === 0 ? 'is-zero' : ''}" ${color ? `style="background:${color};border-color:${color}"` : ''} data-vendor="${esc(v.id)}" title="${esc(v.name)} · ${esc(u.name)}: ${money(amount)}" aria-label="${esc(v.name)} at ${esc(u.name)}, ${money(amount)}"></button></td>`; }).join('')}${large ? `<td>${money(v.total)}</td>` : ''}</tr>`).join('')}</tbody></table></div>` : empty('No shared suppliers in this scope', 'Shared suppliers need positive spend in at least two selected LBUs.')}<div class="matrix-footer"><span>Net spend · select a supplier for details</span><span class="legend">Less ${['#161323','#2c1e53','#4b258f','#6331fb','#b69bff'].map(c => `<i class="legend-block" style="background:${c}"></i>`).join('')} More</span></div></section>`;
}
function unitRanking(s) {
  const max = Math.max(1,...s.unitStats.map(u=>u.total));
  return `<section class="panel"><div class="panel-header"><div><h2>Spend by LBU</h2><p class="panel-subtitle">A group view, with local context</p></div><button class="text-button" data-view="units" aria-label="View all LBUs">View all ↗</button></div><div class="rank-list">${s.unitStats.slice(0,6).map((u,i) => `<button class="rank-item" data-unit="${esc(u.id)}"><div class="rank-top"><span class="rank-name">${esc(u.name)}</span><span class="rank-value">${compact(u.total)}</span></div><div class="rank-bar"><span style="width:${Math.max(0,u.total / max * 100)}%;background:${i === 0 ? '#6331fb' : i === 1 ? '#8860ff' : i === 2 ? '#88f9c0' : '#b19af6'}"></span></div><div class="rank-meta">${esc(u.city)} <span>·</span> ${u.vendorCount} suppliers</div></button>`).join('') || '<p class="panel-subtitle">No spend in this selection.</p>'}</div><div class="rank-footer"><span>${s.activeUnitCount} LBUs in view</span><span>Singapore · SGD</span></div></section>`;
}
function opportunityCard(v) {
  return `<article class="opportunity-card"><div class="opportunity-top"><span class="category-icon">${v.category.includes('Cloud') ? '⌘' : v.category.includes('Logistics') ? '⇄' : v.category.includes('Telecom') ? '⌁' : '⋈'}</span><span class="opportunity-label">${v.unitCount === dataset.units.length && v.unitCount >= 2 ? 'Group leverage' : 'Coordinate buying'}</span></div><h3><button class="row-link" data-vendor="${esc(v.id)}">${esc(v.strategy)}</button></h3><p>${esc(v.name)} serves ${v.unitCount} ${v.unitCount===1?'LBU':'LBUs'}. Bring ${compact(v.eligibleSpend)} of eligible spend into one conversation.</p><div class="opp-vendor"><span class="vendor-dot"></span>${esc(v.category)} <span>·</span> ${v.unitCount} ${v.unitCount===1?'LBU':'LBUs'}</div><div class="opportunity-impact"><div><small>Illustrative potential</small><div class="potential-value">${range(v.estimateLow,v.estimateHigh)}</div></div><button class="add-plan ${plan[v.id] ? 'saved' : ''}" data-plan="${esc(v.id)}" aria-label="${plan[v.id] ? 'Remove' : 'Add'} ${esc(v.name)} ${plan[v.id] ? 'from' : 'to'} action plan" title="${plan[v.id] ? 'In plan — click to remove' : 'Add to action plan'}">${plan[v.id] ? '✓' : '+'}</button></div></article>`;
}
function empty(title, description) { return `<div class="empty-state"><h2>${esc(title)}</h2><p>${esc(description)}</p><button class="button button-secondary" data-reset>Reset scope</button></div>`; }
function unitsView(s) {
  return stats(s) + `<section class="panel lower-section"><div class="panel-header"><div><h2>The LBU landscape</h2><p class="panel-subtitle">All amounts follow your selected reporting scope.</p></div><span class="pill">${s.unitStats.length} LBUs</span></div><div class="data-table-wrap"><table class="data-table"><thead><tr><th scope="col">LBU</th><th scope="col">Market</th><th scope="col">Net spend</th><th scope="col">Group share</th><th scope="col">Suppliers</th><th scope="col">Shared-supplier spend</th><th scope="col">Explore</th></tr></thead><tbody>${s.unitStats.map(u=>`<tr><td><span class="unit-code">${esc(u.code)}</span><button class="row-link" data-unit="${esc(u.id)}">${esc(u.name)}</button></td><td>Singapore</td><td class="amount">${money(u.total)}</td><td>${percent(s.total > 0 ? u.total / s.total : 0)}</td><td>${u.vendorCount}</td><td class="amount">${money(u.sharedSpend)}</td><td><button class="text-button" data-unit="${esc(u.id)}">Explore LBU →</button></td></tr>`).join('')}</tbody></table></div>${!s.unitStats.length ? empty('No LBUs in scope','Try another reporting period or category.') : ''}<div class="subtle-note">Group share and shared-supplier spend are calculated across the units currently selected. Selecting a single unit sets shared suppliers to zero.</div></section>`;
}
function categoriesView() {
  const {rows}=selection(), analysis=overlapAnalysis(rows,dataset.units,dataset.vendors);
  return `<div class="view-intro"><div><h2>Look beyond the common vendor.</h2><p>LBUs can buy the same category from different suppliers. Compare specifications before combining demand.<br>These signals carry no additional savings estimate, avoiding overlap with supplier opportunities.</p></div><div class="intro-number">${analysis.fragmentedCount}<span style="display:block;font:10px 'DM Sans',sans-serif;color:#bcd6ed;text-align:right;margin-top:5px">supplier-panel signals</span></div></div>${analysis.categories.length?`<div class="category-signal-grid">${analysis.categories.map(c=>`<section class="panel category-signal"><div class="panel-header"><div><span class="signal-tag ${c.fragmented?'mint-tag':''}">${c.fragmented?'Different supplier choices':'Common buying need'}</span><h2>${esc(c.name)}</h2><p class="panel-subtitle">${c.unitCount} LBUs · ${c.vendorCount} suppliers · ${compact(c.total)} net spend</p></div><button class="text-button" data-category-focus="${esc(c.name)}">Focus dashboard ↗</button></div><div class="category-lbu-rows">${dataset.units.map(u=>{const suppliers=c.suppliers.filter(v=>(v.byUnit[u.id]||0)>0);return `<div class="category-lbu-row"><div><strong>${esc(u.name)}</strong><span>${money(c.byUnit[u.id]||0)}</span></div><p>${suppliers.length?suppliers.map(v=>`<button class="row-link" data-vendor="${esc(v.id)}">${esc(v.name)}</button>`).join('<span class="supplier-separator"> · </span>'):'No positive net supplier spend'}</p></div>`;}).join('')}</div><div class="signal-next-step"><strong>${esc(c.strategy)}</strong><p>${esc(c.nextStep)}</p><small>${c.sharedSupplierCount} shared suppliers in this category · ${c.exclusiveSupplierCount} used by one LBU only</small></div></section>`).join('')}</div>`:empty('No cross-LBU category overlap in this scope','Select all LBUs and clear supplier or category filters to compare buying needs.')}`;
}
function searchToolbar(s) { return `<div class="table-toolbar"><label style="flex:1"><span class="sr-only">Search suppliers, units or categories</span><input class="search-box" id="supplier-search" type="search" value="${esc(filters.search)}" placeholder="Search suppliers, units or categories…"></label><span class="pill">${s.vendorCount} suppliers in scope</span></div>`; }
function overlapView(s) {
  return stats(s) + `<section class="panel lower-section"><div class="panel-header"><div><h2>Connected suppliers</h2><p class="panel-subtitle">One supplier identity. Every participating unit.</p></div><span class="pill">${s.sharedCount} shared</span></div>${searchToolbar(s)}<div class="data-table-wrap"><table class="data-table"><thead><tr><th scope="col">Supplier</th><th scope="col">Category</th><th scope="col">Net spend</th><th scope="col">LBUs</th><th scope="col">Potential range</th><th scope="col">Next step</th></tr></thead><tbody>${s.vendorStats.map(v=>`<tr><td><button class="row-link" data-vendor="${esc(v.id)}">${esc(v.name)}</button><span class="row-sub">${v.unitCount > 1 ? 'Shared supplier' : 'LBU-specific supplier'}</span></td><td>${esc(v.category)}</td><td class="amount">${money(v.total)}</td><td><span class="pill ${v.unitCount > 1 ? 'shared-pill' : ''}">${v.unitCount} ${v.unitCount===1?'LBU':'LBUs'}</span></td><td class="amount">${v.estimateHigh ? range(v.estimateLow,v.estimateHigh) : '—'}</td><td><button class="text-button" data-vendor="${esc(v.id)}">Explore →</button></td></tr>`).join('')}</tbody></table></div>${!s.vendorStats.length ? empty('No suppliers match','Try a shorter search or clear your scope filters.') : ''}<div class="subtle-note">A shared supplier has positive net spend in at least two selected LBUs. A common vendor does not, by itself, mean the service specifications are comparable.</div></section>${matrixPanel(s,true)}`;
}
function opportunitiesView(s) {
  return `<div class="view-intro"><div><h2>A shared supplier is a starting point.</h2><p>Validate specifications, local constraints, contracts, and switching costs before acting.<br>Each supplier contributes to one primary opportunity, keeping this estimate free of double counting.</p></div><div class="intro-number">${s.opportunities.length}<span style="display:block;font:10px 'DM Sans',sans-serif;color:#bcd6ed;text-align:right;margin-top:5px">sourcing moves</span></div></div>${stats(s)}${s.opportunities.length ? `<div class="opportunity-grid opp-full-grid">${s.opportunities.map(opportunityCard).join('')}</div>` : empty('No cross-LBU opportunities here','Choose all LBUs to look for shared suppliers.')}`;
}
function planView(s) {
  const entries = s.opportunities.filter(v=>plan[v.id]);
  const low = entries.reduce((a,v)=>a+v.estimateLow,0), high=entries.reduce((a,v)=>a+v.estimateHigh,0);
  return `<div class="view-intro"><div><h2>From a signal to a sourcing conversation.</h2><p>Your ${dataset.demo ? 'demo ' : ''}plan is ${dataset.demo ? 'saved in this browser' : 'kept for this session'}. Workflow status never changes the modeled benefit.<br>Export your plan to take these next steps into your category review.</p></div><button class="button button-secondary" id="export-plan">↓ Export plan</button></div><section class="stats-grid full-view-stats"><article class="stat-card"><div class="stat-top">Sourcing moves in scope</div><div class="stat-value">${entries.length}</div><div class="stat-bottom">${Object.keys(plan).length} saved across all scopes</div></article><article class="stat-card"><div class="stat-top">Eligible spend in scope</div><div class="stat-value">${compact(entries.reduce((a,v)=>a+v.eligibleSpend,0))}</div><div class="stat-bottom">Distinct supplier opportunities</div></article><article class="stat-card featured"><div class="stat-top">Illustrative plan potential</div><div class="stat-value range">${high ? range(low,high) : 'S$0'}</div><div class="stat-bottom">Estimate only · validate before committing</div></article></section><section class="panel lower-section"><div class="panel-header"><div><h2>Your sourcing action plan</h2><p class="panel-subtitle">Owners and status can be edited directly.</p></div><span class="pill">${entries.length} in current scope</span></div>${entries.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th scope="col">Supplier & strategy</th><th scope="col">Potential range</th><th scope="col">Owner</th><th scope="col">Status</th><th scope="col">Remove</th></tr></thead><tbody>${entries.map(v=>`<tr><td><button class="row-link" data-vendor="${esc(v.id)}">${esc(v.name)}</button><span class="row-sub">${esc(v.strategy)}</span></td><td class="amount">${range(v.estimateLow,v.estimateHigh)}</td><td><input class="owner-input" data-owner="${esc(v.id)}" aria-label="Owner for ${esc(v.name)}" value="${esc(plan[v.id].owner)}" maxlength="100" placeholder="Assign an owner"></td><td><select class="plan-status" data-status="${esc(v.id)}" aria-label="Status for ${esc(v.name)}">${['Identified','Validating','Approved','In progress','Closed'].map(status=>`<option ${status === plan[v.id].status ? 'selected' : ''}>${status}</option>`).join('')}</select></td><td><button class="remove-plan" data-plan="${esc(v.id)}" aria-label="Remove ${esc(v.name)} from plan">Remove</button></td></tr>`).join('')}</tbody></table></div>` : `<div class="empty-state"><h2>${Object.keys(plan).length ? 'Your saved moves are outside this scope.' : 'Your next move starts with an overlap.'}</h2><p>${Object.keys(plan).length ? 'Reset filters to see your saved actions, or find more opportunities in this selection.' : 'Explore a shared supplier, review the evidence, and add it to your plan.'}</p><button class="button button-primary" data-view="opportunities">Explore opportunities →</button></div>`}<div class="subtle-note">Plan estimates are recalculated using your current period, LBU and category filters. ${dataset.demo ? 'Only demo action owners and status are stored locally.' : 'Imported data and actions are not saved after a refresh.'}</div></section>`;
}
function openVendor(id) {
  const {summary:s}=selection(), v=s.vendorStats.find(v=>v.id===id); if(!v) return;
  currentDetail=id;
  const max = Math.max(1,...Object.values(v.byUnit));
  const participating = s.unitStats.filter(u=>(v.byUnit[u.id] || 0)!==0).sort((a,b)=>(v.byUnit[b.id]||0)-(v.byUnit[a.id]||0));
  $('#detail-content').innerHTML=`<header class="detail-header"><form method="dialog" class="dialog-top"><span class="eyebrow">THE CONNECTION, UP CLOSE</span><button class="icon-button" aria-label="Close supplier details">×</button></form><h2 id="detail-title">${esc(v.name)}</h2><p>${esc(v.category)} <span>·</span> ${v.unitCount >= 2 ? 'Shared supplier' : 'LBU-specific supplier'} <span>·</span> ${dataset.demo ? 'Fictional demo vendor' : 'Imported supplier'}</p></header><div class="detail-body"><div class="detail-metrics"><div><small>Net spend in scope</small><strong>${compact(v.total)}</strong></div><div><small>Participating LBUs</small><strong>${v.unitCount}<span style="font-size:12px;color:#8b9db1"> / ${s.activeUnitCount}</span></strong></div></div><button class="button button-secondary wide-button focus-supplier" data-focus-supplier="${esc(v.id)}">Focus dashboard on this supplier ↗</button><h3>Where the spend sits</h3>${participating.map(u=>`<div class="detail-unit-row"><span>${esc(u.name)}<span style="display:block;font-size:8px;color:#94a6b8;margin-top:4px">${esc(u.city)}</span></span><strong>${money(v.byUnit[u.id])}</strong></div><div class="detail-unit-bar"><span style="width:${Math.max(0,v.byUnit[u.id]/max*100)}%"></span></div>`).join('')}${v.estimateHigh ? `<section class="strategy-box"><span class="eyebrow">A PRACTICAL NEXT MOVE</span><h3>${esc(v.strategy)}</h3><p>${esc(v.nextStep)}</p><div class="estimate-line">${range(v.estimateLow,v.estimateHigh)} illustrative potential</div><div class="estimate-assumption">${money(v.eligibleSpend)} eligible spend × ${percent(v.lowRate)}–${percent(v.highRate)} assumed improvement<br>Eligible share: ${percent(v.eligibleShare)} of positive net spend by unit. Scenario assumptions, not market benchmarks.</div></section><p class="detail-disclaimer">Start with ${esc(v.owner)}. Confirm comparable scope, supplier identity, LBU requirements, contract terms, and switching costs. This estimate is not a promise or realized saving.</p><button class="button ${plan[v.id] ? 'button-secondary' : 'button-primary'} wide-button" data-plan="${esc(v.id)}">${plan[v.id] ? '✓ In your plan · click to remove' : '+ Add to action plan'}</button>` : `<section class="strategy-box"><h3>No cross-LBU estimate in this selection.</h3><p>Shared opportunities require positive net spend in two or more selected LBUs. Widen the scope to compare this supplier across the group.</p></section>`}</div>`;
  if(!$('#detail-dialog').open) $('#detail-dialog').showModal();
}
function togglePlan(id) {
  const v=selection().summary.vendorStats.find(v=>v.id===id); if(!v) return;
  const wasAdded=!!plan[id];
  if(wasAdded) delete plan[id]; else { if(!v.estimateHigh) return; plan[id]={owner:v.owner,status:'Identified'}; }
  persistPlan(); render();
  if($('#detail-dialog').open) openVendor(id);
  toast(wasAdded ? `${v.name} removed from your plan.` : `${v.name} added to your action plan.`);
}
function resetFilters() { filters=emptyScope([...new Set(dataset.rows.map(r=>r.month.slice(0,4)))].sort().reverse()[0] || 'all');render(); }
function showMethod() {
  $('#method-content').innerHTML=`<h3>${dataset.demo?'A Singapore LBU demonstration':'Your Singapore spend'}</h3><p>${dataset.demo?`Three placeholder LBUs, ${demoVendors.length} fictional suppliers and ${demoTransactions.length.toLocaleString()} synthetic spend records across 2025 and January–September 2026. The default 2026 net spend is S$12.48m. All LBUs belong to Singapore. Edit LBU names to personalize the demo.`:'The CSV is processed locally in this browser. Imported spend and actions stay in memory and disappear on refresh. All amounts must already be in SGD; there is no FX conversion.'} Credits reduce net spend.</p><h3>Shared suppliers</h3><p>A supplier is shared when it has positive net spend in at least two selected LBUs. Shared-supplier spend counts each supplier’s scoped net spend once, including credits. It is not a duplicate-payment metric. Selecting one LBU sets cross-LBU overlap to zero. Year, LBU, category, month, supplier and search filters apply first. Pairwise comparisons overlap with each other when a supplier serves all three LBUs; never add pair totals together.</p><h3>Category overlap</h3><p>A category overlaps when at least two selected LBUs have positive net spend in it. A supplier-panel signal means the category has multiple suppliers and at least one supplier serves just one LBU in that category. It prompts a specification and scope review, not an automatic consolidation recommendation. Supplier counts reflect positive net spend. Category signals carry no extra savings estimate.</p><h3>Illustrative potential</h3><p>Each shared supplier contributes one modeled opportunity. Eligible spend is positive net supplier spend by LBU multiplied by an assumed eligible share. Potential = eligible spend × an assumed improvement range. Imported suppliers default to a 65% eligible share and 3–6% improvement range. These are working assumptions, not benchmarks, quotations or realized savings. Check legal supplier identities, comparable services, contract terms, renewal dates and switching costs.</p><h3>Trends and scenarios</h3><p>Prior-year comparisons align to the same calendar months represented in the current filtered scope. The trend retains the full reporting period for context. The 1–12% what-if slider is independent of supplier-specific ranges; neither is realized savings.</p><h3>Local storage and data quality</h3><p>${dataset.demo?'Demo LBU names and action owners/statuses are saved in this browser when storage is available.':'Imported actions last for this session only; export before refreshing.'} Names match after Unicode, case and whitespace normalization. Legal supplier aliases are not resolved automatically. Rows at the same month/LBU/supplier/category grain are summed; repeated invoices are not detected. The network illustration shows LBU relationships, not office locations or physical flows.</p>`;
  $('#method-dialog').showModal();
}
function downloadCSV(filename, header, rows) {
  const text='\uFEFF'+[header,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n'); const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'})); const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportData() {
  if(view==='plan') return exportPlan();
  const rows=selection().rows;
  const units=new Map(dataset.units.map(u=>[u.id,u.name])),vendors=new Map(dataset.vendors.map(v=>[v.id,v.name]));
  downloadCSV(`overarch-spend-${filters.period}.csv`,['month','lbu','country','vendor','category','amount_sgd'],rows.map(r=>[r.month,units.get(r.unitId),'Singapore',vendors.get(r.vendorId),r.category,r.amount/100]));
  toast(`${rows.length.toLocaleString()} records exported for your current scope.`);
}
function exportPlan() {
  const entries=selection().summary.opportunities.filter(v=>plan[v.id]);
  downloadCSV('overarch-action-plan.csv',['supplier','category','strategy','lbus','eligible_spend_sgd','assumed_low_rate','assumed_high_rate','illustrative_low_sgd','illustrative_high_sgd','owner','status','next_step','period'],entries.map(v=>[v.name,v.category,v.strategy,v.unitCount,v.eligibleSpend/100,v.lowRate,v.highRate,v.estimateLow/100,v.estimateHigh/100,plan[v.id].owner,plan[v.id].status,v.nextStep,filters.period]));
  toast(`${entries.length} sourcing ${entries.length===1?'move':'moves'} exported for your current scope.`);
}
async function importCSV() {
  const file=$('#csv-file').files[0];if(!file)return;
  const status=$('#import-status');status.textContent='Checking your file…';$('#load-csv-button').disabled=true;
  try {
    if(file.size>2*1024*1024)throw Error('Choose a CSV smaller than 2 MB.');
    dataset=parseSpendCSV(await file.text());plan={};$('#data-mode').textContent='Imported SGD data · local';
    filters=emptyScope('all');view='overview';history.replaceState(null,'','#overview');setupFilters();render();$('#import-dialog').close();
    toast(`${dataset.units.length} LBUs and ${dataset.vendors.length} suppliers connected. Data stays in this session.`);
  } catch(error) { status.textContent=error.message; } finally { $('#load-csv-button').disabled=!$('#csv-file').files.length; }
}
document.addEventListener('click',event=>{
  const categoryFocus=event.target.closest('[data-category-focus]');if(categoryFocus){filters.category=categoryFocus.dataset.categoryFocus;navigate('overview');return;}
  const LBUButton=event.target.closest('[data-focus-unit]');if(LBUButton){focusLBU(LBUButton.dataset.focusUnit);return;}
  const categoryButton=event.target.closest('[data-category]');if(categoryButton){filters.category=filters.category===categoryButton.dataset.category?'all':categoryButton.dataset.category;render();return;}
  const monthButton=event.target.closest('[data-month]');if(monthButton){filters.month=filters.month===monthButton.dataset.month?'all':monthButton.dataset.month;render();return;}
  const trendButton=event.target.closest('[data-trend]');if(trendButton){trendMode=trendButton.dataset.trend;render();return;}
  const clearButton=event.target.closest('[data-clear-filter]');if(clearButton){filters[clearButton.dataset.clearFilter]='all';render();return;}
  const focusButton=event.target.closest('[data-focus-supplier]');if(focusButton){filters.supplier=focusButton.dataset.focusSupplier;$('#detail-dialog').close();navigate('overview');return;}
  if(event.target.closest('#compare-toggle')){compareEnabled=!compareEnabled;render();return;}

  const viewButton=event.target.closest('[data-view]');if(viewButton){navigate(viewButton.dataset.view);return;}
  const vendorButton=event.target.closest('[data-vendor]');if(vendorButton){openVendor(vendorButton.dataset.vendor);return;}
  const planButton=event.target.closest('[data-plan]');if(planButton){togglePlan(planButton.dataset.plan);return;}
  const unitButton=event.target.closest('[data-unit]');if(unitButton){filters.unit=unitButton.dataset.unit;filters.search='';if(filters.continent!=='all'&&dataset.units.find(u=>u.id===filters.unit)?.continent!==filters.continent)filters.continent='all';navigate('overlap');return;}
  if(event.target.closest('[data-reset]'))resetFilters();
  if(event.target.closest('#export-plan'))exportPlan();
});
document.addEventListener('change',event=>{
  if(event.target.matches('[data-status]')){const id=event.target.dataset.status;if(plan[id]){plan[id].status=event.target.value;persistPlan();toast('Action status updated.');}}
  if(event.target.matches('[data-owner]')){const id=event.target.dataset.owner;if(plan[id]){plan[id].owner=event.target.value.trim().slice(0,100);persistPlan();toast('Action owner updated.');}}
});
document.addEventListener('input',event=>{
  if(event.target.id==='scenario-rate'){scenarioRate=Number(event.target.value);const eligible=selection().summary.opportunities.reduce((sum,v)=>sum+v.eligibleSpend,0);$('#scenario-rate-output').textContent=scenarioRate+'%';$('#scenario-result').textContent=compact(Math.round(eligible*scenarioRate/100));event.target.style.setProperty('--progress',((scenarioRate-1)/11*100)+'%');}

  if(event.target.matches('[data-owner]')){const id=event.target.dataset.owner;if(plan[id]){plan[id].owner=event.target.value.slice(0,100);persistPlan();}}
  if(event.target.id==='supplier-search'){const start=event.target.selectionStart;filters.search=event.target.value;render();const input=$('#supplier-search');input.focus();input.setSelectionRange(start,start);}
});
for(const [name,selector] of [['period','#period-filter'],['unit','#unit-filter'],['category','#category-filter']])$(selector).addEventListener('change',event=>{filters[name]=event.target.value;if(name==='period')filters.month='all';if(name==='continent')filters.unit='all';render();});
$('#reset-filters').addEventListener('click',resetFilters);
$('#export-button').addEventListener('click',exportData);
$('#help-button').addEventListener('click',showMethod);$('#method-button').addEventListener('click',showMethod);
$('#configure-button').addEventListener('click',()=>{
  if(!dataset.demo)return;
  $('#config-status').textContent='';
  $('#lbu-name-inputs').innerHTML=dataset.units.map((u,i)=>`<label>Business unit ${i+1}<input name="lbu-name" value="${esc(u.name)}" maxlength="100" required autocomplete="off"></label>`).join('');
  $('#config-dialog').showModal();
});
$('#lbu-config-form').addEventListener('submit',event=>{
  event.preventDefault();
  const names=[...event.target.querySelectorAll('[name="lbu-name"]')].map(input=>input.value.normalize('NFKC').trim().replace(/\s+/g,' '));
  if(names.some(n=>!n||n.length>100||/[\x00-\x1f]/.test(n))||new Set(names.map(n=>n.toLowerCase())).size!==3){$('#config-status').textContent='Use three different LBU names, each 1–100 readable characters.';return;}
  dataset.units=dataset.units.map((u,i)=>({...u,name:names[i]}));
  let saved=true;try{localStorage.setItem('overarch-singapore-lbu-names-v1',JSON.stringify(names));}catch{saved=false;}
  render();$('#config-dialog').close();toast(saved?'Your LBU names are saved in this browser.':'LBU names updated for this session. Browser storage is unavailable.');
});
$('#import-button').addEventListener('click',()=>{$('#import-status').textContent='';$('#import-dialog').showModal();});
$('#csv-file').addEventListener('change',()=>{$('#load-csv-button').disabled=!$('#csv-file').files.length;$('#import-status').textContent='';});
$('#load-csv-button').addEventListener('click',importCSV);
$('#template-button').addEventListener('click',()=>downloadCSV('overarch-singapore-lbu-template.csv',['month','lbu','country','vendor','category','amount_sgd'],[
  ['2026-01',dataset.units[0]?.name||'LBU 01','Singapore','Nimbus Cloud','Cloud & software',12500.50],
  ['2026-01',dataset.units[1]?.name||'LBU 02','Singapore','Nimbus Cloud','Cloud & software',18750],
  ['2026-01',dataset.units[2]?.name||'LBU 03','Singapore','Nimbus Cloud','Cloud & software',9200],
  ['2026-02',dataset.units[0]?.name||'LBU 01','Singapore','Nimbus Cloud','Cloud & software',-500]
]));
$('#menu-toggle').addEventListener('click',()=>{const open=$('.sidebar').classList.toggle('is-open');$('#menu-toggle').setAttribute('aria-expanded',String(open));});
document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('.map-marker')){event.preventDefault();focusLBU(event.target.dataset.focusUnit);}if(event.key==='Escape'){$('.sidebar').classList.remove('is-open');$('#menu-toggle').setAttribute('aria-expanded','false');}});
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
window.addEventListener('hashchange',()=>{const next=location.hash.slice(1);if(views[next])navigate(next);});
if(views[location.hash.slice(1)])view=location.hash.slice(1);
setupFilters();render();

import { units as demoUnits, vendors as demoVendors, categories as demoCategories, transactions as demoTransactions } from './data.mjs';
import { filterRows, summarize, priorYearRows } from './analytics.mjs';
import { money, compact, range, csvCell, parseCSV } from './utilities.mjs';
import { dashboard } from './dashboard.mjs';

let dataset = { units: demoUnits, vendors: demoVendors, categories: demoCategories, rows: demoTransactions, demo: true };
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
const percent = value => new Intl.NumberFormat('en-MY', { style: 'percent', maximumFractionDigits: 1 }).format(value);
const views = {
  overview: ['Spend overview', 'Global spend. In full view.', 'One intelligent view across countries, categories, and suppliers.'],
  units: ['Countries', 'Local spend. Global perspective.', 'Compare purchasing patterns across your international portfolio.'],
  overlap: ['Supplier overlap', 'Follow the common thread.', 'Find the suppliers that connect your countries. Start a better conversation.'],
  opportunities: ['Opportunities', 'Turn overlap into opportunity.', 'A focused shortlist of sourcing moves, backed by the spend in your scope.'],
  plan: ['Action plan', 'Insight, with a next step.', 'Give your sourcing opportunities an owner and a path forward.'],
};
const paths = {
  overview: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  units: '<path d="M3 21V8l9-5v18M12 8h9v13M7 10v2m0 3v2m9-5h2m-2 4h2M1 21h22"/>',
  overlap: '<circle cx="8" cy="12" r="6"/><circle cx="16" cy="12" r="6"/>',
  opportunities: '<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1.5 1-1 3-1 3H9s.5-2-1-3Z"/>',
  plan: '<rect x="5" y="5" width="15" height="17" rx="2"/><path d="M9 5V2h7v3M9 11l2 2 5-5M9 17h7"/>',
};
function icon(name) { return `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">${paths[name]}</svg>`; }
function readPlan() {
  try { const saved = JSON.parse(localStorage.getItem('overarch-country-plan-v2') || '{}'); if (!saved || Array.isArray(saved) || typeof saved !== 'object') return {}; return Object.fromEntries(Object.entries(saved).filter(([id, item]) => demoVendors.some(v => v.id === id) && item && typeof item.owner === 'string' && ['Identified','Validating','Approved','In progress','Closed'].includes(item.status)).map(([id, item]) => [id, { owner: item.owner.slice(0,100), status: item.status }])); } catch { return {}; }
}
function persistPlan() { if (!dataset.demo) return; try { localStorage.setItem('overarch-country-plan-v2', JSON.stringify(plan)); } catch { toast('Your plan works for this session. Browser storage is unavailable.'); } }
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500); }
function selection() { const rows = filterRows(dataset.rows, filters); return { rows, summary: summarize(rows, dataset.units, dataset.vendors) }; }
function navigate(next) { if (!views[next]) return; view = next; filters.search = ''; history.replaceState(null, '', '#' + next); $('.sidebar').classList.remove('is-open'); $('#menu-toggle').setAttribute('aria-expanded','false'); render(); window.scrollTo({ top: 0, behavior: 'instant' }); }

function comparableRows(fullPeriod) { return priorYearRows(dataset.rows,filters,{fullPeriod}); }
function renderScopeChips() {
  const labels={continent:filters.continent,unit:dataset.units.find(u=>u.id===filters.unit)?.name,category:filters.category,month:filters.month==='all'?'all':new Date(filters.month+'-01T12:00:00Z').toLocaleDateString('en-GB',{month:'short',year:'numeric',timeZone:'UTC'}),supplier:dataset.vendors.find(v=>v.id===filters.supplier)?.name};
  const entries=Object.entries(labels).filter(([key,label])=>filters[key]!=='all'&&label);
  $('#active-filters').innerHTML=entries.length?`<span>FOCUSED ON</span>${entries.map(([key,label])=>`<button data-clear-filter="${key}" aria-label="Clear ${esc(label)} filter">${esc(label)} <span>×</span></button>`).join('')}<button class="clear-all" data-reset>Clear all</button>`:'';
  $('#active-filters').hidden=!entries.length;
}
function focusCountry(id) {
  const country=dataset.units.find(u=>u.id===id);if(!country)return;
  filters.unit=filters.unit===id?'all':id;
  if(filters.unit!=='all'&&filters.continent!=='all'&&country.continent!==filters.continent)filters.continent='all';
  filters.search='';render();
}

function setupFilters() {
  $('#continent-filter').innerHTML = '<option value="all">All continents</option>' + [...new Set(dataset.units.map(u=>u.continent).filter(Boolean))].map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
  $('#unit-filter').innerHTML = '<option value="all">All countries</option>' + dataset.units.filter(u=>filters.continent==='all'||u.continent===filters.continent).map(u => `<option value="${esc(u.id)}">${esc(u.name)}</option>`).join('');
  $('#category-filter').innerHTML = '<option value="all">All categories</option>' + dataset.categories.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  const years = [...new Set(dataset.rows.map(r => r.month.slice(0,4)))].sort().reverse();
  $('#period-filter').innerHTML = years.map(y => `<option value="${y}">${y}${dataset.demo ? y === '2026' ? ' · Jan–Sep' : ' · Full year' : ''}</option>`).join('') + '<option value="all">All periods</option>';
  for (const [name, selector] of [['period','#period-filter'],['continent','#continent-filter'],['unit','#unit-filter'],['category','#category-filter']]) $(selector).value = filters[name];
}
function render() {
  const { rows, summary } = selection();
  setupFilters();
  $('#navigation').innerHTML = Object.entries(views).map(([key, value]) => `<button class="nav-item ${view === key ? 'active' : ''}" data-view="${key}" ${view === key ? 'aria-current="page"' : ''}>${icon(key)}<span>${value[0]}</span>${key === 'plan' && Object.keys(plan).length ? `<span class="nav-count">${Object.keys(plan).length}</span>` : ''}${key === 'units' ? `<span class="nav-count">${dataset.units.length}</span>` : ''}</button>`).join('');
  $('#page-title').textContent = views[view][1]; $('#page-description').textContent = views[view][2]; $('#breadcrumb-name').textContent = views[view][0];
  $('#scope-caption').textContent = `${summary.activeUnitCount} ${summary.activeUnitCount === 1 ? 'country' : 'countries'}`;
  renderScopeChips();
  $('#content').innerHTML = view === 'overview' ? dashboard(summary, rows, {units:dataset.units, demo:dataset.demo, filters, trendRows:filterRows(dataset.rows,{...filters,month:'all'}), previousRows:comparableRows(false), comparisonRows:comparableRows(true), trendMode, compareEnabled, scenarioRate}) : view === 'units' ? unitsView(summary) : view === 'overlap' ? overlapView(summary) : view === 'opportunities' ? opportunitiesView(summary) : planView(summary);
}
function stats(s) {
  const share = s.total > 0 ? s.sharedSpend / s.total : 0;
  return `<section class="stats-grid" aria-label="Spend at a glance">
    <article class="stat-card"><div class="stat-top"><span>Net spend in scope</span><span class="stat-symbol">↗</span></div><div class="stat-value">${compact(s.total)}</div><div class="stat-bottom">${s.activeUnitCount} ${s.activeUnitCount === 1 ? 'country' : 'countries'} <span>·</span> ${s.vendorCount} active ${s.vendorCount === 1 ? 'supplier' : 'suppliers'}</div></article>
    <article class="stat-card"><div class="stat-top"><span>Shared-supplier spend</span><span class="stat-symbol">⋈</span></div><div class="stat-value">${compact(s.sharedSpend)}</div><div class="stat-bottom"><strong>${percent(share)}</strong> of spend in this scope</div></article>
    <article class="stat-card"><div class="stat-top"><span>Shared suppliers</span><span class="stat-symbol">⊙</span></div><div class="stat-value">${s.sharedCount}<span style="font-size:13px;color:#9babbc;font-weight:400;letter-spacing:0"> / ${s.vendorCount}</span></div><div class="stat-bottom">Used by 2+ selected countries</div></article>
    <article class="stat-card featured"><div class="stat-top"><span>Illustrative potential</span><span class="stat-symbol">✧</span></div><div class="stat-value range">${s.estimatedHigh ? range(s.estimatedLow,s.estimatedHigh) : 'RM0'}</div><div class="stat-bottom"><span class="status-dot"></span> Modeled estimate <span>·</span> ${s.opportunities.length} sourcing moves</div></article>
  </section>`;
}
function matrixPanel(s, large) {
  const displayUnits = dataset.units.filter(u => s.unitStats.some(stat => stat.id === u.id));
  const displayVendors = s.vendorStats.filter(v => v.unitCount >= 2).slice(0, large ? 24 : 7);
  const max = Math.max(1, ...displayVendors.flatMap(v => Object.values(v.byUnit)));
  return `<section class="panel matrix-card ${large ? 'matrix-large' : ''}" aria-label="Shared suppliers spend matrix"><div class="panel-header"><div><h2>Where your spend connects</h2><p class="panel-subtitle">Top ${large ? Math.min(24, s.sharedCount) : Math.min(7, s.sharedCount)} shared suppliers across your countries${large ? ' · select a cell to explore' : ''}</p></div><span class="pill shared-pill">${s.sharedCount} shared suppliers</span></div>${!large ? `<div class="bridge-banner"><span class="bridge-icon">⋈</span><p><strong>${percent(s.total > 0 ? s.sharedSpend / s.total : 0)} of group spend</strong> touches a shared supplier.<br>That's a conversation worth having together.</p><button class="text-button" data-view="overlap">Explore →</button></div>` : ''}${displayVendors.length ? `<div class="matrix-wrap" tabindex="0" aria-label="Supplier by country spend. Scroll horizontally to view every country."><table class="matrix"><caption class="sr-only">Net supplier spend by country in MYR; darker cells mean higher spend</caption><thead><tr><th scope="col">Supplier / country</th>${displayUnits.map(u => `<th scope="col" title="${esc(u.name)}">${esc(u.code)}</th>`).join('')}${large ? '<th scope="col">Total MYR</th>' : ''}</tr></thead><tbody>${displayVendors.map(v => `<tr><td class="supplier-cell"><button class="supplier-name" data-vendor="${esc(v.id)}">${esc(v.name)}<small>${v.unitCount} ${v.unitCount===1?'country':'countries'} · ${esc(v.category)}</small></button></td>${displayUnits.map(u => { const amount = v.byUnit[u.id] || 0; const intensity = amount > 0 ? .17 + .83 * Math.pow(amount / max,.55) : 0; const color = amount > 0 ? `hsl(${257} ${45 + intensity * 45}% ${12 + intensity * 48}%)` : ''; return `<td><button class="heatcell ${amount === 0 ? 'is-zero' : ''}" ${color ? `style="background:${color};border-color:${color}"` : ''} data-vendor="${esc(v.id)}" title="${esc(v.name)} · ${esc(u.name)}: ${money(amount)}" aria-label="${esc(v.name)} at ${esc(u.name)}, ${money(amount)}"></button></td>`; }).join('')}${large ? `<td>${money(v.total)}</td>` : ''}</tr>`).join('')}</tbody></table></div>` : empty('No shared suppliers in this scope', 'Shared suppliers need positive spend in at least two selected countries.')}<div class="matrix-footer"><span>Net spend · select a supplier for details</span><span class="legend">Less ${['#161323','#2c1e53','#4b258f','#6331fb','#b69bff'].map(c => `<i class="legend-block" style="background:${c}"></i>`).join('')} More</span></div></section>`;
}
function unitRanking(s) {
  const max = Math.max(1,...s.unitStats.map(u=>u.total));
  return `<section class="panel"><div class="panel-header"><div><h2>Spend by country</h2><p class="panel-subtitle">A group view, with local context</p></div><button class="text-button" data-view="units" aria-label="View all countries">View all ↗</button></div><div class="rank-list">${s.unitStats.slice(0,6).map((u,i) => `<button class="rank-item" data-unit="${esc(u.id)}"><div class="rank-top"><span class="rank-name">${esc(u.name)}</span><span class="rank-value">${compact(u.total)}</span></div><div class="rank-bar"><span style="width:${Math.max(0,u.total / max * 100)}%;background:${i === 0 ? '#6331fb' : i === 1 ? '#8860ff' : i === 2 ? '#88f9c0' : '#b19af6'}"></span></div><div class="rank-meta">${esc(u.city)} <span>·</span> ${u.vendorCount} suppliers</div></button>`).join('') || '<p class="panel-subtitle">No spend in this selection.</p>'}</div><div class="rank-footer"><span>${s.activeUnitCount} countries in view</span><span>${dataset.demo ? `${new Set(s.unitStats.map(u=>u.continent)).size} continents` : 'Market data unavailable'}</span></div></section>`;
}
function opportunityCard(v) {
  return `<article class="opportunity-card"><div class="opportunity-top"><span class="category-icon">${v.category.includes('Cloud') ? '⌘' : v.category.includes('Logistics') ? '⇄' : v.category.includes('Telecom') ? '⌁' : '⋈'}</span><span class="opportunity-label">${v.unitCount >= 8 ? 'Group leverage' : 'Coordinate buying'}</span></div><h3><button class="row-link" data-vendor="${esc(v.id)}">${esc(v.strategy)}</button></h3><p>${esc(v.name)} serves ${v.unitCount} ${v.unitCount===1?'country':'countries'}. Bring ${compact(v.eligibleSpend)} of eligible spend into one conversation.</p><div class="opp-vendor"><span class="vendor-dot"></span>${esc(v.category)} <span>·</span> ${v.unitCount} ${v.unitCount===1?'country':'countries'}</div><div class="opportunity-impact"><div><small>Illustrative potential</small><div class="potential-value">${range(v.estimateLow,v.estimateHigh)}</div></div><button class="add-plan ${plan[v.id] ? 'saved' : ''}" data-plan="${esc(v.id)}" aria-label="${plan[v.id] ? 'Remove' : 'Add'} ${esc(v.name)} ${plan[v.id] ? 'from' : 'to'} action plan" title="${plan[v.id] ? 'In plan — click to remove' : 'Add to action plan'}">${plan[v.id] ? '✓' : '+'}</button></div></article>`;
}
function empty(title, description) { return `<div class="empty-state"><h2>${esc(title)}</h2><p>${esc(description)}</p><button class="button button-secondary" data-reset>Reset scope</button></div>`; }
function unitsView(s) {
  return stats(s) + `<section class="panel lower-section"><div class="panel-header"><div><h2>The country landscape</h2><p class="panel-subtitle">All amounts follow your selected reporting scope.</p></div><span class="pill">${s.unitStats.length} countries</span></div><div class="data-table-wrap"><table class="data-table"><thead><tr><th scope="col">Country</th><th scope="col">Continent / hub</th><th scope="col">Net spend</th><th scope="col">Group share</th><th scope="col">Suppliers</th><th scope="col">Shared-supplier spend</th><th scope="col">Explore</th></tr></thead><tbody>${s.unitStats.map(u=>`<tr><td><span class="unit-code">${esc(u.code)}</span><button class="row-link" data-unit="${esc(u.id)}">${esc(u.name)}</button></td><td>${esc(u.continent||'Unspecified')}<span class="row-sub">${esc(u.city)}</span></td><td class="amount">${money(u.total)}</td><td>${percent(s.total > 0 ? u.total / s.total : 0)}</td><td>${u.vendorCount}</td><td class="amount">${money(u.sharedSpend)}</td><td><button class="text-button" data-unit="${esc(u.id)}">Explore country →</button></td></tr>`).join('')}</tbody></table></div>${!s.unitStats.length ? empty('No countries in scope','Try another reporting period or category.') : ''}<div class="subtle-note">Group share and shared-supplier spend are calculated across the units currently selected. Selecting a single unit sets shared suppliers to zero.</div></section>`;
}
function searchToolbar(s) { return `<div class="table-toolbar"><label style="flex:1"><span class="sr-only">Search suppliers, units or categories</span><input class="search-box" id="supplier-search" type="search" value="${esc(filters.search)}" placeholder="Search suppliers, units or categories…"></label><span class="pill">${s.vendorCount} suppliers in scope</span></div>`; }
function overlapView(s) {
  return stats(s) + `<section class="panel lower-section"><div class="panel-header"><div><h2>Connected suppliers</h2><p class="panel-subtitle">One supplier identity. Every participating unit.</p></div><span class="pill">${s.sharedCount} shared</span></div>${searchToolbar(s)}<div class="data-table-wrap"><table class="data-table"><thead><tr><th scope="col">Supplier</th><th scope="col">Category</th><th scope="col">Net spend</th><th scope="col">Countries</th><th scope="col">Potential range</th><th scope="col">Next step</th></tr></thead><tbody>${s.vendorStats.map(v=>`<tr><td><button class="row-link" data-vendor="${esc(v.id)}">${esc(v.name)}</button><span class="row-sub">${v.unitCount > 1 ? 'Shared supplier' : 'Country-specific supplier'}</span></td><td>${esc(v.category)}</td><td class="amount">${money(v.total)}</td><td><span class="pill ${v.unitCount > 1 ? 'shared-pill' : ''}">${v.unitCount} ${v.unitCount===1?'country':'countries'}</span></td><td class="amount">${v.estimateHigh ? range(v.estimateLow,v.estimateHigh) : '—'}</td><td><button class="text-button" data-vendor="${esc(v.id)}">Explore →</button></td></tr>`).join('')}</tbody></table></div>${!s.vendorStats.length ? empty('No suppliers match','Try a shorter search or clear your scope filters.') : ''}<div class="subtle-note">A shared supplier has positive net spend in at least two selected countries. A common vendor does not, by itself, mean the service specifications are comparable.</div></section>${matrixPanel(s,true)}`;
}
function opportunitiesView(s) {
  return `<div class="view-intro"><div><h2>A shared supplier is a starting point.</h2><p>Validate specifications, local constraints, contracts, and switching costs before acting.<br>Each supplier contributes to one primary opportunity, keeping this estimate free of double counting.</p></div><div class="intro-number">${s.opportunities.length}<span style="display:block;font:10px 'DM Sans',sans-serif;color:#bcd6ed;text-align:right;margin-top:5px">sourcing moves</span></div></div>${stats(s)}${s.opportunities.length ? `<div class="opportunity-grid opp-full-grid">${s.opportunities.map(opportunityCard).join('')}</div>` : empty('No cross-country opportunities here','Choose all countries to look for shared suppliers.')}`;
}
function planView(s) {
  const entries = s.opportunities.filter(v=>plan[v.id]);
  const low = entries.reduce((a,v)=>a+v.estimateLow,0), high=entries.reduce((a,v)=>a+v.estimateHigh,0);
  return `<div class="view-intro"><div><h2>From a signal to a sourcing conversation.</h2><p>Your ${dataset.demo ? 'demo ' : ''}plan is ${dataset.demo ? 'saved in this browser' : 'kept for this session'}. Workflow status never changes the modeled benefit.<br>Export your plan to take these next steps into your category review.</p></div><button class="button button-secondary" id="export-plan">↓ Export plan</button></div><section class="stats-grid full-view-stats"><article class="stat-card"><div class="stat-top">Sourcing moves in scope</div><div class="stat-value">${entries.length}</div><div class="stat-bottom">${Object.keys(plan).length} saved across all scopes</div></article><article class="stat-card"><div class="stat-top">Eligible spend in scope</div><div class="stat-value">${compact(entries.reduce((a,v)=>a+v.eligibleSpend,0))}</div><div class="stat-bottom">Distinct supplier opportunities</div></article><article class="stat-card featured"><div class="stat-top">Illustrative plan potential</div><div class="stat-value range">${high ? range(low,high) : 'RM0'}</div><div class="stat-bottom">Estimate only · validate before committing</div></article></section><section class="panel lower-section"><div class="panel-header"><div><h2>Your sourcing action plan</h2><p class="panel-subtitle">Owners and status can be edited directly.</p></div><span class="pill">${entries.length} in current scope</span></div>${entries.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th scope="col">Supplier & strategy</th><th scope="col">Potential range</th><th scope="col">Owner</th><th scope="col">Status</th><th scope="col">Remove</th></tr></thead><tbody>${entries.map(v=>`<tr><td><button class="row-link" data-vendor="${esc(v.id)}">${esc(v.name)}</button><span class="row-sub">${esc(v.strategy)}</span></td><td class="amount">${range(v.estimateLow,v.estimateHigh)}</td><td><input class="owner-input" data-owner="${esc(v.id)}" aria-label="Owner for ${esc(v.name)}" value="${esc(plan[v.id].owner)}" maxlength="100" placeholder="Assign an owner"></td><td><select class="plan-status" data-status="${esc(v.id)}" aria-label="Status for ${esc(v.name)}">${['Identified','Validating','Approved','In progress','Closed'].map(status=>`<option ${status === plan[v.id].status ? 'selected' : ''}>${status}</option>`).join('')}</select></td><td><button class="remove-plan" data-plan="${esc(v.id)}" aria-label="Remove ${esc(v.name)} from plan">Remove</button></td></tr>`).join('')}</tbody></table></div>` : `<div class="empty-state"><h2>${Object.keys(plan).length ? 'Your saved moves are outside this scope.' : 'Your next move starts with an overlap.'}</h2><p>${Object.keys(plan).length ? 'Reset filters to see your saved actions, or find more opportunities in this selection.' : 'Explore a shared supplier, review the evidence, and add it to your plan.'}</p><button class="button button-primary" data-view="opportunities">Explore opportunities →</button></div>`}<div class="subtle-note">Plan estimates are recalculated using your current period, continent, country, and category filters. ${dataset.demo ? 'Only demo action owners and status are stored locally.' : 'Imported data and actions are not saved after a refresh.'}</div></section>`;
}
function openVendor(id) {
  const {summary:s}=selection(), v=s.vendorStats.find(v=>v.id===id); if(!v) return;
  currentDetail=id;
  const max = Math.max(1,...Object.values(v.byUnit));
  const participating = s.unitStats.filter(u=>(v.byUnit[u.id] || 0)!==0).sort((a,b)=>(v.byUnit[b.id]||0)-(v.byUnit[a.id]||0));
  $('#detail-content').innerHTML=`<header class="detail-header"><form method="dialog" class="dialog-top"><span class="eyebrow">THE CONNECTION, UP CLOSE</span><button class="icon-button" aria-label="Close supplier details">×</button></form><h2 id="detail-title">${esc(v.name)}</h2><p>${esc(v.category)} <span>·</span> ${v.unitCount >= 2 ? 'Shared supplier' : 'Country-specific supplier'} <span>·</span> ${dataset.demo ? 'Fictional demo vendor' : 'Imported supplier'}</p></header><div class="detail-body"><div class="detail-metrics"><div><small>Net spend in scope</small><strong>${compact(v.total)}</strong></div><div><small>Participating countries</small><strong>${v.unitCount}<span style="font-size:12px;color:#8b9db1"> / ${s.activeUnitCount}</span></strong></div></div><button class="button button-secondary wide-button focus-supplier" data-focus-supplier="${esc(v.id)}">Focus dashboard on this supplier ↗</button><h3>Where the spend sits</h3>${participating.map(u=>`<div class="detail-unit-row"><span>${esc(u.name)}<span style="display:block;font-size:8px;color:#94a6b8;margin-top:4px">${esc(u.city)}</span></span><strong>${money(v.byUnit[u.id])}</strong></div><div class="detail-unit-bar"><span style="width:${Math.max(0,v.byUnit[u.id]/max*100)}%"></span></div>`).join('')}${v.estimateHigh ? `<section class="strategy-box"><span class="eyebrow">A PRACTICAL NEXT MOVE</span><h3>${esc(v.strategy)}</h3><p>${esc(v.nextStep)}</p><div class="estimate-line">${range(v.estimateLow,v.estimateHigh)} illustrative potential</div><div class="estimate-assumption">${money(v.eligibleSpend)} eligible spend × ${percent(v.lowRate)}–${percent(v.highRate)} assumed improvement<br>Eligible share: ${percent(v.eligibleShare)} of positive net spend by unit. Scenario assumptions, not market benchmarks.</div></section><p class="detail-disclaimer">Start with ${esc(v.owner)}. Confirm comparable scope, supplier identity, local requirements, contract terms, and switching costs. This estimate is not a promise or realized saving.</p><button class="button ${plan[v.id] ? 'button-secondary' : 'button-primary'} wide-button" data-plan="${esc(v.id)}">${plan[v.id] ? '✓ In your plan · click to remove' : '+ Add to action plan'}</button>` : `<section class="strategy-box"><h3>No cross-country estimate in this selection.</h3><p>Shared opportunities require positive net spend in two or more selected countries. Widen the scope to compare this supplier across the group.</p></section>`}</div>`;
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
  $('#method-content').innerHTML=`<h3>${dataset.demo ? 'Fictional data, realistic questions' : 'Your imported data'}</h3><p>${dataset.demo ? `The demo contains ${demoUnits.length} countries, ${demoVendors.length} fictional suppliers, and ${demoTransactions.length.toLocaleString()} spend records across 2025 and January–September 2026. All amounts are illustrative and expressed in MYR. Credits reduce net spend. The portfolio spans Asia, Europe, and North America, with four countries on each continent.` : 'Your CSV is processed locally in this browser. Imported spend and actions remain in memory and disappear on refresh. No data is sent to a connector or analytics service. This demo does not perform currency conversion; all values must already be in MYR.'}</p><h3>Shared suppliers, without double counting</h3><p>A supplier is shared when it has positive net spend in at least two selected countries. Shared-supplier spend counts each eligible record once, including credits. It is not a duplicate-payment metric. Year, continent, country, category, month, supplier, and search filters apply before every calculation. The trend always shows the full reporting period for your other filters. Prior-year comparisons use the same calendar months represented by current data in the selected scope. For the complete demo, Jan–Sep 2026 is compared with Jan–Sep 2025. Country map arcs represent portfolio connections, not shipment or payment flows.</p><h3>Potential, with assumptions in view</h3><p>Each supplier has one primary opportunity. Eligible spend is the sum of positive net supplier spend by unit multiplied by an illustrative eligible share. Potential = eligible spend × an assumed improvement range. Open a supplier to inspect its numbers. Imported suppliers use a default 65% eligible share and a 3–6% scenario range. These are working hypotheses, not benchmarks.</p><h3>An adjustable what-if scenario</h3><p>The dashboard scenario slider multiplies eligible shared-supplier spend by your selected 1–12% improvement assumption. It is a separate exploration and does not overwrite vendor-specific ranges or realized savings. Figures are reported in MYR with no FX conversion.</p><h3>Your plan stays local</h3><p>${dataset.demo ? 'Demo action owners and workflow states are saved in this browser. No purchase or supplier contact is initiated.' : 'Imported actions are kept only for this session. Export your plan before refreshing.'} Status changes do not turn modeled potential into realized savings. Before a real negotiation, validate names, scopes, contracts, local constraints, and switching costs.</p>`;
  $('#method-dialog').showModal();
}
function downloadCSV(filename, header, rows) {
  const text='\uFEFF'+[header,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n'); const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'})); const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportData() {
  if(view==='plan') return exportPlan();
  const rows=selection().rows;
  const units=new Map(dataset.units.map(u=>[u.id,u.name])),vendors=new Map(dataset.vendors.map(v=>[v.id,v.name]));
  downloadCSV(`overarch-spend-${filters.period}.csv`,['month','country','continent','vendor','category','amount_myr'],rows.map(r=>[r.month,units.get(r.unitId),dataset.units.find(u=>u.id===r.unitId)?.continent||'Unspecified',vendors.get(r.vendorId),r.category,r.amount/100]));
  toast(`${rows.length.toLocaleString()} records exported for your current scope.`);
}
function exportPlan() {
  const entries=selection().summary.opportunities.filter(v=>plan[v.id]);
  downloadCSV('overarch-action-plan.csv',['supplier','category','strategy','countries','eligible_spend_myr','assumed_low_rate','assumed_high_rate','illustrative_low_myr','illustrative_high_myr','owner','status','next_step','period'],entries.map(v=>[v.name,v.category,v.strategy,v.unitCount,v.eligibleSpend/100,v.lowRate,v.highRate,v.estimateLow/100,v.estimateHigh/100,plan[v.id].owner,plan[v.id].status,v.nextStep,filters.period]));
  toast(`${entries.length} sourcing ${entries.length===1?'move':'moves'} exported for your current scope.`);
}
async function importCSV() {
  const file=$('#csv-file').files[0];if(!file)return;
  const status=$('#import-status');status.textContent='Checking your file…';$('#load-csv-button').disabled=true;
  try {
    if(file.size>2*1024*1024)throw Error('Choose a CSV smaller than 2 MB.');
    const parsed=parseCSV((await file.text()).replace(/^\uFEFF/,''));
    if(parsed.length<2)throw Error('Add at least one spend row below the header.');
    if(parsed.length>20001)throw Error('The file has more than 20,000 spend rows.');
    const headers=parsed.shift().map(x=>x.trim().toLowerCase());
    if(!headers.includes('country') && headers.includes('business_unit')) headers[headers.indexOf('business_unit')]='country';
    const required=['month','country','vendor','category','amount_myr'];
    if(required.some(x=>headers.filter(h=>h===x).length!==1))throw Error('Include each required column exactly once: '+required.join(', '));
    const byName={units:new Map(),vendors:new Map()},units=[],vendors=[],cats=new Set(),grouped=new Map();
    const norm=x=>x.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
    parsed.forEach((fields,index)=>{
      if(fields.length!==headers.length)throw Error(`Row ${index+2}: column count does not match the header.`);
      const r=Object.fromEntries(headers.map((h,i)=>[h,fields[i].trim()]));
      if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(r.month)||r.month<'2000-01'||r.month>'2100-12')throw Error(`Row ${index+2}: month must be YYYY-MM, between 2000 and 2100.`);
      if([r.country,r.vendor,r.category].some(x=>!x||x.length>100||/[\x00-\x1f]/.test(x)))throw Error(`Row ${index+2}: names and categories must be 1–100 readable characters.`);
      if(!/^-?\d+(\.\d{1,2})?$/.test(r.amount_myr))throw Error(`Row ${index+2}: use a plain MYR amount such as 12500.50, with no currency symbol or thousands separator.`);
      const amount=Math.round(Number(r.amount_myr)*100);
      if(!Number.isSafeInteger(amount)||Math.abs(amount)>1e12)throw Error(`Row ${index+2}: amount is too large.`);
      const known=demoUnits.find(u=>norm(u.name)===norm(r.country)||norm(u.code)===norm(r.country));
      const declared=r.continent?.trim();
      const allowedContinents=['Asia','Europe','North America','South America','Africa','Oceania','Antarctica','Unspecified'];
      if(declared && !allowedContinents.includes(declared)) throw Error(`Row ${index+2}: use a standard continent name such as Asia, Europe, or North America.`);
      if(known && declared && known.continent!==declared) throw Error(`Row ${index+2}: ${known.name} belongs to ${known.continent}.`);
      const countryName=known?.name||r.country;
      const continent=known?.continent||declared||'Unspecified';
      const uKey=norm(countryName),vKey=norm(r.vendor);
      if(byName.units.has(uKey)&&byName.units.get(uKey).continent!==continent) throw Error(`Row ${index+2}: use one consistent continent for ${countryName}.`);
      if(!byName.units.has(uKey)){const u={...(known||{}),id:`i-u${units.length+1}`,name:countryName,code:known?.code||countryName.slice(0,3).toUpperCase(),city:known?.city||'Imported country',country:countryName,continent};units.push(u);byName.units.set(uKey,u);}
      if(!byName.vendors.has(vKey)){const v={id:`i-v${vendors.length+1}`,name:r.vendor,category:r.category,color:'#6331FB',eligibleShare:.65,lowRate:.03,highRate:.06,strategy:'Coordinate a group framework',nextStep:'Confirm supplier identity, comparable specifications, local requirements, and existing contract terms with country owners.',owner:'Group Procurement'};vendors.push(v);byName.vendors.set(vKey,v);}
      if(units.length>50||vendors.length>500)throw Error('For this MVP, keep imports to 50 countries and 500 suppliers.');
      const u=byName.units.get(uKey),v=byName.vendors.get(vKey);cats.add(r.category);
      const key=JSON.stringify([r.month,u.id,v.id,r.category]);
      if(!grouped.has(key))grouped.set(key,{id:`i-${grouped.size+1}`,month:r.month,unitId:u.id,vendorId:v.id,category:r.category,amount:0,unitName:u.name,vendorName:v.name,country:u.name,continent:u.continent});
      const g=grouped.get(key);g.amount+=amount;if(!Number.isSafeInteger(g.amount))throw Error('Combined spend exceeds the supported amount range.');
    });
    const rows=[...grouped.values()];const absolute=rows.reduce((sum,r)=>sum+Math.abs(r.amount),0);if(!Number.isSafeInteger(absolute))throw Error('Combined spend exceeds the supported amount range.');
    dataset={units,vendors,categories:[...cats].sort(),rows,demo:false};plan={};$('#data-mode').textContent='Imported data · local';filters=emptyScope('all');view='overview';setupFilters();render();$('#import-dialog').close();toast(`${units.length} countries and ${vendors.length} suppliers connected. Data stays in this session.`);
  } catch(error) { status.textContent=error.message; } finally { $('#load-csv-button').disabled=!$('#csv-file').files.length; }
}
document.addEventListener('click',event=>{
  const countryButton=event.target.closest('[data-country]');if(countryButton){focusCountry(countryButton.dataset.country);return;}
  const continentButton=event.target.closest('[data-continent]');if(continentButton){filters.continent=filters.continent===continentButton.dataset.continent?'all':continentButton.dataset.continent;filters.unit='all';render();return;}
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
for(const [name,selector] of [['period','#period-filter'],['continent','#continent-filter'],['unit','#unit-filter'],['category','#category-filter']])$(selector).addEventListener('change',event=>{filters[name]=event.target.value;if(name==='period')filters.month='all';if(name==='continent')filters.unit='all';render();});
$('#reset-filters').addEventListener('click',resetFilters);
$('#export-button').addEventListener('click',exportData);
$('#help-button').addEventListener('click',showMethod);$('#method-button').addEventListener('click',showMethod);
$('#import-button').addEventListener('click',()=>{$('#import-status').textContent='';$('#import-dialog').showModal();});
$('#csv-file').addEventListener('change',()=>{$('#load-csv-button').disabled=!$('#csv-file').files.length;$('#import-status').textContent='';});
$('#load-csv-button').addEventListener('click',importCSV);
$('#template-button').addEventListener('click',()=>downloadCSV('overarch-spend-template.csv',['month','country','continent','vendor','category','amount_myr'],[['2026-01','Malaysia','Asia','Nimbus Cloud','Cloud & software',12500.50],['2026-01','Germany','Europe','Nimbus Cloud','Cloud & software',18750.00],['2026-02','Malaysia','Asia','Nimbus Cloud','Cloud & software',-500.00]]));
$('#menu-toggle').addEventListener('click',()=>{const open=$('.sidebar').classList.toggle('is-open');$('#menu-toggle').setAttribute('aria-expanded',String(open));});
document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('.map-marker')){event.preventDefault();focusCountry(event.target.dataset.country);}if(event.key==='Escape'){$('.sidebar').classList.remove('is-open');$('#menu-toggle').setAttribute('aria-expanded','false');}});
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
window.addEventListener('hashchange',()=>{const next=location.hash.slice(1);if(views[next])navigate(next);});
if(views[location.hash.slice(1)])view=location.hash.slice(1);
setupFilters();render();

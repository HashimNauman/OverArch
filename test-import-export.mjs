import assert from 'node:assert/strict';
import { csvCell, parseCSV, range, compact } from './dist/utilities.mjs';
import { parseSpendCSV } from './dist/import.mjs';
import { summarize } from './dist/analytics.mjs';
assert.equal(range(780,1560),'S$7.80–15.60');
assert.equal(range(3900,7800),'S$39–78');
assert.equal(range(146000000,272000000),'S$1.46–2.72m');
assert.equal(compact(20),'S$0.20');
assert.equal(csvCell(-500),'"-500"');
assert.equal(csvCell('-1+1'),'"\'-1+1"');
assert.equal(csvCell('  =1+1'),'"\'  =1+1"');
assert.equal(csvCell('-2+HYPERLINK("https://example.test","x")'),'"\'-2+HYPERLINK(""https://example.test"",""x"")"');
assert.equal(csvCell('a"b'),'"a""b"');
assert.deepEqual(parseCSV('a,b\r\n"hello, world","a""b"\r\n'),[['a','b'],['hello, world','a"b']]);
assert.deepEqual(parseCSV('a,b\n"one\ntwo",3'),[['a','b'],['one\ntwo','3']]);
assert.throws(()=>parseCSV('a,b\n"unclosed,3'),/not closed/);
assert.throws(()=>parseCSV('a,b\n"one"oops,3'),/Unexpected characters/);
assert.deepEqual(parseCSV(['month','amount'].map(csvCell).join(',')+'\n'+['2026-01',-500].map(csvCell).join(',')),[['month','amount'],['2026-01','-500']]);
console.log('CSV parser, formula-injection defense, credit roundtrip, and small-value formatting checks passed.');

const header='month,lbu,country,vendor,category,amount_sgd';
const records=[
 ['2026-01','PAC','Singapore','Nimbus Cloud','Cloud & software',100],
 ['2026-01','PS','Singapore','Nimbus Cloud','Cloud & software',200],
 ['2026-01','ES','Singapore','Local Tech','Cloud & software',300],
 ['2026-01',' pac ','SG','nimbus cloud','cloud & software',-20],
];
const csv=header+'\n'+records.map(r=>r.map(csvCell).join(',')).join('\n');
const imported=parseSpendCSV(csv);
assert.equal(imported.units.length,3,'A shared Singapore geography must not merge the three LBU identities.');
assert.equal(imported.rows.length,3,'Same-grain credits are aggregated.');
assert.equal(imported.vendors.length,2);
assert.equal(imported.categories.length,1);
const report=summarize(imported.rows,imported.units,imported.vendors);
assert.equal(report.total,58000);
assert.equal(report.sharedSpend,28000);
assert.equal(report.sharedCount,1);
assert.equal(report.estimatedLow,546);
assert.equal(report.estimatedHigh,1092);
assert.ok(imported.units.every(u=>u.country==='Singapore'));
assert.throws(()=>parseSpendCSV(header+'\n2026-01,PAC,Malaysia,Nimbus Cloud,Cloud,100'),/Singapore only/);
assert.throws(()=>parseSpendCSV(header+',currency\n2026-01,PAC,Singapore,Nimbus Cloud,Cloud,100,MYR'),/convert amounts to SGD/);
assert.throws(()=>parseSpendCSV(csv+'\n2026-01,FOUR,Singapore,Nimbus Cloud,Cloud,100'),/at most three/);
assert.throws(()=>parseSpendCSV(csv.replace('amount_sgd','amount_myr')),/amount_sgd/);
assert.throws(()=>parseSpendCSV(csv.replace('lbu,','country,')),/lbu/);
assert.throws(()=>parseSpendCSV(header+',lbu\n2026-01,PAC,Singapore,Cloud,Software,100,PAC'),/only once/);
assert.throws(()=>parseSpendCSV(header+'\n2026-13,PAC,Singapore,Nimbus Cloud,Cloud,100'),/YYYY-MM/);
assert.throws(()=>parseSpendCSV(header+'\n2026-01,PAC,Singapore,Nimbus Cloud,Cloud,NaN'),/plain SGD/);
assert.throws(()=>parseSpendCSV(header+'\n2026-01,PAC,Singapore,Nimbus Cloud,Cloud,100.005'),/plain SGD/);
assert.throws(()=>parseSpendCSV(header+'\n2026-01,PAC,Singapore,Nimbus Cloud,Cloud,9999999999999'),/too large/);
assert.equal(parseSpendCSV(csv.replace('lbu,','business_unit,')).units.length,3);
const names=new Map(imported.units.map(u=>[u.id,u.name])),suppliers=new Map(imported.vendors.map(v=>[v.id,v.name]));
const roundtrip=header+'\n'+imported.rows.map(r=>[r.month,names.get(r.unitId),'Singapore',suppliers.get(r.vendorId),r.category,r.amount/100].map(csvCell).join(',')).join('\n');
assert.equal(summarize(parseSpendCSV(roundtrip).rows,parseSpendCSV(roundtrip).units,parseSpendCSV(roundtrip).vendors).total,58000);
console.log('Singapore LBU import checks passed: distinct identities, currencies, credits, aggregation, limits and export roundtrip.');

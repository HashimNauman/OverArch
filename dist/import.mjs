import { parseCSV } from './utilities.mjs?v=20261106.1';
export function parseSpendCSV(text) {
  if(new TextEncoder().encode(text).length>2*1024*1024) throw Error('Choose a CSV smaller than 2 MB.');
  const parsed=parseCSV(text.replace(/^\uFEFF/,''));
  if(parsed.length<2) throw Error('Add at least one spend row below the header.');
  if(parsed.length>20001) throw Error('The file has more than 20,000 spend rows.');
  const headers=parsed.shift().map(x=>x.trim().toLowerCase());
  if(!headers.includes('lbu')&&headers.includes('business_unit')) headers[headers.indexOf('business_unit')]='lbu';
  const required=['month','lbu','vendor','category','amount_sgd'];
  if(required.some(h=>!headers.includes(h))) throw Error('Include the required columns: '+required.join(', ')+'. Amounts must already be in SGD.');
  if(new Set(headers).size!==headers.length) throw Error('Each CSV column must appear only once.');
  const norm=x=>x.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
  const unitMap=new Map(),vendorMap=new Map(),categoryMap=new Map(),units=[],vendors=[],grouped=new Map();
  parsed.forEach((fields,index)=>{
    const fail=message=>{throw Error(`Row ${index+2}: ${message}`);};
    if(fields.length!==headers.length) fail('column count does not match the header.');
    const r=Object.fromEntries(headers.map((h,i)=>[h,fields[i].trim()]));
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(r.month)||r.month<'2000-01'||r.month>'2100-12') fail('month must be YYYY-MM, between 2000 and 2100.');
    if([r.lbu,r.vendor,r.category].some(x=>!x||x.length>100||/[\x00-\x1f]/.test(x))) fail('LBU, supplier and category names must be 1–100 readable characters.');
    if(!/^-?\d+(\.\d{1,2})?$/.test(r.amount_sgd)) fail('use a plain SGD amount, such as 12500.50, without a symbol or thousands separator.');
    if(r.country&&!['singapore','sg','sgp'].includes(norm(r.country))) fail('this workspace is Singapore only.');
    if(r.currency&&r.currency.toUpperCase()!=='SGD') fail('convert amounts to SGD before importing; this app performs no FX conversion.');
    const amount=Math.round(Number(r.amount_sgd)*100);
    if(!Number.isSafeInteger(amount)||Math.abs(amount)>1e12) fail('amount is too large.');
    const uk=norm(r.lbu),vk=norm(r.vendor),ck=norm(r.category);
    if(!unitMap.has(uk)) {
      if(units.length===3) fail('this MVP supports at most three LBUs. Combine their spend into one file.');
      const u={id:`i-u${units.length+1}`,name:r.lbu,code:String(units.length+1).padStart(2,'0'),city:'Singapore',country:'Singapore',continent:'Asia',color:['#8057ff','#88f9c0','#b3a0ff'][units.length]};
      units.push(u);unitMap.set(uk,u);
    }
    if(!vendorMap.has(vk)) {
      if(vendors.length===500) fail('keep this MVP to 500 suppliers.');
      const v={id:`i-v${vendors.length+1}`,name:r.vendor,category:r.category,color:'#8057ff',eligibleShare:.65,lowRate:.03,highRate:.06,strategy:'Coordinate an LBU supplier framework',nextStep:'Confirm supplier legal identity, comparable scopes, contract terms and renewal dates with the LBU owners.',owner:'Singapore Procurement'};
      vendors.push(v);vendorMap.set(vk,v);
    }
    if(!categoryMap.has(ck)) categoryMap.set(ck,r.category);
    const category=categoryMap.get(ck),u=unitMap.get(uk),v=vendorMap.get(vk);
    const key=JSON.stringify([r.month,u.id,v.id,category]);
    if(!grouped.has(key)) grouped.set(key,{id:`i-${grouped.size+1}`,month:r.month,unitId:u.id,vendorId:v.id,category,amount:0,unitName:u.name,vendorName:v.name,country:'Singapore',continent:'Asia'});
    const g=grouped.get(key);g.amount+=amount;
    if(!Number.isSafeInteger(g.amount)) fail('combined spend exceeds the supported amount range.');
  });
  const rows=[...grouped.values()];
  if(!Number.isSafeInteger(rows.reduce((a,r)=>a+Math.abs(r.amount),0))) throw Error('Combined spend exceeds the supported amount range.');
  return {units,vendors,categories:[...categoryMap.values()].sort(),rows,demo:false};
}

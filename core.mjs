import {readFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
if (!globalThis.crypto) Object.defineProperty(globalThis,'crypto',{value:webcrypto});
export const digest = value => createHash('sha256').update(value).digest('hex');
const assert = (ok,message) => { if(!ok) throw Error(message); };
const moduleURL = source => 'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
export function exactCash(row) {
  const inputs=row.inputs;
  assert(Array.isArray(inputs)&&inputs.length>=2,'At least two cash operands required');
  for(const field of ['period','scope','unit']) assert(inputs.every(x=>typeof x[field]==='string'&&x[field]===inputs[0][field]),'Incompatible '+field);
  assert(inputs.every(x=>x.qualifier==='exact'&&typeof x.value==='string'&&/^-?\d+(\.\d+)?$/.test(x.value)),'Exact finite decimal strings required');
  const scale=Math.max(...inputs.map(x=>(x.value.split('.')[1]||'').length));
  const numbers=inputs.map(x=>{const negative=x.value.startsWith('-'),[whole,fraction='']=x.value.replace(/^-/,'').split('.');return BigInt(whole+fraction.padEnd(scale,'0'))*(negative?-1n:1n);});
  assert(row.operation==='add'||(row.operation==='subtract'&&numbers.length===2),'Unsupported cash operation');
  const n=row.operation==='add'?numbers.reduce((a,b)=>a+b,0n):numbers[0]-numbers[1];
  let s=(n<0n?-n:n).toString().padStart(scale+1,'0');
  if(scale)s=s.slice(0,-scale)+'.'+s.slice(-scale);
  return (n<0n?'-':'')+s;
}
export async function load(root) {
  const pins=JSON.parse(await readFile(new URL('pins.json',root),'utf8'));
  const files={};
  for(const [name,hash] of Object.entries(pins.files)) {
    assert(/^[a-zA-Z0-9/._-]+$/.test(name)&&!name.split('/').includes('..')&&!name.startsWith('/'),'Unsafe bundle member');
    const bytes=await readFile(new URL(name,root));assert(digest(bytes)===hash,'Bundle hash mismatch: '+name);files[name]=bytes.toString('utf8');
  }
  const workflow=await import(moduleURL(files['data/global/workflow.mjs']));
  const cashWorkflow=moduleURL(files['data/cash/workflow.mjs']);
  const cash=await import(moduleURL(files['data/cash/review.mjs'].replace("'./workflow.mjs'",JSON.stringify(cashWorkflow)).replace("'./cash-bridge.mjs'",JSON.stringify(moduleURL(files['data/cash/cash-bridge.mjs'])))));
  const tables=Object.fromEntries(['events','sources','cash-checks','product-terms'].map(t=>[t,files['data/operating/'+t+'.jsonl'].trim().split('\n').filter(Boolean).map(JSON.parse)]));
  const records=[...tables.events,...tables['cash-checks'],...tables['product-terms']];
  const sources=new Map(tables.sources.map(s=>[s.id,s]));
  const eligible=(r,asOf)=>Math.max(workflow.instant(r.observed_at),workflow.instant(r.reviewed_at))<=workflow.instant(asOf);
  const operatingSummary=JSON.parse(files['data/operating/summary.json']);
  const cashCoverage=JSON.parse(files['data/cash/coverage.json']);
  const limits=['Selected fixed research snapshot, not live or complete coverage.','Dataset admission is distinct from historical public availability.','AI-assisted single-operator review; no independent financial assurance.','Hashes verify retained public bytes, not private-source authenticity.','No market prices, return prediction, trading, or publishing privileges.'];
  async function execute(name,a) {
    if(name==='get_coverage') {
      const result=await workflow.run(files['data/global/snapshot.json'],pins.files['data/global/snapshot.json'],{asOf:pins.coverageAsOf});
      return {version:pins.version,coverageAsOf:pins.coverageAsOf,globalDisclosure:result.answer.companies.map(c=>({id:c.entity,name:c.name})),cashReview:{companies:cashCoverage.companies.map(c=>({id:c.entity,name:c.name})),scope:"Historical 12-company cash review"},operatingEvidence:operatingSummary,maintenanceSnapshot:JSON.parse(files['data/maintenance.json']),limits};
    }
    if(name==='query_disclosure_evidence')return (await workflow.run(files['data/global/snapshot.json'],pins.files['data/global/snapshot.json'],{asOf:a.asOf,...(a.entity?{entity:a.entity}:{})})).answer;
    if(name==='get_operating_changes') {
      workflow.instant(a.asOf);
      if(a.previousAsOf)assert(workflow.instant(a.previousAsOf)<=workflow.instant(a.asOf),'Previous cutoff is after current cutoff');
      if(a.issuer)assert(operatingSummary.issuers.includes(a.issuer),'Issuer outside operating evidence pilot');
      return {asOf:a.asOf,previousAsOf:a.previousAsOf??null,availabilityBasis:'observed-and-reviewed',firstPublicAvailability:'unknown',meaning:'Newly admitted annotations; not necessarily newly published disclosures or business changes.',records:records.filter(r=>(!a.issuer||r.issuer===a.issuer)&&eligible(r,a.asOf)&&(!a.previousAsOf||!eligible(r,a.previousAsOf))),limits};
    }
    if(name==='trace_claim'||name==='check_cash_bridge') {
      workflow.instant(a.asOf);
      const row=records.find(r=>r.id===a.recordId);assert(row,'Unknown record ID');
      if(!eligible(row,a.asOf))return {status:'not-admitted-by-cutoff',recordId:a.recordId,asOf:a.asOf,limits};
      if(name==='check_cash_bridge') {
        assert(tables['cash-checks'].some(r=>r.id===row.id),'Record is not a cash calculation');
        const result=exactCash(row);assert(result===row.result,'Stored cash calculation differs');
        return {status:'arithmetic-reproduced',record:row,recomputed:result,source:sources.get(row.source_id),aiCashAttribution:'unestablished',limits};
      }
      return {status:'reviewed-annotation',record:row,source:sources.get(row.source_id),successors:records.filter(r=>r.previous_record_id===row.id&&eligible(r,a.asOf)),fulfillmentAssessment:'unknown-no-independent-longitudinal-assessment',limits};
    }
    if(name==='review_claim') {
      assert(Array.isArray(a.request?.entities)&&a.request.entities.every(id=>cashCoverage.companies.some(c=>c.entity===id)), 'Company outside historical cash-review cohort');
      const r=await cash.makeReview(files['data/cash/snapshot.json'],pins.files['data/cash/snapshot.json'],a.request);
      return {request:r.request,baselineMode:r.baselineMode,report:r.report,sourceReceiptsThrough:r.sourceReceiptsThrough,limits:r.limits};
    }
    throw Error('Unknown tool');
  }
  const protocolTools=new Set(['get_coverage','query_disclosure_evidence','get_operating_changes','trace_claim','check_cash_bridge','review_claim']);
  async function makePacket(name,args) {
    assert(protocolTools.has(name),'Unsupported replayable tool');
    return {schemaVersion:'1.0.0',packageVersion:pins.version,pinsSha256:digest(JSON.stringify(pins)),tool:name,arguments:args,result:await execute(name,args)};
  }
  async function replay(text,sha) {
    assert(digest(text)===sha,'Packet hash mismatch');const packet=JSON.parse(text);
    assert(packet.schemaVersion==='1.0.0'&&packet.packageVersion===pins.version&&packet.pinsSha256===digest(JSON.stringify(pins)),'Use the original pinned package for this packet');
    const reproduced=await makePacket(packet.tool,packet.arguments);
    assert(JSON.stringify(reproduced)===JSON.stringify(packet),'Packet result does not reproduce');
    return {verified:true,packetSha256:sha,result:reproduced.result,limits};
  }
  return {pins,execute,makePacket,replay,cashRequestSchema:JSON.parse(files['data/cash/request.schema.json'])};
}

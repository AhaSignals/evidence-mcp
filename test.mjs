import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
import {load,digest,exactCash} from './core.mjs';
const root=new URL('./',import.meta.url);
const api=await load(root),asOf='2026-10-25T00:00:00Z';
test('coverage is explicit and bounded',async()=>{const c=await api.execute('get_coverage',{});assert.equal(c.globalDisclosure.length,41);assert.equal(c.cashReview.companies.length,12);assert.equal(c.operatingEvidence.issuers.length,4);assert(JSON.stringify(c).length<18000);});
test('prospective enrollment is preserved',async()=>{const c=await api.execute('query_disclosure_evidence',{asOf:'2026-10-21T23:00:00Z'});assert.equal(c.companies.length,12);});
test('microsecond review boundary is enforced',async()=>{const a=await api.execute('get_operating_changes',{issuer:'CRM',asOf:'2026-10-24T23:42:55.474665Z'});assert.equal(a.records.length,0);const b=await api.execute('get_operating_changes',{issuer:'CRM',asOf:'2026-10-24T23:42:55.474666Z'});assert.equal(b.records.length,4);});
test('future, naive and impossible cutoffs fail closed',async()=>{for(const args of [{asOf:'2026-10-25'},{asOf:'2026-02-30T00:00:00Z'},{asOf,previousAsOf:'2026-11-01T00:00:00Z'}])await assert.rejects(api.execute('get_operating_changes',args));});
test('exact cash and incomparable input rejection',async()=>{const r=await api.execute('check_cash_bridge',{recordId:'pypl-fcf-q226',asOf});assert.equal(r.recomputed,'1775');for(const [field,value] of [['period','other'],['scope','AI only'],['unit','EUR'],['qualifier','estimate'],['value','NaN']]){const x=structuredClone(r.record);x.inputs[0][field]=value;assert.throws(()=>exactCash(x));}const x=structuredClone(r.record);x.inputs[0].value='0.3';x.inputs[1].value='0.1';assert.equal(exactCash(x),'0.2');});
test('modified packet with recalculated checksum cannot replay',async()=>{const p=await api.makePacket('check_cash_bridge',{recordId:'pypl-fcf-q226',asOf});p.result.recomputed='999';const s=JSON.stringify(p);await assert.rejects(api.replay(s,digest(s)),/does not reproduce/);});
test('tampered source bundle fails before query',async()=>{const tmp=await mkdtemp(join(tmpdir(),'aha-mcp-test-'));try{await cp(root,tmp,{recursive:true});const path=join(tmp,'data/operating/events.jsonl');await writeFile(path,(await readFile(path,'utf8'))+'\n');await assert.rejects(load(pathToFileURL(tmp+'/')),/hash mismatch/);}finally{await rm(tmp,{recursive:true,force:true});}});
test('cash review accepts baseline issuer and rejects expansion issuer',async()=>{const request={entities:['meta'],previousAsOf:'2026-10-20T00:00:00Z',asOf,thesis:'self-funded'};const r=await api.execute('review_claim',{request});assert.equal(r.report.companies.length,1);await assert.rejects(api.execute('review_claim',{request:{...request,entities:['amzn']}}));});

test('compute admission uses microsecond review boundary, not filing date',async()=>{
 const early=await api.execute('query_compute_commitments',{asOf:'2026-10-26T13:55:42.926409Z'});assert.equal(early.events.length,0);assert.equal(early.sources.length,0);assert.equal(early.relations.length,0);
 const yes=await api.execute('query_compute_commitments',{asOf:'2026-10-26T13:55:42.926410Z'});assert.equal(yes.events.length,9);assert.equal(yes.latestClaims.length,8);assert.equal(yes.cashFacts.length,22);assert.equal(yes.aggregateCommitment,null);
 for(const date of ['2026-10-26','2026-02-30T00:00:00Z'])await assert.rejects(api.execute('query_compute_commitments',{asOf:date}));
});
test('four compute bridges reproduce and cannot leak before admission',async()=>{
 for(const [bridgeId,value] of [['loss-to-ocf','3929'],['cash-change','97517'],['cash-balances','114918'],['restricted-split','114918']]){
  const r=await api.execute('check_compute_cash_bridge',{asOf:'2026-10-27T00:00:00Z',bridgeId});assert.equal(r.recomputed,value);assert.equal(r.aiCashAttribution,'unestablished');
  const early=await api.execute('check_compute_cash_bridge',{asOf:'2026-10-26T13:55:42.926409Z',bridgeId});assert.equal(early.status,'not-admitted-by-cutoff');assert(!early.inputs);
 }
});
test('manifest lists exactly the protocol tools',async()=>{
 const {toolDefinitions}=await import('./tools.mjs');const manifest=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
 assert.equal(manifest.tools_generated,false);assert.deepEqual(manifest.tools,toolDefinitions(api.cashRequestSchema).map(({name,description})=>({name,description})));
});
test('older package packets require the original release',async()=>{const p=await api.makePacket('get_coverage',{});p.packageVersion='0.1.1';const text=JSON.stringify(p);await assert.rejects(api.replay(text,digest(text)),/original pinned package/);});

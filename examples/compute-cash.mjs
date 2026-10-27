// Offline end-to-end example over the actual MCP stdio protocol.
import {spawn} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),dir=new URL('./',import.meta.url);
const child=spawn(process.execPath,[fileURLToPath(new URL('server.mjs',root))],{stdio:['pipe','pipe','pipe'],env:{}});
let buffer='',id=0;const pending=new Map();
child.stdout.on('data',c=>{buffer+=c;let n;while((n=buffer.indexOf('\n'))>=0){const m=JSON.parse(buffer.slice(0,n));buffer=buffer.slice(n+1);pending.get(m.id)?.(m);pending.delete(m.id);}});
const timeout=setTimeout(()=>{child.kill();throw Error('Protocol example timed out');},30000);
const rpc=(method,params={})=>new Promise(resolve=>{pending.set(++id,resolve);child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');});
async function call(name,args){const m=await rpc('tools/call',{name,arguments:args});assert(!m.error,JSON.stringify(m));assert(!m.result.isError,JSON.stringify(m));return JSON.parse(m.result.content[0].text);}
async function packet(result){const m=await rpc('resources/read',{uri:result.packetUri});assert(!m.error);const text=m.result.contents[0].text;assert.equal(createHash('sha256').update(text).digest('hex'),result.packetSha256);return text;}
try {
 await rpc('initialize',{protocolVersion:'2025-06-18',clientInfo:{name:'compute-cash-example',version:'0.2.0'},capabilities:{}});
 child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
 const asOf='2026-10-26T13:55:42.926410Z';
 const before=JSON.parse(await packet(await call('query_compute_commitments',{asOf:'2026-10-26T13:55:42.926409Z'}))).result;
 assert.equal(before.events.length,0);assert.equal(before.cashFacts.length,0);
 const receipt=await call('query_compute_commitments',{asOf}),text=await packet(receipt),data=JSON.parse(text).result;
 assert.equal(data.events.length,9);assert.equal(data.latestClaims.length,8);assert.equal(data.cashFacts.length,22);assert.equal(data.aggregateCommitment,null);
 const bridges=[];
 for(const bridgeId of ['loss-to-ocf','cash-change','cash-balances','restricted-split']){
  const r=await call('check_compute_cash_bridge',{asOf,bridgeId});
  bridges.push({id:bridgeId,status:r.result.status,value:r.result.recomputed,unit:r.result.result.unit,period:r.result.result.period});
 }
 const replay=await call('replay_evidence',{packetText:text,packetSha256:receipt.packetSha256});assert(replay.verified);
 const output={packageVersion:'0.2.0',question:'Do reviewed compute commitments establish cash payments or self-funding?',cutoff:asOf,earlyCutoffRecords:before.events.length,admittedEvents:data.events.length,latestClaims:data.latestClaims.length,cashInputs:data.cashFacts.length,aggregateCommitment:null,contractCashPaid:'unknown',aiCashAttribution:'unestablished',bridges,packetSha256:receipt.packetSha256,replayVerified:true,externalAdoption:false};
 const pretty=JSON.stringify(output,null,2)+'\n';
 if(process.argv.includes('--write')){
  await writeFile(new URL('compute-cash.expected.json',dir),pretty);await writeFile(new URL('compute-cash.packet.json',dir),text);await writeFile(new URL('compute-cash.packet.sha256',dir),receipt.packetSha256+'  compute-cash.packet.json\n');
 }else{
  assert.equal(pretty,await readFile(new URL('compute-cash.expected.json',dir),'utf8'));
  const saved=await readFile(new URL('compute-cash.packet.json',dir),'utf8');assert.equal(saved,text);
  assert.equal((await readFile(new URL('compute-cash.packet.sha256',dir),'utf8')).split(' ')[0],receipt.packetSha256);
 }
 console.log(pretty);
}finally{clearTimeout(timeout);child.stdin.end();child.kill();}

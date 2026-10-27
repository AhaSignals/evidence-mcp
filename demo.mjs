import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const child=spawn(process.execPath,[fileURLToPath(new URL('./server.mjs',import.meta.url))],{stdio:['pipe','pipe','pipe']});
let buffer='',next=0;const waiting=new Map();let errors='';
child.stderr.on('data',c=>errors+=c);
child.stdout.on('data',c=>{buffer+=c;let i;while((i=buffer.indexOf('\n'))>=0){const m=JSON.parse(buffer.slice(0,i));buffer=buffer.slice(i+1);waiting.get(m.id)?.(m);waiting.delete(m.id);}});
const timer=setTimeout(()=>{child.kill();throw Error('MCP demonstration timed out: '+errors);},30000);
function rpc(method,params={}) {const id=++next;return new Promise(resolve=>{waiting.set(id,resolve);child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');});}
async function call(name,args={}){const m=await rpc('tools/call',{name,arguments:args});assert(!m.error,JSON.stringify(m));assert(!m.result.isError,JSON.stringify(m));return JSON.parse(m.result.content[0].text);}
try {
 await rpc('initialize',{protocolVersion:'2025-06-18',clientInfo:{name:'ahasignals-protocol-demo',version:'0.1.0'},capabilities:{}});
 child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
 const listed=await rpc('tools/list');assert.equal(listed.result.tools.length,9);
 const before=await call('get_operating_changes',{issuer:'CRM',asOf:'2026-10-24T00:00:00Z'});assert.equal(before.result.records.length,0);
 const after=await call('get_operating_changes',{issuer:'CRM',asOf:'2026-10-25T00:00:00Z'});assert.equal(after.result.records.length,4);
 const trace=await call('trace_claim',{recordId:'crm-arr-scope-fy27q2',asOf:'2026-10-25T00:00:00Z'});
 assert.equal(trace.result.record.comparability,'unknown-without-common-scope-bridge');
 const cash=await call('check_cash_bridge',{recordId:'pypl-fcf-q226',asOf:'2026-10-25T00:00:00Z'});assert.equal(cash.result.recomputed,'1775');
 const resource=await rpc('resources/read',{uri:cash.packetUri}),text=resource.result.contents[0].text;
 assert.equal(createHash('sha256').update(text).digest('hex'),cash.packetSha256);
 const replay=await call('replay_evidence',{packetText:text,packetSha256:cash.packetSha256});assert.equal(replay.verified,true);
 const bad=await rpc('tools/call',{name:'get_operating_changes',arguments:{asOf:'2026-10-25T00:00:00Z',issuer:'NVDA'}});assert.equal(bad.result.isError,true);
 console.log(JSON.stringify({protocol:'stdio MCP',tools:9,earlyCutoffRecords:0,crmAdmittedRecords:4,commonScopeGrowth:'unknown',pyplCash:'1775 USD million',replayVerified:true,unsupportedOperatingIssuerRejected:true,externalAdoption:false},null,2));
} finally {clearTimeout(timer);child.stdin.end();child.kill();}

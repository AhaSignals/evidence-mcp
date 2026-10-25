// Local stdio only: no sockets, arbitrary paths, account access or outbound requests.
import {loadKit,digest} from './load-kit.mjs';
const json=o=>JSON.stringify(o,null,2)+'\n';
try{
 const pin=process.argv[2],kit=await loadKit(pin),{makeReview,baselineFrom,replayReview}=kit.engine;
 const requestSchema=JSON.parse(kit.files['request.schema.json']);
 const textSchema={type:'string',maxLength:15000000},hashSchema={type:'string',pattern:'^[a-f0-9]{64}$'};
 const tools=[
  {name:'review_claim',description:'Review selected companies at two cutoffs. Return a compact summary and local resource URI for the complete replayable packet. Read the resource only when full evidence is needed.',inputSchema:{type:'object',additionalProperties:false,required:['request'],properties:{request:requestSchema}}},
  {name:'compare_reviews',description:'Replay a prior packet, preserve its exact snapshot, then run the next request. Supply priorPacketText for a saved packet from an earlier session; omit it only when its digest is still in this session cache.',inputSchema:{type:'object',additionalProperties:false,required:['request','priorPacketSha256'],properties:{request:requestSchema,priorPacketText:textSchema,priorPacketSha256:hashSchema}}},
  {name:'replay_review',description:'Verify a packet and reproduce its complete stored result. Supply packetText for an earlier session, or omit it for a packet still cached in this session. Hashes establish consistency, not source truth.',inputSchema:{type:'object',additionalProperties:false,required:['packetSha256'],properties:{packetText:textSchema,packetSha256:hashSchema}}}
 ].map(t=>({...t,annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false}}));
 let initialized=false,ready=false,buffer='',chain=Promise.resolve();
 const packets=new Map(),uri=h=>'ahasignals-review://'+h;
 const remember=text=>{const h=digest(text);packets.set(h,text);while(packets.size>8)packets.delete(packets.keys().next().value);return h;};
 const resolve=(text,h)=>{const value=text??packets.get(h);if(typeof value!=='string')throw Error('Packet is not in this session. Supply the saved exact packet text and digest, or use the offline CLI.');return value;};
 const compact=p=>({request:{entities:p.request.entities,previousAsOf:p.request.previousAsOf,asOf:p.request.asOf,thesis:p.request.thesis},baselineMode:p.baselineMode,summary:p.report.summary,
  companies:p.report.companies.map(c=>({entity:c.entity,name:c.name,thesisStatus:c.thesisStatus,annotationChangeCount:c.changes.length,sourceCheckCount:c.sourceChecks.length,
   cashRatios:c.cashChecks.map(v=>({value:v.value,period:v.period,status:v.status})),cashBridges:c.cashFunding?.bridges.map(b=>({period:b.period,unit:b.unit,operatingCash:b.operatingCash,cashInvestment:b.cashInvestment,cashAfterInvestment:b.cashAfterInvestment,cashAfterInvestmentAndDividends:b.cashAfterInvestmentAndDividends,checks:b.checks}))??[],nextChecks:c.nextChecks,fundingConclusion:c.fundingConclusion})),limits:p.report.limits});
 const send=o=>process.stdout.write(JSON.stringify(o)+'\n');
 async function handle(line){
  let m;try{m=JSON.parse(line);}catch{send({jsonrpc:'2.0',id:null,error:{code:-32700,message:'Invalid JSON'}});return;}
  if(!m||Array.isArray(m)||m.jsonrpc!=='2.0'||typeof m.method!=='string'){send({jsonrpc:'2.0',id:m?.id??null,error:{code:-32600,message:'Invalid request'}});return;}
  const hasId=Object.hasOwn(m,'id'),error=(code,message)=>hasId&&send({jsonrpc:'2.0',id:m.id,error:{code,message}}),result=x=>hasId&&send({jsonrpc:'2.0',id:m.id,result:x});
  if(m.method==='initialize'){
   if(initialized)return error(-32600,'Already initialized');
   if(!hasId||typeof m.params?.protocolVersion!=='string'||!m.params?.clientInfo)return error(-32602,'Missing initialization parameters');
   initialized=true;return result({protocolVersion:'2025-06-18',capabilities:{tools:{listChanged:false},resources:{}},serverInfo:{name:'ahasignals-cash-review',version:'1.0.0'},instructions:'Read-only selected-archive research. Tool replies are compact; resources/read returns the complete packet, which may be large. Cache holds the last 8 packets until process exit; save required evidence separately. Preserve unknowns. No forecasts, trade execution or broker connection. Keep private notes local unless host transmission is authorized.'});
  }
  if(m.method==='notifications/initialized'){if(initialized)ready=true;return;}
  if(m.method==='ping')return result({});
  if(!hasId)return;
  if(!ready)return error(-32002,'Initialize the server first');
  if(m.method==='tools/list')return result({tools});
  if(m.method==='resources/list')return result({resources:[...packets.keys()].map(h=>({uri:uri(h),name:'Cash review '+h,mimeType:'application/json',size:Buffer.byteLength(packets.get(h))}))});
  if(m.method==='resources/read'){
   const target=m.params?.uri,h=typeof target==='string'?target.replace(/^ahasignals-review:\/\//,''):'';
   if(!/^[a-f0-9]{64}$/.test(h)||target!==uri(h)||!packets.has(h))return error(-32002,'Unknown or expired local packet resource');
   return result({contents:[{uri:target,mimeType:'application/json',text:packets.get(h)}]});
  }
  if(m.method!=='tools/call')return error(-32601,'Method not found');
  const t=tools.find(t=>t.name===m.params?.name);if(!t)return error(-32602,'Unknown tool');
  const a=m.params.arguments;
  if(!a||typeof a!=='object'||Array.isArray(a)||Object.keys(a).some(k=>!Object.hasOwn(t.inputSchema.properties,k))||t.inputSchema.required.some(k=>!Object.hasOwn(a,k)))return error(-32602,'Invalid tool arguments');
  for(const key of ['packetText','priorPacketText'])if(key in a&&(typeof a[key]!=='string'||a[key].length>15000000))return error(-32602,'Invalid packet text');
  for(const key of ['packetSha256','priorPacketSha256'])if(key in a&&(typeof a[key]!=='string'||!/^[a-f0-9]{64}$/.test(a[key])))return error(-32602,'Invalid packet digest');
  try{
   let output;
   if(t.name==='replay_review'){const text=resolve(a.packetText,a.packetSha256),p=await replayReview(text,a.packetSha256);remember(text);output={verified:true,packetSha256:a.packetSha256,packetUri:uri(a.packetSha256),report:compact(p)};}
   else{const baseline=t.name==='compare_reviews'?await baselineFrom(resolve(a.priorPacketText,a.priorPacketSha256),a.priorPacketSha256):null;
    const p=await makeReview(kit.files['snapshot.json'],kit.manifest.files['snapshot.json'],a.request,baseline),packetText=json(p);
    const h=remember(packetText);output={releaseSha256:pin,packetSha256:h,packetUri:uri(h),packetBytes:Buffer.byteLength(packetText),report:compact(p)};}
   result({content:[{type:'text',text:JSON.stringify(output)},{type:'resource_link',uri:output.packetUri,name:'Complete replayable cash review',mimeType:'application/json',description:'Private local packet; may contain your note. Read or save explicitly. Session cache only.'}],structuredContent:output,isError:false});
  }catch(e){result({content:[{type:'text',text:e.message}],isError:true});}
 }
 process.stdin.setEncoding('utf8');
 process.stdin.on('data',chunk=>{
  buffer+=chunk;if(Buffer.byteLength(buffer)>20000000){process.stderr.write('Input exceeds 20 MB limit\n');process.exit(1);}
  let index;while((index=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,index);buffer=buffer.slice(index+1);if(line.trim())chain=chain.then(()=>handle(line)).catch(()=>{process.stderr.write('Request failed\n');process.exitCode=1;});}
 });
 process.stdin.on('end',()=>{if(buffer.trim())chain=chain.then(()=>handle(buffer));});
}catch(e){process.stderr.write(e.message+'\n');process.exitCode=1;}

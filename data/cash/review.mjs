// Deterministic research review. Both calculations consume verified, captured bytes.
import {run,instant,sha256} from './workflow.mjs';
import {cashBridge} from './cash-bridge.mjs';
export {sha256};
export const VERSION='1.0.0';
export const THESES={
 'cash-conversion':'Revenue growth is accompanied by operating cash flow',
 'self-funded':'Operating cash can cover investment without new financing',
 'investment-continuity':'Investment guidance still supports my demand assumption'
};
const requireThat=(ok,msg)=>{if(!ok)throw Error(msg)};
export function validateRequest(r){
 requireThat(r&&typeof r==='object'&&!Array.isArray(r),'Request must be an object.');
 requireThat(Object.keys(r).every(k=>['entities','previousAsOf','asOf','thesis','minimumCashRatioPct','note'].includes(k)),'Unknown request field. Do not include positions or account data.');
 requireThat(Array.isArray(r.entities)&&r.entities.length>0&&r.entities.length<=12&&r.entities.every(e=>typeof e==='string')&&new Set(r.entities).size===r.entities.length,'Select 1–12 distinct company IDs.');
 requireThat(instant(r.previousAsOf)<=instant(r.asOf),'Previous review must not be after the current cutoff.');
 requireThat(Object.hasOwn(THESES,r.thesis),'Select a supported original judgment.');
 requireThat(r.minimumCashRatioPct===undefined||r.minimumCashRatioPct===null||typeof r.minimumCashRatioPct==='number'&&Number.isFinite(r.minimumCashRatioPct)&&r.minimumCashRatioPct>=0&&r.minimumCashRatioPct<=1000,'Cash ratio threshold must be null or a number between 0 and 1000.');
 requireThat(r.note===undefined||typeof r.note==='string'&&r.note.length<=2000,'Local note is limited to 2,000 characters.');
 return {...r,entities:[...r.entities].sort(),minimumCashRatioPct:r.minimumCashRatioPct??null,note:r.note??''};
}
const semantic=f=>JSON.stringify([f.claimKey,f.concept,f.kind,f.period,f.scope]);
function changes(before,after){
 const a=new Map(before.facts.map(f=>[semantic(f),f])),b=new Map(after.facts.map(f=>[semantic(f),f]));
 return [...new Set([...a.keys(),...b.keys()])].sort().flatMap(k=>{
  const old=a.get(k),now=b.get(k);if(old&&now&&JSON.stringify([old.value,old.unit,old.interpretation])===JSON.stringify([now.value,now.unit,now.interpretation]))return [];
  return [{type:!old?'newly-admitted-evidence':!now?'evidence-no-longer-admitted':'reviewed-annotation-difference',before:old??null,after:now??null,meaning:!old?'New to this retained archive or cutoff; not necessarily a new issuer disclosure.':!now?'Recheck evidence coverage; not proof of financial deterioration.':'Recheck the same claim against both sources; not automatically an issuer restatement.'}];
 });
}
const FUNDING_MISSING=[
 {field:'cash-capex',question:'Obtain cash paid for property, plant and equipment for the same period; separate it from capex guidance and lease additions.'},
 {field:'working-capital',question:'Read receivables, inventory, payables and customer advances to explain operating cash flow; do not call a sensitivity calculation recurring cash flow.'},
 {field:'liquidity-and-maturities',question:'Check cash restrictions, debt maturities, committed funding availability and near-term obligations at the same reporting date.'},
 {field:'lease-and-purchase-payments',question:'Separate current lease principal from future lease and purchase commitments. Do not deduct all future commitments from current-period cash flow.'}
];
function summarize(before,now,r){
 const changed=changes(before,now);
 const checks=[];
 for(const calc of now.calculations){
  const inputs=calc.inputFactIds.map(id=>{const f=now.facts.find(x=>x.id===id),d=now.documents.find(x=>x.documentId===f.documentId);return {...f,sourceUrl:d.url,sourceSha256:d.sourceSha256,annotationRecordedAt:d.annotationRecordedAt,matchingRetentionReceiptAt:d.matchingRetentionReceiptAt,firstPublicAt:d.firstPublicAt};});
  checks.push({...calc,inputs,status:r.minimumCashRatioPct===null?'observed-ratio':Number(calc.value)<r.minimumCashRatioPct?'below-your-threshold':'meets-your-threshold',thresholdPct:r.minimumCashRatioPct,thresholdMeaning:'User research screen only. Rounded to two decimals; not a forecast, collection rate, quality score or recommendation.'});
 }
 const sourceChecks=now.documents.filter(d=>d.state!=='matches-reviewed-seed').map(d=>({documentId:d.documentId,url:d.url,state:d.state,admitted:d.admitted,reviewedSha256:d.sourceSha256,latestAttempt:d.latestAttempt,meaning:d.admitted?'Calculation retains the older reviewed version. Latest bytes are not promoted to facts.':'This source contributes no facts under the retained-observation policy.'}));
 const contexts=now.facts.filter(f=>f.kind==='context'||f.concept==='capital-expenditure'||f.interpretation).map(f=>({factId:f.id,concept:f.concept,value:f.value,unit:f.unit,period:f.period,scope:f.scope,kind:f.kind,interpretation:f.interpretation,documentId:f.documentId}));
 const thesisStatus=r.thesis==='self-funded'?'insufficient-funding-evidence':r.thesis==='investment-continuity'?'manual-scope-review-required':!checks.length?'insufficient-cash-evidence':checks.some(c=>c.status==='below-your-threshold')?'review-your-cash-assumption':'limited-cash-check-only';
 const nextChecks=[...(!checks.length?[{field:'matched-cash-pair',question:'Obtain operating cash flow and revenue for the same period, consolidation scope, currency and document. Revenue alone does not establish cash realization.'}]:[]),...FUNDING_MISSING];
 if(r.thesis==='investment-continuity')nextChecks.unshift({field:'guidance-definition',question:'Compare the reporting period, lease classification and actual-versus-guidance status before interpreting a changed investment amount as changed demand.'});
 const bridge=cashBridge(now);
 const priorBridge=cashBridge(before);
 const hasBridge=bridge?.bridges.length>0;
 return {entity:now.entity,name:now.name,market:now.market,thesisStatus,changes:changed,cashChecks:checks,sourceChecks,contexts,nextChecks:hasBridge?[...nextChecks.filter(x=>x.field==='guidance-definition'),...bridge.unknowns.map((question,i)=>({field:'forward-funding-'+i,question}))]:nextChecks,
 ...(bridge?{cashFunding:bridge,previousCashFunding:priorBridge}:{}),
 fundingConclusion:hasBridge?'Historical cash bridges reconcile. Forward financing dependence and cash return on AI investment remain unestablished.':'Not established from this selected archive. A funding gap, self-funding capacity and AI investment cash return cannot be computed from these annotations.',
 before:{facts:before.facts,documents:before.documents,calculations:before.calculations},after:{facts:now.facts,documents:now.documents,calculations:now.calculations},
 conflictingClaims:now.conflictingClaims};
}
export async function makeReview(text,pin,request,baseline=null){
 const r=validateRequest(request);
 if(baseline){requireThat(baseline.asOf===r.previousAsOf,'Saved baseline cutoff differs from previousAsOf.');requireThat(/^[a-f0-9]{64}$/.test(baseline.packetSha256),'Missing prior packet digest.');}
 const previous=baseline?{text:baseline.text,sha256:baseline.sha256}:{text,sha256:pin};
 const before=await run(previous.text,previous.sha256,{asOf:r.previousAsOf}),after=await run(text,pin,{asOf:r.asOf});
 requireThat(r.entities.every(id=>after.answer.companies.some(c=>c.entity===id)),'Company outside the fixed 12-issuer cohort.');
 const companies=r.entities.map(id=>summarize(before.answer.companies.find(c=>c.entity===id),after.answer.companies.find(c=>c.entity===id),r));
 return {schemaVersion:VERSION,request:r,baselineMode:baseline?'saved-reviewed-snapshot':'reconstructed-from-current-archive',baselinePacketSha256:baseline?.packetSha256??null,
 inputs:{previous,current:{text,sha256:pin}},report:{question:THESES[r.thesis],companies,
 summary:{companies:companies.length,cashPairs:companies.reduce((n,c)=>n+c.cashChecks.length,0),changedAnnotations:companies.reduce((n,c)=>n+c.changes.length,0),sourcesNeedingCheck:companies.reduce((n,c)=>n+c.sourceChecks.length,0),fundingAssessmentsEstablished:0},
 sourceReceiptsThrough:after.answer.latestReceiptByCutoff,
 limits:['Selected retained archive, not complete or real-time filing coverage.','First-public timestamps remain unknown. An observation clock is not a market-availability clock.','No new financial extraction: only previously reviewed annotations are admitted.','Raw issuer bytes are retained privately; public replay verifies annotations, receipts and results, not independent source authenticity.','AI-assisted single-operator review; no independent assurance.','Missing evidence and changed web bytes are not financial deterioration.','No portfolio weights, trading instructions, peer ranking or investment-return attribution.']}};
}
export async function replayReview(text,expected){
 requireThat(await sha256(text)===expected,'Review packet hash mismatch.');
 const p=JSON.parse(text);requireThat(p.schemaVersion===VERSION,'Unsupported review version. Use the original kit.');
 requireThat(['saved-reviewed-snapshot','reconstructed-from-current-archive'].includes(p.baselineMode),'Invalid baseline mode.');
 if(p.baselineMode==='reconstructed-from-current-archive')requireThat(JSON.stringify(p.inputs.previous)===JSON.stringify(p.inputs.current)&&p.baselinePacketSha256===null,'Reconstructed baseline differs from current input.');
 const b=p.baselineMode==='saved-reviewed-snapshot'?{...p.inputs.previous,asOf:p.request.previousAsOf,packetSha256:p.baselinePacketSha256}:null;
 const rerun=await makeReview(p.inputs.current.text,p.inputs.current.sha256,p.request,b);
 requireThat(JSON.stringify(rerun)===JSON.stringify(p),'Stored review differs from deterministic replay.');return rerun;
}
export async function baselineFrom(text,expected){const p=await replayReview(text,expected);return {...p.inputs.current,asOf:p.request.asOf,packetSha256:expected};}

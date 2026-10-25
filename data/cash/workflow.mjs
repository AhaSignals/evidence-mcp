// Shared browser/Node engine. Calculation consumes the same captured bytes that were checked.
export const VERSION = '1.0.0';
export const QUESTION = 'Do selected AI investment and revenue disclosures establish cash realization?';
export const sha256 = async text => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))].map(x => x.toString(16).padStart(2,'0')).join('');
const requireThat = (test, message) => { if (!test) throw Error(message); };
export function instant(s) {
  requireThat(typeof s === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(s) && Number.isFinite(Date.parse(s)), 'An ISO cutoff with an explicit UTC offset is required.');
  requireThat(new Date(s.slice(0,10)+'T00:00:00Z').toISOString().slice(0,10)===s.slice(0,10)
    && Number(s.slice(11,13))<24 && Number(s.slice(14,16))<60 && Number(s.slice(17,19))<60,
    'Invalid calendar date or clock.');
  // Integer microseconds preserve Python receipt clocks without admitting future evidence.
  const fraction=(s.match(/\.(\d+)(?:Z|[+-]\d{2}:\d{2})$/)?.[1]||'').padEnd(6,'0');
  const micros=Date.parse(s)*1000+Number(fraction.slice(3));
  requireThat(Number.isSafeInteger(micros),'Clock outside supported precision range.');
  return micros;
}
export async function capture(text, expected) {
  requireThat(/^[a-f0-9]{64}$/.test(expected) && await sha256(text) === expected, 'Input hash mismatch; no calculation performed.');
  const snapshot = JSON.parse(text);
  requireThat(snapshot.schemaVersion === VERSION, 'Unsupported snapshot version.');
  requireThat(await sha256(snapshot.seedText) === snapshot.seedSha256, 'Seed hash mismatch.');
  const seed = JSON.parse(snapshot.seedText), receipts = [];
  const expansion=snapshot.expansionEntities||[];
  requireThat(new Set(expansion.map(e=>e.id)).size===expansion.length,'Duplicate expansion entity.');
  for(const e of expansion){
    const existing=seed.entities.find(b=>b.id===e.id);
    requireThat(existing ? existing.cohort==='optical-extension' && e.promotedFrom==='optical-extension' && e.ticker===existing.ticker : !e.promotedFrom,'Invalid cohort promotion.');
  }
  for(const e of expansion){
    requireThat(e.cohort==='expansion' && e.name && e.role && e.market && e.timeZone && e.membershipBasis,'Invalid expansion entity.');
    requireThat(instant(e.enrolledAt)>instant(seed.constructedAt),'Expansion predates baseline selection.');
  }
  seed.entities=seed.entities.filter(e=>!expansion.some(x=>x.id===e.id));
  seed.entities.push(...expansion);
  const supplemental=snapshot.supplementalDocuments||[];
  for(const doc of supplemental){
    requireThat(!seed.documents.some(d=>d.id===doc.id) && seed.entities.some(e=>e.id===doc.entity&&['pilot','expansion'].includes(e.cohort)),'Invalid supplemental source identity.');
    const prior=[...seed.documents,...supplemental].find(d=>d.id===doc.relatedDocumentId&&d.entity===doc.entity&&d.id!==doc.id);
    const nextPeriod=doc.relationshipType==='subsequent-period';
    const entry=doc.relationshipType==='cohort-entry';
    const member=expansion.find(e=>e.id===doc.entity);
    requireThat((entry ? member && doc.relatedDocumentId===null && instant(doc.registeredAt)>=instant(member.enrolledAt)
      && /^\d{4}-\d{2}-\d{2}$/.test(doc.periodEnd) && doc.periodEnd<=doc.sourceDate
      : prior && (nextPeriod
      ? doc.eventId!==prior.eventId && doc.sourceDate>prior.sourceDate
        && /^\d{4}-\d{2}-\d{2}$/.test(doc.periodEnd) && /^\d{4}-\d{2}-\d{2}$/.test(doc.priorPeriodEnd)
        && doc.periodEnd>doc.priorPeriodEnd && doc.periodEnd<=doc.sourceDate
      : doc.relationshipType===undefined && doc.eventId===prior.eventId))
      && doc.relationship && doc.language && /^https:\/\//.test(doc.url) && doc.sha256===null && doc.publicAvailableAt===null,'Invalid supplemental source provenance.');
    instant(doc.registeredAt);
  }
  requireThat(new Set(supplemental.map(d=>d.id)).size===supplemental.length,'Duplicate supplemental source.');
  seed.documents.push(...supplemental);
  for (const entry of snapshot.receipts) {
    requireThat(await sha256(entry.text) === entry.sha256, 'Observation receipt hash mismatch.');
    const r = JSON.parse(entry.text);
    requireThat(r.seedSha256 === snapshot.seedSha256, 'Receipt belongs to another seed.');
    requireThat(instant(r.startedAt) <= instant(r.completedAt), 'Invalid receipt clock.');
    requireThat(new Set(r.observations.map(o=>o.documentId)).size === r.observations.length, 'Duplicate source observation.');
    for (const o of r.observations) {
      const doc = seed.documents.find(d=>d.id===o.documentId);
      requireThat(doc && o.url===doc.url, 'Receipt source identity mismatch.');
      if (o.status==='observed') requireThat(o.sha256?.match(/^[a-f0-9]{64}$/) && o.bytes>0 && instant(o.observedAt)>=instant(r.startedAt) && instant(o.observedAt)<=instant(r.completedAt), 'Invalid successful observation.');
      else requireThat(o.status==='unavailable' && o.observedAt===null && o.sha256===null, 'Failed acquisition cannot establish an observation.');
    }
    receipts.push(r);
  }
  requireThat(seed.entities.filter(e=>e.cohort==='pilot').length===12, 'Unexpected research cohort.');
  // Never expose this mutable object; each call gets a fresh verified parse.
  const reviews=snapshot.reviews||[];
  requireThat(new Set(reviews.map(r=>r.id)).size===reviews.length,'Duplicate source review.');
  for(const review of reviews){
    const doc=seed.documents.find(d=>d.id===review.documentId);
    requireThat(doc && Array.isArray(review.facts) && (review.facts.length>0 || !seed.facts.some(f=>f.documentId===doc.id)),'Unknown source or missing financial facts in review.');
    requireThat(instant(review.reviewedAt)>=instant(review.sourceObservedAt),'Review predates observation.');
    if(doc.registeredAt) requireThat(instant(review.sourceObservedAt)>=instant(doc.registeredAt)&&review.facts.length>0,'Supplement review predates registration or lacks facts.');
    requireThat(snapshot.receipts.some(e=>e.path===review.receipt && (()=>{const r=JSON.parse(e.text);return r.retention && instant(r.completedAt)<=instant(review.reviewedAt) && r.observations.some(o=>o.documentId===doc.id&&o.status==='observed'&&o.sha256===review.sourceSha256&&o.observedAt===review.sourceObservedAt);})()),'Review has no matching retained receipt.');
    requireThat(review.facts.every(f=>f.documentId===doc.id&&f.entity===doc.entity&&f.locator&&f.period&&f.scope&&f.unit&&typeof f.value==='string'),'Reviewed fact identity mismatch.');
  }
  return {seed:{...seed,sourceReviews:reviews}, receipts};
}
const localDay = (timestamp, zone) => {
  const p = new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(Math.floor(timestamp/1000)));
  return ['year','month','day'].map(k=>p.find(x=>x.type===k).value).join('-');
};
function percent(n,d) {
  // Exact decimal inputs; round half up to two percentage decimals.
  const decimal = v => {requireThat(/^\d+(\.\d+)?$/.test(v),'Non-point value');const [a,b='']=v.split('.');return [BigInt(a+b),10n**BigInt(b.length)];};
  const [a,b]=decimal(n),[c,e]=decimal(d);requireThat(c>0n,'Nonpositive revenue');
  const denominator=b*c, numerator=a*e*10000n;
  const q=(numerator+denominator/2n)/denominator;
  return `${q/100n}.${String(q%100n).padStart(2,'0')}`;
}
export function evaluate(seed, receipts, request) {
  requireThat(request && typeof request==='object' && !Array.isArray(request), 'Invalid request.');
  requireThat(Object.keys(request).every(k=>['asOf','mode','entity'].includes(k)), 'Unknown request field.');
  requireThat(request.entity===undefined || (typeof request.entity==='string' && request.entity.length>0),'Entity must be a cohort ID or omitted.');
  const cutoff=instant(request.asOf), mode=request.mode === undefined ? 'retained-observation' : request.mode;
  requireThat(['retained-observation','retrospective-date'].includes(mode),'Unknown evidence policy.');
  const cohort=seed.entities.filter(e=>e.cohort==='pilot'||(e.cohort==='expansion'&&instant(e.enrolledAt)<=cutoff));
  requireThat(!request.entity || cohort.some(e=>e.id===request.entity),'Company outside the cohort available at this cutoff.');
  const entities=cohort.filter(e=>!request.entity || e.id===request.entity);
  const eligibleReceipts=receipts.filter(r=>instant(r.completedAt)<=cutoff).sort((a,b)=>instant(a.completedAt)-instant(b.completedAt));
  const rows=entities.map(entity=>{
    const docs=seed.documents.filter(d=>d.entity===entity.id&&(!d.registeredAt||instant(d.registeredAt)<=cutoff)).map(doc=>{
      const review=(seed.sourceReviews||[]).filter(r=>r.documentId===doc.id&&instant(r.reviewedAt)<=cutoff).sort((a,b)=>instant(a.reviewedAt)-instant(b.reviewedAt)).at(-1);
      return review?{...doc,sha256:review.sourceSha256,review}:doc;
    }), admitted=[], withheld=[];
    const observations=docs.map(doc=>{
      const entries=eligibleReceipts.flatMap(r=>r.observations.filter(o=>o.documentId===doc.id).map(o=>({...o,retained:!!r.retention,receiptCompletedAt:r.completedAt})));
      const retained=entries.filter(o=>o.status==='observed' && o.retained && doc.sha256 && o.sha256===doc.sha256);
      const latest=entries.at(-1);
      // Conservative policy: both the annotation and a completed private-retention receipt must exist.
      const allowed=mode==='retained-observation'
        ? instant(doc.review?.reviewedAt??seed.constructedAt)<=cutoff && retained.length>0
        : doc.sourceDate<localDay(cutoff,entity.timeZone) && (!doc.registeredAt || !!doc.review);
      (allowed?admitted:withheld).push(doc.id);
      return {documentId:doc.id,url:doc.url,sourceDate:doc.sourceDate,sourceLanguage:doc.language,sourceSha256:doc.sha256,
        ...(doc.registeredAt?{relatedDocumentId:doc.relatedDocumentId,relationship:doc.relationship,sourceRegisteredAt:doc.registeredAt}:{}),
        originalObservedAt:doc.firstObservedAt,annotationRecordedAt:doc.review?.reviewedAt??seed.constructedAt,sourceReviewId:doc.review?.id??null,
        matchingRetentionReceiptAt:retained[0]?.receiptCompletedAt??null,firstPublicAt:doc.publicAvailableAt,
        latestAttempt:latest?{status:latest.status,at:latest.observedAt??latest.attemptedAt,sha256:latest.sha256}:null,
        state:!latest?'not-observed-by-cutoff':latest.status!=='observed'?'acquisition-failed':!doc.sha256?'seed-bytes-unpinned':latest.sha256!==doc.sha256?'changed-bytes-awaiting-review':'matches-reviewed-seed',admitted:allowed};
    });
    const facts=docs.filter(d=>admitted.includes(d.id)).flatMap(d=>d.review?.facts??seed.facts.filter(f=>f.documentId===d.id));
    const conflicts=new Set();
    for(const f of facts){const variants=facts.filter(v=>v.claimKey===f.claimKey);if(new Set(variants.map(v=>JSON.stringify([v.value,v.unit]))).size>1) conflicts.add(f.claimKey);}
    const usable=facts.filter(f=>!conflicts.has(f.claimKey));
    const calculations=[];
    for(const ocf of usable.filter(f=>f.concept==='operating-cash-flow' && f.kind==='actual')) {
      const revenues=usable.filter(f=>f.concept==='revenue' && f.kind==='actual' && f.period===ocf.period && f.scope===ocf.scope && f.unit===ocf.unit && f.documentId===ocf.documentId);
      if(revenues.length===1) calculations.push({name:'Operating cash flow / revenue',value:percent(ocf.value,revenues[0].value),unit:'%',period:ocf.period,scope:ocf.scope,inputFactIds:[ocf.id,revenues[0].id],limitation:'Company cash-flow ratio; not collection of these sales, AI-only cash flow, investment return, or contract fulfillment.'});
    }
    return {...(entity.cohort==='expansion'?{cohortEnrolledAt:entity.enrolledAt}:{}),entity:entity.id,name:entity.name,market:entity.market,role:entity.role,admittedDocuments:admitted.length,withheldDocuments:withheld.length,
      coverage:{investmentGuidance:usable.some(f=>f.concept==='capital-expenditure'&&f.kind==='guidance'),revenueGuidance:usable.some(f=>f.concept==='revenue'&&f.kind==='guidance'),revenueActual:usable.some(f=>f.concept==='revenue'&&f.kind==='actual'),operatingCashFlow:usable.some(f=>f.concept==='operating-cash-flow'&&f.kind==='actual'),matchedInvestmentToCash:false},
      conclusion:'The selected evidence does not establish cash returns on AI investment. Missing coverage is not a zero value.',
      documents:observations,facts,conflictingClaims:[...conflicts].sort(),calculations};
  });
  return {engineVersion:VERSION,question:QUESTION,asOf:request.asOf,mode,
    cohortSelectedAt:seed.constructedAt,latestReceiptByCutoff:eligibleReceipts.at(-1)?.completedAt??null,
    interpretation:mode==='retained-observation'?'Exact reviewed source hash matched a completed retention receipt by cutoff; annotations were recorded by cutoff.':'Retrospective source-date reconstruction. This uses later annotations and is not a historical knowledge or retained-byte claim.',
    limits:['No verified first-public timestamps.','Private source retention is recorded by the operator; this public packet cannot independently authenticate source bytes.','Known URLs only; new filings and changed financial values need separate review.','No cross-company total, investment-return estimate or trading recommendation.'],companies:rows};
}
export async function run(text,expected,request) {
  const {seed,receipts}=await capture(text,expected);
  const ownedRequest=JSON.parse(JSON.stringify(request));
  return {schemaVersion:VERSION,inputSha256:expected,request:ownedRequest,answer:evaluate(seed,receipts,ownedRequest)};
}
export async function packet(text,expected,request) {return {...await run(text,expected,request),inputText:text};}
export async function replay(text,expectedPacketSha256) {
  requireThat(await sha256(text)===expectedPacketSha256,'Packet hash mismatch.');
  const p=JSON.parse(text),actual=await run(p.inputText,p.inputSha256,p.request);
  requireThat(JSON.stringify(actual.answer)===JSON.stringify(p.answer),'Stored answer differs from replay.');
  return actual;
}

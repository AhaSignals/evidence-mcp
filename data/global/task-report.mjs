// Shared human/agent summary. Unknown evidence is never a numerical zero.
export const TASK_VERSION = '1.0.0';
const micros=s=>Date.parse(s)*1000+Number((s.match(/\.(\d+)(?:Z|[+-]\d{2}:\d{2})$/)?.[1]||'').padEnd(6,'0').slice(3));
export const stages = {
  investmentGuidance: 'Investment guidance', revenueGuidance: 'Revenue guidance',
  revenueActual: 'Revenue actual', operatingCashFlow: 'Operating cash flow',
  matchedInvestmentToCash: 'Cash attributable to the selected AI investment',
};
export function summarize(answer) {
  return {
    asOf: answer.asOf, mode: answer.mode,
    conclusion: 'The selected evidence does not establish cash returns on AI investment.',
    companies: answer.companies.map(c => ({
      entity: c.entity, name: c.name,
      unknowns: Object.entries(stages).filter(([key])=>!c.coverage[key]).map(([code,label])=>({code,label,
        reason: code==='matchedInvestmentToCash' ? 'No reviewed evidence links the selected AI investment to attributable cash receipts.' : 'No non-conflicting admitted fact establishes this stage at the requested cutoff.',
      })),
      withheldSources: c.documents.filter(d=>!d.admitted).map(d=>({documentId:d.documentId,url:d.url,
        reasons: [
          ...(d.sourceSha256 ? [] : ['reviewed-source-bytes-unpinned']),
          ...(d.annotationRecordedAt && micros(d.annotationRecordedAt)>micros(answer.asOf) ? ['annotation-after-cutoff'] : []),
          ...(answer.mode==='retained-observation' && !d.matchingRetentionReceiptAt ? ['no-matching-completed-retention-by-cutoff'] : []),
          ...(answer.mode==='retrospective-date' ? ['source-date-or-registration-policy-not-met'] : []),
        ], latestAttemptState:d.state,
      })),
      conflictingClaims:c.conflictingClaims,
      calculations:c.calculations.map(x=>({...x, inputs:x.inputFactIds.map(id=>{
        const fact=c.facts.find(f=>f.id===id),doc=c.documents.find(d=>d.documentId===fact.documentId);
        return {factId:id,documentId:fact.documentId,value:fact.value,unit:fact.unit,period:fact.period,scope:fact.scope,locator:fact.locator,
          sourceUrl:doc.url,sourceSha256:doc.sourceSha256,sourceLanguage:doc.sourceLanguage,annotationRecordedAt:doc.annotationRecordedAt};
      })})),
    })),
    limits: [...answer.limits, 'AI-assisted single-operator annotations; no independent expert audit.'],
  };
}

// Bounded accounting checks over the exact facts admitted by the cutoff engine.
// No forecasts, annualization or causal attribution of borrowing.
const PREFIX='cash-review:';
const FLOW=['ocf','ppe','lease-principal','dividends','debt-proceeds','equity-tax','buybacks','other-financing','cfi','cff','fx','cash-change','cash-start','cash-end','reported-fcf','ar-change','prepaid-change','other-assets-change','ap-change','accruals-change','other-liabilities-change','securities-purchases','securities-sales','equity-investments','held-for-sale','acquisitions','other-investing'];
const add=(...v)=>v.reduce((a,b)=>a+BigInt(b),0n).toString();
const abs=v=>BigInt(v)<0n?(-BigInt(v)).toString():v;
export function cashBridge(company){
 const selected=company.facts.filter(f=>f.concept.startsWith(PREFIX)&&!company.conflictingClaims.includes(f.claimKey));
 if(!selected.length)return null;
 const enrich=f=>{const d=company.documents.find(d=>d.documentId===f.documentId);if(!d?.admitted)throw Error('Cash input source not admitted');return {...f,sourceUrl:d.url,sourceSha256:d.sourceSha256,reviewedAt:d.annotationRecordedAt,retainedAt:d.matchingRetentionReceiptAt,firstPublicAt:d.firstPublicAt};};
 const facts=selected.map(enrich),bridges=[],withheld=[];
 for(const period of [...new Set(facts.filter(f=>f.concept===PREFIX+'ocf').map(f=>f.period))].sort()){
  const group=facts.filter(f=>f.period===period&&f.kind==='actual'),v={},inputs=[];
  for(const k of FLOW){const rows=group.filter(f=>f.concept===PREFIX+k);if(rows.length!==1)continue;const f=rows[0];if(!/^-?\d+$/.test(f.value))continue;v[k]=f.value;inputs.push(f);}
  const missing=FLOW.filter(k=>!(k in v));
  if(missing.length||new Set(inputs.map(f=>[f.documentId,f.unit,f.scope].join('|'))).size!==1||inputs[0].unit!=='USD million'){
   withheld.push({period,reason:'Incomplete or incompatible accounting inputs; no zero substitution.',missing});continue;
  }
  if(['ppe','lease-principal','dividends','equity-tax','buybacks','securities-purchases','equity-investments','held-for-sale','acquisitions'].some(k=>BigInt(v[k])>0n)){
   withheld.push({period,reason:'Outflow sign convention failed.'});continue;
  }
  const investment=add(v.ppe,v['lease-principal']),fcf=add(v.ocf,investment),afterDividends=add(fcf,v.dividends);
  const checks={fcf:fcf===v['reported-fcf'],investing:add(v.ppe,v['securities-purchases'],v['securities-sales'],v['equity-investments'],v['held-for-sale'],v.acquisitions,v['other-investing'])===v.cfi,
   financing:add(v['debt-proceeds'],v['equity-tax'],v.buybacks,v.dividends,v['lease-principal'],v['other-financing'])===v.cff,
   cashChange:add(v.ocf,v.cfi,v.cff,v.fx)===v['cash-change'],cashBalance:add(v['cash-start'],v['cash-change'])===v['cash-end']};
  if(Object.values(checks).some(x=>!x)){withheld.push({period,reason:'Accounting reconciliation failed.',checks});continue;}
  bridges.push({period,scope:inputs[0].scope,unit:inputs[0].unit,inputs,checks,
   operatingCash:v.ocf,cashInvestment:abs(investment),cashAfterInvestment:fcf,dividends:abs(v.dividends),cashAfterInvestmentAndDividends:afterDividends,
   investmentCovered:BigInt(fcf)>=0n,investmentAndDividendsCovered:BigInt(afterDividends)>=0n,netDebtProceeds:v['debt-proceeds'],
   assetLiabilityCashAdjustments:add(v['ar-change'],v['prepaid-change'],v['other-assets-change'],v['ap-change'],v['accruals-change'],v['other-liabilities-change']),
   cashMovement:{beginning:v['cash-start'],operating:v.ocf,investing:v.cfi,financing:v.cff,fx:v.fx,change:v['cash-change'],ending:v['cash-end']},
   meaning:'Historical company-level cash bridge. Asset/liability adjustments are selected cash-flow statement lines, not a recurring-cash estimate. Restricted cash is included in the cash movement. Debt proceeds do not prove that borrowing was necessary.'});
 }
 const context=facts.filter(f=>!FLOW.includes(f.concept.slice(PREFIX.length))),liquidity=[];
 const get=k=>context.filter(f=>f.concept===PREFIX+k);
 const liquidKeys=['cash-unrestricted','marketable-securities','restricted-current','restricted-noncurrent'];
 const liquid=liquidKeys.map(k=>get(k));
 if(liquid.every(x=>x.length===1)&&new Set(liquid.map(x=>[x[0].period,x[0].unit,x[0].scope].join('|'))).size===1&&liquid.every(x=>/^\d+$/.test(x[0].value))){
  const v=Object.fromEntries(liquidKeys.map((k,i)=>[k,liquid[i][0].value]));
  liquidity.push({period:liquid[0][0].period,unit:liquid[0][0].unit,cashAndMarketableSecurities:add(v['cash-unrestricted'],v['marketable-securities']),restrictedCash:add(v['restricted-current'],v['restricted-noncurrent']),inputs:liquid.flat(),meaning:'Marketable securities are not cash. Restricted balances are excluded from this cash-and-securities sum; accessibility and liquidation assumptions require review.'});
 }
 return {version:'1.0.0',bridges,withheld,liquidity,context,
  reviewRequired:bridges.some(b=>!b.investmentAndDividendsCovered)?'The assumption that operating cash covers both investment and dividends needs rechecking for at least one reviewed period.':'Historical investment coverage is observable; future self-funding remains unestablished.',
  unknowns:[
   'Future operating cash and the payment calendar needed for a forward funding gap are not established.',
   'Calendar-year debt maturities and contractual obligations are not an exact next-12-month cash schedule.',
   'Commitments, lease obligations, capex guidance and escrow can overlap; do not add them into one funding gap.',
   'Available committed credit, minimum cash requirements and access to each liquidity balance have not been established.',
   'Company-level cash flow does not attribute returns to AI investment or identify the causal use of debt proceeds.'
  ]};
}

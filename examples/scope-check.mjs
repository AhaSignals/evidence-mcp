import assert from 'node:assert/strict';
import {load,digest} from '../core.mjs';

// This is an unsupported illustrative claim, not an issuer quotation or a forecast.
const proposedClaim='Agentforce ARR above USD 1.5 billion proves comparable organic growth.';
const api=await load(new URL('../',import.meta.url));
const args={recordId:'crm-arr-scope-fy27q2',asOf:'2026-10-25T00:00:00Z'};
const packet=await api.makePacket('trace_claim',args);
const record=packet.result.record;
assert.equal(record.comparability,'unknown-without-common-scope-bridge');
assert.equal(record.details.prior_definition_reviewed,false);
assert.equal(record.details.organic_growth_recomputed,false);
const text=JSON.stringify(packet);
const replay=await api.replay(text,digest(text));
assert.equal(replay.verified,true);
const prior=await api.execute('trace_claim',{...args,asOf:'2026-10-24T23:42:55.474665Z'});
assert.equal(prior.status,'not-admitted-by-cutoff');

console.log(JSON.stringify({
  example:'scope-comparability',packageVersion:api.pins.version,
  proposedClaim,assessment:'UNKNOWN',
  reason:record.finding,
  reportedAmount:record.details.reported_amount,
  comparableOrganicGrowth:null,
  missingEvidence:['Reviewed previous metric definition','Same-period common-scope reconciliation'],
  admissibleConclusion:'The reviewed source reports ARR above USD 1.5 billion under an expanded scope. Comparable organic growth is not established by this record.',
  earlierCutoff:prior.status,
  asOf:args.asOf,observedAt:record.observed_at,reviewedAt:record.reviewed_at,
  source:packet.result.source,
  packetSha256:digest(text),replayVerified:replay.verified,
  limits:['Dataset admission is not first-public availability.','No invented prior-quarter amount, growth rate, or valuation effect.','AI-assisted single-operator review.'],
  externalAdoption:false
},null,2));

const clock={type:'string',maxLength:40,description:'ISO timestamp with explicit timezone. Admission uses capture and review clocks.'};
const id={type:'string',minLength:1,maxLength:120};
const schema=(properties={},required=[])=>({type:'object',additionalProperties:false,properties,required});
export const toolDefinitions=cashRequestSchema=>[
 ['get_coverage','Read fixed package coverage, review clocks and source-health snapshot. Start here; different tools cover different company sets.',schema()],
 ['query_disclosure_evidence','Query retained and reviewed global AI disclosure evidence at a cutoff. Does not certify first-public availability.',schema({asOf:clock,entity:id},['asOf'])],
 ['get_operating_changes','List admitted operating annotations for CRM, ADBE, INTU or PYPL. A newly admitted record is not necessarily a new business change.',schema({asOf:clock,previousAsOf:clock,issuer:{type:'string',enum:['CRM','ADBE','INTU','PYPL']}},['asOf'])],
 ['trace_claim','Trace an operating record to its source, capture and review clocks. Missing successor evidence stays unknown.',schema({recordId:id,asOf:clock},['recordId','asOf'])],
 ['check_cash_bridge','Recompute a reviewed operating-pilot cash calculation with exact decimals. Requires matching period, unit and scope.',schema({recordId:id,asOf:clock},['recordId','asOf'])],
 ['review_claim','Review cash evidence for the historical 12-company cash cohort. Does not cover all expanded global issuers.',schema({request:cashRequestSchema},['request'])],
 ['query_compute_commitments','Read reviewed compute contract terms, payment conditions, linked claims and source clocks. Selected counterparty case; overlapping obligations cannot be summed.',schema({asOf:clock},['asOf'])],
 ['check_compute_cash_bridge','Recompute a selected company cash bridge, preserving source, period, scope and units. Does not establish contract cash payments.',schema({asOf:clock,bridgeId:{type:'string',enum:['loss-to-ocf','cash-change','cash-balances','restricted-split']}},['asOf','bridgeId'])],
 ['replay_evidence','Verify and recompute a saved packet using this exact bundled snapshot. Supply packet text and its separately saved SHA-256.',schema({packetText:{type:'string',maxLength:12000000},packetSha256:{type:'string',pattern:'^[a-f0-9]{64}$'}},['packetText','packetSha256'])]
].map(([name,description,inputSchema])=>({name,description,inputSchema,annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false}}));

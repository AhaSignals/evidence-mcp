# Compute commitments and cash evidence — v1.0.1

AhaSignals · AI-assisted single-operator review, not independent assurance.

This selected counterparty case reads Anthropic's October 26, 2026 public S-1 alongside an earlier AWS announcement and Broadcom 8-K. It supplements Global AI Disclosure Evidence without changing the 41-issuer cohort or any frozen workflow release. It is not a complete list of Anthropic's compute contracts.

## Run and cite

Download and extract `evidence.zip`. With Python 3.9+ and no dependencies:

```sh
python3 verify.py
python3 reader.py --cutoff 2026-10-26T13:00:10Z
python3 reader.py --cutoff 2026-10-27T00:00:00Z
```

The earlier query returns no admitted observations. The later query returns all nine contract/financing annotations, eight latest claims and 22 cash facts. The reader uses recorded registration, observation, review and (where available) SEC acceptance clocks. It does not infer first-public time from SEC acceptance or reconstruct access before capture. Preserve `manifest.json` and its hash independently; local checksums do not authenticate private source bytes.

Citation: AhaSignals (2026), *Compute commitments and cash evidence*, v1.0.1. Include the manifest hash, record IDs and cutoff. Source-linked explanation: https://ahasignals.com/research/global-ai-disclosure-evidence/#compute-commitments . Machine-readable attribution: `CITATION.cff`.

## Files and field meanings

- `events.csv` / `events.jsonl`: identical contract annotations. `value` is a decimal string; `upperValue` is present only for a range. USD billion and GW are different units. `amountType` distinguishes minimums, ceilings, conditional estimates, lease payments excluding interest, financing capacity and planned capacity.
- `claimId` links disclosures of the same metric; `priorEventId` and `relationshipType` distinguish a later clarification from a related arrangement. The AWS announcement's more-than-$100bn and the S-1's $110bn minimum are not two purchases. The 3.5 GW statement, lease payments and note-financing ceiling are different measurements of related arrangements.
- `contractTerm`, `paymentTrigger`, `cancellation` and `financingCondition` retain the contract conditions. A five-year equipment lease is not a calendar-year expense. Nscale fees start on delivery and acceptance; some Broadcom rent can start before a delayed facility is ready.
- `deliveredCapacity`, `recognizedSupplierRevenue` and `cashPaid` are null where not established by this review. CSV blanks mean unknown, not zero. No aggregate is calculated: floors, ceilings, estimates, overlapping arrangements and financing capacity cannot be naively added.
- `cash.csv`: signed USD million amounts for the same consolidated six months ended June 30, 2026 (unaudited). Four bridges in `review.json` reconcile loss to OCF, cash flow categories to cash change, opening to closing cash, and restricted/unrestricted cash. They do not estimate normalized cash, project returns or cash paid per contract.
- `sources.json`: source links, retained-byte hashes, exact capture/review clocks and narrow review scope. `acceptedAt` is the SEC-reported acceptance clock, independently checked against the filing index and submissions record; `firstPublicAt` remains unknown. A source's older reporting date does not backdate this dataset's observation.

## Findings and limits

The selected S-1 paragraphs disclose minimum spending commitments to Microsoft, Google and AWS; an up-to amount for Nscale; equipment lease payments excluding interest; a separate convertible-note funding ceiling; and an additional TPU estimate dependent on deployment and pricing. Some aggregate contractual-obligation cells are incomplete in this preliminary filing. No media draft total or rumored second Nscale deal is inserted into those blanks.

For H1 2026, the $80,748m net loss reconciles to $3,929m operating cash after $83,509m of other reconciliation adjustments and $1,168m of operating asset/liability movements. The latter includes a $1,380m deferred-revenue inflow and a $4,982m receivables outflow. Financing cash was $110,774m. Closing cash including restricted cash was $114,918m, of which $2,529m was restricted. Net loss is not cash burn; positive OCF does not establish that future compute obligations are self-funding.

Only selected factual annotations, original commentary and code are distributed. No original filings, full financial tables or issuer announcement text are included. Source owners retain their rights; CC BY 4.0 covers AhaSignals' original compilation and annotations, and MIT covers reader/verifier code. AhaSignals is independent of, and not affiliated with or endorsed by, the named companies. Research only, not investment, legal, accounting or tax advice; no offer of securities.

Version 1.0.1 corrects the standalone verifier: it works in an extracted folder without requiring the ZIP alongside the files. Version 1 remains available unchanged; its verifier requires the original ZIP in that same folder. All financial records, sources and review clocks are identical across these two versions.

This release is immutable. Later reviewed evidence requires a new version with explicit links; byte changes alone do not authorize financial updates. The existing MCP bundle remains pinned to its prior dataset and does not automatically acquire this supplement. These files can be read directly by an agent or local Python process without credentials.

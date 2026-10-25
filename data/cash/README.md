# Cash realization and funding review

AhaSignals · AI-assisted single-operator research. 12 selected issuers.

Download review-kit.zip and check its SHA-256 against the release index before extracting or executing. Save the kit and its release ID. Node.js 22+; no dependencies or network during calculation.

`node cli.mjs verify RELEASE_SHA256`
`node cli.mjs review RELEASE_SHA256 request.json my-review.json`
`node cli.mjs replay RELEASE_SHA256 my-review.json PACKET_SHA256`

Copy request.json to set company IDs, the previous and current cutoff with explicit UTC offsets, and one original judgment. The optional cash-ratio threshold is your research screen, not an AhaSignals standard. A free-text note is preserved only; it is not interpreted by a model. Output files are never overwritten.

## Return at your next review

Download and verify the latest kit. Set previousAsOf to the prior request's asOf and asOf to your new cutoff. Run:

`node cli.mjs review NEW_RELEASE_SHA256 next-request.json next-review.json my-review.json PRIOR_PACKET_SHA256`

The prior packet is verified and replayed before its current snapshot becomes your baseline. This preserves the exact evidence version used before. A newly added company has a reconstructed baseline from that same archived snapshot; it was not necessarily reviewed previously. Without a saved packet, both cutoffs are reconstructed from this kit; this does not prove what you actually saw in an earlier review. Keep the previous packet separately. Different engine versions require their original kit.

## Interpret the output

Changes compare retained annotations, not daily stock prices. Newly admitted evidence can be an old disclosure reviewed later. Identical financial facts with a changed webpage hash remain a source-review task. No byte change is automatically a financial revision. Cash ratios use actuals from the same document, period, scope and unit. OCF/revenue is not cash collected from these sales. Meta has separately reviewed Q2/H1 cash bridges and selected liquidity, maturity and obligation evidence. Forward funding needs remain unknown: payment timing, overlapping obligations and future operating cash are not established. Other issuers retain their explicit coverage gaps. No ratio here establishes an AI investment return.

## Read-only Agent connection

Launch `node mcp.mjs RELEASE_SHA256` from the extracted kit with an MCP stdio client. It verifies every manifest member before loading the engine. Tools: review_claim, compare_reviews and replay_review. Responses provide a compact summary and a local packet URI. Request resources/read only when you need the full evidence; it can exceed 1 MB. The last 8 packets are cached until the process exits. Within the session, replay and comparison accept the packet digest alone. Across sessions, supply exact saved packet text and digest, or use the CLI. Save the resource outside model context where your host supports it. All arguments and results stay in the local process; your host Agent may send them to its model provider under that host policy. Tool arguments never open arbitrary filesystem paths or URLs. No account access or execution. No claim of Robinhood or other platform compatibility. See EVALUATION.md for the separate external-use protocol; external adoption and paid value remain unverified.

## Privacy and rights

All requests, notes and saved baselines are local. No telemetry in the CLI. Browser input is not uploaded by the review tool; ordinary site hosting receives public page/data requests. Do not put private notes in URLs or public issues. Original compilation CC BY 4.0; code MIT. Issuer source documents remain linked and privately retained, not part of this public kit. No independent assurance, trade recommendation or portfolio optimization.

## Source continuity

Source release: 9d91cfa989e979d1532d63751c0957ee972321f867328d02c549c46acbd6784e
Source snapshot: fd89ebd1e929fdf594aa40547d6d8fc85d7b31a0d2bfd4999922b2ab0046cfcf
Last source collection: 2026-10-23T23:28:05.329753+00:00
Last financial review: 2026-10-23T23:33:54.267956+00:00

Daily collection may update source warnings without updating financial facts. Known URLs only; this is not comprehensive discovery. Historical first-public timestamps remain unknown.

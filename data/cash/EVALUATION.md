# Can a saved cash review help at the next disclosure?

AhaSignals · protocol v1.0.0 · AI-assisted single-operator research.

This is an evaluation protocol, not a report of independent users or investment performance. The public Meta case is a retrospective reading of retained issuer materials. Its admission clock is the actual review time, not the filing's reporting date. Automated corruption and cutoff tests are synthetic engineering checks. Neither demonstrates an independent investor benefited.

## The task

Choose companies from the fixed 12-issuer cohort. State a cash-conversion, self-funding or investment-continuity judgment. Select explicit previous/current cutoffs. Run the review, inspect each calculation and unknown, then retain the packet and its independently saved SHA-256. After a relevant disclosure or reviewed annotation, rerun using that exact packet as the baseline.

For the Meta case, ask whether operating cash covered cash investment and dividends in each reviewed period. Separately examine cash movements, restricted liquidity, borrowing, debt maturities and future obligations. Do not extrapolate historical coverage into a forecast. The July subsequent lease event is not a June balance-sheet liability. Calendar-year commitments are not next-12-month cash payments.

## Compare workflows fairly

Use the same issuer, documents, periods and cutoff for a manual filing-only workflow and a review-kit workflow. Record time to locate the inputs, time to reconcile them, unsupported conclusions, missed material caveats and successful replay. Include source-search time in both arms, or exclude it from both. Counterbalance task order to reduce learning effects. A reviewer should assess correctness against original sources without knowing which arm produced the report.

## Evidence to record, with permission

Record a random participant ID, task, release ID, cutoff, packet digest, completion time, source-verification outcome and specific issue found. Separate first use from a repeat review after a genuine evidence change. A user deciding the result is not useful is still an outcome. Do not publish holdings, private thesis notes, account details, identity or full packets without explicit permission.

External completion, repeat use and willingness to pay must each have their own evidence. Dataset downloads, paper views, synthetic tests and successful integrations do not count as those outcomes. No independent participants, paid clients or platform partnerships are asserted by this release.

## Reproduce engineering checks

In the source repository run `npm run verify:rebalance-review`. Tests cover pre-review cutoffs, altered facts, unit/period mismatch, cash reconciliation, modified results, old packet replay and the MCP initialize/list/call flow. These are implementation checks; they do not establish economic usefulness, independent accounting assurance, market-wide coverage or returns.

Use `review_claim` for a first review, `compare_reviews` with exact prior packet text and hash for a subsequent review, and `replay_review` for verification. Tool replies are compact; resources/read retrieves the complete evidence packet on demand. The session cache is not durable storage: save the packet and its digest before closing the host. The local MCP server is read-only and has no network, credentials or trading tools. Host Agents may transmit tool inputs to their provider; inspect the host's privacy policy before including private context.

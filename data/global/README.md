# AI investment and cash evidence workflow

Question: Do selected AI investment and revenue disclosures establish cash realization?
Coverage: 32 selected issuers. The original 12-issuer baseline was selected October 6, 2026. Additional issuers enter only at their recorded enrollment timestamps; earlier cutoffs retain the baseline. Optical cases enter the formal workflow only at their separately recorded promotion clocks; their original v1 scope stays frozen.

This package is original AhaSignals research (CC BY 4.0), not raw issuer documents. It contains the frozen reviewed annotations, later collection receipts, and a browser/Node replay engine. Source owners retain their document rights. AhaSignals is independent and unaffiliated with cited issuers. Research only; not investment advice.

## Complete task (Node.js 24; no dependencies, account or network)

Use workflow/index.json from the website or dataset mirror. Select one release and retain its sha256 (the manifest hash), packageSha256 (the ZIP hash), and root. Do not mix files from different releases. Download root/research.zip and verify its SHA-256 against the separately retained packageSha256 before extracting or running code. For example, use `shasum -a 256 research.zip` or `sha256sum research.zip` and compare the result exactly.

After extraction, substitute the pinned manifest hash for RELEASE_SHA256:

    node task.mjs verify --release RELEASE_SHA256
    node task.mjs query --release RELEASE_SHA256 --as-of 2026-10-07T12:00:00Z --out evidence-packet.json
    node task.mjs replay --release RELEASE_SHA256 --packet evidence-packet.json --sha256 PACKET_SHA256

Query defaults to all companies enrolled by the requested cutoff and retained-observation mode. Add `--entity innolight` for one issuer or explicitly select `--mode retrospective-date` for reconstruction. Query prints the packet hash; retain it separately. Existing output files are never overwritten. Invalid cutoffs, mixed versions, altered results and missing files fail with a nonzero exit status.

The task verifies the manifest and every listed file, then loads the exact captured engine bytes and snapshot that passed verification. It reports each issuer's missing evidence stages, source withholding reasons, conflicts, and calculation inputs with source URL, hash, period, unit, scope and locator. Unknowns remain unknown. The machine-readable agent-manifest.json describes this interface. Agents can execute these local commands; no hosted service or platform registration is required.

Browser packets use this same task report and release ID. Choose the matching kit, not necessarily the latest one, to replay an older packet. New releases never replace the saved package or packet. The original v1 Python/MCP conformance interface is separate and does not provide this retained-observation task.

## Lower-level replay compatibility

Obtain the manifest hash from a trusted release index and pin it independently. Check manifest.json and the listed files before running code. A hash stored only beside an untrusted file cannot authenticate it. The website uses the same workflow.mjs engine.

    node workflow-cli.mjs query snapshot.json fd89ebd1e929fdf594aa40547d6d8fc85d7b31a0d2bfd4999922b2ab0046cfcf 2026-10-07T00:00:00Z evidence-packet.json innolight
    node workflow-cli.mjs replay evidence-packet.json EXPECTED_PACKET_SHA256

The query command prints the packet hash. Retain it separately. Replaying checks the entire packet (including request), the captured input and nested receipts, then recalculates and compares the answer. It never reopens an input after checking it. This binds this workflow's consumption, not arbitrary downstream agents or external calculations.

Retained-observation (default) requires the annotation to have been recorded by cutoff and an exact reviewed source hash to match a completed private-retention receipt by cutoff. Source acquisition failures and missing retained versions withhold evidence, never become zeros. Retrospective-date is an optional reconstruction from source dates; it does not prove historical knowledge, original bytes or public accessibility. A later fetch does not authenticate an earlier version.

Source publicAvailableAt remains unknown. First observation is not first publication. The latest byte mismatch is a review candidate and does not automatically invalidate an older retained observation or establish a financial change. Original HTTP bodies stay in the private archive; public users cannot independently verify those bytes from this packet alone.

## Supplemental sources

Separately identified issuer presentations may supplement an inaccessible original URL. They retain their own URL, language, registration clock, source hash and dated review. They enter retained queries only after registration and review. The original source and its failed attempts remain visible. Supplemental documents do not establish historical public availability. Prospective cohort additions are recorded separately in expansionEntities; their initial source documents use cohort-entry provenance. The frozen v1 study remains unchanged.

## Reviewed source versions

Dated source reviews are retained separately from the immutable seed. They pin the exact private source hash, observation receipt, review clock and admitted facts. A historical query only uses a review recorded by its cutoff. New facts such as the Meta quarterly operating cash flow are not backdated into earlier observed-mode queries. Reviewers must read the retained source and verify the numerical scope; byte equality alone does not review a financial fact.

## Financial limits

Rows retain period, language, scope, value, unit and source locator. Conflicting variants are withheld from calculations. Operating cash flow / revenue uses same-document, same-period, same-scope, same-unit actuals with decimal arithmetic. It does not measure collection of those sales, cash return on AI investment or contract fulfillment. No cross-company aggregate is produced. Revenue disclosures, capex guidance and operating cash flow are different evidence stages; absent fields mean unestablished coverage.

## Updates

The mutable workflow/index.json lists immutable release directories. Later receipts create a new package; old packages stay unchanged. Collection covers selected URLs once daily. New filings and changed financial values require a separate source review and a new reviewed release; there is no claim of fully automatic accounting judgment. Last successful collection and failed sources are in health.json. After 48 hours without a receipt, the page marks collection stale. Scheduled execution and publication can fail or be delayed.

Citation: AhaSignals, AI investment and cash evidence workflow, version 1.0.0. Include the release hash, packet hash, evidence policy and cutoff. Single-operator AI-assisted annotations; no independent expert audit or external-user validation claimed.

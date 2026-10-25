# AhaSignals Evidence MCP

Check a financial claim's source, cutoff and cash arithmetic. The server runs locally against bundled, fixed research snapshots. It makes no network requests, reads no account credentials and publishes nothing.

## Run

Requires Node.js 22 or newer. Download the `.mcpb` file and `SHA256SUMS` from the [versioned GitHub Release](https://github.com/AhaSignals/evidence-mcp/releases/tag/v0.1.1). A compatible MCPB host can import the bundle. Host-specific installation and permissions still apply; directory listing does not install a server automatically.

Alternatively clone this repository and pin the release tag. No npm account or dependency installation is required:

```sh
git clone https://github.com/AhaSignals/evidence-mcp.git
cd evidence-mcp
git checkout v0.1.1
```

Then run:

```sh
node server.mjs coverage
node demo.mjs
node examples/scope-check.mjs
```

Configure a local MCP host with the absolute path to the unpacked server:

```json
{"mcpServers":{"ahasignals-evidence":{"command":"node","args":["/absolute/path/to/package/server.mjs"]}}}
```

The path is a placeholder. This configuration starts a stdio process, not an HTTP server. Hosts with a different configuration format should use the same command and argument. Read RESEARCH.md or the `check_operating_evidence` MCP prompt for the research sequence. No API key is needed for this server; the host's model usage is separate.

## Scope

- Global disclosure query: 32 selected companies at the packaged cutoff; prior cutoffs respect prospective enrollment. This is not a comprehensive market universe.
- Cash review: the separately frozen historical 12-company review. The larger global cohort does not expand this tool's scope.
- Operating evidence: CRM, ADBE, INTU and PYPL; six annotations, four cash calculations and two initial product-terms observations. No complete management-promise outcome panel yet.

Use `get_coverage` for exact pins and clocks. Financial facts are admitted under capture/review rules; historical first-public availability may remain unknown. Missing records are not evidence of business deterioration. Initial product observations do not establish price changes. No stock prices, market-response model, forecasts, validated factor, execution or independent financial assurance are included.

## Tools and replay

`get_coverage`, `query_disclosure_evidence`, `get_operating_changes`, `trace_claim`, `check_cash_bridge`, `review_claim`, `replay_evidence`.

Replies include a packet hash and a resource URI. Read that resource to get full evidence, and save both its exact text and hash. The session retains eight packets; restarting loses that cache. Replay requires this original package. A hash verifies consistency, not private-source authenticity. Tool results may be sent to the host model provider under its own policy.

`node demo.mjs` exercises a real stdio handshake, lists tools, queries the CRM scope annotation, verifies the earlier cutoff returns no records, recomputes PYPL cash flow and replays a saved packet. This is a protocol integration test, not an independent investor adoption claim or a model-performance evaluation.

## Updates and citation

The server does not auto-download a newer snapshot. Install a newly reviewed package explicitly and retain the prior version for old-cutoff replay. Dataset changes and package updates are separate from source checking. Pin `pins.json`, the package version and the returned packet SHA-256 when citing a result.

Original code: MIT. Bundled original research annotations: CC BY 4.0 under their included licenses. Third-party source material retains its own rights; raw issuer documents are not included. Review is AI-assisted single-operator. AhaSignals is independent of named companies and compatible hosts; research only, not investment, legal, tax or accounting advice.

MCP namespace: `com.ahasignals/evidence`. Directory publication is checked separately from code publication.

## Reproduce a scope check

```sh
node examples/scope-check.mjs
```

The illustrative claim is that Agentforce ARR above USD 1.5 billion proves comparable organic growth. The reviewed FY2027 Q2 annotation says the scope includes AI offerings, Slackbot and Headless 360. A reviewed prior definition and common-scope reconciliation are missing. The result is **UNKNOWN**, with `comparableOrganicGrowth: null`; the script does not manufacture a prior-period amount or a valuation change. It also checks the earlier admission cutoff and replays the evidence packet.

The expected result is in [examples/scope-check.expected.json](examples/scope-check.expected.json). The source locator, document hash and review clocks allow readers to challenge the annotation against the issuer's original disclosure. This scripted example is not an evaluation of any model or evidence of external adoption.

## Local verification and packaging

```sh
npm test
python3 scripts/build_bundle.py
python3 scripts/verify_release.py
```

`npm test` runs local Node commands without installing dependencies. Packaging uses Python's standard library, fixed ZIP timestamps and an explicit file allowlist. The separate official MCPB CLI can validate `manifest.json`. For the optional official SDK interoperability test, install `@modelcontextprotocol/sdk` separately, set `MCP_SDK_ROOT` to its package directory and run `node sdk-smoke.mjs`.

Source code is MIT; evidence annotations retain their included CC BY 4.0 licenses. There are no scheduled workflows in this repository. New data requires source review and a new pinned release; directory registration does not imply live updates.

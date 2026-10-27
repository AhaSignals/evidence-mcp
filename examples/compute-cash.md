# Compute commitments and cash: a reproducible evidence check

**Question:** Do the reviewed compute arrangements establish payments already made, or show that operating cash funds those arrangements?

**Answer:** Neither is established by this selected evidence. Payment triggers differ by contract, the obligations overlap, and company operating cash is not contract-level cash paid. The retained annotations support four cash reconciliations, but do not support one aggregate commitment total or an AI-project cash-return rate.

## Run and inspect

Use the **v0.2.0** release and Node.js 22 or newer. No credentials, live requests, installation service or paid model are required.

```sh
node examples/compute-cash.mjs
```

This calls the actual stdio MCP server, queries before and at the admission boundary, reads the full evidence resource, recomputes all four bridges and replays the saved packet. It compares the result with `compute-cash.expected.json`, the complete `compute-cash.packet.json` and its separately saved SHA-256. These files are a reproducible test fixture, not evidence of external use.

## What the retained case establishes

The study subject is Anthropic, PBC, a supplementary counterparty case outside the 41-issuer cohort. The primary source is its [October 26, 2026 S-1](https://www.sec.gov/Archives/edgar/data/2130357/000162828026067168/anthropicpbc-sx1.htm). Each event and cash input includes a source URL, locator, retained source hash, scope and review clocks. Source documents are not redistributed.

Nine reviewed events resolve to eight latest claims. Minimum purchase commitments, equipment leases, optional financing capacity and conditional estimates remain separate. In particular, the $42 billion optional note capacity is financing for the equipment lease, not another purchase to add to it. The $125–150 billion conditional provider estimate is not an unconditional liability. Earlier capacity announcements are not proof of capacity delivered.

For the **six months ended June 30, 2026**, the selected unaudited consolidated cash inputs reproduce the following in **USD million**:

| Reconciliation | Calculation | Result |
| --- | --- | ---: |
| Net loss to operating cash | −80,748 + 83,509 noncash adjustments + 1,168 working-capital changes | 3,929 |
| Change in cash | 3,929 operating − 17,181 investing + 110,774 financing − 5 FX | 97,517 |
| Ending cash including restricted balances | 17,401 opening + 97,517 change | 114,918 |
| Balance split | 112,389 unrestricted + 2,529 restricted | 114,918 |

The full packet retains the individual operands behind these grouped figures. Financing cash is material to the cash-balance reconciliation. A positive operating cash figure alone does not establish that future compute obligations are self-funded. We do not project cash burn, infer valuation or attribute consolidated cash to an AI contract.

## Which historical question is answered?

The SEC index records acceptance at **2026-10-26T13:00:11Z**. This case was registered at **13:52:42.479642Z**, the S-1 was retained at **13:52:59.591848Z**, and the annotations were reviewed at **13:55:42.926410Z**.

The example returns zero event and cash rows at **13:55:42.926409Z**, then admits nine events and 22 cash inputs one microsecond later. This is the dataset's retained-and-reviewed admission boundary. It does not claim that the filing first became public at review time, or reconstruct an observation in April merely because a source describes an April announcement.

## Challenge or cite the result

Cite AhaSignals, *Compute commitments and cash: a reproducible evidence check*, Evidence MCP **v0.2.0**, using `CITATION.cff`, the tagged example URL and the packet hash. Keep the release and cutoff together. A hash checks bytes; it does not prove the underlying source is authentic or the interpretation is correct.

To dispute a conclusion, identify the record ID, source locator, period or condition at issue. A later correction should append a new case/package version and link to this result. The v0.1.1 package remains available for its original packets; the new server rejects packets from another package version.

AhaSignals is an independent, AI-assisted single-operator research publisher. This case is not independent assurance or investment, legal or accounting advice. Third-party names are source context only; no affiliation or endorsement is implied.

# Operating evidence history

An additive supplement to `company-kpi-history`. The frozen 0.1.0 and 0.1.1 base tables are unchanged. This pilot selects CRM, ADBE, INTU and PYPL; it does not change the separate global AI disclosure cohort.

The first release contains six reviewed annotations, four cash calculations and two first observations of public product list prices. Two annotations concern measurement boundaries, not policy changes. Earlier definitions have not been independently reconstructed. Selected facts are retrospective captures made on 24 October UTC / 25 October Beijing time. No earlier daily coverage is implied.

## Reproduce

```sh
python3 scripts/operating-evidence/evidence.py verify public/data/company-kpi-history/operating-evidence/v0.1.0
python3 scripts/operating-evidence/evidence.py query public/data/company-kpi-history/operating-evidence/v0.1.0 --as-of 2026-10-24T00:00:00Z
python3 -m unittest discover -s scripts/operating-evidence -p 'test_*.py'
```

The query returns no records before capture and review. This is a dataset-admission rule, not a claim that financial facts first became public at our capture time. Source publication dates are only day-precision; first-public timestamps remain unknown. Do not use current annotations as historically investable signals without independent historical availability evidence. The calculation module refuses unequal periods, units, scopes and approximate operands.

CSV `record_json` is the lossless record. Blank flattened values are not zeros. JSONL is canonical. A passing verifier establishes internal consistency and byte identity, not source authenticity, independent review, accounting assurance or investment performance.

## Local maintenance, within the free allowance

```sh
python3 scripts/operating-evidence/collect.py
```

This makes six bounded reads of registered official URLs and writes private receipts under the ignored `internal/operating-evidence/checks/` directory. It does not use Actions, publish, classify financial changes or discover new quarterly releases. Dynamic HTML can change without financial changes. Missing price fragments, 403s and offline execution are explicit unknowns; do not infer absence of new results. The existing `scripts/earnings-cash/daily_check.py` also invokes this check. Run it independently only for a targeted investigation; do not repeat reads to increase download counts. No new schedule or paid infrastructure is installed.

For a new financial period, first discover its official release, review source language/period/unit/scope, register the URL and reconcile it against the prior record. The initial release is immutable. Later schemas must validate predecessor references against retained earlier releases, distinguish subsequent periods from revisions, and test old cutoff results. Do not modify `review-v0.1.0.json` after publication to revise history.

`build.py` needs retained private HTML and review anchors, verifies hashes and selected passages, then writes a new immutable release. Public outputs contain selected facts, original annotations and source locators, not raw financial reports or copied price-page text. Source hashes do not independently authenticate unavailable private captures. Company sources may overlap other AhaSignals research; these examples are development material, not a held-out benchmark.

Before publishing: local unit tests, release verification, rights and identity checks, expanded ZIP inspection, full website build, desktop/mobile browser QA. The organization is AhaSignals; review remains AI-assisted single-operator. No alpha, management-integrity score, comprehensive dilution adjustment or owner-earnings estimate is asserted.

## Standalone archive

Run `python3 evidence.py verify .` and `python3 evidence.py query . --as-of 2026-10-24T00:00:00Z`. The latter must return zero records. The repository commands above describe source maintenance, not files bundled in this archive.

## Rights and citation

AhaSignals original compilation and commentary: CC BY 4.0. Python code: MIT. No rights over issuer names, source publications or third-party content are granted. Read the source links and their applicable terms. Public access is not a blanket redistribution license. This selective facts-only release is not a legal clearance of every future use. Independent research; no issuer affiliation or endorsement; not investment, accounting or legal advice.

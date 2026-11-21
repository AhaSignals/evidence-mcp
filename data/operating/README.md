# Operating evidence v0.1.2

The tables include all records from v0.1.1. Linked records identify their predecessor. Product prices can be compared only within the same product, scope, currency and unit. Source dates, capture clocks and review clocks are separate. Records first enter queries at the later of capture and review.

Run `python3 evidence.py verify .` and `python3 evidence.py query . --issuer INTU --as-of 2026-11-21T13:11:34.843543+00:00`. The JSONL and CSV contain the same records. See sources.jsonl for original-document links, events.jsonl for reporting changes and product-terms.jsonl for price observations. Cash calculations use the specified period, units and consolidation scope.

AI-assisted single-operator review by AhaSignals. Source rights belong to their respective owners. This package contains selected facts and original calculations. See LICENSE.txt and CODE-LICENSE.txt.

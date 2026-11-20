# Operating evidence v0.1.1

The tables include all records from v0.1.0. Each new event or calculation identifies the earlier record and the relationship. Source dates, capture clocks and review clocks are separate. Records first enter queries at the later of capture and review.

Run `python3 evidence.py verify .` and `python3 evidence.py query . --issuer INTU --as-of 2026-11-20T13:12:17.943936+00:00`. The JSONL and CSV contain the same records. See sources.jsonl for original documents and events.jsonl for reporting changes. Cash calculations use the specified period, units and consolidation scope.

AI-assisted single-operator review by AhaSignals. Source rights belong to their respective owners. This package contains selected facts and original calculations. See LICENSE.txt and CODE-LICENSE.txt.

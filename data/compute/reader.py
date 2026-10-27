"""Offline retained-evidence reader. No network, credentials or automatic approval."""
import argparse
import datetime as dt
import json
from pathlib import Path

def instant(value):
    result = dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
    if result.tzinfo is None: raise ValueError('Cutoffs and clocks require a timezone')
    return result

def eligible(row, cutoff):
    limit = instant(cutoff)
    required = ['registeredAt', 'sourceObservedAt', 'reviewedAt']
    if any(not row.get(key) for key in required): return False
    clocks = [instant(row[key]) for key in required]
    if row.get('acceptedAt'): clocks.append(instant(row['acceptedAt']))
    return max(clocks) <= limit

def query(folder, cutoff):
    data = json.loads((Path(folder) / 'review.json').read_text())
    events = [r for r in data['events'] if eligible(r, cutoff)]
    facts = [r for r in data['cashFacts'] if eligible(r, cutoff)]
    latest = {}
    for row in events:
        # Same claim only. Different metrics for related arrangements stay separate.
        key = row['claimId']
        if key not in latest or (row['sourceDate'], row['reviewedAt']) > (latest[key]['sourceDate'], latest[key]['reviewedAt']):
            latest[key] = row
    return {'cutoff': cutoff, 'version': data['version'], 'events': events,
            'latestClaims': list(latest.values()), 'cashFacts': facts,
            'aggregateCommitment': None,
            'boundary': 'Retained and reviewed evidence only; no pre-observation historical reconstruction or contract total.'}

def total_commitments(rows):
    raise ValueError('No validated non-overlapping commitment universe; summation is not supported')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cutoff', required=True)
    parser.add_argument('--dir', type=Path, default=Path(__file__).parent)
    args = parser.parse_args()
    print(json.dumps(query(args.dir, args.cutoff), indent=2))

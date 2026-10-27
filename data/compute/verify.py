"""Verify local files, exact cash bridges and retained cutoff boundaries."""
import sys
sys.dont_write_bytecode = True
import csv
from decimal import Decimal
import hashlib
import io
import json
from pathlib import Path
import zipfile
from reader import eligible, instant, query

def validate(data):
    sources = {s['id']: s for s in data['sources']}
    events = {r['id']: r for r in data['events']}
    facts = {r['id']: r for r in data['cashFacts']}
    assert len(events) == len(data['events']) and len(facts) == len(data['cashFacts'])
    for row in list(events.values()) + list(facts.values()):
        source = sources[row['sourceId']]
        assert row['sourceSha256'] == source['sha256'] and len(source['sha256']) == 64
        assert row['sourceUrl'] == source['url'] and row['sourceLocator']
        assert row['sourceObservedAt'] == source['sourceObservedAt']
        assert instant(row['registeredAt']) <= instant(row['sourceObservedAt']) <= instant(row['reviewedAt'])
        assert instant(row['reviewedAt']) <= instant(data['reviewedAt'])
        if row.get('acceptedAt'):
            assert instant(row['acceptedAt']) <= instant(row['sourceObservedAt'])
        Decimal(row['value'])
    for row in events.values():
        assert row['aggregateEligible'] is False
        assert all(row[k] is None for k in ['cashPaid', 'recognizedSupplierRevenue', 'deliveredCapacity'])
        if row['priorEventId']:
            previous = events[row['priorEventId']]
            assert previous['id'] != row['id']
            assert previous['sourceDate'] <= row['sourceDate']
            if row['relationshipType'] == 'subsequent-disclosure-clarification':
                assert previous['claimId'] == row['claimId']
        if row['upperValue'] is not None: assert Decimal(row['upperValue']) >= Decimal(row['value'])
    results = {}
    for bridge in data['bridges']:
        inputs = [facts[x] for x in bridge['inputs']]
        result = facts[bridge['result']]
        assert all(all(row[k] == result[k] for k in ['period', 'unit', 'scope', 'sourceId']) for row in inputs)
        amount = sum(Decimal(row['value']) for row in inputs)
        assert amount == Decimal(result['value']), bridge['id']
        results[bridge['id']] = str(amount)
    assert data['aggregateCommitment'] is None
    return results

def verify(folder):
    folder = Path(folder)
    manifest = json.loads((folder / 'manifest.json').read_text())
    expected = set(manifest['files']) | {'manifest.json'}
    if (folder/'evidence.zip').exists(): expected.add('evidence.zip')
    assert {p.name for p in folder.iterdir() if p.is_file()} == expected
    for name, digest in manifest['files'].items():
        assert Path(name).name == name
        assert hashlib.sha256((folder/name).read_bytes()).hexdigest() == digest, name
    for name in expected - {'evidence.zip'}:
        raw = (folder/name).read_bytes()
        assert bytes([47])+b'Users'+bytes([47]) not in raw
        assert bytes([47])+b'home'+bytes([47]) not in raw
        assert b'BEGIN '+b'PRIVATE KEY' not in raw
    if (folder/'evidence.zip').exists():
        with zipfile.ZipFile(folder/'evidence.zip') as z:
            assert set(z.namelist()) == expected - {'evidence.zip'}
            for name in z.namelist():
                assert z.read(name) == (folder/name).read_bytes(), name
    data = json.loads((folder/'review.json').read_text())
    assert json.loads((folder/'sources.json').read_text()) == data['sources']
    assert [json.loads(s) for s in (folder/'events.jsonl').read_text().splitlines()] == data['events']
    csvrows = list(csv.DictReader(io.StringIO((folder/'events.csv').read_text())))
    assert len(csvrows) == len(data['events'])
    for row, event in zip(csvrows, data['events']):
        assert row == {k: '' if v is None else str(v) for k,v in event.items()}
    cashrows = list(csv.DictReader(io.StringIO((folder/'cash.csv').read_text())))
    assert cashrows == [{k: '' if v is None else str(v) for k,v in row.items()} for row in data['cashFacts']]
    results = validate(data)
    before = query(folder, '2026-10-26T13:00:10Z')
    assert not before['events'] and not before['cashFacts']
    after = query(folder, data['reviewedAt'])
    assert len(after['events']) == len(data['events'])
    assert len(after['latestClaims']) == len({r['claimId'] for r in data['events']})
    print(json.dumps({'events':len(data['events']), 'cashFacts':len(data['cashFacts']), 'bridges':results,
                      'boundary':'Arithmetic, provenance links and recorded clocks checked; not independent source authentication or assurance.'}))
    return data

if __name__ == '__main__':
    verify(Path(__file__).parent)

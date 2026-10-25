"""Offline operating-evidence reader and verifier. Python standard library; MIT."""
import argparse
import csv
import hashlib
import json
import re
from datetime import datetime
from decimal import Decimal
from pathlib import Path
from zipfile import ZipFile

TABLES = ('sources', 'events', 'cash-checks', 'product-terms')


def clock(value):
    time = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if time.tzinfo is None:
        raise ValueError('A timezone is required')
    return time


def rows(path):
    return [json.loads(line) for line in path.read_text().splitlines() if line]


def eligible(record, cutoff):
    """Dataset admission, not proof of historical public availability."""
    return max(clock(record['observed_at']), clock(record['reviewed_at'])) <= clock(cutoff)


def calculate(check):
    operands = check['inputs']
    # All inputs must share the explicitly selected period, scope and currency.
    for field in ('period', 'scope', 'unit'):
        if len({x[field] for x in operands}) != 1:
            raise ValueError('Incompatible ' + field)
    if any(x['qualifier'] != 'exact' for x in operands):
        raise ValueError('Approximate inputs cannot produce an exact result')
    values = [Decimal(x['value']) for x in operands]
    if not all(v.is_finite() for v in values):
        raise ValueError('Non-finite input')
    if check['operation'] == 'subtract' and len(values) == 2:
        result = values[0] - values[1]
    elif check['operation'] == 'add' and len(values) >= 2:
        result = sum(values)
    else:
        raise ValueError('Unsupported operation')
    return format(result, 'f')


def verify(root):
    manifest = json.loads((root / 'manifest.json').read_text())
    expected = manifest['files']
    actual = {str(p.relative_to(root)) for p in root.rglob('*') if p.is_file()
              and p.name not in ('manifest.json', 'research.zip') and '__pycache__' not in p.parts}
    if actual != set(expected):
        raise ValueError('Unexpected or missing release files')
    for name, digest in expected.items():
        if name.startswith('/') or '..' in Path(name).parts:
            raise ValueError('Unsafe manifest path')
        if hashlib.sha256((root / name).read_bytes()).hexdigest() != digest:
            raise ValueError('Hash mismatch: ' + name)
    data = {t: rows(root / (t + '.jsonl')) for t in TABLES}
    ids = [r['id'] for t in data.values() for r in t]
    if len(ids) != len(set(ids)):
        raise ValueError('Duplicate record ID')
    sources = {s['id']: s for s in data['sources']}
    for name in TABLES:
        with (root / (name + '.csv')).open(newline='') as handle:
            csv_rows = list(csv.DictReader(handle))
        if [json.loads(r['record_json']) for r in csv_rows] != data[name]:
            raise ValueError('Lossy CSV view: ' + name)
    for source in sources.values():
        clock(source['observed_at'])
        if source['first_public_available_at'] is not None:
            raise ValueError('Pilot does not establish first-publication timestamps')
        if source['capture_status'] == 'retained' and not re.fullmatch('[a-f0-9]{64}', source['sha256'] or ''):
            raise ValueError('Missing source digest')
    for table in TABLES[1:]:
        for r in data[table]:
            source = sources[r['source_id']]
            if clock(r['reviewed_at']) < clock(source['observed_at']):
                raise ValueError('Review precedes capture')
            if r['observed_at'] != source['observed_at']:
                raise ValueError('Source clock mismatch')
            if r['review_mode'] != 'AI-assisted single-operator':
                raise ValueError('Review attribution missing')
            if source['capture_status'] != 'retained':
                raise ValueError('A failed source cannot support a reviewed record')
            if r['previous_record_id'] is not None:
                # Initial release has no separately reviewed prior snapshots.
                raise ValueError('Unverified predecessor in initial release')
            if table == 'cash-checks' and calculate(r) != r['result']:
                raise ValueError('Calculation mismatch: ' + r['id'])
            if table == 'product-terms':
                if r['change_status'] != 'initial-observation' or r['price_change'] is not None:
                    raise ValueError('First observation cannot prove a price change')
                if Decimal(r['list_price']) <= 0 or Decimal(r['quantity']) <= 0:
                    raise ValueError('Invalid price unit')
            if r.get('event_type') == 'issuer-explained-guidance-change':
                detail = r['details']
                if sum(Decimal(detail[k]) for k in ('organic_change', 'pending_acquisition_change', 'currency_change')) != Decimal(detail['reported_net_change']):
                    raise ValueError('Guidance bridge mismatch')
    if (root / 'research.zip').exists():
        with ZipFile(root / 'research.zip') as archive:
            names = archive.namelist()
            if len(names) != len(set(names)) or set(names) != set(expected) | {'manifest.json'}:
                raise ValueError('Archive inventory mismatch')
            for name in names:
                if archive.read(name) != (root / name).read_bytes():
                    raise ValueError('Archive bytes mismatch')
    return {t: len(data[t]) for t in TABLES}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['verify', 'query'])
    parser.add_argument('release', type=Path)
    parser.add_argument('--as-of', help='Timezone-aware dataset availability cutoff')
    parser.add_argument('--issuer')
    args = parser.parse_args()
    counts = verify(args.release)
    if args.command == 'verify':
        print(json.dumps({'verified': counts}))
        return
    if not args.as_of:
        parser.error('query requires --as-of')
    records = [r for table in TABLES[1:] for r in rows(args.release / (table + '.jsonl'))
               if eligible(r, args.as_of) and (not args.issuer or r['issuer'] == args.issuer)]
    print(json.dumps({'as_of': args.as_of, 'availability_basis': 'observed-and-reviewed',
                     'historical_public_availability': 'unknown', 'records': records}, indent=2))


if __name__ == '__main__':
    main()

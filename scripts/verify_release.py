"""Inspect public files and decompressed release members for operator identity leaks."""
from pathlib import Path
import hashlib,json,re,zipfile

ROOT=Path(__file__).resolve().parents[1]
handle=''.join(map(chr,[115,110,111,119]))
patterns=[f'/users/{handle}/',f'/home/{handle}/',f'c:\\users\\{handle}\\',handle+'@']
identity=re.compile(r'(?:author|creator|operator|researcher|username|user)[^a-z0-9]{1,12}'+handle+r'\b',re.I)
def check(name,data):
    text=data.decode('utf-8',errors='replace')
    assert not any(p in (name+'\n'+text).lower() for p in patterns), 'Private operator path/contact in '+name
    assert not identity.search(text),'Private operator attribution in '+name
    assert not re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',text),'Private key in '+name
count=0
for p in ROOT.rglob('*'):
    rel=p.relative_to(ROOT)
    if any(x in {'.git','node_modules','dist','__pycache__'} for x in rel.parts) or not p.is_file():continue
    check(str(rel),p.read_bytes());count+=1
for path,expected in json.loads((ROOT/'pins.json').read_text())['files'].items():
    assert hashlib.sha256((ROOT/path).read_bytes()).hexdigest()==expected,'Pinned data changed: '+path
for archive in (ROOT/'dist').glob('*.mcpb'):
    with zipfile.ZipFile(archive) as z:
        assert len(z.namelist())==len(set(z.namelist())),'Duplicate archive paths'
        for name in z.namelist():
            assert not name.startswith('/') and '..' not in Path(name).parts,'Unsafe archive path'
            data=z.read(name);check(name,data)
            assert data==(ROOT/name).read_bytes(),'Archive does not match source: '+name
    meta=json.loads((ROOT/'server.json').read_text())
    assert hashlib.sha256(archive.read_bytes()).hexdigest()==meta['packages'][0]['fileSha256']
print(json.dumps({'publicFilesChecked':count,'pinnedDataVerified':True,'expandedArchiveChecked':True}))

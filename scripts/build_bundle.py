"""Build a deterministic MCPB from an explicit public-file allowlist."""
from pathlib import Path
import hashlib,json,zipfile

ROOT=Path(__file__).resolve().parents[1]
VERSION=json.loads((ROOT/'package.json').read_text())['version']
FILES=['manifest.json','package.json','pins.json','LICENSE','README.md','RESEARCH.md',
       'core.mjs','tools.mjs','server.mjs','demo.mjs','examples/scope-check.mjs',
       'examples/scope-check.expected.json','test.mjs','sdk-smoke.mjs','CHANGELOG.md',
       'scripts/build_bundle.py','scripts/verify_release.py','examples/compute-cash.mjs','examples/compute-cash.expected.json','examples/compute-cash.packet.json','examples/compute-cash.packet.sha256','examples/compute-cash.md','CITATION.cff']
FILES+=sorted(str(p.relative_to(ROOT)) for p in (ROOT/'data').rglob('*') if p.is_file())
out=ROOT/'dist';out.mkdir(exist_ok=True)
archive=out/f'ahasignals-evidence-mcp-{VERSION}.mcpb'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for name in sorted(FILES):
        p=ROOT/name
        if p.is_symlink(): raise ValueError('Symlink not allowed: '+name)
        info=zipfile.ZipInfo(name,date_time=(2026,10,25,0,0,0))
        info.compress_type=zipfile.ZIP_DEFLATED
        info.create_system=3
        info.external_attr=0o100644<<16
        z.writestr(info,p.read_bytes(),compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
sha=hashlib.sha256(archive.read_bytes()).hexdigest()
(out/'SHA256SUMS').write_text(f'{sha}  {archive.name}\n')
server={
 '$schema':'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json',
 'name':'com.ahasignals/evidence','title':'AhaSignals Evidence',
 'description':'Read-only financial evidence: disclosure cutoffs, operating changes and cash calculations.',
 'version':VERSION,
 'websiteUrl':'https://ahasignals.com/research/company-kpi-history/#agent-connection',
 'repository':{'url':'https://github.com/AhaSignals/evidence-mcp','source':'github'},
 'packages':[{'registryType':'mcpb','identifier':f'https://github.com/AhaSignals/evidence-mcp/releases/download/v{VERSION}/{archive.name}','fileSha256':sha,'transport':{'type':'stdio'}}]
}
(ROOT/'server.json').write_text(json.dumps(server,indent=2)+'\n')
print(json.dumps({'artifact':archive.name,'sha256':sha,'members':len(FILES)}))

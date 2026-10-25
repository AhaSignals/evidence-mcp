// Offline release verifier and task runner; only Node built-ins are required.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import {dirname,join,basename,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
if (!globalThis.crypto) Object.defineProperty(globalThis,'crypto',{value:webcrypto});
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const check=(ok,message)=>{if(!ok)throw Error(message);};
const pin=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
export async function loadRelease(root,expected) {
  check(pin(expected),'A separately pinned release SHA-256 is required.');
  const manifestBytes=await readFile(join(root,'manifest.json'));
  check(hash(manifestBytes)===expected,'Release manifest hash mismatch.');
  const manifest=JSON.parse(manifestBytes), captured=new Map();
  check(manifest.schemaVersion==='1.0.0' && manifest.files && typeof manifest.files==='object','Invalid release manifest.');
  for(const [name,expectedFile] of Object.entries(manifest.files)) {
    check(name===basename(name)&&!name.includes('\\')&&name!=='.'&&name!=='..'&&pin(expectedFile),'Unsafe manifest entry.');
    const bytes=await readFile(join(root,name));
    check(hash(bytes)===expectedFile,'Release file hash mismatch: '+name);
    captured.set(name,bytes);
  }
  for(const name of ['snapshot.json','workflow.mjs','task-report.mjs','task.mjs','agent-manifest.json'])check(captured.has(name),'Required task file missing: '+name);
  // Execute the exact captured module bytes that passed the manifest checks.
  // Neither module has filesystem/network dependencies; no second file read is made.
  const moduleFrom=name=>import('data:text/javascript;base64,'+captured.get(name).toString('base64'));
  const engine=await moduleFrom('workflow.mjs'),report=await moduleFrom('task-report.mjs');
  const snapshot=new TextDecoder('utf-8',{fatal:true}).decode(captured.get('snapshot.json'));
  await engine.capture(snapshot,manifest.files['snapshot.json']);
  return {releaseSha256:expected,snapshot,inputSha256:manifest.files['snapshot.json'],engine,report,filesVerified:captured.size};
}
export async function queryTask(release,request) {
  const p=await release.engine.packet(release.snapshot,release.inputSha256,request);
  return {...p,taskVersion:release.report.TASK_VERSION,releaseSha256:release.releaseSha256,report:release.report.summarize(p.answer)};
}
export async function replayTask(release,text,expected) {
  check(pin(expected)&&hash(Buffer.from(text))===expected,'Packet hash mismatch.');
  const p=JSON.parse(text);
  check(p.taskVersion===release.report.TASK_VERSION&&p.releaseSha256===release.releaseSha256,'Packet belongs to a different task release.');
  check(p.schemaVersion==='1.0.0'&&p.inputSha256===release.inputSha256&&p.inputText===release.snapshot,'Packet input differs from the pinned release.');
  const actual=await release.engine.replay(text,expected);
  check(JSON.stringify(p.report)===JSON.stringify(release.report.summarize(actual.answer)),'Stored task report differs from replay.');
  return {verified:true,releaseSha256:release.releaseSha256,packetSha256:expected,...actual,report:p.report};
}
async function main() {
  const [command,...args]=process.argv.slice(2),options={};
  check(['verify','query','replay'].includes(command),'Use verify, query or replay.');
  const allowed={verify:['release'],query:['release','as-of','out','entity','mode'],replay:['release','packet','sha256']}[command];
  for(let i=0;i<args.length;i+=2){
    const key=args[i].replace(/^--/,'');
    check(args[i].startsWith('--')&&allowed.includes(key)&&!(key in options)&&args[i+1]&&!args[i+1].startsWith('--'),'Invalid or duplicate argument: '+args[i]);options[key]=args[i+1];
  }
  const release=await loadRelease(dirname(fileURLToPath(import.meta.url)),options.release);
  if(command==='verify')console.log(JSON.stringify({verified:true,releaseSha256:release.releaseSha256,inputSha256:release.inputSha256,filesVerified:release.filesVerified}));
  else if(command==='query') {
    check(options.out,'--out must name a new packet file.');
    const p=await queryTask(release,{asOf:options['as-of'],mode:options.mode||'retained-observation',...(options.entity?{entity:options.entity}:{})});
    const text=JSON.stringify(p,null,2)+'\n';await writeFile(options.out,text,{flag:'wx'});
    console.log(JSON.stringify({releaseSha256:release.releaseSha256,inputSha256:p.inputSha256,packetSha256:hash(Buffer.from(text)),companies:p.answer.companies.length,report:p.report},null,2));
  } else {
    check(options.packet,'--packet is required.');
    console.log(JSON.stringify(await replayTask(release,await readFile(options.packet,'utf8'),options.sha256),null,2));
  }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.message);process.exitCode=1;});

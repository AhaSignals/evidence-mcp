import {readFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
if(!globalThis.crypto)Object.defineProperty(globalThis,'crypto',{value:webcrypto});
export const digest=b=>createHash('sha256').update(b).digest('hex');
export async function loadKit(pin){
 const root=path.dirname(fileURLToPath(import.meta.url)),raw=await readFile(path.join(root,'manifest.json'));
 if(!/^[a-f0-9]{64}$/.test(pin??'')||digest(raw)!==pin)throw Error('Manifest hash mismatch. Pin the release ID independently.');
 const manifest=JSON.parse(raw),files={};
 for(const [name,sha] of Object.entries(manifest.files)){
  if(!/^[a-zA-Z0-9.-]+$/.test(name))throw Error('Unsafe release member');
  const bytes=await readFile(path.join(root,name));if(digest(bytes)!==sha)throw Error('Release file mismatch: '+name);
  files[name]=bytes.toString('utf8');
 }
 const moduleUrl=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
 // Import captured verified strings; never reopen modules or inputs after checking.
 const source=files['review.mjs'].replace("'./workflow.mjs'",JSON.stringify(moduleUrl(files['workflow.mjs']))).replace("'./cash-bridge.mjs'",JSON.stringify(moduleUrl(files['cash-bridge.mjs'])));
 const engine=await import(moduleUrl(source));
 return {manifest,files,engine};
}

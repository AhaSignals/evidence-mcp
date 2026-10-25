import {readFile,writeFile} from 'node:fs/promises';
import {packet,replay,sha256} from './workflow.mjs';
const [command,...args]=process.argv.slice(2);
try {
  if(command==='replay' && args.length===2) {
    const answer=await replay(await readFile(args[0],'utf8'),args[1]);
    console.log(JSON.stringify({verified:true,...answer},null,2));
  } else if(command==='query' && args.length>=4 && args.length<=6) {
    const [file,pin,cutoff,out,entity,mode='retained-observation']=args;
    const request={asOf:cutoff,mode,...(entity?{entity}:{})};
    const result=await packet(await readFile(file,'utf8'),pin,request),text=JSON.stringify(result,null,2)+'\n';
    await writeFile(out,text,{flag:'wx'});
    console.log(JSON.stringify({packetSha256:await sha256(text),companies:result.answer.companies.length,mode}));
  } else throw Error('Usage: node workflow-cli.mjs query SNAPSHOT EXPECTED_SHA256 CUTOFF NEW_OUTPUT [ENTITY] [MODE]\n       node workflow-cli.mjs replay PACKET EXPECTED_PACKET_SHA256');
} catch(e) { console.error(e.message); process.exitCode=1; }

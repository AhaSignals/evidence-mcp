// Verify and capture all kit files before importing or calculating.
import {readFile,writeFile} from 'node:fs/promises';
import {loadKit,digest as hash} from './load-kit.mjs';
try{
 const [command,pin,...args]=process.argv.slice(2),{files,manifest,engine}=await loadKit(pin);
 const {makeReview,replayReview,baselineFrom}=engine;
 if(command==='verify'&&!args.length){console.log(JSON.stringify({verified:true,release:pin}));}
 else if(command==='replay'&&args.length===2){const p=await replayReview(await readFile(args[0],'utf8'),args[1]);console.log(JSON.stringify({verified:true,summary:p.report.summary}));}
 else if(command==='review'&&(args.length===2||args.length===4)){
  const request=JSON.parse(await readFile(args[0],'utf8'));
  const baseline=args.length===4?await baselineFrom(await readFile(args[2],'utf8'),args[3]):null;
  const p=await makeReview(files['snapshot.json'],manifest.files['snapshot.json'],request,baseline),out=JSON.stringify(p,null,2)+'\n';
  await writeFile(args[1],out,{flag:'wx'});console.log(JSON.stringify({packetSha256:hash(out),summary:p.report.summary}));
 }else throw Error('Usage: node cli.mjs verify RELEASE_SHA256 | review RELEASE_SHA256 REQUEST.json NEW_OUTPUT.json [PRIOR_PACKET.json PRIOR_SHA256] | replay RELEASE_SHA256 PACKET.json PACKET_SHA256');
}catch(e){console.error(e.message);process.exitCode=1;}

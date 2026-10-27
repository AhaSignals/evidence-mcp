import {readFile} from 'node:fs/promises';
// Use a separately installed official SDK. It is not a runtime dependency of the server.
import {pathToFileURL,fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const sdk=process.env.MCP_SDK_ROOT;
if(!sdk)throw Error('Set MCP_SDK_ROOT to the installed @modelcontextprotocol/sdk directory');
const {Client}=await import(pathToFileURL(sdk+'/dist/esm/client/index.js'));
const {StdioClientTransport}=await import(pathToFileURL(sdk+'/dist/esm/client/stdio.js'));
const client=new Client({name:'ahasignals-sdk-smoke',version:'0.1.0'},{capabilities:{}});
try{
 await client.connect(new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('./server.mjs',import.meta.url))]}));
 const list=await client.listTools();assert.equal(list.tools.length,9);
 const response=await client.callTool({name:'get_coverage',arguments:{}});assert(!response.isError);
 const data=JSON.parse(response.content[0].text);assert.equal(data.result.globalDisclosure.length,41);assert.equal(data.result.cashReview.companies.length,12);
 const saved=await client.readResource({uri:data.packetUri});
 const replay=await client.callTool({name:'replay_evidence',arguments:{packetText:saved.contents[0].text,packetSha256:data.packetSha256}});assert(!replay.isError);assert(JSON.parse(replay.content[0].text).verified);
 const prompts=await client.listPrompts();assert.equal(prompts.prompts.length,1);
 console.log(JSON.stringify({client:'Official MCP TypeScript SDK',sdkVersion:JSON.parse(await readFile(sdk+'/package.json','utf8')).version,connected:true,tools:list.tools.length,scopes:[41,12,4],resourceRead:true,replay:true,paidModelCalls:0,externalAdoption:false}));
}finally{await client.close();}

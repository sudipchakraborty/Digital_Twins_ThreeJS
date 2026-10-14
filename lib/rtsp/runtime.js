import { spawn, execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, delimiter } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, createConnection } from 'node:net';
import { createBridge } from './bridge.js';

const moduleDir=dirname(fileURLToPath(import.meta.url));
function findBinary(root,name,depth=4){
  if(!existsSync(root))return null;
  const direct=join(root,name);if(existsSync(direct))return direct;
  if(depth<1)return null;
  for(const entry of readdirSync(root,{withFileTypes:true}))if(entry.isDirectory()){const found=findBinary(join(root,entry.name),name,depth-1);if(found)return found;}
  return null;
}
export function resolveTools(config) {
  const tools={};
  for(const name of ['ffmpeg','ffprobe','mediamtx']){
    const binary=name+(process.platform==='win32'?'.exe':'');
    let path=config[name];
    if(!path){for(const folder of (process.env.PATH ?? '').split(delimiter)){const candidate=join(folder,binary);if(existsSync(candidate)){path=candidate;break;}}}
    if(!path)path=findBinary(join(moduleDir,'tools'),binary);
    if(!path && process.platform==='win32' && name!=='mediamtx'){
      const packages=join(process.env.LOCALAPPDATA ?? '', 'Microsoft','WinGet','Packages');
      if(existsSync(packages))for(const entry of readdirSync(packages))if(entry.startsWith('Gyan.FFmpeg_')){path=findBinary(join(packages,entry),binary);if(path)break;}
    }
    if(!path || !existsSync(path))throw new Error(`${name} is missing. Configure its executable path or run setup.ps1.`);
    execFileSync(path,[name==='mediamtx'?'--version':'-version'],{windowsHide:true,timeout:10000,stdio:'pipe'});
    tools[name]=path;
  }
  const encoders=execFileSync(tools.ffmpeg,['-hide_banner','-encoders'],{windowsHide:true,timeout:10000,encoding:'utf8'});
  if(!encoders.includes('libx264'))throw new Error('FFmpeg must include the libx264 H.264 encoder');
  return tools;
}
export function renderMediaMtxConfig(config){
  return `logLevel: info\nlogDestinations: [stdout]\nrtsp: true\nrtspAddress: :${config.rtspPort}\nrtspTransports: [tcp]\nrtmp: false\nhls: false\nwebrtc: false\nsrt: false\nmoq: false\napi: false\nmetrics: false\npprof: false\nplayback: false\nauthInternalUsers:\n  - user: any\n    ips: ['127.0.0.1', '::1']\n    permissions:\n      - action: publish\n        path: ${config.stream}\n  - user: any\n    ips: []\n    permissions:\n      - action: read\n        path: ${config.stream}\npaths:\n  ${config.stream}:\n    source: publisher\n    overridePublisher: false\n`;
}
export async function assertPortFree(port,host){
  const listening=await new Promise(resolve=>{
    const socket=createConnection({port,host:host==='0.0.0.0'?'127.0.0.1':host});socket.setTimeout(500);
    socket.once('connect',()=>{socket.destroy();resolve(true);});
    socket.once('error',()=>{socket.destroy();resolve(false);});
    socket.once('timeout',()=>{socket.destroy();resolve(false);});
  });
  if(listening)throw new Error(`Port ${port} is occupied`);
  const listener=createServer();
  await new Promise((resolve,reject)=>{listener.once('error',()=>reject(new Error(`Port ${port} is occupied or unavailable`)));listener.listen(port,host,()=>listener.close(resolve));});
}
export async function waitForReady(port,child,timeoutMs=10000){
  const deadline=Date.now()+timeoutMs;
  while(Date.now()<deadline){
    if(child.exitCode!==null && child.exitCode!==undefined)throw new Error(`MediaMTX exited (${child.exitCode}) before readiness`);
    const connected=await new Promise(resolve=>{const socket=createConnection({port,host:'127.0.0.1'});socket.setTimeout(250);socket.once('connect',()=>{socket.destroy();resolve(true);});socket.once('error',()=>{socket.destroy();resolve(false);});socket.once('timeout',()=>{socket.destroy();resolve(false);});});
    if(connected)return;
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  throw new Error('MediaMTX readiness timeout');
}
async function writeRuntimeConfig(config){
  const folder=join(moduleDir,'.runtime');await mkdir(folder,{recursive:true});const path=join(folder,'mediamtx.yml');await writeFile(path,renderMediaMtxConfig(config));return path;
}
export async function startRuntime(config, deps={}){
  const tools=deps.tools ?? resolveTools(config);
  await (deps.assertPortFree ?? assertPortFree)(config.rtspPort,'0.0.0.0');
  await (deps.assertPortFree ?? assertPortFree)(config.bridgePort,config.bridgeHost);
  const path=await (deps.writeRuntimeConfig ?? writeRuntimeConfig)(config);
  let media,bridge,closed=false,diagnostic='';
  const close=async()=>{if(closed)return;closed=true;await bridge?.close();media?.kill();};
  try {
    media=(deps.spawnProcess ?? spawn)(tools.mediamtx,[path],{windowsHide:true,stdio:['ignore','pipe','pipe']});
    media.stdout?.on('data',data=>{diagnostic=(diagnostic+data.toString()).slice(-4096);});
    media.stderr?.on('data',data=>{diagnostic=(diagnostic+data.toString()).slice(-4096);});
    let spawnError;
    media.on('error',error=>{spawnError=error;void close();});
    media.on('exit',()=>{void close();});
    await (deps.waitForReady ?? waitForReady)(config.rtspPort,media);
    if(spawnError || closed)throw spawnError ?? new Error(`MediaMTX exited during startup: ${diagnostic}`);
    bridge=(deps.bridgeFactory ?? createBridge)({config:{...config,...tools}});await bridge.listen();
    if(closed){await bridge.close();throw new Error('MediaMTX stopped during bridge startup');}
    if(!deps.writeRuntimeConfig)await writeFile(join(moduleDir,'.runtime','ownership.json'),JSON.stringify({nodePid:process.pid,mediaPid:media.pid,serverPath:join(moduleDir,'server.js'),mediaConfig:path,mediaExecutable:tools.mediamtx,ffmpegExecutable:tools.ffmpeg,bridgePort:config.bridgePort,rtspPort:config.rtspPort,stream:config.stream},null,2));
    return {close,getStatus:()=>({...bridge.getStatus(),ok:!closed,mediaPid:media.pid,tools,diagnostic})};
  }catch(error){await close();throw new Error(`${error.message}${diagnostic?'\n'+diagnostic:''}`);}
}

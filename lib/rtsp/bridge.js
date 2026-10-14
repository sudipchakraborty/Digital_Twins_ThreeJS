import { createServer } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { createEncoder } from './encoder.js';
import { validateJpeg } from './config.js';

export function createBridge({ config, encoderFactory = createEncoder }) {
  const sources=new Map(); let lastError=''; let closing=false;
  const rtspUrl=stream=>`rtsp://${config.advertisedHost}:${config.rtspPort}/${stream}`;
  const getStatus=()=>({ok:!closing,rtspUrl:rtspUrl(config.stream),lastError,streams:Object.fromEntries([...sources].map(([name,s])=>[name,{ready:s.ready,frames:s.frames,lastFrameAgeMs:Date.now()-s.lastFrame,encoder:s.encoder?.getStatus(),rtspUrl:rtspUrl(name)}]))});
  const server=createServer((request,response)=>{
    if (request.method!=='GET' || request.url!=='/rtsp/health') { response.writeHead(404);response.end();return; }
    response.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});response.end(JSON.stringify(getStatus()));
  });
  const sockets=new WebSocketServer({server,path:'/rtsp/publish',maxPayload:config.maxFrameBytes,perMessageDeflate:false});
  sockets.on('connection',socket=>{
    let source;
    const send=value=>{if(socket.readyState===WebSocket.OPEN)socket.send(JSON.stringify(value));};
    const cleanup=()=>{clearTimeout(registrationTimer);if(source && sources.get(source.stream)===source){sources.delete(source.stream);source.encoder?.close();}source=null;};
    const reject=message=>{lastError=message;send({type:'error',message});cleanup();socket.close(1008,message.slice(0,100));};
    const registrationTimer=setTimeout(()=>reject('Publisher registration timed out'),config.registrationTimeoutMs ?? 5000);
    socket.on('error',()=>cleanup()); socket.on('close',cleanup);
    socket.on('message',(payload,binary)=>{
      if (!source) {
        if(binary) {reject('Register before sending images');return;}
        let request;
        try {request=JSON.parse(payload.toString());} catch {reject('Invalid registration JSON');return;}
        if(!request || request.type!=='register' || request.stream!==config.stream || request.width!==config.width || request.height!==config.height) {reject('Stream or dimensions do not match configuration');return;}
        if(sources.has(request.stream)) {reject('This stream already has a publisher');return;}
        clearTimeout(registrationTimer);source={stream:request.stream,socket,frames:0,lastFrame:Date.now(),ready:false,encoder:null};sources.set(request.stream,source);
        send({type:'ready',stream:source.stream,rtspUrl:rtspUrl(source.stream),publishing:false});return;
      }
      if(!binary || !validateJpeg(payload,config.width,config.height,config.maxFrameBytes)) {reject('Invalid JPEG frame or dimensions');return;}
      const current=source;
      if(!current.encoder) {
        try {
          const encoder=encoderFactory({config,stream:current.stream,onError:error=>reject(error.message),onReady:()=>{
            if(source!==current)return;current.ready=true;send({type:'publishing',stream:current.stream,rtspUrl:rtspUrl(current.stream)});
          }});
          if(source!==current){encoder.close();return;}current.encoder=encoder;
        } catch(error) {reject(error.message);return;}
      }
      current.lastFrame=Date.now();current.frames++;current.encoder.offerFrame(payload);
    });
  });
  const expiry=setInterval(()=>{
    for(const s of sources.values())if(Date.now()-s.lastFrame>config.sourceTimeoutMs){lastError='Camera source stopped sending frames';s.socket.close(1008,lastError);sources.delete(s.stream);s.encoder?.close();}
  },Math.min(500,config.sourceTimeoutMs/2));
  return {
    async listen(port=config.bridgePort) {await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,config.bridgeHost,()=>{server.off('error',reject);resolve();});});return server.address();},
    address:()=>server.address(),getStatus,
    async close(){if(closing)return;closing=true;clearInterval(expiry);for(const s of sources.values())s.encoder?.close();sources.clear();for(const socket of sockets.clients)socket.terminate();await new Promise(resolve=>sockets.close(()=>resolve()));if(server.listening)await new Promise(resolve=>server.close(()=>resolve()));},
  };
}

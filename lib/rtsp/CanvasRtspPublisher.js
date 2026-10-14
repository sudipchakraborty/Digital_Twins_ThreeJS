/** Publish any completed 2D camera canvas through the local RTSP bridge. */
export class CanvasRtspPublisher {
  constructor({canvas,url,stream='ptz',fps=8,quality=0.85,onStatus=()=>{},WebSocket=globalThis.WebSocket,setTimeout=globalThis.setTimeout,clearTimeout=globalThis.clearTimeout}) {
    if(!canvas || typeof canvas.toBlob!=='function')throw new TypeError('A camera canvas is required');
    if(!/^[a-zA-Z0-9_-]{1,64}$/.test(stream) || !Number.isFinite(fps) || fps<1 || fps>30 || !Number.isFinite(quality) || quality<=0 || quality>1)throw new RangeError('Invalid stream, fps or quality');
    this.canvas=canvas;this.url=url ?? `${globalThis.location?.protocol==='https:'?'wss':'ws'}://${globalThis.location?.host}/rtsp/publish`;
    this.stream=stream;this.fps=fps;this.quality=quality;this.onStatus=onStatus;this.Socket=WebSocket;
    this.schedule=setTimeout.bind(globalThis);this.cancel=clearTimeout.bind(globalThis);this.generation=0;this.active=false;this.disposed=false;this.timer=null;this.retry=500;this.busy=false;this.socket=null;
    this.status={state:'stopped',message:'RTSP stopped',rtspUrl:''};
  }
  getStatus(){return {...this.status};}
  emit(state,message,rtspUrl=this.status.rtspUrl){this.status={state,message,rtspUrl};this.onStatus(this.getStatus());}
  start(){if(this.active || this.disposed)return;this.active=true;this.connect();}
  connect(){
    if(!this.active || this.disposed)return;
    const generation=++this.generation;this.busy=false;this.emit('connecting','Connecting RTSP');
    const current=()=>this.active && !this.disposed && generation===this.generation;
    let socket;
    try {socket=new this.Socket(this.url);this.socket=socket;} catch(error){this.emit('error',error.message);this.reconnect(generation);return;}
    socket.onopen=()=>{if(current())socket.send(JSON.stringify({type:'register',stream:this.stream,width:this.canvas.width,height:this.canvas.height}));};
    socket.onmessage=event=>{
      if(!current())return;let message;
      try {message=JSON.parse(event.data);}catch{this.emit('error','Invalid bridge response');socket.close();return;}
      if(message.type==='ready'){this.retry=500;this.emit('connecting','Preparing RTSP stream',message.rtspUrl);this.sample(generation);}
      if(message.type==='publishing')this.emit('publishing','RTSP live',message.rtspUrl);
      if(message.type==='error')this.emit('error',message.message ?? 'RTSP source error');
    };
    socket.onerror=()=>{if(current())this.emit('reconnecting','RTSP service unavailable; retrying');};
    socket.onclose=()=>{if(current())this.reconnect(generation);};
  }
  reconnect(generation){
    if(!this.active || this.disposed || generation!==this.generation)return;
    this.cancel(this.timer);this.busy=false;
    if(this.status.state!=='error')this.emit('reconnecting','RTSP disconnected; retrying');
    const wait=this.retry;this.retry=Math.min(5000,this.retry*2);
    this.timer=this.schedule(()=>this.connect(),wait);
  }
  sample(generation){
    if(!this.active || this.disposed || generation!==this.generation || this.socket?.readyState!==1)return;
    const socket=this.socket;
    if(!this.busy && socket.bufferedAmount<2097152){
      this.busy=true;
      try {
        this.canvas.toBlob(blob=>{
          if(generation!==this.generation || !this.active || this.disposed)return;
          this.busy=false;
          if(blob && blob.size<=2097152 && socket.readyState===1 && socket.bufferedAmount<2097152)socket.send(blob);
        },'image/jpeg',this.quality);
      }catch(error){this.busy=false;this.emit('error',`Camera frame: ${error.message}`);}
    }
    this.timer=this.schedule(()=>this.sample(generation),1000/this.fps);
  }
  stop(){
    this.active=false;this.generation++;this.cancel(this.timer);this.timer=null;this.busy=false;
    this.socket?.close();this.socket=null;this.emit('stopped','RTSP stopped');
  }
  dispose(){if(this.disposed)return;this.stop();this.disposed=true;}
}

import { spawn } from 'node:child_process';

export function buildEncoderArgs(config, stream) {
  return ['-hide_banner','-loglevel','warning','-nostdin','-f','image2pipe','-c:v','mjpeg','-framerate',String(config.fps),'-i','pipe:0','-an','-c:v','libx264','-preset',config.encoderPreset,'-tune','zerolatency','-pix_fmt','yuv420p','-g',String(Math.ceil(config.fps)),'-bf','0','-threads','2','-progress','pipe:3','-stats_period','0.5','-f','rtsp','-rtsp_transport','tcp',`rtsp://127.0.0.1:${config.rtspPort}/${stream}`];
}

export function createEncoder({ config, stream, spawnProcess = spawn, onError = () => {}, onReady = () => {} }) {
  let child, timer, latest, blocked=false, closed=false, failed=false, ready=false, diagnostic='', progress='';
  let writes=0;
  const fail = error => { if (closed || failed) return; failed=true; clearInterval(timer); onError(error); };
  const close = () => {
    if (closed) return; closed=true; clearInterval(timer); latest=null;
    try { child?.stdin?.end(); child?.kill(); } catch { /* Already exited. */ }
  };
  try {
    child=spawnProcess(config.ffmpeg || 'ffmpeg',buildEncoderArgs(config,stream),{windowsHide:true,stdio:['pipe','ignore','pipe','pipe']});
    child.on('error',fail);
    child.on('exit',(code,signal)=>fail(new Error(`Encoder exited (${code ?? signal}): ${diagnostic}`)));
    child.stdin.on('error',fail); child.stdin.on('drain',()=>{blocked=false;});
    child.stderr.on('data',data=>{diagnostic=(diagnostic+data.toString()).slice(-4096);});
    child.stdio?.[3]?.on('data',data=>{
      progress=(progress+data.toString()).slice(-2048);
      if (!ready && /frame=\s*[1-9]\d*/.test(progress)) { ready=true; onReady(); }
    });
    timer=setInterval(()=>{
      if (closed || failed || blocked || !latest) return;
      try { blocked=!child.stdin.write(latest); writes++; } catch (error) { fail(error); }
    },1000/config.fps);
  } catch (error) { fail(error); }
  return {
    offerFrame(buffer) { if (!closed && !failed) latest=buffer; }, close,
    getStatus() { return {state: failed?'error':closed?'closed':ready?'publishing':'starting',writes,diagnostic,pid:child?.pid}; },
  };
}

export function parseConfigText(text) { return JSON.parse(text.replace(/^\uFEFF/,'')); }

export function loadConfig(overrides = {}) {
  const config = { bridgeHost: '127.0.0.1', bridgePort: 8890, rtspPort: 8554, advertisedHost: '127.0.0.1', stream: 'ptz', width: 800, height: 450, fps: 8, quality: 0.85, sourceTimeoutMs: 10000, maxFrameBytes: 2097152, encoderPreset: 'ultrafast', ffmpeg: '', ffprobe: '', mediamtx: '', ...overrides };
  for (const key of ['bridgePort','rtspPort']) if (!Number.isInteger(config[key]) || config[key]<1 || config[key]>65535) throw new RangeError(`Invalid ${key}`);
  for (const key of ['width','height']) if (!Number.isInteger(config[key]) || config[key]<2 || config[key]>4096 || config[key]%2) throw new RangeError(`Invalid ${key}: use even dimensions from 2 to 4096`);
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(config.stream)) throw new RangeError('Invalid stream name');
  for (const key of ['bridgeHost','advertisedHost']) if (typeof config[key]!=='string' || !/^[a-zA-Z0-9.-]+$/.test(config[key])) throw new RangeError(`Invalid ${key}`);
  if (!Number.isFinite(config.fps) || config.fps<1 || config.fps>30) throw new RangeError('Invalid fps');
  if (!Number.isFinite(config.quality) || config.quality<=0 || config.quality>1) throw new RangeError('Invalid quality');
  if (!Number.isInteger(config.sourceTimeoutMs) || config.sourceTimeoutMs<1000 || config.sourceTimeoutMs>60000) throw new RangeError('Invalid sourceTimeoutMs');
  if (!Number.isInteger(config.maxFrameBytes) || config.maxFrameBytes<1024 || config.maxFrameBytes>8388608) throw new RangeError('Invalid maxFrameBytes');
  if (!['ultrafast','superfast','veryfast','faster','fast','medium'].includes(config.encoderPreset)) throw new RangeError('Invalid encoderPreset');
  for (const key of ['ffmpeg','ffprobe','mediamtx']) if (typeof config[key]!=='string') throw new TypeError(`Invalid ${key} path`);
  return config;
}

/** Validate bounded JPEG headers and scan boundaries before offering to FFmpeg. */
export function validateJpeg(buffer, width, height, maxBytes = 2097152) {
  if (!(buffer instanceof Uint8Array) || buffer.length<20 || buffer.length>maxBytes || buffer[0]!==255 || buffer[1]!==216 || buffer.at(-2)!==255 || buffer.at(-1)!==217) return false;
  let offset=2; let matched=false;
  while (offset<buffer.length-2) {
    if (buffer[offset++]!==255) return false;
    while (buffer[offset]===255) offset++;
    const marker=buffer[offset++];
    if (offset+2>buffer.length-2) return false;
    const length=buffer[offset]*256+buffer[offset+1];
    if (length<2 || offset+length>buffer.length-2) return false;
    if ([192,193,194].includes(marker)) {
      if (length<8) return false;
      const h=buffer[offset+3]*256+buffer[offset+4], w=buffer[offset+5]*256+buffer[offset+6];
      if (w!==width || h!==height) return false;
      matched=true;
    }
    if (marker===218) return matched && offset+length<buffer.length-2;
    offset+=length;
  }
  return false;
}

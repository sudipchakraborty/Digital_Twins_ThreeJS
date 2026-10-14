import { readFile } from 'node:fs/promises';
import { loadConfig, parseConfigText } from './config.js';
import { startRuntime } from './runtime.js';

const config=loadConfig(process.argv[2]?parseConfigText(await readFile(process.argv[2],'utf8')):{});
let runtime;
try {
  runtime=await startRuntime(config);
  console.log(`Canvas bridge: http://${config.bridgeHost}:${config.bridgePort}/rtsp/health`);
  console.log(`RTSP URL: rtsp://${config.advertisedHost}:${config.rtspPort}/${config.stream}`);
  const shutdown=async()=>{await runtime.close();};
  process.once('SIGINT',shutdown);process.once('SIGTERM',shutdown);
} catch(error) {console.error(error.message);await runtime?.close();process.exitCode=1;}

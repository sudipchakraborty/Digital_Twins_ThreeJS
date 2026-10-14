# Canvas RTSP

Publish the image from any simulated camera canvas as H.264 RTSP for VLC or an AI reader. Node 22+, FFmpeg with libx264, FFprobe, and MediaMTX 1.21.1 are required. The browser must keep rendering; closing its page disconnects the camera. Background-tab throttling can slow updates.

## Windows startup

Run `./setup.ps1` once in this directory. It installs the package-local Node dependency, reuses installed FFmpeg where available, and installs missing tools under ignored `tools/`, retaining licenses. Copy `config.example.json` to ignored `config.local.json` to customize executable paths, advertised IP, stream name or dimensions.

Run `./start.ps1 -AdvertisedHost <your-LAN-IP>` to start hidden service processes. `./stop.ps1` stops only recorded owned processes. Logs and generated settings are under ignored `.runtime/`. Port 8554 carries RTSP/TCP; publisher bridge port 8890 stays on loopback. Permit inbound TCP 8554 on the relevant local network if Windows firewall blocks the remote reader.

## Canvas integration

```js
import { CanvasRtspPublisher } from './lib/rtsp/CanvasRtspPublisher.js';
const publisher = new CanvasRtspPublisher({
  canvas: cameraInsetCanvas,
  url: `ws://${location.host}/rtsp/publish`,
  stream: 'ptz',
  onStatus: console.log,
});
// Call after the first complete camera frame has been drawn.
publisher.start();
// At application teardown:
publisher.dispose();
```

Forward `/rtsp` to `http://127.0.0.1:8890` using the host application's Vite proxy with `ws: true`. Set `wss:` on HTTPS pages. The package does not import React or Three.js. Configure the bridge's width/height to match the canvas. One publisher owns the configured stream; several RTSP readers share the encoder. For a second named camera, run another configured runtime with distinct bridge and RTSP ports.

Frames are JPEG images in browser transport, H.264/yuv420p over RTSP, default 800x450 at 8 FPS. Keepalive frame sampling repeats the displayed canvas during animation Stop. Frames expire after 10 seconds without valid input. Only the latest frame is retained when encoding/sending is congested. The `publishing` status requires FFmpeg output progress, not merely a connected socket.

## VLC / AI

In VLC use **Media > Open Network Stream** and enter `rtsp://<reachable-host>:8554/ptz`. Enable RTP over RTSP (TCP), or launch VLC with `--rtsp-tcp`. The host address must be the computer running this service. RTSP reader requests subscribe to the current image without controlling animation.

```python
import os
os.environ['OPENCV_FFMPEG_CAPTURE_OPTIONS'] = 'rtsp_transport;tcp'
import cv2
camera = cv2.VideoCapture('rtsp://<reachable-host>:8554/ptz', cv2.CAP_FFMPEG)
try:
    while camera.isOpened():
        ok, frame = camera.read()
        if not ok:
            break
        # Run your AI analysis on frame (BGR image).
finally:
    camera.release()
```

The served image includes inset overlays and any captured-face hold. This module supplies video; inference is performed by the reader application. Control/publish traffic is local; RTSP anonymous readers are intended for a reachable LAN/private network. MediaMTX permits publishing only from loopback.

## Verify and troubleshoot

Inspect `http://127.0.0.1:8890/rtsp/health` for actual encoder state and accepted frame counts. If there is no source, open the configured simulation page. Duplicate pages are rejected to avoid switching cameras. If tools fail, inspect `.runtime/service-error.log`; executable paths may contain spaces. Occupied ports fail startup without terminating their owners.

Copy this entire directory's tracked files into another project's `lib/rtsp`, run setup there, and integrate a canvas. Do not copy `.runtime`, `tools`, or `node_modules` as source. Runtime paths are resolved from the module's directory.

References: [MediaMTX configuration](https://mediamtx.org/docs/references/configuration-file), [FFmpeg RTSP](https://ffmpeg.org/ffmpeg-protocols.html#rtsp), [Windows FFmpeg download providers](https://ffmpeg.org/download.html).

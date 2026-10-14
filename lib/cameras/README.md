# Reusable robotics RGB camera

Portable Three.js camera package. Copy this complete folder into any Three.js project with `three` installed. No React, pond code, network service or model download is required.

## Quick start — PTZ

```js
import { RoboticsCamera } from './lib/cameras/index.js';
import * as THREE from 'three';

const sensor = new RoboticsCamera({
  position: [0, 3, 0],       // your project's world units
  baseFov: 48, aspect: 16 / 9, near: 0.1, far: 500,
  panLimits: [0, 180], tiltLimits: [-80, 80],
  panDegrees: 0, tiltDegrees: -12, zoom: 1,
  patrolSpeed: 18, modelScale: 1,
});
scene.add(sensor.group);
overviewCamera.layers.enable(1);  // see housing; sensor remains on layer 0
sensor.startPatrol();

// In your animation loop, supply elapsed seconds, independent of frame rate.
sensor.update(deltaSeconds);
sensor.renderFeed(renderer, scene, renderTarget);

// Use the render target as a monitor texture, or read its pixels for a feed.
// Snapshot capture returns a correctly oriented browser canvas.
const snapshot = sensor.capture(renderer, scene, { width: 1280, height: 720 });
const png = snapshot.toDataURL('image/png');
```

## Fixed camera

```js
const fixed = new RoboticsCamera({ mode: 'fixed', baseFov: 60, position: [2, 1.5, 0] });
scene.add(fixed.group);
fixed.lookAtWorld(new THREE.Vector3(0, 1, -5));
// Manual aiming works; startPatrol() has no effect in fixed mode.
```

## Robot-mounted camera

```js
const wristSensor = new RoboticsCamera({
  mode: 'fixed', position: [0, 0.06, -0.04], modelScale: 0.1,
  near: 0.005, far: 20, baseFov: 55, panLimits: [-180, 180],
});
robotEndEffector.add(wristSensor.group);
// Inherits robot translation and rotation. Call after the robot moves.
wristSensor.lookAtWorld(workpieceWorldPosition);
```

Use rigid or uniformly scaled mounts. For robots using a different up-axis, rotate `sensor.group` to your convention. Nonuniformly scaled camera ancestors are not supported. `modelScale` changes the housing only, not sensor optics or transforms.

## Conventions and API

- Y up, forward -Z. Pan is degrees: 0 points -Z, +90 points +X, +180 points +Z. Positive tilt points upward. The visual lens follows the sensor.
- `setPose({panDegrees, tiltDegrees, zoom})`: unspecified fields retain their current values; finite angles clamp to limits. Positive zoom changes field of view using the perspective focal-length relationship.
- `startPatrol()`, `stopPatrol()`, `update(deltaSeconds)`: reversible sweep. Stopping does not reset the pose. Starting resumes the current pose/direction. Large time steps cross endpoints without overshoot. Fixed mode never patrols.
- `lookAtWorld(Vector3)`: world-space aiming through the mount transform. Limits still apply; a target outside the pan/tilt sector will not be perfectly centered.
- `getStatus()`: `{mode, panDegrees, tiltDegrees, zoom, patrolling}`.
- `isObjectVisible(Object3D)`: intersection of object world bounds and sensor frustum. Does not test occlusion, hidden flags, restricted zones or AI detection. Check object visibility and zone membership in the caller.
- `renderFeed(renderer, scene, WebGLRenderTarget)`: render using the existing renderer; restores active render target (including cube face and mipmap level), viewport, scissor, autoClear and XR state even on an exception. Match target aspect to sensor aspect for undistorted output. Caller owns the target and its disposal.
- `capture(renderer, scene, {width=960, height=540})`: browser-only canvas snapshot; temporarily matches sensor aspect to image dimensions, reads/vertically flips pixels, restores aspect/state and disposes temporary GPU target. Dimensions 1–4096 pixels. Use `renderFeed` with a persistent target for frequent live rendering.
- `dispose()`: idempotent disposal of owned housing resources; detaches the group. Stop using a disposed camera.
- `CameraModel`: import separately for housing-only visualisations; `.group`, `.pan`, `.tilt`, `setPose(panRadians, tiltRadians)`, `dispose()`.

Constructor rejects nonfinite optics, invalid near/far, nonpositive speed/aspect/scale and unordered limits. Default mode PTZ, initial pose 0°/0°, zoom 1, 48° vertical field of view, 16:9 aspect, 0.1–500 clipping, pan 0–180°, tilt -80–80°, 12°/s patrol. Tilt limits must remain inside ±89.9°.

Housing uses layer 1; default sensor renders layer 0. Add other cameras' housings to their feed by changing layer settings deliberately. This implementation is a simulated perspective/RGB sensor, not CoppeliaSim integration. Depth/segmentation images, lens calibration, real RTSP/ONVIF and learned object detection require separate adapters.

## Future task shortcut

Ask: “Use `lib/cameras/RoboticsCamera.js`; follow its README API. Mount it to [object], use [fixed/PTZ] mode and display/capture its RGB feed.” This provides the package interface without reopening the previous demo.

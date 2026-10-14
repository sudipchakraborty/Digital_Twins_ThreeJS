# Air Spring Tester Digital Twin

## 2026-09-23 - Planned design documentation

Before implementation, document the approved architecture for a reusable,
parameter-driven air spring tester module.

Planned system:

- Procedural double-convoluted air spring model with configurable dimensions.
- Initial air spring dimensions: 300 mm outer diameter, 120 mm inner/top-plate
  diameter, and 260 mm total height.
- DC-motor-driven turntable with an initial speed of 2 RPM.
- Two opposing cameras moving vertically on reusable lead-screw axes.
- Time-based motion independent of rendering frame rate.
- Simulated capture and inspection callbacks for later AI integration.
- Main entry point supplies configuration without changing module internals.
- Resource disposal and configuration validation for reuse in other projects.

Next documentation change:

- Add the reviewed design specification under `docs/superpowers/specs/`.

## 2026-09-23 - Implementation planning

The air spring tester design was approved. Before product-code changes, create
a task-by-task implementation plan covering:

- Configuration validation and millimetre-to-world-unit conversion.
- Reusable procedural air spring, turntable, lead-screw, and camera modules.
- Time-based turntable and camera motion with capture callbacks.
- React entry-point integration and responsive full-screen presentation.
- Unit, lint, build, and rendered-browser verification.

No implementation file will be modified until this plan is complete and
reviewed.

## 2026-09-23 - Implementation started

The implementation plan was approved for native execution.

- Prepare an isolated Git worktree for the feature so the pre-existing
  `package-lock.json` change on `main` remains untouched.
- Execute the five planned tasks using test-first development.
- Run the local application and verify the rendered simulation before handoff.

## 2026-09-23 - Frontend demo access correction

Before correcting the demo handoff, verified that two existing Vite processes
serve different checkouts on port 5173:

- `localhost:5173` resolves to the IPv6 listener serving the original main
  checkout and its `Frame2020` demo.
- `127.0.0.1:5173` reaches the IPv4 listener serving the implemented
  `AirSpringTester` from `.worktrees/air-spring-tester`.

Planned correction: update the feature worktree's demo URL record and open
`http://127.0.0.1:5173/` in the default browser. HTTP checks confirm this address
serves the air spring frontend. No application-code or dependency changes are
needed for this access correction.

Outcome: automatic browser launch was rejected by the execution policy. Provide
the verified IPv4 URL for the user to open directly. No rendered verification
was performed; the page and its entry, app, and tester modules all return 200.

## 2026-10-06 � reusable fish surveillance library added

- Added `lib/cameras/CameraModel.js`, `RoboticsCamera.js`, `index.js` and `README.md` from the fish demo, with matching SHA-256 hashes.
- Reusable RGB camera supports fixed/PTZ modes, robot-parent mounting, pan/tilt, zoom, reversible patrol, world-space aiming, geometric visibility, render targets and PNG snapshot capture. Renderer state including cube face/mipmap is restored; camera housing uses layer 1.
- Added `lib/fish/PondModel.js`, `PersonModel.js`, `modelUtils.js`, `index.js` and `README.md`, also matching the fish-demo source hashes. Includes procedural pond, vegetation, boat, landing and animated person with net.
- Direct import: `import { RoboticsCamera } from './lib/cameras/index.js'`. See package README for fixed/PTZ and wrist-mounted camera examples. RGB simulation only; no RTSP/ONVIF or trained AI.
- The fish application is in `D:/ESTPL/Visual-AI-on-Fish-Cultivation`; its complete modification and verification history is in its `progress.md`.
- Existing application entry points, library index, worktrees and pre-existing package-lock/progress content were preserved.

## 2026-10-06 � reusable face-target model revision

- Updated `lib/fish/PersonModel.js` and its README to match the fish demo: detailed articulated face group, scaled `getFaceTarget()` and world-space `faceAtWorld()` aiming.
- All nine reusable package files still SHA-256 match the fish project. Existing robotics camera module and application entry points were unchanged.
- Fish demo now starts at night with narrow PTZ/searchlight patrol, a visible face-zoom transition, delayed face capture and a saved-face inset. Complete changes and verification are in the fish project's `progress.md`.

## 2026-10-07 - reusable simulated-camera RTSP module

- Copied the standalone canvas publisher, local Node bridge, FFmpeg encoder, MediaMTX runtime and Windows helpers into lib/rtsp from the Fish Cultivation project.
- All 15 copied source files matched SHA-256; publisher/config smoke imports passed. Existing app entry point and unrelated edits preserved.
- Module exports simulated camera pixels over H.264 RTSP/TCP for VLC and downstream AI; see lib/rtsp/README.md for setup and integration.

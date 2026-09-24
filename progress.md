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

### React demonstration work started

- Replace the earlier robot-frame demo with one configured `AirSpringTester`.
- Add a neutral industrial scene, shadows, responsive camera framing, and floor.
- Add compact run/pause, reset-view, RPM, camera-height, and capture status UI.
- Keep all machine geometry and motion inside reusable `lib/airspring/` modules.
- Dispose the tester, controls, floor resources, renderer, and listeners on exit.

### Baseline lint correction

- Remove the unused `delta` parameter from `Joint2.update()`. The method is not
  called with or without that parameter anywhere in the project, and its motion
  is driven directly by `Date.now()`, so this is behavior-preserving.

## 2026-09-23 - Air spring tester implementation completed

Implemented reusable modules:

- `config.js`: millimetre-based defaults, validation, and world-unit conversion.
- `motion.js`: RPM conversion and frame-rate-independent reflected travel.
- `AirSpring.js`: configurable double-convoluted rubber bellows, ribs, plates,
  and air fitting generated from Three.js geometry.
- `Turntable.js`: base, platter, bearing, coupling, DC motor, and RPM controls.
- `LeadScrewAxis.js`: guide rails, threaded screw, bearing blocks, and carriage.
- `InspectionCamera.js`: industrial camera body, lens, status light, and view ray.
- `CameraInspectionRig.js`: two opposing synchronized camera axes.
- `InspectionController.js`: deterministic angle-based capture events.
- `TesterFrame.js`: aluminium support frame, mounts, feet, and motor guard.
- `AirSpringTester.js`: reusable facade with start, stop, speed, update, status,
  callback, and disposal APIs.

Demonstration behavior:

- Air spring dimensions: 300 mm outer diameter, 120 mm plate/inner diameter,
  and 260 mm height.
- Turntable rotates at 2 RPM.
- Both cameras begin at the 450 mm upper limit and travel downward at 20 mm/s.
- Capture events occur every 30 degrees for both cameras.
- Full-screen responsive scene includes shadows, orbit controls, telemetry,
  capture status, pause/start, and reset-view controls.

Verification results:

- `npm test`: 18/18 tests passed, including zero camera speed and turntable
  direction-reversal capture regressions.
- `npm run lint`: passed after removing the pre-existing unused parameter.
- `npm run build`: passed; Vite reports only its bundle-size advisory.
- `git diff --check`: passed.
- Development server: `http://127.0.0.1:5173/` (explicit IPv4 address; see access
  correction below).
- Rendered screenshot and canvas-pixel inspection could not be performed because
  no controllable browser was connected to this session. This remains for live
  visual review; automated geometry, motion, build, and lint checks passed.

Real-system boundary:

- Camera streaming, AI anomaly classification, PLC/motor-driver communication,
  encoder feedback, and mechanical force/torque behavior remain integration work.

### Final review corrections

- Accept an initial camera speed of `0` as a valid stopped state, matching the
  public speed contract.
- Keep capture cadence based on absolute rotational travel so changing the
  turntable direction continues to emit captures at each angular interval.

## 2026-09-23 - Frontend demo access correction

The original main checkout's Vite server listens on IPv6 loopback port 5173,
while this feature checkout's server listens on IPv4 port 5173. As a result,
`http://localhost:5173/` opens the original framework on this machine.

Use `http://127.0.0.1:5173/` to open the air spring tester. Verified HTTP 200
and the served `src/App.jsx` imports `AirSpringTester`; the localhost response
instead constructs `Frame2020`. Planned runtime action: open the corrected URL
in the default browser. Application source and dependencies are unchanged.

Outcome: automatic browser launch was rejected by the execution policy. The
page, React entry, app, and tester module each return HTTP 200 at the IPv4 URL.
Direct visual verification remains pending; share the URL for manual opening.

## 2026-09-24 - Publish air spring tester to GitHub

Requested action: commit the pending demo-access documentation and push
`feature/air-spring-tester` to `origin` at
`https://github.com/sudipchakraborty/Digital_Twins_ThreeJS.git`.

Before publication, fetch the remote, check branch history, run the unit tests,
lint, production build, and whitespace checks, then verify that the remote branch
points to the published local commit. The feature branch contains the original
design/planning commits and the complete reusable tester implementation.

The primary checkout's existing local `package-lock.json` and `progress.md`
changes are outside this feature publication. Its demo-access correction is
already recorded above in this branch.

Pre-push verification on 2026-09-24: all 18 tests passed; lint passed; the
production build passed with the existing bundle-size advisory; whitespace
checks passed. The fetched remote has no commits missing from the feature's
history. Rendered browser verification remains pending as previously recorded.

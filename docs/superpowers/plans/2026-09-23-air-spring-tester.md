# Air Spring Tester Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and display a reusable, parameter-driven Three.js air spring tester with a slow motorized turntable, a procedural double-convoluted air spring, and two vertically moving inspection cameras.

**Architecture:** Pure motion and configuration functions remain independent of rendering and are tested with Node's built-in test runner. Focused Three.js components each own one `THREE.Group`; `AirSpringTester` composes them and exposes the public lifecycle API. React owns the scene, renderer, animation loop, camera controls, and responsive inspection-status overlay.

**Tech Stack:** JavaScript ES modules, Three.js 0.183, React 19, Vite 8, Node test runner, ESLint

**Spec:** `docs/superpowers/specs/2026-09-23-air-spring-tester-design.md`

## Global Constraints

- Public dimensions, distances, and linear speeds use millimetres.
- Rotational speed uses revolutions per minute and elapsed time uses seconds.
- The default scale is exactly `1000 mm = 1 Three.js world unit`.
- Initial air spring dimensions are 300 mm outer diameter, 120 mm inner/top-plate diameter, and 260 mm total height.
- Initial turntable diameter is 500 mm and speed is 2 RPM.
- Exactly two opposing cameras travel 450 mm at 20 mm/s and aim at the air spring.
- The module must not own the global scene, renderer, application camera, controls, or animation loop.
- No new runtime or test dependency is required.
- Existing unrelated `package-lock.json` changes must remain untouched.

## Review Focus

- `NaN`, infinity, strings, and missing numeric values must not create invalid geometry; defaults and warnings are expected.
- Inner diameter greater than or equal to outer diameter must fall back without producing a self-intersecting model.
- A turntable smaller than the air spring must fall back to a supporting diameter.
- Large frame deltas must clamp camera travel at its limit and reverse cleanly without escaping the valid range.
- Calling `dispose()` repeatedly must not throw or dispose application-owned resources.

---

### Task 1: Configuration and Motion Core

**Files:**
- Create: `lib/airspring/config.js`
- Create: `lib/airspring/motion.js`
- Create: `test/airspring/config.test.js`
- Create: `test/airspring/motion.test.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: User configuration object and elapsed seconds.
- Produces: `createAirSpringTesterConfig(input, warn)`, `mmToWorld(mm, config)`, `rpmToRadiansPerSecond(rpm)`, and `advancePingPong(state, speed, minimum, maximum, deltaSeconds)`.

- [ ] **Step 1: Add the Node test script and write failing configuration tests**

```json
"test": "node --test"
```

```js
import test from 'node:test'
import assert from 'node:assert/strict'
import { createAirSpringTesterConfig, mmToWorld } from '../../lib/airspring/config.js'

test('normalizes defaults and converts millimetres', () => {
  const config = createAirSpringTesterConfig()
  assert.equal(config.airSpring.outerDiameterMm, 300)
  assert.equal(config.airSpring.innerDiameterMm, 120)
  assert.equal(config.airSpring.heightMm, 260)
  assert.equal(mmToWorld(500, config), 0.5)
})

test('falls back for non-finite and conflicting dimensions', () => {
  const warnings = []
  const config = createAirSpringTesterConfig({
    airSpring: { outerDiameterMm: NaN, innerDiameterMm: 400 },
    turntable: { diameterMm: 100 },
  }, (message) => warnings.push(message))
  assert.equal(config.airSpring.outerDiameterMm, 300)
  assert.equal(config.airSpring.innerDiameterMm, 120)
  assert.ok(config.turntable.diameterMm >= config.airSpring.outerDiameterMm)
  assert.ok(warnings.length >= 2)
})
```

- [ ] **Step 2: Run configuration tests and verify module-not-found failure**

Run: `npm test -- test/airspring/config.test.js`

Expected: FAIL because `lib/airspring/config.js` does not exist.

- [ ] **Step 3: Implement immutable normalized defaults and unit conversion**

```js
export const DEFAULT_AIR_SPRING_TESTER_CONFIG = Object.freeze({
  units: { millimetresPerWorldUnit: 1000 },
  airSpring: { outerDiameterMm: 300, innerDiameterMm: 120, heightMm: 260 },
  turntable: { diameterMm: 500, speedRpm: 2 },
  cameras: { count: 2, travelMm: 450, verticalSpeedMmPerSecond: 20 },
})

export function createAirSpringTesterConfig(input = {}, warn = console.warn) {
  // Copy nested defaults, accept finite values, enforce relational constraints,
  // warn for every supplied invalid value, and return the normalized copy.
}

export function mmToWorld(mm, config) {
  return mm / config.units.millimetresPerWorldUnit
}
```

- [ ] **Step 4: Write failing deterministic motion tests**

```js
test('converts RPM and advances ping-pong travel without escaping limits', () => {
  assert.equal(rpmToRadiansPerSecond(2), Math.PI / 15)
  const result = advancePingPong(
    { position: 9, direction: 1 }, 4, 0, 10, 1,
  )
  assert.ok(result.position >= 0 && result.position <= 10)
  assert.equal(result.direction, -1)
})
```

- [ ] **Step 5: Implement RPM conversion and reflected ping-pong motion**

```js
export const rpmToRadiansPerSecond = (rpm) => rpm * Math.PI * 2 / 60

export function advancePingPong(state, speed, minimum, maximum, deltaSeconds) {
  // Reflect overshoot until the result lies within the inclusive limits so
  // unusually large frame deltas remain deterministic.
}
```

- [ ] **Step 6: Run the complete core test suite**

Run: `npm test`

Expected: PASS for defaults, invalid values, unit conversion, RPM conversion, zero speed, both travel limits, and large-delta reflection.

- [ ] **Step 7: Commit the core**

```powershell
git add package.json lib/airspring/config.js lib/airspring/motion.js test/airspring/config.test.js test/airspring/motion.test.js progress.md docs/superpowers/plans/2026-09-23-air-spring-tester.md
git commit -m "feat: add air spring tester motion core"
```

### Task 2: Procedural Air Spring and Turntable

**Files:**
- Create: `lib/airspring/dispose.js`
- Create: `lib/airspring/AirSpring.js`
- Create: `lib/airspring/Turntable.js`
- Create: `test/airspring/components.test.js`

**Interfaces:**
- Consumes: Normalized configuration from Task 1 and Three.js.
- Produces: `AirSpring.group`, `Turntable.group`, `Turntable.mount`, `start()`, `stop()`, `setSpeed(rpm)`, `update(deltaSeconds)`, `angleRadians`, and idempotent `dispose()` methods.

- [ ] **Step 1: Write failing component-contract tests**

```js
test('builds a dimensioned two-bellows air spring', () => {
  const config = createAirSpringTesterConfig()
  const spring = new AirSpring(config.airSpring, config)
  assert.equal(spring.group.userData.component, 'air-spring')
  assert.equal(spring.group.userData.bellowsCount, 2)
  assert.ok(spring.group.children.length >= 6)
  assert.doesNotThrow(() => { spring.dispose(); spring.dispose() })
})

test('rotates the mounted assembly at two RPM', () => {
  const config = createAirSpringTesterConfig()
  const table = new Turntable(config.turntable, config)
  table.start()
  table.update(7.5)
  assert.ok(Math.abs(table.angleRadians - Math.PI / 2) < 1e-9)
  assert.doesNotThrow(() => { table.dispose(); table.dispose() })
})
```

- [ ] **Step 2: Run tests and verify missing-component failure**

Run: `npm test -- test/airspring/components.test.js`

Expected: FAIL because `AirSpring.js` and `Turntable.js` do not exist.

- [ ] **Step 3: Implement the procedural double-convoluted air spring**

Use a `THREE.LatheGeometry` profile for the two rounded rubber lobes and centre waist. Add separate upper/lower metal plates, a top fitting, circumferential rib rings, and slim vertical ribs. Store dimensional metadata in `group.userData`; keep all mesh creation inside `AirSpring`.

- [ ] **Step 4: Implement the motorized turntable**

Build a fixed base, rotating platter, shaft/coupling, and visible side-mounted DC motor. Attach the public `mount` group to the platter, integrate rotation from `rpmToRadiansPerSecond`, and wrap displayed angles into `[0, 2 * Math.PI)`.

- [ ] **Step 5: Implement shared idempotent Three.js disposal**

```js
export function disposeObject3D(root) {
  root.traverse((object) => {
    object.geometry?.dispose()
    const materials = Array.isArray(object.material) ? object.material : [object.material]
    materials.filter(Boolean).forEach((material) => material.dispose())
  })
}
```

Guard each component's `dispose()` with a private disposed flag.

- [ ] **Step 6: Run component and core tests**

Run: `npm test`

Expected: PASS, including exact 90-degree displacement after 7.5 seconds at 2 RPM and repeated disposal.

- [ ] **Step 7: Commit visual core components**

```powershell
git add lib/airspring/dispose.js lib/airspring/AirSpring.js lib/airspring/Turntable.js test/airspring/components.test.js
git commit -m "feat: add procedural air spring and turntable"
```

### Task 3: Dual Lead-Screw Camera Inspection Rig

**Files:**
- Create: `lib/airspring/LeadScrewAxis.js`
- Create: `lib/airspring/InspectionCamera.js`
- Create: `lib/airspring/CameraInspectionRig.js`
- Create: `test/airspring/camera-rig.test.js`

**Interfaces:**
- Consumes: Normalized camera configuration, `advancePingPong`, and a world-space inspection target.
- Produces: `CameraInspectionRig.group`, `start()`, `stop()`, `setSpeed(mmPerSecond)`, `update(deltaSeconds, target)`, `heightMm`, `direction`, `progress`, `getCameraStates()`, and `dispose()`.

- [ ] **Step 1: Write failing rig movement and orientation tests**

```js
test('moves exactly two opposing cameras and reverses at travel limits', () => {
  const config = createAirSpringTesterConfig()
  const rig = new CameraInspectionRig(config.cameras, config)
  rig.start()
  rig.update(30, new THREE.Vector3(0, 0.3, 0))
  assert.equal(rig.getCameraStates().length, 2)
  assert.ok(rig.heightMm >= 0 && rig.heightMm <= 450)
  assert.equal(rig.direction, -1)
  assert.ok(rig.getCameraStates().every(({ cameraId }) => cameraId))
})
```

- [ ] **Step 2: Run the rig test and verify missing-module failure**

Run: `npm test -- test/airspring/camera-rig.test.js`

Expected: FAIL because `CameraInspectionRig.js` does not exist.

- [ ] **Step 3: Build the reusable lead-screw axis**

Create two rails, bearing blocks, a screw cylinder with visible helical cue, and a carriage group. Expose `setTravelPosition(worldUnits)` and rotate the screw proportionally to carriage displacement.

- [ ] **Step 4: Build the inspection camera**

Create an industrial camera housing, lens rings, status light, and a thin view-direction line. Keep the camera aimed at the supplied target with `group.lookAt(target)` while correcting model-forward orientation internally.

- [ ] **Step 5: Compose and animate the two-camera rig**

Place axes on opposite X sides of the turntable, orient both cameras inward, and update one shared height state using `advancePingPong`. Convert millimetres to world units only at the geometry/matrix boundary.

- [ ] **Step 6: Run all tests**

Run: `npm test`

Expected: PASS for camera count, opposing placement, limit reversal, large deltas, zero speed, and repeated disposal.

- [ ] **Step 7: Commit the inspection rig**

```powershell
git add lib/airspring/LeadScrewAxis.js lib/airspring/InspectionCamera.js lib/airspring/CameraInspectionRig.js test/airspring/camera-rig.test.js
git commit -m "feat: add dual camera lead screw rig"
```

### Task 4: Tester Facade and Capture Events

**Files:**
- Create: `lib/airspring/InspectionController.js`
- Create: `lib/airspring/TesterFrame.js`
- Create: `lib/airspring/AirSpringTester.js`
- Create: `test/airspring/tester.test.js`
- Modify: `lib/index.js`

**Interfaces:**
- Consumes: All prior components and optional `onCapture`/`onInspection` callbacks.
- Produces: Public `AirSpringTester` API from the design specification and exports it from `lib/index.js`.

- [ ] **Step 1: Write failing facade and capture-cadence tests**

```js
test('assembles the machine and emits deterministic capture metadata', () => {
  const captures = []
  const tester = new AirSpringTester({
    inspection: { captureAngleStepDegrees: 30 },
    onCapture: (capture) => captures.push(capture),
  })
  tester.start()
  tester.update(5)
  assert.equal(tester.group.userData.component, 'air-spring-tester')
  assert.ok(captures.length >= 2)
  assert.deepEqual(new Set(captures.map((item) => item.cameraId)).size, 2)
  assert.ok(captures.every((item) => Number.isFinite(item.heightMm)))
  assert.doesNotThrow(() => { tester.dispose(); tester.dispose() })
})
```

- [ ] **Step 2: Run the facade test and verify missing-module failure**

Run: `npm test -- test/airspring/tester.test.js`

Expected: FAIL because `AirSpringTester.js` does not exist.

- [ ] **Step 3: Build the machine support frame**

Construct a compact aluminium-profile frame around the turntable with four posts, upper cross-members, axis mounting points, motor guards, and adjustable feet. Keep the spring and camera sight lines unobstructed.

- [ ] **Step 4: Implement deterministic inspection events**

Track accumulated unwrapped turntable angle. Whenever an angular threshold is crossed, emit one event per camera with `cameraId`, `heightMm`, wrapped `angleRadians`, monotonic `timestampSeconds`, and a sequence-based `sampleId`. Briefly pulse each camera status light on capture.

- [ ] **Step 5: Implement the facade and public controls**

Compose the frame, turntable, spring, rig, and controller. Implement `start`, `stop`, `setTurntableSpeed`, `setCameraSpeed`, `update`, and idempotent `dispose`; do not add the group to a scene internally.

- [ ] **Step 6: Export the reusable subsystem**

```js
export { AirSpringTester } from './airspring/AirSpringTester.js'
export { AirSpring } from './airspring/AirSpring.js'
export { Turntable } from './airspring/Turntable.js'
export { CameraInspectionRig } from './airspring/CameraInspectionRig.js'
export { createAirSpringTesterConfig } from './airspring/config.js'
```

- [ ] **Step 7: Run all module tests**

Run: `npm test`

Expected: PASS for assembly, public controls, event cadence/metadata, invalid callbacks, stopped state, and repeated disposal.

- [ ] **Step 8: Commit the reusable tester subsystem**

```powershell
git add lib/airspring lib/index.js test/airspring/tester.test.js
git commit -m "feat: compose reusable air spring tester"
```

### Task 5: React Demonstration and Rendered Verification

**Files:**
- Modify: `src/App.jsx`
- Replace: `src/App.css`
- Replace: `src/index.css`
- Modify: `progress.md`

**Interfaces:**
- Consumes: `AirSpringTester` and `CameraController` exports.
- Produces: A responsive full-screen machine simulation with live status, controls, and proper cleanup.

- [ ] **Step 1: Integrate the tester through configuration only**

In `App.jsx`, instantiate `AirSpringTester` with the approved dimensions and speeds, add `tester.group` to the scene, call `tester.start()`, and pass `clock.getDelta()` to `tester.update(deltaSeconds)`. Use capture callbacks only to update React inspection status.

- [ ] **Step 2: Frame and light the complete machine**

Use a physically credible neutral industrial palette, ACES tone mapping, sRGB output, a key/fill lighting arrangement, soft shadows, and an orbit target at machine centre. Position the application camera so the turntable, both lead screws, both cameras, and complete air spring are visible at startup.

- [ ] **Step 3: Add compact operational controls and status**

Provide icon-labelled start/pause and reset-view controls, RPM and camera-height readouts, and a small inspection-status strip. Controls must call the public tester API only. Add `aria-label` and `title` attributes to unfamiliar icon buttons.

- [ ] **Step 4: Replace template CSS with a responsive simulation layout**

Make `html`, `body`, `#root`, and the application shell fill the viewport without the template width constraint or borders. Use stable control dimensions, compact typography, safe mobile wrapping, and no decorative cards around the Three.js canvas.

- [ ] **Step 5: Implement complete cleanup**

Stop the animation loop; remove resize listeners; dispose tester, controls, renderer, and application-created floor resources; remove the renderer canvas; and guard React state updates after unmount.

- [ ] **Step 6: Run automated verification**

Run: `npm test`

Expected: all tests PASS.

Run: `npm run lint`

Expected: exit code 0 with no errors.

Run: `npm run build`

Expected: Vite production build succeeds.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 7: Start the development server and inspect rendered output**

Run: `npm run dev -- --host 0.0.0.0`

Open the reported local URL in the browser. At desktop `1440x900` and mobile `390x844`, verify a nonblank canvas, full machine framing, slow visible air-spring rotation, both cameras moving vertically, responsive controls, and no overlaps.

- [ ] **Step 8: Verify canvas motion numerically**

Capture two browser screenshots at least one second apart and compare canvas pixels or inspect the displayed angle/height values. Confirm that the scene changes while running and becomes stable when paused.

- [ ] **Step 9: Record completed implementation and verification**

Append the final module list, behavior, commands, outcomes, rendered viewport results, and remaining real-hardware/AI boundary to `progress.md`.

- [ ] **Step 10: Commit the demonstration**

```powershell
git add src/App.jsx src/App.css src/index.css progress.md
git commit -m "feat: demonstrate air spring inspection machine"
```


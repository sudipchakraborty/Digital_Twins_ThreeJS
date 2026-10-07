# Reusable Robotics Models Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build reusable procedural Three.js models for conveyors, six-axis robot arms, Dobot Magician, Universal Robots, robotic cars, and proximity sensors under `lib/robotics`.

**Architecture:** Shared validation, materials, transform, and disposal helpers support independent model modules. Generic motion APIs are defined first; Dobot and Universal Robots specialize the generic arm without duplicating joint-control behavior. Public exports are centralized in `lib/robotics/index.js` and re-exported from `lib/index.js`.

**Tech Stack:** JavaScript ES modules, Three.js, Vitest or the repository's available test runner, ESLint, Vite.

**Spec:** `docs/superpowers/specs/2026-10-07-reusable-robotics-models-design.md`

## Global Constraints

- Use the existing Three.js dependency and project conventions.
- Do not add React imports or renderer creation to model modules.
- Y is up and model forward is local -Z unless explicitly documented.
- Every model exposes `group`, `getStatus()`, and idempotent `dispose()`.
- Do not claim physical robot accuracy, collision physics, or hardware control.
- Verify with tests, `npm run lint`, `npm run build`, and `git diff --check`.

## Review Focus

- Invalid and non-finite dimensions/options must fail with clear `RangeError` messages; test in the core/model validation task.
- Joint-angle arrays with wrong length or out-of-limit values must not corrupt transforms; test in the generic arm task.
- Unreachable end-effector targets must return a non-success result without NaN rotations; test in the generic arm task.
- Zero, negative, and excessive conveyor/car speeds must be handled consistently; test in the conveyor and car tasks.
- Detection against empty, invisible, or out-of-range objects must return a stable no-detection reading; test in the proximity-sensor task.

### Task 1: Robotics Core Utilities

**Files:**
- Create: `lib/robotics/core/RoboticsModel.js`
- Create: `lib/robotics/core/materials.js`
- Create: `lib/robotics/core/transforms.js`
- Create: `lib/robotics/core/dispose.js`
- Create: `tests/robotics/core.test.js`

**Interfaces:**
- Produces shared validation helpers, standard material factories, transform helpers, and recursive disposal used by every model.

- [ ] Write failing tests for finite-positive validation, material creation, transform construction, and repeated disposal.
- [ ] Run the focused test and verify it fails because the utilities do not exist.
- [ ] Implement the utilities with no renderer or React dependency.
- [ ] Run the focused test and verify it passes.
- [ ] Commit: `feat: add reusable robotics core utilities`.

### Task 2: Conveyor Belt

**Files:**
- Create: `lib/robotics/conveyor/ConveyorBelt.js`
- Create: `tests/robotics/conveyor.test.js`

**Interfaces:**
- Consumes core utilities.
- Produces `ConveyorBelt({ length, width, height, speed, ... })` with `group`, `start()`, `stop()`, `setSpeed(value)`, `addProduct(object, position)`, `removeProduct(object)`, `update(delta)`, `getStatus()`, and `dispose()`.

- [ ] Write tests for default geometry, start/stop state, speed changes, product registration, and belt movement after `update(delta)`.
- [ ] Run the focused test and verify the expected failures.
- [ ] Implement belt, rollers, supports, product anchors, and bounded motion.
- [ ] Run the focused test and verify it passes.
- [ ] Commit: `feat: add reusable conveyor belt model`.

### Task 3: Generic Six-DOF Robot Arm

**Files:**
- Create: `lib/robotics/arms/SixDofRobotArm.js`
- Create: `tests/robotics/six-dof-robot-arm.test.js`

**Interfaces:**
- Consumes core utilities.
- Produces `SixDofRobotArm(options)` with `group`, `toolMount`, `setJointAngles(angles)`, `getJointAngles()`, `setEndEffectorTarget(target)`, `update(delta)`, `getStatus()`, and `dispose()`.

- [ ] Write tests for six-joint hierarchy, default/limited angles, invalid arrays, reachable target handling, unreachable target handling, and idempotent disposal.
- [ ] Run the focused test and verify it fails for missing implementation.
- [ ] Implement the serial joint hierarchy, explicit limits, deterministic pose updates, and safe target result `{ reachable, angles }`.
- [ ] Run the focused test and verify it passes without NaN transforms.
- [ ] Commit: `feat: add reusable six-dof robot arm`.

### Task 4: Dobot Magician and Universal Robot Specializations

**Files:**
- Create: `lib/robotics/arms/DobotMagician.js`
- Create: `lib/robotics/arms/UniversalRobot.js`
- Create: `tests/robotics/arm-specializations.test.js`

**Interfaces:**
- Consumes `SixDofRobotArm`.
- Produces `DobotMagician(options)` and `UniversalRobot(options)` with the generic arm API, model-specific defaults, named root groups, and usable `toolMount` groups.

- [ ] Write tests that instantiate both models, verify distinct geometry/default metadata, preserve six-axis control, and expose tool mounts.
- [ ] Run the focused test and verify it fails before specialization code exists.
- [ ] Implement model-specific geometry and defaults through composition/inheritance without duplicating IK/control logic.
- [ ] Run the focused test and verify it passes.
- [ ] Commit: `feat: add dobot and universal robot models`.

### Task 5: Proximity Sensor and Robotic Car

**Files:**
- Create: `lib/robotics/vehicles/ProximitySensor.js`
- Create: `lib/robotics/vehicles/RoboticCar.js`
- Create: `tests/robotics/vehicle-models.test.js`

**Interfaces:**
- Consumes core utilities and `ProximitySensor` from the same task.
- Produces `ProximitySensor(options)` with `setPose()`, `setRange()`, `detect(objects)`, `getReading()`, and `dispose()`; produces `RoboticCar(options)` with `setDrive(speed)`, `setSteering(angle)`, `addSensor(sensor)`, `update(delta)`, `getStatus()`, and `dispose()`.

- [ ] Write tests for forward-range detection, empty/out-of-range results, sensor readings, car steering, wheel rotation, drive motion, and sensor mounting.
- [ ] Run the focused test and verify it fails as expected.
- [ ] Implement bounded ray/cone detection and a four-wheel car with steering and drive state.
- [ ] Run the focused test and verify it passes.
- [ ] Commit: `feat: add robotic car and proximity sensor`.

### Task 6: Public Exports and Documentation

**Files:**
- Create: `lib/robotics/index.js`
- Create: `lib/robotics/README.md`
- Modify: `lib/index.js`
- Create: `tests/robotics/exports.test.js`

**Interfaces:**
- Produces stable named exports for all six public model classes from both `lib/robotics/index.js` and the project root library entry point.

- [ ] Write an import test for every public class and verify it fails before export wiring.
- [ ] Add exports, usage examples, coordinate conventions, lifecycle guidance, and model limitations to the README.
- [ ] Run the export test and verify it passes.
- [ ] Commit: `feat: expose reusable robotics model library`.

### Task 7: Full Verification

**Files:**
- Modify only if verification exposes a defect in the files above.

- [ ] Run the complete test command discovered from `package.json` or existing test configuration.
- [ ] Run `npm run lint` and resolve only defects introduced by this feature.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check`.
- [ ] Report separately what code/build tests prove versus what requires browser rendering or physical robot validation.
- [ ] Commit any final verification fixes with a focused message.

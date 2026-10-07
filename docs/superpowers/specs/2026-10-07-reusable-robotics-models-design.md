# Reusable Robotics Models for Digital Twins

## Purpose

Add a reusable Three.js robotics-model library under `lib/robotics` in
`Digital_Twins_ThreeJS`. The library will provide operational, procedural
models that can be imported into this and other Digital Twins projects without
depending on React, a renderer, or application-specific state.

## Scope

The first release includes:

- A conveyor belt with rollers, belt motion, product placement, speed, and
  start/stop control.
- A generic six-degree-of-freedom robot arm with hierarchical joints, joint
  limits, direct joint-angle control, and end-effector pose support.
- A Dobot Magician-style compact desktop robot with a tool mount and gripper
  attachment point.
- A Universal Robots-style six-axis arm with configurable tool mounting.
- A robotic car with wheels, steering, drive motion, and sensor mounting
  points.
- A reusable proximity sensor with configurable range and detection status.

Models are procedural and dimensionally approximate rather than imported CAD.
Dimensions, colors, and selected motion parameters are configurable so later
projects can adapt the models without changing their public APIs.

## Module layout

```text
lib/robotics/
  core/
    RoboticsModel.js
    materials.js
    transforms.js
    dispose.js
  conveyor/
    ConveyorBelt.js
  arms/
    SixDofRobotArm.js
    DobotMagician.js
    UniversalRobot.js
  vehicles/
    RoboticCar.js
    ProximitySensor.js
  index.js
  README.md
```

The public entry point `lib/robotics/index.js` will export all public model
classes. The root `lib/index.js` will re-export that entry point for consumers
that already use the project-wide library entry point.

## Public API contract

Every model exposes a `group` property containing its root `THREE.Group`, a
`getStatus()` method, and an idempotent `dispose()` method. Models accept an
options object and validate finite numeric inputs and positive dimensions.

`ConveyorBelt` exposes `start()`, `stop()`, `setSpeed(value)`,
`addProduct(object, position)`, `removeProduct(object)`, and `update(delta)`.

`SixDofRobotArm` exposes `setJointAngles(angles)`,
`setEndEffectorTarget(target)`, `getJointAngles()`, and `update(delta)`. Its
joint limits are explicit and its end-effector target operation reports an
unreachable target rather than silently producing invalid transforms.

`DobotMagician` and `UniversalRobot` specialize the generic arm geometry and
defaults while retaining the arm control API. Both provide a tool mount group
for grippers, cameras, or process tools.

`RoboticCar` exposes `setDrive(speed)`, `setSteering(angle)`, `update(delta)`,
and sensor mounting support. `ProximitySensor` exposes `setPose()`,
`setRange()`, `detect(objects)`, and `getReading()`; detection is based on a
forward ray or bounded cone and returns the nearest detected object and range.

## Design constraints

- Use the existing Three.js dependency and project conventions.
- Do not add React imports or renderer creation to model modules.
- Keep geometry and behavior separated where practical so a model can be
  replaced by CAD geometry later.
- Reuse existing disposal and geometry/material patterns where compatible.
- Keep coordinate conventions documented: Y is up and the model forward axis
  is local -Z unless a model explicitly documents otherwise.
- Do not claim physical robot accuracy, collision physics, or hardware control.

## Verification

Add focused automated tests for option validation, public control behavior,
motion updates, sensor readings, and idempotent disposal. Verify the complete
project with the repository test command if present, `npm run lint`,
`npm run build`, and `git diff --check`. Verification will establish code and
build correctness; rendered visual fidelity and physical robot behavior remain
separate runtime boundaries.

## Future extension boundary

Additional models such as AGV variants, pick-and-place cells, palletizers,
grippers, industrial cameras, and safety scanners should reuse the same core
contracts. They are outside this first implementation unless required to
complete the listed model integrations.

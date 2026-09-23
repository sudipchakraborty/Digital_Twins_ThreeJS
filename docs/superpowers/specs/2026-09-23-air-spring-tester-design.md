# Air Spring Tester Digital Twin Design

## Purpose

Build a reusable Three.js subsystem that visualizes the proposed physical air
spring inspection machine before fabrication. The simulation must show a
double-convoluted rubber air spring rotating slowly on a motorized turntable
while two opposing cameras travel vertically on lead-screw mechanisms.

The first version simulates inspection timing and emits capture events. It does
not implement image processing or anomaly classification, but its public event
interface must allow those systems to be connected later without changing the
3D components.

## Units and Coordinate System

- All public dimensions, distances, and linear speeds use millimetres.
- Rotational speed uses revolutions per minute.
- Time values use seconds.
- The module converts millimetres to Three.js world units internally using
  `1000 mm = 1 world unit` by default.
- The module uses Y as the vertical axis, matching the existing scene.
- The conversion scale is configurable for reuse in other scenes.

## Initial Configuration

```js
{
  units: {
    millimetresPerWorldUnit: 1000
  },
  airSpring: {
    outerDiameterMm: 300,
    innerDiameterMm: 120,
    heightMm: 260
  },
  turntable: {
    diameterMm: 500,
    speedRpm: 2
  },
  cameras: {
    count: 2,
    travelMm: 450,
    verticalSpeedMmPerSecond: 20
  }
}
```

Additional appearance, position, motion-limit, and capture settings may be
provided, but sensible defaults must make the module usable with only the
configuration above.

## Architecture

`AirSpringTester` is the facade used by an application. It assembles the
machine, owns the inspection sequence, and exposes lifecycle and control
methods. The application must not need to know the internal mesh hierarchy.

```text
AirSpringTester
  TesterFrame
  Turntable
    DCMotor
    AirSpring
  CameraInspectionRig
    LeadScrewAxis + InspectionCamera
    LeadScrewAxis + InspectionCamera
  InspectionController
```

Every visual component owns a root `THREE.Group`. Parent components place that
group in the machine assembly. Components must not add themselves directly to
the global scene except through the tester facade.

## Components

### AirSpring

The model is generated procedurally from dimensions. Its first representation
contains:

- Two rounded rubber bellows forming a double-convoluted profile.
- A narrower centre waist between the bellows.
- Upper and lower metal mounting plates.
- A central top fitting suggested by the supplied reference image.
- Subtle circumferential and vertical rubber ribs that make rotation visible.

The bellows can use lathed profiles or other native Three.js geometry that
preserves smooth silhouettes and configurable proportions. Geometry creation
must remain independent from turntable animation.

### Turntable

The turntable contains a base, rotating platter, shaft/coupling, and simplified
DC motor representation. The platter owns the air spring so both rotate as one
assembly. Rotation is time-based:

```text
radiansPerSecond = speedRpm * 2 * PI / 60
rotation += radiansPerSecond * deltaSeconds
```

The initial speed is 2 RPM. The API supports starting, stopping, changing
speed, and querying current angular position.

### LeadScrewAxis

Each reusable axis contains support rails, top and bottom bearing blocks, a
lead screw, and a moving carriage. Its public inputs include travel distance,
speed, direction, and starting position. It clamps motion to valid limits and
supports smooth reversal without exceeding them.

Lead-screw rotation is derived visually from carriage movement. Exact thread
physics are outside the first-version scope.

### InspectionCamera

Each camera has a housing, visible lens, and view-direction indicator. It is
attached to a lead-screw carriage and continuously aims toward the configured
air-spring inspection centre. The two cameras are positioned on opposite sides
of the turntable.

The visible camera object represents the physical device. It does not need to
render an additional live viewport in the first version.

### CameraInspectionRig

The rig owns both camera axes and synchronizes their vertical travel. Cameras
move from the upper inspection limit to the lower limit and then reverse. The
rig exposes current height, direction, and normalized travel progress.

### InspectionController

The controller coordinates motor rotation and camera travel. It emits events
without depending on a particular AI engine:

```js
onCapture({ cameraId, heightMm, angleRadians, timestampSeconds })
onInspection({ cameraId, sampleId, status, metadata })
```

Capture frequency is configurable by vertical distance and/or angular step.
The initial demo may visualize a capture with a short lens or inspection-point
highlight. Generated events are deterministic from elapsed simulation time.

## Public Interface

The reusable facade provides at least:

```js
const tester = new AirSpringTester(config)
scene.add(tester.group)

tester.start()
tester.stop()
tester.setTurntableSpeed(rpm)
tester.setCameraSpeed(mmPerSecond)
tester.update(deltaSeconds)
tester.dispose()
```

Callbacks are supplied in configuration or registered through explicit event
methods. The module does not own the application's animation loop, renderer,
camera controller, or global scene.

## Validation and Failure Behaviour

- Dimensions and speeds must be finite numbers.
- Outer diameter, height, turntable diameter, and camera travel must be
  positive.
- Inner diameter must be positive and smaller than outer diameter.
- Turntable diameter must be large enough to support the air spring.
- Camera count is fixed at two for this machine version.
- Missing values use documented defaults.
- Invalid supplied values fall back to defaults and produce clear warnings.
- A zero speed is valid and means stopped motion.
- A negative turntable speed reverses rotation; camera speed uses magnitude
  while direction remains internal state.

## Lifecycle and Resource Ownership

`dispose()` cancels module-owned transient state and disposes all generated
geometries and materials. It removes no application-owned renderer, scene,
camera, lights, or controls. Event callbacks are released during disposal.

## Application Integration

The existing application entry point creates its scene and passes the tester
configuration once. Machine-specific construction must be removed from the
entry point; it may only instantiate, position, update, control, and dispose
the tester.

The existing workspace floor and camera controller can remain application
services. The tester must also work in a different Three.js application that
provides an animation loop and scene.

## Verification

Automated checks will cover:

- Default configuration and millimetre conversion.
- Validation and fallback behavior.
- Turntable angular displacement at a known RPM and elapsed time.
- Camera travel, clamping, and reversal at both limits.
- Capture event metadata and cadence.
- Safe repeated disposal.

Project verification will include the repository lint and production build.
Rendered verification will inspect desktop and mobile viewports for a visible,
correctly framed machine, nonblank canvas, smooth motion, and no overlapping
application UI.

## Out of Scope for the First Version

- Real camera connectivity or image streaming.
- AI model loading and anomaly classification.
- Photorealistic CAD-level fasteners and manufacturing tolerances.
- Mechanical force, vibration, torque, or structural simulation.
- PLC, motor-driver, encoder, and lead-screw hardware communication.
- A secondary rendered camera viewport or captured-image gallery.


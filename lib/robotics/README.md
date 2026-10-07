# Reusable Robotics Models

Import models from `lib/robotics/index.js` or the project root `lib/index.js`.
Each model exposes a Three.js `group`, operational methods, `getStatus()`, and
idempotent `dispose()`. Models use Y-up coordinates and local -Z as forward.

```js
import { ConveyorBelt, DobotMagician, ProximitySensor } from './lib/robotics/index.js';
const belt = new ConveyorBelt({ length: 4, speed: 0.5 });
const arm = new DobotMagician();
const sensor = new ProximitySensor({ range: 2 });
scene.add(belt.group, arm.group, sensor.group);
belt.start();
// In the animation loop: belt.update(deltaSeconds); arm.update(deltaSeconds);
```

These are procedural operational approximations for digital-twin scenes, not
CAD-accurate geometry, collision physics, or hardware-control drivers.

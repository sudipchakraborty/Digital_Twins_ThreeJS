# Reusable pond and person/net models

Only dependency: `three`. Metres, Y up. No React or event/controller dependencies.

```js
import { PondModel, PersonModel } from './lib/fish/index.js';

const pond = new PondModel({ radiusX: 28, radiusZ: 18, seed: 42 });
scene.add(pond.group);
const person = new PersonModel({
  scale: 1.15, shirtColor: 0xe18c43,
  start: [21, 0.3, 19], destination: [13, 0.3, 17.8], walkSeconds: 4,
});
scene.add(person.group);

pond.update(simulationSeconds, nightMode);
person.update(secondsSinceEntry); // negative = hidden; walks then uses net
const aimTarget = person.getTarget(); // Vector3 in world coordinates
const faceTarget = person.getFaceTarget(); // scaled head centre in world coordinates
person.faceAtWorld(cameraWorldPosition); // turn this fictional subject's head

// On teardown, stop animation and release owned GPU resources.
person.dispose(); pond.dispose();
```

`PondModel` includes animated water, bank, deterministic trees/grass/stones, landing, boat and bamboo net rack. Radius parameters control water/bank/vegetation size; landing/net-rack placements are example site props at fixed metre offsets. Minimum radius is greater than 6 metres; move those props if using a substantially smaller pond. Its `group`, `water`, `boat`, `jetty` and `waterMaterial` are exposed for positioning/styling. Day/night only modifies its water shader; configure your scene lighting separately.

`PersonModel` exposes `group`, `body`, `face`, `legs`, `arms`, `net`; its net is line geometry. The face group contains eyes, eyebrows, nose, mouth, ears and hair for a visible close-up. `getFaceTarget()` respects model scaling and mounting. `faceAtWorld(Vector3)` aims the head towards the supplied world point; calling `update()` resets the head to its walking pose, so call face aiming afterwards. It is a stylised fictional adult, not a realistic facial reconstruction or face recognition. `scale`, walking duration and path coordinates are validated. Place on an unobstructed path or add collision/terrain handling in the caller.

Photographs, restricted zones, camera station, AI/event simulation, dashboard and scene lighting belong to the demo, not these portable model packages.

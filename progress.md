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

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

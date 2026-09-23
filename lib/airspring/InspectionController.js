import { rpmToRadiansPerSecond } from './motion.js';

const TAU = Math.PI * 2;

export class InspectionController {
  constructor({ captureAngleStepDegrees, onCapture, onInspection } = {}) {
    this.stepRadians = captureAngleStepDegrees * Math.PI / 180;
    this.onCapture = typeof onCapture === 'function' ? onCapture : null;
    this.onInspection = typeof onInspection === 'function' ? onInspection : null;
    this.totalAngleRadians = 0;
    this.elapsedSeconds = 0;
    this.sequence = 0;
    this.disposed = false;
  }

  update(deltaSeconds, speedRpm, cameraStates) {
    if (this.disposed || deltaSeconds <= 0 || speedRpm === 0) return 0;

    const previousMagnitude = Math.abs(this.totalAngleRadians);
    this.totalAngleRadians += rpmToRadiansPerSecond(speedRpm) * deltaSeconds;
    this.elapsedSeconds += deltaSeconds;
    const currentMagnitude = Math.abs(this.totalAngleRadians);
    const previousStep = Math.floor((previousMagnitude + Number.EPSILON) / this.stepRadians);
    const currentStep = Math.floor((currentMagnitude + Number.EPSILON) / this.stepRadians);
    const crossings = Math.max(0, currentStep - previousStep);

    for (let crossing = 1; crossing <= crossings; crossing += 1) {
      this.sequence += 1;
      const signedAngle = Math.sign(speedRpm || 1)
        * (previousStep + crossing) * this.stepRadians;
      const angleRadians = ((signedAngle % TAU) + TAU) % TAU;

      cameraStates.forEach((camera) => {
        this.onCapture?.({
          cameraId: camera.cameraId,
          heightMm: camera.heightMm,
          angleRadians,
          timestampSeconds: this.elapsedSeconds,
          sampleId: `SCAN-${String(this.sequence).padStart(6, '0')}-${camera.cameraId}`,
        });
      });
    }

    return crossings;
  }

  reportInspection(result) {
    this.onInspection?.(result);
  }

  dispose() {
    this.disposed = true;
    this.onCapture = null;
    this.onInspection = null;
  }
}

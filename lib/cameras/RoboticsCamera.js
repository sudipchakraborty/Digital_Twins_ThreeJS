import * as THREE from 'three';
import { CameraModel } from './CameraModel.js';

const finite = (value, name) => {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite`);
  return value;
};
const limits = (value, name) => {
  if (!Array.isArray(value) || value.length !== 2 || !value.every(Number.isFinite) || value[0] >= value[1]) {
    throw new RangeError(`${name} must contain increasing finite bounds`);
  }
  return [...value];
};
const rendererState = renderer => ({
  target: renderer.getRenderTarget(), cubeFace: renderer.getActiveCubeFace(), mipmapLevel: renderer.getActiveMipmapLevel(),
  viewport: renderer.getViewport(new THREE.Vector4()), scissor: renderer.getScissor(new THREE.Vector4()),
  scissorTest: renderer.getScissorTest(), autoClear: renderer.autoClear, xr: renderer.xr.enabled,
});
const restoreRenderer = (renderer, state) => {
  renderer.setRenderTarget(state.target, state.cubeFace, state.mipmapLevel);
  renderer.setViewport(state.viewport); renderer.setScissor(state.scissor); renderer.setScissorTest(state.scissorTest);
  renderer.autoClear = state.autoClear; renderer.xr.enabled = state.xr;
};

/** Portable RGB sensor. Local forward is -Z; positive pan turns toward +X. */
export class RoboticsCamera {
  constructor(config = {}) {
    this.mode = config.mode ?? 'ptz';
    if (!['ptz', 'fixed'].includes(this.mode)) throw new RangeError('mode must be fixed or ptz');
    this.panLimits = limits(config.panLimits ?? [0, 180], 'panLimits');
    this.tiltLimits = limits(config.tiltLimits ?? [-80, 80], 'tiltLimits');
    if (this.tiltLimits[0] < -89.9 || this.tiltLimits[1] > 89.9) throw new RangeError('tilt bounds must be within ±89.9 degrees');
    this.baseFov = finite(config.baseFov ?? 48, 'baseFov');
    const aspect = finite(config.aspect ?? 16 / 9, 'aspect');
    const near = finite(config.near ?? 0.1, 'near');
    const far = finite(config.far ?? 500, 'far');
    this.patrolSpeed = finite(config.patrolSpeed ?? 12, 'patrolSpeed');
    if (aspect <= 0 || near <= 0 || far <= near || this.baseFov <= 0 || this.baseFov >= 179 || this.patrolSpeed <= 0) throw new RangeError('invalid camera optics or patrol speed');
    const position = config.position ?? [0, 0, 0];
    if (!Array.isArray(position) || position.length !== 3 || !position.every(Number.isFinite)) throw new RangeError('position must be three finite coordinates');
    const modelScale = finite(config.modelScale ?? 1, 'modelScale');
    if (modelScale <= 0) throw new RangeError('modelScale must be positive');
    this.group = new THREE.Group(); this.group.name = 'RoboticsCamera';
    this.group.position.set(...position);
    this.yaw = new THREE.Group(); this.pitch = new THREE.Group();
    this.group.add(this.yaw); this.yaw.add(this.pitch);
    this.camera = new THREE.PerspectiveCamera(this.baseFov, aspect, near, far);
    this.pitch.add(this.camera);
    this.model = new CameraModel({ scale: modelScale, mode: this.mode });
    this.group.add(this.model.group);
    this.panDegrees = 0; this.tiltDegrees = 0; this.zoom = 1;
    this.direction = 1; this.patrolling = false; this.disposed = false;
    this.setPose({ panDegrees: config.panDegrees ?? 0, tiltDegrees: config.tiltDegrees ?? 0, zoom: config.zoom ?? 1 });
  }

  setPose({ panDegrees = this.panDegrees, tiltDegrees = this.tiltDegrees, zoom = this.zoom }) {
    finite(panDegrees, 'panDegrees'); finite(tiltDegrees, 'tiltDegrees'); finite(zoom, 'zoom');
    if (zoom <= 0) throw new RangeError('zoom must be positive');
    this.panDegrees = THREE.MathUtils.clamp(panDegrees, ...this.panLimits);
    this.tiltDegrees = THREE.MathUtils.clamp(tiltDegrees, ...this.tiltLimits);
    this.zoom = zoom;
    this.yaw.rotation.y = -THREE.MathUtils.degToRad(this.panDegrees);
    this.pitch.rotation.x = THREE.MathUtils.degToRad(this.tiltDegrees);
    this.model.setPose(-this.yaw.rotation.y, this.pitch.rotation.x);
    this.camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(this.baseFov / 2)) / zoom));
    this.camera.updateProjectionMatrix();
    this.group.updateWorldMatrix(true, true);
  }

  startPatrol() { this.patrolling = this.mode === 'ptz'; }
  stopPatrol() { this.patrolling = false; }

  update(deltaSeconds) {
    finite(deltaSeconds, 'deltaSeconds');
    if (deltaSeconds < 0) throw new RangeError('deltaSeconds must be nonnegative');
    if (!this.patrolling || !deltaSeconds) return;
    const [low, high] = this.panLimits; const span = high - low;
    let phase = this.direction > 0 ? this.panDegrees - low : 2 * span - (this.panDegrees - low);
    phase = (phase + (deltaSeconds % (2 * span / this.patrolSpeed)) * this.patrolSpeed) % (2 * span);
    this.direction = phase < span ? 1 : -1;
    this.setPose({ panDegrees: low + (phase <= span ? phase : 2 * span - phase) });
  }

  lookAtWorld(target) {
    if (!target?.isVector3 || ![target.x, target.y, target.z].every(Number.isFinite)) throw new RangeError('target must be a finite Vector3');
    this.group.updateWorldMatrix(true, true);
    const local = this.group.worldToLocal(target.clone());
    if (local.lengthSq() < 1e-12) return;
    const angle = THREE.MathUtils.radToDeg(Math.atan2(local.x, -local.z));
    const [low, high] = this.panLimits;
    const minTurn = Math.ceil((low - angle) / 360); const maxTurn = Math.floor((high - angle) / 360);
    const panDegrees = minTurn <= maxTurn
      ? angle + 360 * THREE.MathUtils.clamp(Math.round((this.panDegrees - angle) / 360), minTurn, maxTurn)
      : low - (angle + 360 * maxTurn) <= angle + 360 * minTurn - high ? low : high;
    this.setPose({ panDegrees, tiltDegrees: THREE.MathUtils.radToDeg(Math.atan2(local.y, Math.hypot(local.x, local.z))) });
  }

  getStatus() {
    return { mode: this.mode, panDegrees: this.panDegrees, tiltDegrees: this.tiltDegrees, zoom: this.zoom, patrolling: this.patrolling };
  }

  isObjectVisible(object) {
    this.camera.updateWorldMatrix(true, false); object.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(object);
    if (bounds.isEmpty()) return false;
    const matrix = new THREE.Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    return new THREE.Frustum().setFromProjectionMatrix(matrix).intersectsBox(bounds);
  }

  renderFeed(renderer, scene, target) {
    const state = rendererState(renderer);
    try {
      renderer.xr.enabled = false; renderer.autoClear = true;
      renderer.setRenderTarget(target); renderer.setScissorTest(false);
      renderer.setViewport(0, 0, target.width, target.height);
      renderer.render(scene, this.camera);
    } finally {
      restoreRenderer(renderer, state);
    }
  }

  capture(renderer, scene, { width = 960, height = 540 } = {}) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 4096 || height > 4096) throw new RangeError('capture dimensions must be integers from 1 to 4096');
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Snapshot canvas is unavailable');
    const target = new THREE.WebGLRenderTarget(width, height, { depthBuffer: true });
    target.texture.colorSpace = THREE.SRGBColorSpace;
    const previousAspect = this.camera.aspect;
    const state = rendererState(renderer);
    try {
      this.camera.aspect = width / height; this.camera.updateProjectionMatrix();
      this.renderFeed(renderer, scene, target);
      const pixels = new Uint8Array(width * height * 4);
      // Read with this ordinary target active. Three.js readback restoration does
      // not handle an active cube framebuffer array; restore that ourselves.
      renderer.setRenderTarget(target);
      renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels);
      const frame = context.createImageData(width, height);
      for (let y = 0; y < height; y++) frame.data.set(pixels.subarray((height - 1 - y) * width * 4, (height - y) * width * 4), y * width * 4);
      context.putImageData(frame, 0, 0); return canvas;
    } finally {
      this.camera.aspect = previousAspect; this.camera.updateProjectionMatrix();
      restoreRenderer(renderer, state); target.dispose();
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true; this.stopPatrol(); this.model.dispose(); this.group.removeFromParent();
  }
}

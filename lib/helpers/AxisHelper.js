import * as THREE from 'three';

export class AxisHelper3D {
  constructor(parent, size = 0.5) {
    this.group = new THREE.Group();

    // =========================
    // Axes (RGB standard)
    // =========================
    const axes = new THREE.AxesHelper(size);
    this.group.add(axes);

    // =========================
    // Labels
    // =========================
    this.group.add(this.createLabel('X', new THREE.Vector3(size + 0.1, 0, 0), 0xff0000));
    this.group.add(this.createLabel('Y', new THREE.Vector3(0, size + 0.1, 0), 0x00ff00));
    this.group.add(this.createLabel('Z', new THREE.Vector3(0, 0, size + 0.1), 0x0000ff));

    parent.add(this.group);
  }

  createLabel(text, position, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.font = 'bold 120px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.2, 0.2, 0.2);
    sprite.position.copy(position);

    return sprite;
  }

  // =========================
  // Visibility control
  // =========================
  show() {
    this.group.visible = true;
  }

  hide() {
    this.group.visible = false;
  }

  toggle() {
    this.group.visible = !this.group.visible;
  }
}
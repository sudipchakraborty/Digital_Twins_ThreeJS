import * as THREE from 'three';
import { mesh, beam, seededRandom, disposeGroup } from './modelUtils.js';

export class PondModel {
  constructor({ radiusX = 28, radiusZ = 18, seed = 42 } = {}) {
    if (![radiusX, radiusZ].every(value => Number.isFinite(value) && value > 6)) throw new RangeError('pond radii must exceed 6 metres');
    this.group = new THREE.Group(); this.group.name = 'AquaculturePond';
    this.radiusX = radiusX; this.radiusZ = radiusZ;
    const random = seededRandom(seed);
    const earth = new THREE.MeshStandardMaterial({ color: 0x677953, roughness: 1 });
    const bank = new THREE.MeshStandardMaterial({ color: 0xb0a282, roughness: 1 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x70553a, roughness: 0.9 });
    mesh(this.group, new THREE.BoxGeometry(radiusX * 3.2, 0.6, radiusZ * 3.8), earth, [0, -0.55, 0]);
    const ring = mesh(this.group, new THREE.RingGeometry(1, 1.14, 120), bank, [0, 0.06, 0]);
    ring.rotation.x = -Math.PI / 2; ring.scale.set(radiusX, radiusZ, 1);
    ring.castShadow = false;
    this.waterMaterial = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, night: { value: 0 } },
      vertexShader: `uniform float time; varying vec2 p; varying vec3 world; void main(){p=position.xy; vec3 v=position; v.z += sin(p.x*1.4+time*1.1)*sin(p.y*1.9-time*.7)*.035; world=(modelMatrix*vec4(v,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(v,1.);}`,
      fragmentShader: `
        uniform float time; uniform float night; varying vec2 p; varying vec3 world;
        float hash(vec2 q) { return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453); }
        float noise(vec2 q) {
          vec2 i=floor(q); vec2 f=fract(q); f=f*f*(3.-2.*f);
          return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
        }
        void main(){
          vec2 q=world.xz; vec2 drift=vec2(time*.16,-time*.12);
          float waves=noise(q*2.2+drift)*.55+noise(q*5.1-drift)*.3+noise(q*10.+drift)*.15;
          float streak=sin(q.y*4.+noise(q*.7)*7.+time)*.03;
          vec3 normal=normalize(vec3((noise(q*2.+drift)-.5)*.13,1.,(waves-.5)*.18));
          vec3 view=normalize(cameraPosition-world);
          float fresnel=pow(1.-max(dot(normal,view),0.),2.5);
          float specular=pow(max(dot(reflect(-normalize(vec3(-.3,1.,.4)),normal),view),0.),90.);
          vec3 color=mix(vec3(.13,.27,.23),vec3(.40,.54,.49),fresnel*.85);
          color+=(waves-.5)*.13+streak+specular*.35;
          color=mix(color,color*vec3(.10,.17,.27),night);
          gl_FragColor=vec4(color,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    });
    this.water = mesh(this.group, new THREE.CircleGeometry(1, 128), this.waterMaterial, [0, 0.11, 0]);
    this.water.rotation.x = -Math.PI / 2; this.water.scale.set(radiusX, radiusZ, 1); this.water.castShadow = false;
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x705c45, roughness: 1 });
    const foliage = [0x355744, 0x426b46, 0x567b4c, 0x648855].map(color => new THREE.MeshStandardMaterial({ color, roughness: 1 }));
    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.26, 2.6, 7);
    const crownGeo = new THREE.IcosahedronGeometry(1, 1);
    for (let i = 0; i < 64; i++) {
      const angle = random() * Math.PI * 2; const distance = 1.28 + random() * 0.36;
      const x = Math.cos(angle) * radiusX * distance; const z = Math.sin(angle) * radiusZ * distance;
      if (z > 15 && x > -33 && x < 25) continue;
      const height = 0.7 + random() * 1.2;
      const tree = new THREE.Group(); tree.position.set(x, 0.05, z); tree.scale.setScalar(height); this.group.add(tree);
      mesh(tree, trunkGeo, trunkMat, [0, 1.1, 0]);
      for (let j = 0; j < 4; j++) {
        const crown = mesh(tree, crownGeo, foliage[i % foliage.length], [(random() - 0.5) * 1.6, 2.5 + random(), (random() - 0.5) * 1.6]);
        crown.scale.set(1.4 + random() * 0.5, 1.4 + random() * 0.8, 1.4 + random() * 0.5);
      }
    }
    const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x5b8048, roughness: 1, side: THREE.DoubleSide });
    const grassGeometry = new THREE.ConeGeometry(0.1, 0.55, 3);
    const grass = new THREE.InstancedMesh(grassGeometry, grassMaterial, 1000); const dummy = new THREE.Object3D();
    for (let i = 0; i < 1000; i++) {
      const angle = random() * Math.PI * 2; const distance = 1.05 + random() * 0.14;
      dummy.position.set(Math.cos(angle) * radiusX * distance, 0.22, Math.sin(angle) * radiusZ * distance);
      dummy.scale.set(1 + random(), 0.6 + random(), 1 + random()); dummy.rotation.y = random() * Math.PI; dummy.updateMatrix(); grass.setMatrixAt(i, dummy.matrix);
    }
    this.group.add(grass);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x9b9c8c, roughness: 1 }); const stoneGeo = new THREE.IcosahedronGeometry(0.5, 0);
    for (let i = 0; i < 65; i++) {
      const angle = random() * Math.PI * 2; const rock = mesh(this.group, stoneGeo, stoneMat, [Math.cos(angle) * radiusX * 1.035, 0.12, Math.sin(angle) * radiusZ * 1.035]);
      rock.scale.set(0.4 + random() * 0.8, 0.2 + random() * 0.3, 0.4 + random());
    }
    // Timber landing and bamboo net rack echo the supplied site photos.
    this.jetty = new THREE.Group(); this.jetty.position.set(-13, 0.28, radiusZ - 1); this.group.add(this.jetty);
    for (let i = 0; i < 14; i++) mesh(this.jetty, new THREE.BoxGeometry(3.2, 0.14, 0.42), wood, [0, 0, -i * 0.45]);
    for (const x of [-1.3, 1.3]) for (const z of [0, -5.8]) beam(this.jetty, [x, -1, z], [x, 0.35, z], 0.09, wood);
    const bamboo = new THREE.MeshStandardMaterial({ color: 0xa29566, roughness: 1 });
    for (const x of [-17, -21]) beam(this.group, [x, 0, 16], [x, 3.5, 16], 0.06, bamboo);
    beam(this.group, [-21, 3, 16], [-17, 3, 16], 0.05, bamboo);
    const net = mesh(this.group, new THREE.PlaneGeometry(4, 2.5, 20, 14), new THREE.MeshBasicMaterial({ color: 0x495846, wireframe: true, transparent: true, opacity: 0.55 }), [-19, 1.8, 16]); net.castShadow = false;
    this.boat = new THREE.Group(); this.boat.position.set(-9, 0.32, radiusZ - 4); this.boat.rotation.y = -0.3; this.group.add(this.boat);
    const hullShape = new THREE.Shape(); hullShape.moveTo(0, -3.8); hullShape.quadraticCurveTo(-1.1, -2.4, -0.8, 2.7); hullShape.quadraticCurveTo(0, 4.4, 0.8, 2.7); hullShape.quadraticCurveTo(1.1, -2.4, 0, -3.8);
    const bottom = mesh(this.boat, new THREE.ShapeGeometry(hullShape), wood); bottom.rotation.x = -Math.PI / 2;
    const edge = hullShape.getPoints(48);
    for (let i = 0; i < edge.length - 1; i++) beam(this.boat, [edge[i].x, 0.28, -edge[i].y], [edge[i + 1].x, 0.28, -edge[i + 1].y], 0.10, wood);
    for (let i = -2; i <= 2; i++) mesh(this.boat, new THREE.BoxGeometry(1.45, 0.12, 0.24), wood, [0, 0.31, i * 1.1]);
    beam(this.boat, [-0.3, 0.4, -2], [1.3, 0.5, 2.1], 0.035, bamboo);
    this.baseBoatY = this.boat.position.y;
  }
  update(time, night = false) {
    this.waterMaterial.uniforms.time.value = time; this.waterMaterial.uniforms.night.value = night ? 1 : 0;
    this.boat.position.y = this.baseBoatY + Math.sin(time * 1.2) * 0.045;
    this.boat.rotation.z = Math.sin(time * 0.9) * 0.018;
  }
  dispose() { disposeGroup(this.group); }
}

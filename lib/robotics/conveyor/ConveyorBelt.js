import * as THREE from 'three';
import { RoboticsModel, positive, finite } from '../core/RoboticsModel.js';
import { material, darkMaterial } from '../core/materials.js';
import { box, cylinder, disposeGroup } from '../core/transforms.js';
export class ConveyorBelt extends RoboticsModel {
  constructor({ length = 4, width = 0.8, height = 0.8, speed = 0 } = {}) { super('ConveyorBelt'); this.length=positive(length,'length'); this.width=positive(width,'width'); this.height=positive(height,'height'); this.speed=finite(speed,'speed'); this.running=false; this.belt=box(this.group,[length,.08,width],material(0x252a30),[0,height,width*0]); this.belt.position.y=height; this.rollers=[]; for(const x of [-length/2,length/2]) this.rollers.push(cylinder(this.group,width/2,.12,darkMaterial(),[x,height,0],[0,0,Math.PI/2])); this.products=new Map(); }
  start(){this.running=true;} stop(){this.running=false;} setSpeed(value){this.speed=finite(value,'speed');} addProduct(object, position=0){if(!object?.isObject3D)throw new TypeError('product must be a THREE.Object3D'); this.products.set(object,position); this.group.add(object); return object;} removeProduct(object){this.products.delete(object); object.removeFromParent();}
  update(delta){finite(delta,'delta'); if(delta<0)throw new RangeError('delta must be nonnegative'); if(!this.running)return; for(const [object,position] of this.products){let next=position+this.speed*delta; if(next>this.length/2)next=-this.length/2; if(next<-this.length/2)next=this.length/2; this.products.set(object,next); object.position.x=next; object.position.y=this.height+.12; }}
  getStatus(){return {...super.getStatus(),running:this.running,speed:this.speed,productCount:this.products.size};} dispose(){if(this.disposed)return; disposeGroup(this.group); this.disposed=true;}
}

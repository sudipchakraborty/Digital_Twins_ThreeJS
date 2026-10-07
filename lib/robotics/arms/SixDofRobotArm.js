import * as THREE from 'three';
import { RoboticsModel, positive, finite, vector3 } from '../core/RoboticsModel.js';
import { material, darkMaterial } from '../core/materials.js';
import { cylinder, box, disposeGroup } from '../core/transforms.js';
const DEFAULT_LIMITS=[[-180,180],[-90,90],[-135,135],[-180,180],[-120,120],[-360,360]];
export class SixDofRobotArm extends RoboticsModel {
 constructor({name='SixDofRobotArm',baseRadius=.35,linkLengths=[.45,.4,.25],jointLimits=DEFAULT_LIMITS}={}){super(name); this.jointLimits=jointLimits.map((l,i)=>{if(!Array.isArray(l)||l.length!==2||l[0]>=l[1])throw new RangeError(`jointLimits[${i}] invalid`);return l.slice();}); this.angles=[0,0,0,0,0,0]; this.joints=[]; this.toolMount=new THREE.Group(); this.toolMount.name='ToolMount'; let parent=this.group; cylinder(parent,baseRadius,.18,darkMaterial(),[0,.09,0]); for(let i=0;i<6;i++){const joint=new THREE.Group();joint.name=`Joint${i+1}`; parent.add(joint); cylinder(joint,.08,.12,material(0x8c98a5),[0,0,0]); const link=box(joint,[this._link(linkLengths,i),.12,.12],material(0x64748b),[this._link(linkLengths,i)/2,0,0]); parent=link; const pivot=new THREE.Group(); parent.add(pivot); this.joints.push(pivot); parent=pivot;} parent.add(this.toolMount); this.setJointAngles(this.angles); }
 _link(lengths,i){return positive(lengths[Math.min(i,lengths.length-1)]??.2,`linkLengths[${i}]`);}
 setJointAngles(angles){if(!Array.isArray(angles)||angles.length!==6||!angles.every(Number.isFinite))throw new RangeError('angles must contain six finite values'); this.angles=angles.map((v,i)=>THREE.MathUtils.clamp(v,...this.jointLimits[i])); this.joints.forEach((j,i)=>j.rotation.y=THREE.MathUtils.degToRad(this.angles[i])); return this.getJointAngles();}
 getJointAngles(){return this.angles.slice();}
 setEndEffectorTarget(target){const point=target?.isVector3?target:vector3(target,'target'); if(point.length()>3)return {reachable:false,angles:this.getJointAngles()}; const angles=this.getJointAngles(); angles[0]=THREE.MathUtils.radToDeg(Math.atan2(point.z,point.x)); return {reachable:true,angles:this.setJointAngles(angles)};}
 update(delta){finite(delta,'delta');} getStatus(){return {...super.getStatus(),angles:this.getJointAngles(),jointCount:6};} dispose(){if(this.disposed)return; disposeGroup(this.group); this.disposed=true;}
}

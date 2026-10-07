import { SixDofRobotArm } from './SixDofRobotArm.js';
export class DobotMagician extends SixDofRobotArm { constructor(options={}){super({name:'DobotMagician',baseRadius:.22,linkLengths:[.14,.16,.12],...options});} }

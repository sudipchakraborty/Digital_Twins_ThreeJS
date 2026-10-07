import { SixDofRobotArm } from './SixDofRobotArm.js';
export class UniversalRobot extends SixDofRobotArm { constructor(options={}){super({name:'UniversalRobot',baseRadius:.3,linkLengths:[.42,.4,.25],...options});} }

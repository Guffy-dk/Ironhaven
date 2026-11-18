import * as T from './vendor/three.module.js';
let material;
export function conveyorSurface(){
 return material??=new T.MeshStandardMaterial({color:0x303a37,roughness:.88,metalness:.1,side:T.DoubleSide});
}

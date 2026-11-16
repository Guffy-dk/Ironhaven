import * as T from './vendor/three.module.js';
const mats=new Map(),geos=new Map();
export function mat(color,basic=false,side=T.FrontSide){const key=color+':'+basic+':'+side;if(!mats.has(key))mats.set(key,basic?new T.MeshBasicMaterial({color,side}):new T.MeshStandardMaterial({color,side,roughness:.72,metalness:.18}));return mats.get(key);}
export function geometry(kind,w,h,d){const key=[kind,w,h,d].join(':');if(!geos.has(key)){let g;if(kind==='box')g=new T.BoxGeometry(w,h,d);else if(kind==='round'){const r=Math.min(.06,Math.min(w,h,d)*.18),shape=new T.Shape();shape.moveTo(-w/2+r,-h/2+r);shape.lineTo(w/2-r,-h/2+r);shape.lineTo(w/2-r,h/2-r);shape.lineTo(-w/2+r,h/2-r);shape.closePath();g=new T.ExtrudeGeometry(shape,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:2,steps:1});g.translate(0,0,-d/2+r);}else if(kind==='cyl')g=new T.CylinderGeometry(w,w,h,d||8);else if(kind==='cone')g=new T.ConeGeometry(w,h,d||6);else g=new T.IcosahedronGeometry(w,0);geos.set(key,g);}return geos.get(key);}
function part(parent,kind,color,x,y,z,w,h,d,basic=false){const o=new T.Mesh(geometry(kind,w,h,d),mat(color,basic));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
export const box=(p,c,x,y,z,w,h,d,b=false)=>part(p,'round',c,x,y,z,w,h,d,b);
export const cyl=(p,c,x,y,z,r,h,n=8,b=false)=>part(p,'cyl',c,x,y,z,r,h,n,b);

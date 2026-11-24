export const LAMP_RADIUS = 6;
export const SIGNAL_RADIUS = 10;
export const lampRadius = type => type === 'signalMast' ? SIGNAL_RADIUS : type === 'lamp' ? LAMP_RADIUS : 0;
const EMPTY_FIELD = {sourceAt(){return null;}};

// Spatial buckets keep local-light lookup bounded even in very large colonies.
export function lampField(buildings) {
 const buckets = new Map();
 for (const b of buildings) {
  const radius = lampRadius(b.type);
  if (!radius || b.hp <= 0 || !b.active) continue;
  const k = Math.floor(b.x / SIGNAL_RADIUS) + ',' + Math.floor(b.z / SIGNAL_RADIUS);
  if (!buckets.has(k)) buckets.set(k, []);
  buckets.get(k).push({b,radius});
 }
 if (!buckets.size) return EMPTY_FIELD;
 return {sourceAt(p) {
  let source = null, closest = Infinity;
  const x = Math.floor(p.x / SIGNAL_RADIUS), z = Math.floor(p.z / SIGNAL_RADIUS);
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
   for (const {b,radius} of buckets.get((x + dx) + ',' + (z + dz)) ?? []) {
    const d = (p.x - b.x) ** 2 + (p.z - b.z) ** 2;
    if (d <= radius ** 2 && d <= closest) { closest = d; source = b; }
   }
  }
  return source;
 }};
}

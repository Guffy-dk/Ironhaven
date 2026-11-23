// Projects are per colony. The lighthouse dispatches shipments from shared stock.
export const HARBOR_PROJECTS = Object.freeze({
 grid: {
  name: 'Harbor grid',
  description: '+24 power without fuel per tier.',
  limit: 2,
  cost: {harborKit: 10, switchgear: 8}
 },
 depot: {
  name: 'Dock depot',
  description: '+300 shared storage per tier. Individual warehouse limits stay the same.',
  limit: 2,
  cost: {harborKit: 8, hull: 10}
 },
 shipment: {
  name: 'Resupply shipment',
  description: 'Import 48 coal and 14 copper. Available again after 150 seconds.',
  cost: {harborKit: 6, firebrick: 6},
  reward: {coal: 48, copper: 14},
  interval: 150
 }
});

export const projectLevel = (state, id) => state.harbor?.[id] ?? 0;

export function projectCost(state, id) {
 const project = HARBOR_PROJECTS[id];
 if (!project) return {};
 if (!project.limit || projectLevel(state, id) === 0) return project.cost;
 return Object.fromEntries(Object.entries(project.cost).map(([item, amount]) => [item, amount * 2]));
}

export function projectStatus(state, id, freeSpace) {
 if (!Object.hasOwn(HARBOR_PROJECTS, id)) return 'Unknown harbor project';
 const project = HARBOR_PROJECTS[id];
 if (state.tutorialStep !== undefined) return 'Finish or skip training first';
 if (state.status !== 'playing') return 'Resume the expedition first';
 if (project.limit && projectLevel(state, id) >= project.limit) return 'Complete';
 if (id === 'shipment') {
  if (!projectLevel(state, 'grid') && !projectLevel(state, 'depot')) return 'Complete a grid or depot project first';
  const remaining = Math.ceil((state.harbor?.nextShipment ?? 0) - state.time);
  if (remaining > 0) return 'Next shipment in ' + remaining + ' s';
 }
 const cost = Object.entries(projectCost(state, id));
 if (cost.some(([item, amount]) => (state.resources[item] ?? 0) < amount)) return 'Waiting for materials';
 if (project.reward) {
  const released = cost.reduce((sum, [, amount]) => sum + amount, 0);
  const imported = Object.values(project.reward).reduce((sum, amount) => sum + amount, 0);
  if (freeSpace + released < imported) return 'Free space in shared storage';
 }
 return null;
}

export function normalizeHarbor(state) {
 if (!state.harbor) return;
 const int = (value, limit) => Number.isSafeInteger(value) ? Math.max(0, Math.min(limit, value)) : 0;
 state.harbor = {
  grid: int(state.harbor.grid, HARBOR_PROJECTS.grid.limit),
  depot: int(state.harbor.depot, HARBOR_PROJECTS.depot.limit),
  shipments: int(state.harbor.shipments, Number.MAX_SAFE_INTEGER),
  nextShipment: Number.isFinite(state.harbor.nextShipment) ? Math.max(0, state.harbor.nextShipment) : 0
 };
}

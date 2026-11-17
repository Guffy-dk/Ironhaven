# Shared materials and warehouse ownership (save schema 10)

`state.resources` is the authoritative total available for construction, upgrades, repair, ammunition and generator fuel. Warehouse deliveries enter that total immediately. `warehouse.stock` is a physical subset of the total, not extra inventory to add a second time.

`spendResource` consumes free lighthouse stock first, then warehouse stock in stable building order. Warehouse output consumes that warehouse's own stock and the shared total together. Output to another warehouse or the lighthouse is rejected because it would move nothing between shared ledgers. A conveyor or machine input still requires a real transfer and removes its item from shared availability while in transit or processing.

Warehouses add capacity to shared storage and retain their own per-material receiving limit. Full storage backs up producers. Dismantling or losing a warehouse reduces capacity but does not credit or discard its already-shared goods again. Packed warehouses release their physical ownership so those items cannot be restored twice.

Schema-nine worlds had independent warehouse inventories. Migration normalizes and adds those contents to the shared total once, retaining placed warehouse stock as ownership. Packed legacy contents are added once and removed from the packed payload. Schema-ten loads must not sum warehouse contents into `resources` again. Migration preserves schema-nine terrain and deposits.

The transient stock ledger caches totals/capacity and is invalidated with power/building changes; receipt and spending update physical ownership in that ledger. It is not serialized. Keep all global withdrawals routed through `spendResource`.

Regression tests cover direct smelter delivery in every rotation, per-warehouse fullness, conservation during backpressure, construction from remote deliveries, ammunition/fuel withdrawals, local export, dismantling and repeat migration.

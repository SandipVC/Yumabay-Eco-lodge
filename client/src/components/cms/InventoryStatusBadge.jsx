/**
 * Phase 2 read-only badge — shows that the inventory data layer is loaded.
 * Sits above TextContentSection in the dashboard. Phase 5 will replace it
 * with a full inventory editor.
 */
import { useAssets } from '../../hooks/useAssets.js';

export default function InventoryStatusBadge() {
  const { assets } = useAssets();
  const inv = assets?.inventory;
  if (!inv?.buildings) {
    return (
      <div className="inventory-badge inventory-badge--missing">
        🏢 Inventory: <strong>not loaded</strong> · run <code>node server/scripts/seed-inventory.mjs</code>
      </div>
    );
  }
  const aptCount = inv.buildings.reduce((n, b) => n + b.units.length, 0);
  const available = inv.buildings.reduce(
    (n, b) => n + b.units.filter((u) => u.status === 'available').length,
    0
  );
  const blocked = aptCount - available;
  const villaCount = inv.villas?.length || 0;
  const bungalowCount = inv.phase2?.bungalows?.count || 0;
  return (
    <div className="inventory-badge">
      🏢 Inventory loaded · <strong>{aptCount}</strong> apt units (
      <span className="inv-ok">{available} available</span> ·
      <span className="inv-blocked"> {blocked} blocked</span>) ·
      <strong> {villaCount}</strong> villas · <strong>{bungalowCount}</strong> Phase 2 bungalows ·
      last updated <strong>{inv.updatedAt || '—'}</strong>
    </div>
  );
}

import type { EquipmentItem, EquipmentSlot } from "@/constants/dnd";
import { SRD_ITEMS, SrdItem } from "@/constants/item-catalog";

/** Normaliza un nombre para compararlo con el catálogo. */
export function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Completa `category`/`stats` de un item usando el catálogo SRD cuando el
 * objeto no los trae (items creados antes del sistema de equipamiento).
 * No muta la entrada.
 */
export function resolveItem(item: EquipmentItem): EquipmentItem {
  if (item.category && item.stats) return item;

  const entry = findCatalogItem(item.name);
  if (!entry) return item;

  return {
    ...item,
    category: item.category ?? entry.category,
    stats: { ...entry.stats, ...item.stats },
  };
}

export function findCatalogItem(name: string): SrdItem | undefined {
  const key = normalizeItemName(name);
  return SRD_ITEMS.find((item) => normalizeItemName(item.name) === key);
}

/** Slots en los que un objeto puede equiparse. Vacío = no equipable. */
export function getAllowedSlots(item: EquipmentItem): EquipmentSlot[] {
  const resolved = resolveItem(item);
  switch (resolved.category) {
    case "armor":
      return ["armor"];
    case "shield":
      return ["shield"];
    case "weapon":
      return resolved.stats?.twoHanded
        ? ["weapon-main"]
        : ["weapon-main", "weapon-offhand"];
    default:
      return [];
  }
}

export function isEquippable(item: EquipmentItem): boolean {
  return getAllowedSlots(item).length > 0;
}

/**
 * Motivo por el que `item` no puede ocupar `slot` con lo que hay equipado
 * ahora mismo, o `null` si puede.
 *
 * Espejo de las reglas del server, que sigue siendo quien decide (este solo
 * sirve para no ofrecer un botón que va a fallar siempre). Las dos manos son
 * dos: el arma principal ocupa una, y escudo y arma secundaria disputan la
 * otra.
 */
export function slotConflict(
  item: EquipmentItem,
  slot: EquipmentSlot,
  equipment: EquipmentItem[],
): string | null {
  const self = normalizeItemName(item.name);
  const others = equipment.filter((i) => normalizeItemName(i.name) !== self);

  const shield = others.find((i) => i.slot === "shield");
  const offhand = others.find((i) => i.slot === "weapon-offhand");
  const main = others.find((i) => i.slot === "weapon-main");
  const mainTwoHander =
    main !== undefined && resolveItem(main).stats?.twoHanded === true;

  if (slot === "shield") {
    if (mainTwoHander && main) return `«${main.name}» ocupa ambas manos`;
    if (offhand) return `«${offhand.name}» ocupa la otra mano`;
    return null;
  }

  if (slot === "weapon-offhand") {
    if (mainTwoHander && main) return `«${main.name}» ocupa ambas manos`;
    if (shield) return `«${shield.name}» ocupa esa mano`;
    return null;
  }

  if (slot === "weapon-main") {
    const resolved = resolveItem(item);
    const isTwoHander =
      resolved.category === "weapon" && resolved.stats?.twoHanded === true;
    if (!isTwoHander) return null;

    const blockers = [shield, offhand].filter(
      (i): i is EquipmentItem => i !== undefined,
    );
    if (blockers.length === 0) return null;

    const names = blockers.map((i) => i.name).join(", ");
    return `necesita ambas manos y ${names} ya ${blockers.length > 1 ? "la ocupan" : "la ocupa"}`;
  }

  return null;
}

export const SLOT_LABELS: Record<EquipmentSlot, string> = {
  armor: "Armadura",
  shield: "Escudo",
  "weapon-main": "Arma principal",
  "weapon-offhand": "Arma secundaria",
};

export const SLOT_ICONS: Record<EquipmentSlot, string> = {
  armor: "🛡️",
  shield: "🔰",
  "weapon-main": "⚔️",
  "weapon-offhand": "🗡️",
};

/** Etiqueta legible de un objeto según sus stats. Ej: "1d8 cortante". */
export function describeItemStats(item: EquipmentItem): string | null {
  const resolved = resolveItem(item);
  const parts: string[] = [];

  if (resolved.category === "armor") {
    const ac = resolved.stats?.acBase;
    if (ac !== undefined) {
      switch (resolved.stats?.acFormula) {
        case "dex":
          parts.push(`CA ${ac} + DES`);
          break;
        case "dex-capped":
          parts.push(`CA ${ac} + DES (máx 2)`);
          break;
        default:
          parts.push(`CA ${ac}`);
      }
    }
    if (resolved.stats?.stealthDisadvantage) parts.push("Sigilo en desventaja");
  } else if (resolved.category === "shield") {
    parts.push(`+${resolved.stats?.acBase ?? 2} a la CA`);
  } else if (resolved.category === "weapon") {
    if (resolved.stats?.damage) {
      parts.push(
        resolved.stats.damageType
          ? `${resolved.stats.damage} ${resolved.stats.damageType}`
          : resolved.stats.damage,
      );
    }
    if (resolved.stats?.twoHanded) parts.push("A dos manos");
    if (resolved.stats?.range) parts.push(`Alcance ${resolved.stats.range}`);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

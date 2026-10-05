import { describe, expect, it } from "vitest";
import {
  DND_BACKGROUNDS,
  DND_CLASSES,
  PACK_CONTENTS,
  getStartingEquipment,
} from "@/constants/dnd";
import { SRD_ITEMS, SrdItem } from "@/constants/item-catalog";
import { findCatalogItem, getAllowedSlots, normalizeItemName } from "./equipment";

/**
 * Los packs son contenedores ("Equipo de explorador"), no objetos sueltos:
 * se desglosan vía PACK_CONTENTS y por eso no necesitan estar en el catálogo.
 */
function isPack(name: string): boolean {
  return normalizeItemName(name).startsWith("equipo de ");
}

function byName(name: string): SrdItem | undefined {
  return SRD_ITEMS.find(
    (item) => normalizeItemName(item.name) === normalizeItemName(name),
  );
}

describe("item catalog integrity", () => {
  it("has unique names (no two entries collapse on normalize)", () => {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];

    for (const item of SRD_ITEMS) {
      const key = normalizeItemName(item.name);
      if (seen.has(key)) {
        duplicates.push(`"${item.name}" duplica "${seen.get(key)}"`);
      } else {
        seen.set(key, item.name);
      }
    }

    expect(duplicates).toEqual([]);
  });

  it("gives every armor a base AC and a formula", () => {
    const bad = SRD_ITEMS.filter(
      (item) =>
        item.category === "armor" &&
        (item.stats?.acBase === undefined || item.stats?.acFormula === undefined),
    ).map((item) => item.name);

    expect(bad).toEqual([]);
  });

  it("gives every weapon damage and a damage type", () => {
    const bad = SRD_ITEMS.filter(
      (item) =>
        item.category === "weapon" &&
        (!item.stats?.damage || !item.stats?.damageType),
    ).map((item) => item.name);

    expect(bad).toEqual([]);
  });

  it("resolves every item granted by starting packs", () => {
    const packItems = Object.values(PACK_CONTENTS).flat();
    const missing = packItems
      .filter((item) => !isPack(item.name))
      .filter((item) => findCatalogItem(item.name) === undefined)
      .map((item) => item.name);

    expect([...new Set(missing)]).toEqual([]);
  });

  it("resolves every item granted at character creation, for every class and background", () => {
    const missing: string[] = [];

    for (const cls of DND_CLASSES) {
      for (const bg of DND_BACKGROUNDS) {
        const { equipment, displayEquipment } = getStartingEquipment(
          cls.value,
          bg.value,
        );
        for (const item of [...equipment, ...displayEquipment]) {
          if (isPack(item.name)) continue;
          if (findCatalogItem(item.name) === undefined) {
            missing.push(`${cls.value}/${bg.value}: ${item.name}`);
          }
        }
      }
    }

    expect([...new Set(missing)]).toEqual([]);
  });

  it("equips the weapons and armors granted at character creation", () => {
    const shouldBeEquippable = [
      "Lanza corta",
      "Gran hacha",
      "Espada larga",
      "Cota de mallas",
      "Escudo",
      "Armadura de cuero",
      "Daga",
      "Estoque",
      "Arco corto",
      "Ballesta ligera",
      "Martillo ligero",
      "Mangual",
    ];

    for (const name of shouldBeEquippable) {
      expect(findCatalogItem(name), `no resuelve: ${name}`).toBeDefined();
      expect(getAllowedSlots({ name, quantity: 1 }).length, `no equipable: ${name}`)
        .toBeGreaterThan(0);
    }
  });

  it("never lists a two-handed weapon as usable in the offhand", () => {
    const twoHanded = SRD_ITEMS.filter(
      (item) => item.category === "weapon" && item.stats?.twoHanded,
    );

    expect(twoHanded.length).toBeGreaterThan(0);
    for (const item of twoHanded) {
      expect(getAllowedSlots({ name: item.name, quantity: 1 })).toEqual([
        "weapon-main",
      ]);
    }
  });

  it("matches the server AC catalog for every armor and shield", () => {
    // El server calcula la CA con su propio catálogo: los valores del cliente
    // deben coincidir o la CA mostrada no coincidiría con la persistida.
    const expectedAc: Record<string, number> = {
      "Armadura acolchada": 11,
      "Armadura de cuero": 11,
      "Armadura de cuero tachonado": 12,
      "Armadura de pieles": 12,
      "Camisa de cota": 13,
      "Cota de escamas": 14,
      Coraza: 14,
      "Media armadura": 15,
      "Armadura de anillos": 14,
      "Cota de mallas": 16,
      "Armadura de bandas": 17,
      "Armadura de placas": 18,
      Escudo: 2,
      "Escudo de madera": 2,
    };

    const mismatched: string[] = [];
    for (const [name, acBase] of Object.entries(expectedAc)) {
      const entry = byName(name);
      if (!entry) {
        mismatched.push(`falta: ${name}`);
      } else if (entry.stats?.acBase !== acBase) {
        mismatched.push(`${name}: ${entry.stats?.acBase} ≠ ${acBase}`);
      }
    }

    expect(mismatched).toEqual([]);
  });
});

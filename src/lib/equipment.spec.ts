import { describe, expect, it } from "vitest";
import type { EquipmentItem } from "@/constants/dnd";
import {
  describeItemStats,
  findCatalogItem,
  getAllowedSlots,
  isEquippable,
  normalizeItemName,
  resolveItem,
} from "./equipment";

const item = (name: string, extra: Partial<EquipmentItem> = {}): EquipmentItem => ({
  name,
  quantity: 1,
  ...extra,
});

describe("equipment lib", () => {
  describe("normalizeItemName", () => {
    it("lowercases and strips accents", () => {
      expect(normalizeItemName("  Cota de Mallas ")).toBe("cota de mallas");
      expect(normalizeItemName("Bástón")).toBe("baston");
    });
  });

  describe("findCatalogItem", () => {
    it("finds a catalog entry ignoring case and accents", () => {
      expect(findCatalogItem("COTA DE MALLAS")?.stats?.acBase).toBe(16);
      expect(findCatalogItem("Bástón")?.category).toBe("weapon");
    });

    it("returns undefined for unknown items", () => {
      expect(findCatalogItem("Objeto inventado")).toBeUndefined();
    });
  });

  describe("resolveItem", () => {
    it("fills category and stats from the catalog for legacy items", () => {
      const resolved = resolveItem(item("Escudo"));
      expect(resolved.category).toBe("shield");
      expect(resolved.stats?.acBase).toBe(2);
    });

    it("keeps explicit stats over catalog values", () => {
      const resolved = resolveItem(
        item("Cota de mallas", { stats: { acBase: 17 } }),
      );
      expect(resolved.stats?.acBase).toBe(17);
    });

    it("leaves unknown items untouched", () => {
      const source = item("Amuleto del DM");
      expect(resolveItem(source)).toEqual(source);
      expect(getAllowedSlots(source)).toEqual([]);
    });
  });

  describe("getAllowedSlots", () => {
    it("armor goes to the armor slot", () => {
      expect(getAllowedSlots(item("Cota de mallas"))).toEqual(["armor"]);
    });

    it("shields go to the shield slot", () => {
      expect(getAllowedSlots(item("Escudo"))).toEqual(["shield"]);
    });

    it("one-handed weapons can use main or offhand", () => {
      expect(getAllowedSlots(item("Daga"))).toEqual([
        "weapon-main",
        "weapon-offhand",
      ]);
    });

    it("two-handed weapons are locked to the main hand", () => {
      expect(getAllowedSlots(item("Gran hacha"))).toEqual(["weapon-main"]);
    });

    it("gear is not equippable", () => {
      expect(isEquippable(item("Mochila"))).toBe(false);
      expect(getAllowedSlots(item("Mochila"))).toEqual([]);
    });
  });

  describe("describeItemStats", () => {
    it("describes light armor with its DEX bonus", () => {
      expect(describeItemStats(item("Armadura de cuero"))).toContain("CA 11 + DES");
    });

    it("flags stealth disadvantage on heavy armor", () => {
      expect(describeItemStats(item("Cota de mallas"))).toContain(
        "Sigilo en desventaja",
      );
    });

    it("describes a shield bonus", () => {
      expect(describeItemStats(item("Escudo"))).toBe("+2 a la CA");
    });

    it("describes weapon damage and hands", () => {
      const description = describeItemStats(item("Gran hacha"));
      expect(description).toContain("1d12 cortante");
      expect(description).toContain("A dos manos");
    });

    it("returns null for plain gear", () => {
      expect(describeItemStats(item("Mochila"))).toBeNull();
    });
  });
});

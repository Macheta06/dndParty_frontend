import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { EquipmentItem, EquipmentSlot } from "@/constants/dnd";
import EquipButton from "./EquipButton";

const item = (
  name: string,
  extra: Partial<EquipmentItem> = {},
): EquipmentItem => ({
  name,
  quantity: 1,
  ...extra,
});

type Toggle = ((item: EquipmentItem, slot?: EquipmentSlot) => void) & {
  mock: { calls: unknown[][] };
};

interface HarnessProps {
  target: EquipmentItem;
  equipped?: boolean;
  equipment?: EquipmentItem[];
  onToggle?: Toggle;
}

function renderTarget({
  target,
  equipped = false,
  equipment = [target],
  onToggle = vi.fn() as unknown as Toggle,
}: HarnessProps) {
  render(
    <EquipButton
      item={target}
      equipped={equipped}
      canEquip
      equipment={equipment}
      onToggle={onToggle}
    />,
  );
  return onToggle;
}

describe("EquipButton", () => {
  it("renders nothing for non-equippable gear", () => {
    const { container } = render(
      <EquipButton
        item={item("Mochila")}
        equipped={false}
        canEquip
        equipment={[]}
        onToggle={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the viewer cannot equip", () => {
    const { container } = render(
      <EquipButton
        item={item("Cota de mallas")}
        equipped={false}
        canEquip={false}
        equipment={[]}
        onToggle={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("asks the server for the only allowed slot when equipping armor", async () => {
    const onToggle = renderTarget({ target: item("Cota de mallas") });

    await userEvent.click(screen.getByRole("button", { name: "Equipar" }));

    expect(onToggle).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Cota de mallas" }),
      "armor",
    );
  });

  it("offers both hands for a one-handed weapon when they are free", async () => {
    const onToggle = renderTarget({
      target: item("Daga"),
      equipment: [item("Daga")],
    });

    await userEvent.click(screen.getByRole("button", { name: "Secundaria" }));

    expect(onToggle).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Daga" }),
      "weapon-offhand",
    );
  });

  it("offers only the main hand for a two-handed weapon", () => {
    renderTarget({ target: item("Gran hacha") });

    expect(screen.queryByRole("button", { name: "Secundaria" })).toBeNull();
    expect(screen.getByRole("button", { name: "Equipar" })).toBeTruthy();
  });

  it("drops the slot argument when unequipping", async () => {
    const onToggle = renderTarget({
      target: item("Escudo", { slot: "shield" as EquipmentSlot }),
      equipped: true,
    });

    await userEvent.click(screen.getByRole("button", { name: "Desequipar" }));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle.mock.calls[0]).toHaveLength(1);
  });

  describe("with a shield equipped", () => {
    const withShield = [item("Escudo", { slot: "shield" as EquipmentSlot })];

    it("does not offer the offhand for a one-handed weapon", () => {
      renderTarget({
        target: item("Espada corta"),
        equipment: withShield,
      });

      expect(screen.queryByRole("button", { name: "Secundaria" })).toBeNull();
      expect(screen.getByRole("button", { name: "Equipar" })).toBeTruthy();
    });

    it("still offers the main hand for a one-handed weapon", async () => {
      const onToggle = renderTarget({
        target: item("Espada larga"),
        equipment: withShield,
      });

      await userEvent.click(screen.getByRole("button", { name: "Equipar" }));

      expect(onToggle).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Espada larga" }),
        "weapon-main",
      );
    });

    it("disables a two-handed weapon instead of offering a click that fails", () => {
      renderTarget({ target: item("Gran hacha"), equipment: withShield });

      const button = screen.getByRole("button", { name: "Equipar" });
      expect(button).toBeDisabled();
      expect(button.getAttribute("title")).toContain("ambas manos");
    });

    it("hides the shield slot from an already equipped shield's peers", () => {
      // Un escudo ya equipado no se ofrece como "equipar": se desequipa.
      renderTarget({
        target: item("Escudo", { slot: "shield" as EquipmentSlot }),
        equipped: true,
        equipment: withShield,
      });

      expect(screen.getByRole("button", { name: "Desequipar" })).toBeTruthy();
    });
  });

  describe("with an offhand weapon equipped", () => {
    const withOffhand = [
      item("Daga", { slot: "weapon-main" as EquipmentSlot }),
      item("Espada corta", { slot: "weapon-offhand" as EquipmentSlot }),
    ];

    it("does not offer the shield slot", () => {
      renderTarget({ target: item("Escudo"), equipment: withOffhand });

      const button = screen.getByRole("button", { name: "Equipar" });
      expect(button).toBeDisabled();
      expect(button.getAttribute("title")).toContain("otra mano");
    });
  });
});

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { EquipmentItem, EquipmentSlot } from "@/constants/dnd";
import EquipButton from "./EquipButton";

const item = (name: string, extra: Partial<EquipmentItem> = {}): EquipmentItem => ({
  name,
  quantity: 1,
  ...extra,
});

describe("EquipButton", () => {
  it("renders nothing for non-equippable gear", () => {
    const { container } = render(
      <EquipButton
        item={item("Mochila")}
        equipped={false}
        canEquip
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
        onToggle={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("asks the server for the only allowed slot when equipping armor", async () => {
    const onToggle = vi.fn();
    render(
      <EquipButton
        item={item("Cota de mallas")}
        equipped={false}
        canEquip
        onToggle={onToggle}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Equipar" }));

    expect(onToggle).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Cota de mallas" }),
      "armor",
    );
  });

  it("offers both hands for a one-handed weapon so the offhand is reachable", async () => {
    const onToggle = vi.fn();
    render(
      <EquipButton
        item={item("Daga")}
        equipped={false}
        canEquip
        onToggle={onToggle}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Secundaria" }));

    expect(onToggle).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Daga" }),
      "weapon-offhand",
    );
  });

  it("offers only the main hand for a two-handed weapon", () => {
    render(
      <EquipButton
        item={item("Gran hacha")}
        equipped={false}
        canEquip
        onToggle={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Secundaria" })).toBeNull();
    expect(screen.getByRole("button", { name: "Equipar" })).toBeTruthy();
  });

  it("drops the slot argument when unequipping", async () => {
    const onToggle = vi.fn();
    render(
      <EquipButton
        item={item("Escudo", { slot: "shield" as EquipmentSlot })}
        equipped
        canEquip
        onToggle={onToggle}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Desequipar" }));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle.mock.calls[0]).toHaveLength(1);
  });
});

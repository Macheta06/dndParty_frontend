import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Socket } from "socket.io-client";

import type { Character } from "@/types/character";
import CombatPanel from "./CombatPanel";

const character = (overrides: Partial<Character>): Character =>
  ({
    id: 7,
    name: "Aria",
    userId: 2,
    is_npc: false,
    level: 1,
    armor: 14,
    equipment: [],
    ...overrides,
  }) as unknown as Character;

const withWeapon = (name: string, slot: string) => [
  { name, quantity: 1, slot },
];

const aria = character({
  id: 7,
  name: "Aria",
  userId: 2,
  equipment: withWeapon("Espada larga", "weapon-main"),
});
const boris = character({
  id: 8,
  name: "Boris",
  userId: 3,
  equipment: withWeapon("Maza", "weapon-main"),
});
const goblin = character({ id: 9, name: "Goblin", userId: 1, is_npc: true });

const socket = () => ({ emit: vi.fn() }) as unknown as Socket;

function renderPanel(
  overrides: {
    socket?: Socket;
    characters?: Character[];
    userId?: number;
    isMaster?: boolean;
  } = {},
) {
  return render(
    <CombatPanel
      socket={overrides.socket ?? socket()}
      gameId="game-1"
      characters={overrides.characters ?? [aria, goblin]}
      userId={overrides.userId ?? 2}
      isMaster={overrides.isMaster ?? false}
    />,
  );
}

describe("CombatPanel", () => {
  it("shows the weapon the attacker has equipped, taken from the sheet", () => {
    renderPanel();

    expect(screen.getByText("Espada larga")).toBeTruthy();
    expect(screen.getByText("1d8 cortante")).toBeTruthy();
  });

  it("emits the attack with attacker, target and mode", async () => {
    const sock = socket();
    renderPanel({ socket: sock });

    await userEvent.click(screen.getByRole("button", { name: "⚔ Atacar" }));

    expect(sock.emit).toHaveBeenCalledWith("attack", {
      gameId: "game-1",
      attackerId: 7,
      targetId: 9,
      advantage: "normal",
    });
  });

  it("sends advantage when it is selected", async () => {
    const sock = socket();
    renderPanel({ socket: sock });

    await userEvent.click(screen.getByRole("button", { name: "Ventaja" }));
    await userEvent.click(screen.getByRole("button", { name: "⚔ Atacar" }));

    expect(sock.emit).toHaveBeenCalledWith(
      "attack",
      expect.objectContaining({ advantage: "advantage" }),
    );
  });

  it("disables the attack with the reason when no weapon is equipped", async () => {
    const sock = socket();
    renderPanel({
      socket: sock,
      characters: [character({ id: 7, name: "Aria", userId: 2 }), goblin],
    });

    const button = screen.getByRole("button", { name: "⚔ Atacar" });

    expect(button).toHaveProperty("disabled", true);
    expect(
      screen.getByText("Aria no tiene arma equipada"),
    ).toBeTruthy();

    await userEvent.click(button);
    expect(sock.emit).not.toHaveBeenCalled();
  });

  it("only lets a player act with their own characters", () => {
    renderPanel({ characters: [aria, boris, goblin], userId: 2 });

    const select = screen.getByLabelText("Atacante") as HTMLSelectElement;

    expect(select.options).toHaveLength(1);
    expect(select.options[0].textContent).toBe("Aria");
    // Los otros dos siguen siendo válidos como objetivo.
    expect(screen.getByLabelText("Objetivo")).toBeTruthy();
  });

  it("lets the DM act with any character, including NPCs", () => {
    renderPanel({
      characters: [aria, boris, goblin],
      userId: 1,
      isMaster: true,
    });

    const select = screen.getByLabelText("Atacante") as HTMLSelectElement;

    expect(select.options).toHaveLength(3);
    expect(
      Array.from(select.options).some((option) =>
        option.textContent?.includes("(NPC)"),
      ),
    ).toBe(true);
  });

  it("never lets a character attack itself", () => {
    renderPanel({ characters: [aria], userId: 2 });

    const targets = screen.getByLabelText("Objetivo") as HTMLSelectElement;

    expect(targets.options).toHaveLength(0);
    expect(
      screen.getByRole("button", { name: "⚔ Atacar" }),
    ).toHaveProperty("disabled", true);
  });
});

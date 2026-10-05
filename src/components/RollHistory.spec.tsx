import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type {
  AttackRollResult,
  CharacterRollResult,
  DiceRollResult,
} from "@/types/game";
import RollHistory from "./RollHistory";

const freeform: DiceRollResult = {
  userId: 1,
  userName: "dm@test.com",
  formula: "2d6+3",
  rolls: [4, 5],
  total: 12,
};

const skillRoll: CharacterRollResult = {
  kind: "skill",
  key: "athletics",
  label: "Atletismo",
  stat: "strength",
  statModifier: 3,
  proficient: true,
  proficiencyBonus: 2,
  modifier: 5,
  advantage: "advantage",
  dice: [7, 18],
  kept: 18,
  total: 23,
  dc: 20,
  success: true,
  userId: 1,
  userName: "player@test.com",
  characterId: 7,
  characterName: "Aria",
};

const attack: AttackRollResult = {
  weapon: "Espada larga",
  damage: "1d8",
  damageType: "cortante",
  ability: "strength",
  abilityModifier: 3,
  modifier: 5,
  advantage: "normal",
  dice: [16],
  kept: 16,
  total: 21,
  targetAc: 13,
  hit: true,
  critical: false,
  damageDice: [5],
  damageTotal: 8,
  userId: 2,
  userName: "player@test.com",
  attackerId: 7,
  attackerName: "Aria",
  targetId: 9,
  targetName: "Goblin",
};

describe("RollHistory", () => {
  it("renders a freeform dice roll", () => {
    render(<RollHistory history={[freeform]} />);

    expect(screen.getByText("2d6+3")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
  });

  it("renders a character roll with its label, modifier and dice", () => {
    render(<RollHistory history={[skillRoll]} />);

    expect(screen.getByText("Aria")).toBeTruthy();
    expect(screen.getByText(/Atletismo/)).toBeTruthy();
    expect(screen.getByText(/Mod \+5/)).toBeTruthy();
    expect(screen.getByText(/\(7 \+ 18\) → 18/)).toBeTruthy();
    expect(screen.getByText("23")).toBeTruthy();
  });

  it("shows the advantage that was applied", () => {
    render(<RollHistory history={[skillRoll]} />);

    // El texto vive en un span anidado, así que puede haber más de un match.
    expect(screen.getAllByText(/Ventaja/).length).toBeGreaterThan(0);
  });

  it("passes a roll against its DC", () => {
    render(<RollHistory history={[skillRoll]} />);

    expect(screen.getByText(/DC 20 ✓/)).toBeTruthy();
  });

  it("fails a roll below its DC", () => {
    render(<RollHistory history={[{ ...skillRoll, success: false }]} />);

    expect(screen.getByText(/DC 20 ✗/)).toBeTruthy();
  });

  it("omits the DC comparison when none was given", () => {
    render(<RollHistory history={[{ ...skillRoll, dc: undefined }]} />);

    expect(screen.queryByText(/DC/)).toBeNull();
    expect(screen.getByText("23")).toBeTruthy();
  });

  it("lists every roll once the history is expanded", async () => {
    render(<RollHistory history={[freeform, skillRoll]} />);

    await userEvent.click(
      screen.getByRole("button", { name: /Ver todo el historial/ }),
    );

    expect(screen.getByText("2d6+3")).toBeTruthy();
    // La del skill aparece destacada y ahora también en la lista.
    expect(screen.getAllByText(/Atletismo/).length).toBeGreaterThan(1);
  });

  it("explains itself when there are no rolls yet", () => {
    render(<RollHistory history={[]} />);

    expect(screen.getByText(/No hay tiradas recientes/)).toBeTruthy();
  });

  describe("an attack", () => {
    it("shows who attacked whom, with what weapon and against which AC", () => {
      render(<RollHistory history={[attack]} />);

      expect(screen.getByText("Aria")).toBeTruthy();
      expect(screen.getByText("Goblin")).toBeTruthy();
      expect(screen.getByText("Espada larga")).toBeTruthy();
      expect(screen.getByText("CA 13")).toBeTruthy();
      expect(screen.getByText(/Mod \+5/)).toBeTruthy();
      expect(screen.getByText("21")).toBeTruthy();
    });

    it("shows the damage when it hits", () => {
      render(<RollHistory history={[attack]} />);

      expect(screen.getByText("¡Golpe! ✓")).toBeTruthy();
      expect(screen.getByText("8")).toBeTruthy();
      expect(screen.getByText(/\(5 \+ 3\) · cortante/)).toBeTruthy();
    });

    it("shows no damage when it misses", () => {
      render(
        <RollHistory
          history={[
            {
              ...attack,
              hit: false,
              damageDice: undefined,
              damageTotal: undefined,
            },
          ]}
        />,
      );

      expect(screen.getByText("Fallo ✗")).toBeTruthy();
      expect(screen.queryByText(/Daño/)).toBeNull();
    });

    it("marks a critical hit and doubles the damage dice", () => {
      render(
        <RollHistory
          history={[
            { ...attack, critical: true, damageDice: [5, 7], damageTotal: 15 },
          ]}
        />,
      );

      expect(screen.getByText("¡Crítico! ✓")).toBeTruthy();
      expect(screen.getByText(/\(5 \+ 7 \+ 3\) · cortante/)).toBeTruthy();
    });

    it("keeps the advantage that was applied", () => {
      render(<RollHistory history={[{ ...attack, advantage: "advantage" }]} />);

      expect(screen.getAllByText(/Ventaja/).length).toBeGreaterThan(0);
    });

    it("lists attacks alongside the other kinds of roll", async () => {
      render(<RollHistory history={[freeform, skillRoll, attack]} />);

      await userEvent.click(
        screen.getByRole("button", { name: /Ver todo el historial/ }),
      );

      expect(screen.getByText("2d6+3")).toBeTruthy();
      expect(screen.getByText(/Atletismo/)).toBeTruthy();
      expect(screen.getByText("atacó a")).toBeTruthy();
    });
  });
});

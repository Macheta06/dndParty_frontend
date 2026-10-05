import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { CharacterRollResult, DiceRollResult } from "@/types/game";
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
});

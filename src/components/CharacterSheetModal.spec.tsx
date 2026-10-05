import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { Character } from "@/types/character";
import type { CharacterRollRequest } from "@/types/game";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, email: "player@test.com", name: "Aria" },
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("@/services/character.service", () => ({
  characterService: {
    getCharacterById: vi.fn(),
    updateCharacter: vi.fn(),
  },
}));

import { characterService } from "@/services/character.service";
import CharacterSheetModal from "./CharacterSheetModal";

const characterFixture = {
  id: 7,
  name: "Aria",
  class: "rogue",
  race: "human",
  level: 1,
  current_hp: 9,
  max_hp: 9,
  is_npc: false,
  alignment: "Neutral",
  background: "merchant",
  exp: 0,
  proficiency: 2,
  inspiration: 0,
  strength: 16,
  dexterity: 14,
  constitution: 12,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
  armor: 14,
  initiative: 2,
  speed: 30,
  temporary_hp: 0,
  hitDice: "1d8",
  gold_coins: 0,
  silver_coins: 0,
  copper_coins: 0,
  equipment: [],
  proficiencies: ["Atletismo"],
  spells: [],
  userId: 1,
  gameId: "game-1",
} as unknown as Character;

function renderModal(onRoll?: (request: CharacterRollRequest) => void) {
  return render(
    <CharacterSheetModal
      characterId={7}
      initialCharacter={characterFixture}
      onClose={vi.fn()}
      {...(onRoll ? { onRoll } : {})}
    />,
  );
}

describe("CharacterSheetModal", () => {
  const onRoll = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists the six saving throws", () => {
    renderModal(onRoll);

    expect(screen.getAllByText(/^Salvación de /)).toHaveLength(6);
  });

  it("keeps skills and saving throws in the same panel", () => {
    renderModal(onRoll);

    expect(screen.getByText("Salvación de Fuerza")).toBeTruthy();
    expect(screen.getByText("Atletismo")).toBeTruthy();
    expect(screen.getByText("Salvaciones")).toBeTruthy();
    expect(screen.getByText("Habilidades")).toBeTruthy();
  });

  it("asks the server to roll a saving throw", async () => {
    renderModal(onRoll);

    await userEvent.click(
      screen.getByRole("button", { name: "Tirar Salvación de Destreza" }),
    );

    expect(onRoll).toHaveBeenCalledTimes(1);
    expect(onRoll).toHaveBeenCalledWith({
      characterId: 7,
      kind: "save",
      key: "save:dexterity",
      advantage: "normal",
    });
  });

  it("asks the server to roll a skill", async () => {
    renderModal(onRoll);

    await userEvent.click(
      screen.getByRole("button", { name: "Tirar Atletismo" }),
    );

    expect(onRoll).toHaveBeenCalledWith({
      characterId: 7,
      kind: "skill",
      key: "athletics",
      advantage: "normal",
    });
  });

  it("carries the selected advantage mode into the roll", async () => {
    renderModal(onRoll);

    await userEvent.click(screen.getByRole("button", { name: "Ventaja" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Tirar Atletismo" }),
    );

    expect(onRoll).toHaveBeenCalledWith(
      expect.objectContaining({ advantage: "advantage" }),
    );
  });

  it("never sends a modifier: the client only says what to roll", async () => {
    renderModal(onRoll);

    await userEvent.click(
      screen.getByRole("button", { name: "Tirar Atletismo" }),
    );

    const request = onRoll.mock.calls[0][0] as Record<string, unknown>;
    expect(Object.keys(request).sort()).toEqual([
      "advantage",
      "characterId",
      "key",
      "kind",
    ]);
  });

  it("does not toggle proficiency when rolling", async () => {
    renderModal(onRoll);

    // Atletismo está competente: si el click se propagara se desmarcaría.
    await userEvent.click(
      screen.getByRole("button", { name: "Tirar Atletismo" }),
    );

    expect(characterService.updateCharacter).not.toHaveBeenCalled();
  });

  it("hides every roll button when there is no game session", () => {
    renderModal();

    expect(screen.queryByRole("button", { name: /^Tirar / })).toBeNull();
    // Los datos siguen ahí: solo se oculta tirar.
    expect(screen.getByText("Salvación de Fuerza")).toBeTruthy();
  });
});

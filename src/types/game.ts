import { Character } from "./character";

export interface Game {
  id: string;
  name: string;
  joinCode: string;
  masterId: number;
}

export interface Note {
  id: number;
  title: string;
  description: string;
  is_public: boolean;
  gameId: string;
}

export interface InitiativeEntry {
  type: "character" | "npc";
  id: number;
  name: string;
  score: number;
}

export interface InitiativeState {
  entries: InitiativeEntry[];
  currentTurn: number;
  round: number;
}

export interface DiceRollResult {
  userId: number;
  userName: string;
  formula: string;
  rolls: number[];
  total: number;
}

export type AbilityStat =
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma";

export type AdvantageMode = "normal" | "advantage" | "disadvantage";

/**
 * Tira de habilidad o salvación ya resuelta por el server: el bono no lo
 * suma el cliente, así que el número que se ve es el que se jugó.
 */
export interface CharacterRollResult {
  kind: "skill" | "save";
  /** id estable, por ejemplo `athletics` o `save:wisdom`. */
  key: string;
  label: string;
  stat: AbilityStat;
  statModifier: number;
  proficient: boolean;
  proficiencyBonus: number;
  /** Bono total sumado al d20. */
  modifier: number;
  advantage: AdvantageMode;
  /** Todos los dados tirados; dos con ventaja o desventaja. */
  dice: number[];
  /** El dado que cuenta. */
  kept: number;
  total: number;
  dc?: number;
  success?: boolean;
  userId: number;
  userName: string;
  characterId: number;
  characterName: string;
}

export type RollEntry = DiceRollResult | CharacterRollResult;

/**
 * Lo que la hoja pide tirar. El page le agrega el `gameId` antes de emitir:
 * el cliente nunca manda modificadores, solo qué tirar.
 */
export interface CharacterRollRequest {
  characterId: number;
  kind: "skill" | "save";
  key: string;
  advantage?: AdvantageMode;
}

/** `DiceRollResult` no trae `label`: con eso se distingue una de la otra. */
export function isCharacterRoll(
  entry: RollEntry,
): entry is CharacterRollResult {
  return "label" in entry;
}

export interface GameDetail extends Game {
  characters: Character[];
  npcs: Character[];
  notes?: Note[];
  initiative?: InitiativeState | null;
}

export interface JoinGameResponse {
  id: number;
  name: string;
  game: { id: string; name: string; master: { name: string } };
}

export interface ChatMessage {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
  sender: { id: number; name: string };
}

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

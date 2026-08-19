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
export interface GameDetail extends Game {
  characters: Character[];
  npcs: Character[];
  notes?: Note[];
}

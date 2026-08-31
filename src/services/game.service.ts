import { api } from "./api";
import { Game, GameDetail, JoinGameResponse, Note } from "@/types/game";
import { Character } from "@/types/character";

export interface CreateGameDto {
  name: string;
}

export interface JoinGameDto {
  joinCode: string;
  characterId: number;
}
export interface UpdateHpDto {
  current_hp: number;
}
export interface CreateNpcDto {
  name: string;
  max_hp: number;
  current_hp: number;
  race?: string;
  class?: string;
}
export interface CreateNoteDto {
  title: string;
  description: string;
}

export const gameService = {
  async getMyGames(): Promise<Game[]> {
    const { data } = await api.get<Game[]>("/games/my-games");
    return data;
  },

  async createGame(gameData: CreateGameDto): Promise<Game> {
    const { data } = await api.post<Game>("/games/", gameData);
    return data;
  },

  async joinGame(joinData: JoinGameDto): Promise<JoinGameResponse> {
    const { data } = await api.post<JoinGameResponse>("/games/join", joinData);
    return data;
  },
  async leaveGame(gameId: string) {
    const { data } = await api.post(`/games/${gameId}/leave`);
    return data;
  },
  async getGameById(gameId: string): Promise<GameDetail> {
    const { data } = await api.get<GameDetail>(`/games/${gameId}`);
    return data;
  },
  async updateCharacterHp(
    gameId: string,
    characterId: number,
    hpData: UpdateHpDto,
  ) {
    const { data } = await api.patch(
      `/games/${gameId}/characters/${characterId}/hp`,
      hpData,
    );
    return data;
  },
  async createNpc(
    gameId: string,
    npcData: CreateNpcDto,
  ): Promise<Character> {
    const { data } = await api.post<Character>(`/games/${gameId}/npcs`, npcData);
    return data;
  },
  async createNote(gameId: string, noteData: CreateNoteDto): Promise<Note> {
    const { data } = await api.post<Note>(`/games/${gameId}/notes`, noteData);
    return data;
  },
};

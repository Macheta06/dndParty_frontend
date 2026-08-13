import { api } from "./api";
import { Game, GameDetail } from "@/types/game";

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

export const gameService = {
  async getMyGames(): Promise<Game[]> {
    const { data } = await api.get<Game[]>("/games/my-games");
    return data;
  },

  async createGame(gameData: CreateGameDto): Promise<Game> {
    const { data } = await api.post<Game>("/games/", gameData);
    return data;
  },

  async joinGame(joinData: JoinGameDto): Promise<Game> {
    const { data } = await api.post<Game>("/games/join", joinData);
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
};

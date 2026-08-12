import { api } from "./api";
import { Game, GameDetail } from "@/types/game";

export interface CreateGameDto {
  name: string;
}

export interface JoinGameDto {
  joinCode: string;
  characterId: number;
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
};

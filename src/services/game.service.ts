import { api } from "./api";
import { Game } from "@/types/game";

export const gameService = {
  async getMyGames(): Promise<Game[]> {
    const { data } = await api.get<Game[]>("/games/my-games");
    return data;
  },
};

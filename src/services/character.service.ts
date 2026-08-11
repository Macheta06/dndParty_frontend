import { api } from "./api";
import { Character } from "@/types/character";

export const characterService = {
  async getMyCharacters(): Promise<Character[]> {
    const { data } = await api.get<Character[]>("/characters/mine");
    return data;
  },
};

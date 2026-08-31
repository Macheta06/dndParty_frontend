import { api } from "./api";
import { Character } from "@/types/character";

// Alineado con el DTO de tu backend en NestJS
export interface CreateCharacterDto {
  name: string;
  class: string;
  race: string;
  alignment: string;
  background: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  armor: number;
  initiative: number;
  speed: number;
  max_hp: number;
  current_hp: number;
  hitDice: string;
}

export const characterService = {
  async getMyCharacters(): Promise<Character[]> {
    const { data } = await api.get<Character[]>("/characters/mine");
    return data;
  },

  async createCharacter(characterData: CreateCharacterDto): Promise<Character> {
    const { data } = await api.post<Character>("/characters", characterData);
    return data;
  },

  async getCharacterById(id: number): Promise<Character> {
    const { data } = await api.get<Character>(`/characters/${id}`);
    return data;
  },

  async updateCharacter(
    id: number,
    characterData: Partial<Character>,
  ): Promise<Character> {
    const { data } = await api.patch<Character>(
      `/characters/${id}`,
      characterData,
    );
    return data;
  },

  async deleteCharacter(id: number): Promise<void> {
    await api.delete(`/characters/${id}`);
  },
};

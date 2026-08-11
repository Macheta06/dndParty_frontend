export interface Character {
  id: number;
  name: string;
  class: string;
  race: string;
  level: number;
  current_hp: number;
  max_hp: number;
  game?: {
    id: string;
    name: string;
  };
}

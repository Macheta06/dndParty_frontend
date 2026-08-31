import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gameService } from '@/services/game.service';
import type { Game, GameDetail, Note } from '@/types/game';
import type { Character } from '@/types/character';

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));

vi.mock('@/services/api', () => ({ api: apiMock }));

const gameFixture: Game = {
  id: 'game-1',
  name: 'La Cueva del Dragón',
  joinCode: 'ABC123',
  masterId: 1,
};

const characterFixture: Character = {
  id: 1,
  name: 'Aria',
  class: 'Rogue',
  race: 'Half-Elf',
  level: 3,
  current_hp: 20,
  max_hp: 30,
};

const gameDetailFixture: GameDetail = {
  ...gameFixture,
  characters: [characterFixture],
  npcs: [],
  notes: [],
};

const noteFixture: Note = {
  id: 1,
  title: 'Secreto',
  description: 'Tesoro detrás de la puerta',
  gameId: 'game-1',
};

describe('gameService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMyGames calls GET /games/my-games and returns the data', async () => {
    apiMock.get.mockResolvedValue({ data: [gameFixture] });

    const result = await gameService.getMyGames();

    expect(apiMock.get).toHaveBeenCalledWith('/games/my-games');
    expect(result).toEqual([gameFixture]);
  });

  it('createGame calls POST /games/ with the payload and returns the data', async () => {
    apiMock.post.mockResolvedValue({ data: gameFixture });
    const payload = { name: 'Nueva Campaña' };

    const result = await gameService.createGame(payload);

    expect(apiMock.post).toHaveBeenCalledWith('/games/', payload);
    expect(result).toEqual(gameFixture);
  });

  it('joinGame calls POST /games/join with the payload and returns the data', async () => {
    apiMock.post.mockResolvedValue({ data: gameFixture });
    const payload = { joinCode: 'ABC123', characterId: 1 };

    const result = await gameService.joinGame(payload);

    expect(apiMock.post).toHaveBeenCalledWith('/games/join', payload);
    expect(result).toEqual(gameFixture);
  });

  it('leaveGame calls POST /games/:id/leave', async () => {
    apiMock.post.mockResolvedValue({ data: { ok: true } });

    const result = await gameService.leaveGame('game-1');

    expect(apiMock.post).toHaveBeenCalledWith('/games/game-1/leave');
    expect(result).toEqual({ ok: true });
  });

  it('getGameById calls GET /games/:id and returns the data', async () => {
    apiMock.get.mockResolvedValue({ data: gameDetailFixture });

    const result = await gameService.getGameById('game-1');

    expect(apiMock.get).toHaveBeenCalledWith('/games/game-1');
    expect(result).toEqual(gameDetailFixture);
  });

  it('updateCharacterHp calls PATCH with the game, character and hp payload', async () => {
    apiMock.patch.mockResolvedValue({ data: { id: 1, current_hp: 15 } });
    const payload = { current_hp: 15 };

    const result = await gameService.updateCharacterHp('game-1', 1, payload);

    expect(apiMock.patch).toHaveBeenCalledWith(
      '/games/game-1/characters/1/hp',
      payload,
    );
    expect(result).toEqual({ id: 1, current_hp: 15 });
  });

  it('createNpc calls POST /games/:id/npcs with the payload and returns the data', async () => {
    apiMock.post.mockResolvedValue({ data: characterFixture });
    const payload = { name: 'Orco', max_hp: 12, current_hp: 12 };

    const result = await gameService.createNpc('game-1', payload);

    expect(apiMock.post).toHaveBeenCalledWith('/games/game-1/npcs', payload);
    expect(result).toEqual(characterFixture);
  });

  it('createNote calls POST /games/:id/notes with the payload and returns the data', async () => {
    apiMock.post.mockResolvedValue({ data: noteFixture });
    const payload = {
      title: 'Secreto',
      description: 'Tesoro detrás de la puerta',
    };

    const result = await gameService.createNote('game-1', payload);

    expect(apiMock.post).toHaveBeenCalledWith('/games/game-1/notes', payload);
    expect(result).toEqual(noteFixture);
  });
});
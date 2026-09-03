import { Suspense } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Character } from '@/types/character';
import type { GameDetail, Note } from '@/types/game';
import { gameService } from '@/services/game.service';
import GameRoomPage from './page';

const { fakeSocket, authUser } = vi.hoisted(() => ({
  fakeSocket: {
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  },
  authUser: {
    user: { id: 1, email: 'dm@test.com', name: 'DM' },
  },
}));

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => fakeSocket),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/services/game.service', () => ({
  gameService: {
    getGameById: vi.fn(),
    updateCharacterHp: vi.fn(),
    createNpc: vi.fn(),
    createNote: vi.fn(),
    leaveGame: vi.fn(),
  },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: authUser.user }),
}));

const baseCharacterFields = {
  is_npc: false,
  alignment: 'Neutral',
  background: 'Acolyte',
  exp: 0,
  proficiency: 2,
  inspiration: 0,
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
  armor: 10,
  initiative: 0,
  speed: 30,
  temporary_hp: 0,
  hitDice: '1d8',
  gold_coins: 0,
  silver_coins: 0,
  copper_coins: 0,
  equipment: [] as unknown[],
  proficiencies: [] as unknown[],
  spells: [] as unknown[],
  userId: 1,
};

const playerFixture: Character = {
  ...baseCharacterFields,
  id: 1,
  name: 'Aria',
  class: 'Rogue',
  race: 'Half-Elf',
  level: 3,
  current_hp: 20,
  max_hp: 30,
};

const npcFixture: Character = {
  ...baseCharacterFields,
  id: 2,
  name: 'Goblin',
  class: 'Enemigo',
  race: 'Goblinoid',
  level: 1,
  current_hp: 5,
  max_hp: 7,
  is_npc: true,
};

const newNpcFixture: Character = {
  ...baseCharacterFields,
  id: 3,
  name: 'Orco',
  class: 'Enemigo',
  race: 'Orc',
  level: 1,
  current_hp: 12,
  max_hp: 12,
  is_npc: true,
};

const noteFixture: Note = {
  id: 1,
  title: 'Secreto de la cueva',
  description: 'Tesoro detrás de la puerta',
  is_public: false,
  gameId: 'game-1',
};

const masterGame: GameDetail = {
  id: 'game-1',
  name: 'La Cueva del Dragón',
  joinCode: 'ABC123',
  masterId: 1,
  characters: [playerFixture],
  npcs: [npcFixture],
  notes: [noteFixture],
};

const paramsPromise = Promise.resolve({ id: 'game-1' });

async function renderPage() {
  await act(async () => {
    render(
      <Suspense fallback={<div>Cargando params...</div>}>
        <GameRoomPage params={paramsPromise} />
      </Suspense>,
    );
  });
}

function getSocketHandler(eventName: string): (...args: unknown[]) => void {
  const call = fakeSocket.on.mock.calls.find((args) => args[0] === eventName);
  return (call?.[1] ?? (() => {})) as (...args: unknown[]) => void;
}

beforeEach(() => {
  vi.clearAllMocks();
  authUser.user = { id: 1, email: 'dm@test.com', name: 'DM' };
  vi.mocked(gameService.getGameById).mockResolvedValue(masterGame);
});

afterEach(() => {
  cleanup();
});

describe('GameRoomPage', () => {
  describe('player view', () => {
    it('does not render the master panel, notes or NPC/note buttons', async () => {
      authUser.user = { id: 2, email: 'player@test.com', name: 'Player' };
      await renderPage();

      await screen.findByRole('heading', { name: 'La Cueva del Dragón' });

      expect(screen.queryByRole('heading', { name: /Panel del Master/ })).toBeNull();
      expect(screen.queryByText(/Notas del Master/)).toBeNull();
      expect(
        screen.queryByRole('button', { name: '+ Crear Enemigo (NPC)' }),
      ).toBeNull();
      expect(
        screen.queryByRole('button', { name: '+ Añadir Nota Oculta' }),
      ).toBeNull();
      expect(screen.getByRole('heading', { name: 'Enemigos' })).toBeInTheDocument();
      expect(screen.getByText('Jugador')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Abandonar Partida' }),
      ).toBeInTheDocument();
    });
  });

  describe('master view', () => {
    it('renders the master panel, actions and the master notes', async () => {
      await renderPage();

      await screen.findByRole('heading', { name: /Panel del Master/ });

      expect(
        screen.getByRole('button', { name: '+ Modificar HP de Personaje' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '+ Crear Enemigo (NPC)' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: '+ Añadir Nota Oculta' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Dungeon Master')).toBeInTheDocument();
      expect(screen.getByText('Secreto de la cueva')).toBeInTheDocument();
    });
  });

  describe('socket events', () => {
    it('updates the HP of a player character on hpUpdated', async () => {
      await renderPage();
      await screen.findByRole('heading', { name: 'La Cueva del Dragón' });

      act(() => {
        getSocketHandler('hpUpdated')({ characterId: 1, current_hp: 3 });
      });

      expect(await screen.findByText('3')).toBeInTheDocument();
      expect(screen.queryByText('20')).toBeNull();
    });

    it('updates the HP of an NPC on hpUpdated', async () => {
      await renderPage();
      await screen.findByRole('heading', { name: 'La Cueva del Dragón' });

      act(() => {
        getSocketHandler('hpUpdated')({ characterId: 2, current_hp: 9 });
      });

      expect(await screen.findByText('9')).toBeInTheDocument();
      expect(screen.queryByText('5')).toBeNull();
    });

    it('adds exactly one enemy row per npcCreated event', async () => {
      await renderPage();
      await screen.findByRole('heading', { name: 'La Cueva del Dragón' });

      act(() => {
        getSocketHandler('npcCreated')(newNpcFixture);
      });

      expect(await screen.findByText('Orco')).toBeInTheDocument();
      expect(screen.getAllByText('Orco')).toHaveLength(1);
    });
  });

  describe('HP modal', () => {
    it('lists players and enemies and submits the HP update', async () => {
      const user = userEvent.setup();
      await renderPage();
      await screen.findByRole('heading', { name: /Panel del Master/ });

      await user.click(
        screen.getByRole('button', { name: '+ Modificar HP de Personaje' }),
      );
      await screen.findByRole('heading', { name: 'Modificar Puntos de Vida' });

      const combobox = screen.getByRole('combobox');
      expect(screen.getByRole('option', { name: /Aria \(Jugador/ })).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: /Goblin \(Enemigo/ }),
      ).toBeInTheDocument();

      await user.selectOptions(combobox, '1');
      const hpInput = screen.getByRole('spinbutton');
      await user.clear(hpInput);
      await user.type(hpInput, '15');
      await user.click(screen.getByRole('button', { name: 'Guardar HP' }));

      await waitFor(() =>
        expect(gameService.updateCharacterHp).toHaveBeenCalledWith('game-1', 1, {
          current_hp: 15,
        }),
      );
      expect(
        screen.queryByRole('heading', { name: 'Modificar Puntos de Vida' }),
      ).toBeNull();
    });
  });

  describe('Create NPC modal', () => {
    it('submits the NPC payload from the form', async () => {
      const user = userEvent.setup();
      await renderPage();
      await screen.findByRole('heading', { name: /Panel del Master/ });

      await user.click(
        screen.getByRole('button', { name: '+ Crear Enemigo (NPC)' }),
      );
      await screen.findByRole('heading', { name: 'Crear Enemigo (NPC)' });

      await user.type(screen.getByLabelText('Nombre'), 'Orco');
      await user.type(screen.getByLabelText('HP Máximo'), '12');
      await user.type(screen.getByLabelText('HP Actual'), '8');

      await user.click(screen.getByRole('button', { name: 'Crear Enemigo' }));

      await waitFor(() =>
        expect(gameService.createNpc).toHaveBeenCalledWith('game-1', {
          name: 'Orco',
          max_hp: 12,
          current_hp: 8,
        }),
      );
      expect(
        screen.queryByRole('heading', { name: 'Crear Enemigo (NPC)' }),
      ).toBeNull();
    });
  });

  describe('Note modal', () => {
    it('submits the note and appends it to the notes list via socket', async () => {
      const user = userEvent.setup();
      const createdNote: Note = {
        id: 2,
        title: 'Mapa del tesoro',
        description: 'Enterrado bajo el roble.',
        is_public: false,
        gameId: 'game-1',
      };
      vi.mocked(gameService.createNote).mockResolvedValue(createdNote);
      await renderPage();
      await screen.findByRole('heading', { name: /Panel del Master/ });

      await user.click(
        screen.getByRole('button', { name: '+ Añadir Nota Oculta' }),
      );
      await screen.findByRole('heading', { name: 'Añadir Nota Oculta' });

      await user.type(screen.getByLabelText('Título'), 'Mapa del tesoro');
      await user.type(screen.getByLabelText('Descripción'), 'Enterrado bajo el roble.');

      await user.click(screen.getByRole('button', { name: 'Guardar Nota' }));

      await waitFor(() =>
        expect(gameService.createNote).toHaveBeenCalledWith('game-1', {
          title: 'Mapa del tesoro',
          description: 'Enterrado bajo el roble.',
          is_public: false,
        }),
      );

      // Simulate socket event (note arrives via realtime, not REST)
      act(() => {
        getSocketHandler('noteCreated')(createdNote);
      });

      expect(await screen.findByText('Mapa del tesoro')).toBeInTheDocument();
      expect(screen.getAllByText('Mapa del tesoro')).toHaveLength(1);
    });
  });

  describe('error path', () => {
    it('alerts the user when creating an NPC fails', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        const user = userEvent.setup();
        vi.mocked(gameService.createNpc).mockRejectedValue(new Error('boom'));
        await renderPage();
        await screen.findByRole('heading', { name: /Panel del Master/ });

        await user.click(
          screen.getByRole('button', { name: '+ Crear Enemigo (NPC)' }),
        );
        await user.type(screen.getByLabelText('Nombre'), 'Orco');
        await user.type(screen.getByLabelText('HP Máximo'), '12');
        await user.type(screen.getByLabelText('HP Actual'), '8');
        await user.click(screen.getByRole('button', { name: 'Crear Enemigo' }));

        await waitFor(() => expect(alertSpy).toHaveBeenCalled());
      } finally {
        alertSpy.mockRestore();
        errorSpy.mockRestore();
      }
    });
  });
});

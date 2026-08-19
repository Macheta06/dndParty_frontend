"use client";

import { io, Socket } from "socket.io-client";
import { use, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  gameService,
  CreateNpcDto,
  CreateNoteDto,
} from "@/services/game.service";
import { GameDetail, Note } from "@/types/game";
import { Character } from "@/types/character";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface HpUpdate {
  characterId: number;
  current_hp: number;
}

function applyHpUpdate(
  prevGame: GameDetail | null,
  update: HpUpdate,
): GameDetail | null {
  if (!prevGame) return prevGame;
  return {
    ...prevGame,
    characters: prevGame.characters.map((char) =>
      char.id === update.characterId
        ? { ...char, current_hp: update.current_hp }
        : char,
    ),
    npcs: prevGame.npcs.map((npc) =>
      npc.id === update.characterId
        ? { ...npc, current_hp: update.current_hp }
        : npc,
    ),
  };
}

export default function GameRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = useAuth();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const { id: gameId } = use(params);

  const [isHpModalOpen, setIsHpModalOpen] = useState(false);
  const [selectedCharId, setSelectedCharId] = useState<number | "">("");
  const [newHp, setNewHp] = useState<number | "">("");
  const [isUpdatingHp, setIsUpdatingHp] = useState(false);
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  const [isNpcModalOpen, setIsNpcModalOpen] = useState(false);
  const [isCreatingNpc, setIsCreatingNpc] = useState(false);
  const [npcName, setNpcName] = useState("");
  const [npcMaxHp, setNpcMaxHp] = useState<number | "">("");
  const [npcCurrentHp, setNpcCurrentHp] = useState<number | "">("");
  const [npcRace, setNpcRace] = useState("");
  const [npcClass, setNpcClass] = useState("");

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDescription, setNoteDescription] = useState("");

  useEffect(() => {
    async function fetchGame() {
      try {
        const data = await gameService.getGameById(gameId);
        setGame(data);
      } catch {
        setError("No se pudo cargar la sala de juego.");
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchGame();
  }, [gameId, user]);

  useEffect(() => {
    const socket: Socket = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    );

    socket.emit("joinGameRoom", gameId);

    socket.on("hpUpdated", (data: HpUpdate) => {
      setGame((prevGame) => applyHpUpdate(prevGame, data));
    });

    socket.on("npcCreated", (npc: Character) => {
      setGame((prevGame) =>
        prevGame ? { ...prevGame, npcs: [...prevGame.npcs, npc] } : prevGame,
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [gameId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-amber-500 font-bold text-xl">
        Cargando mesa...
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-slate-900 text-red-500 p-8 text-center font-bold">
        {error || "Partida no encontrada"}
      </div>
    );
  }

  const handleUpdateHp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!game || selectedCharId === "" || newHp === "") return;

    setIsUpdatingHp(true);
    try {
      await gameService.updateCharacterHp(gameId, Number(selectedCharId), {
        current_hp: Number(newHp),
      });

      setGame((prevGame) =>
        applyHpUpdate(prevGame, {
          characterId: Number(selectedCharId),
          current_hp: Number(newHp),
        }),
      );

      setIsHpModalOpen(false);
      setSelectedCharId("");
      setNewHp("");
    } catch (err) {
      console.error("Error actualizando HP:", err);
      alert("Hubo un error al actualizar la vida del personaje.");
    } finally {
      setIsUpdatingHp(false);
    }
  };

  const handleCreateNpc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (npcName.trim() === "" || npcMaxHp === "" || npcCurrentHp === "") return;

    const npcData: CreateNpcDto = {
      name: npcName.trim(),
      max_hp: Number(npcMaxHp),
      current_hp: Number(npcCurrentHp),
    };
    if (npcRace.trim() !== "") npcData.race = npcRace.trim();
    if (npcClass.trim() !== "") npcData.class = npcClass.trim();

    setIsCreatingNpc(true);
    try {
      await gameService.createNpc(gameId, npcData);
      setIsNpcModalOpen(false);
      setNpcName("");
      setNpcMaxHp("");
      setNpcCurrentHp("");
      setNpcRace("");
      setNpcClass("");
    } catch (err) {
      console.error("Error creando el enemigo:", err);
      alert("Hubo un error al crear el enemigo.");
    } finally {
      setIsCreatingNpc(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (noteTitle.trim() === "" || noteDescription.trim() === "") return;

    const noteData: CreateNoteDto = {
      title: noteTitle.trim(),
      description: noteDescription.trim(),
    };

    setIsCreatingNote(true);
    try {
      const note: Note = await gameService.createNote(gameId, noteData);
      setGame((prevGame) =>
        prevGame
          ? { ...prevGame, notes: [...(prevGame.notes ?? []), note] }
          : prevGame,
      );
      setIsNoteModalOpen(false);
      setNoteTitle("");
      setNoteDescription("");
    } catch (err) {
      console.error("Error creando la nota:", err);
      alert("Hubo un error al crear la nota.");
    } finally {
      setIsCreatingNote(false);
    }
  };

  const handleLeaveGame = async () => {
    const confirm = window.confirm(
      "¿Estás seguro de que deseas abandonar esta partida? Tu personaje será desvinculado de la campaña.",
    );
    if (!confirm) return;

    setIsLeaving(true);
    try {
      await gameService.leaveGame(gameId);
      router.push("/dashboard"); // Regresamos a la taberna principal
    } catch (err) {
      console.error("Error abandonando partida:", err);
      alert("Hubo un error al intentar abandonar la partida.");
      setIsLeaving(false);
    }
  };

  const isMaster = user?.id === game.masterId;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header de la Sala */}
        <header className="flex justify-between items-end border-b border-slate-700 pb-4 mb-8">
          <div>
            <Link
              href="/dashboard"
              className="text-xs text-amber-500 hover:underline mb-2 inline-block"
            >
              ← Salir de la sala
            </Link>
            <h1 className="text-3xl font-bold text-slate-100">{game.name}</h1>
            <p className="text-sm text-slate-400 mt-1">
              Código de invitación:{" "}
              <span className="font-mono text-amber-400 bg-slate-800 px-2 py-0.5 rounded">
                {game.joinCode}
              </span>
            </p>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <span
              className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border ${isMaster ? "bg-purple-500/10 text-purple-400 border-purple-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"}`}
            >
              {isMaster ? "Dungeon Master" : "Jugador"}
            </span>

            {/* Renderizado condicional: Solo visible si NO es el Master */}
            {!isMaster && (
              <button
                onClick={handleLeaveGame}
                disabled={isLeaving}
                className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400 bg-red-500/10 px-3 py-1 rounded transition-colors disabled:opacity-50"
              >
                {isLeaving ? "Escapando..." : "Abandonar Partida"}
              </button>
            )}
          </div>
        </header>

        {/* Layout Principal: Grid dividido */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda (2/3): Personajes y Enemigos (Visible para todos) */}
          <div className="lg:col-span-2 space-y-8">
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-amber-500 mb-4">
                El Grupo
              </h2>

              {game.characters.length === 0 ? (
                <p className="text-slate-500 italic">
                  No hay héroes en esta partida todavía.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {game.characters.map((char) => (
                    <div
                      key={char.id}
                      className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow flex justify-between items-center"
                    >
                      <div>
                        <h3 className="font-bold text-lg text-slate-200">
                          {char.name}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {char.race} {char.class} - Lvl {char.level}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-300">HP</p>
                        <p
                          className={`text-xl font-black ${char.current_hp <= char.max_hp / 4 ? "text-red-500" : "text-emerald-400"}`}
                        >
                          {char.current_hp}{" "}
                          <span className="text-sm text-slate-500 font-normal">
                            / {char.max_hp}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-red-500 mb-4">Enemigos</h2>

              {game.npcs.length === 0 ? (
                <p className="text-slate-500 italic">
                  No hay enemigos en la mesa todavía.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {game.npcs.map((npc) => (
                    <div
                      key={npc.id}
                      className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow flex justify-between items-center"
                    >
                      <div>
                        <h3 className="font-bold text-lg text-slate-200">
                          {npc.name}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {npc.race} {npc.class} - Lvl {npc.level}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-300">HP</p>
                        <p
                          className={`text-xl font-black ${npc.current_hp <= npc.max_hp / 4 ? "text-red-500" : "text-emerald-400"}`}
                        >
                          {npc.current_hp}{" "}
                          <span className="text-sm text-slate-500 font-normal">
                            / {npc.max_hp}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Columna Derecha (1/3): Panel del Master (Renderizado Condicional) */}
          {isMaster && (
            <div className="space-y-4">
              <div className="bg-slate-800 p-6 rounded-xl border border-purple-500/30 shadow-lg h-fit">
                <h2 className="text-xl font-bold text-purple-400 mb-6 flex items-center gap-2">
                  ⚔️ Panel del Master
                </h2>

                <div className="space-y-4">
                  <button
                    onClick={() => setIsHpModalOpen(true)}
                    className="w-full py-2 bg-slate-900 border border-slate-700 hover:border-purple-500 text-slate-300 rounded transition-colors text-sm"
                  >
                    + Modificar HP de Personaje
                  </button>
                  <button
                    onClick={() => setIsNpcModalOpen(true)}
                    className="w-full py-2 bg-slate-900 border border-slate-700 hover:border-purple-500 text-slate-300 rounded transition-colors text-sm"
                  >
                    + Crear Enemigo (NPC)
                  </button>
                  <button
                    onClick={() => setIsNoteModalOpen(true)}
                    className="w-full py-2 bg-slate-900 border border-slate-700 hover:border-purple-500 text-slate-300 rounded transition-colors text-sm"
                  >
                    + Añadir Nota Oculta
                  </button>
                </div>
              </div>

              <div className="bg-slate-800 p-6 rounded-xl border border-purple-500/30 shadow-lg h-fit">
                <h2 className="text-xl font-bold text-purple-400 mb-4">
                  📜 Notas del Master
                </h2>
                {game.notes && game.notes.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {game.notes.map((note) => (
                      <div
                        key={note.id}
                        className="bg-slate-900 border border-slate-700 rounded p-3"
                      >
                        <h3 className="font-bold text-slate-200 text-sm">
                          {note.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 whitespace-pre-wrap">
                          {note.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic text-sm">
                    No hay notas ocultas todavía.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* MODAL PARA MODIFICAR HP */}
      {isHpModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-purple-500/50 p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-purple-400 mb-4">
              Modificar Puntos de Vida
            </h3>

            <form onSubmit={handleUpdateHp} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Selecciona el Personaje
                </label>
                <select
                  required
                  value={selectedCharId}
                  onChange={(e) => {
                    const charId = Number(e.target.value);
                    setSelectedCharId(charId);
                    const target =
                      game.characters.find((c) => c.id === charId) ??
                      game.npcs.find((npc) => npc.id === charId);
                    if (target) setNewHp(target.current_hp);
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:border-purple-500 text-slate-100"
                >
                  <option value="">-- Elige un personaje --</option>
                  {game.characters.map((char) => (
                    <option key={`char-${char.id}`} value={char.id}>
                      {char.name} (Jugador - {char.current_hp}/{char.max_hp} HP)
                    </option>
                  ))}
                  {game.npcs.map((npc) => (
                    <option key={`npc-${npc.id}`} value={npc.id}>
                      {npc.name} (Enemigo - {npc.current_hp}/{npc.max_hp} HP)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Nuevo HP Actual
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newHp}
                  onChange={(e) =>
                    setNewHp(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:border-purple-500 text-slate-100 text-lg font-bold"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsHpModalOpen(false)}
                  className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    isUpdatingHp || selectedCharId === "" || newHp === ""
                  }
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded transition-colors disabled:opacity-50"
                >
                  {isUpdatingHp ? "Guardando..." : "Guardar HP"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA CREAR ENEMIGO (NPC) */}
      {isNpcModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-purple-500/50 p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-purple-400 mb-4">
              Crear Enemigo (NPC)
            </h3>

            <form onSubmit={handleCreateNpc} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={npcName}
                  onChange={(e) => setNpcName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:border-purple-500 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">
                    HP Máximo
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={npcMaxHp}
                    onChange={(e) =>
                      setNpcMaxHp(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:border-purple-500 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">
                    HP Actual
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={npcCurrentHp}
                    onChange={(e) =>
                      setNpcCurrentHp(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:border-purple-500 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">
                    Raza (opcional)
                  </label>
                  <input
                    type="text"
                    value={npcRace}
                    onChange={(e) => setNpcRace(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:border-purple-500 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">
                    Clase (opcional)
                  </label>
                  <input
                    type="text"
                    value={npcClass}
                    onChange={(e) => setNpcClass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:border-purple-500 text-slate-100"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsNpcModalOpen(false)}
                  className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    isCreatingNpc ||
                    npcName.trim() === "" ||
                    npcMaxHp === "" ||
                    npcCurrentHp === ""
                  }
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded transition-colors disabled:opacity-50"
                >
                  {isCreatingNpc ? "Creando..." : "Crear Enemigo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA AÑADIR NOTA OCULTA */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-purple-500/50 p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-purple-400 mb-4">
              Añadir Nota Oculta
            </h3>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:border-purple-500 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Descripción
                </label>
                <textarea
                  required
                  rows={4}
                  value={noteDescription}
                  onChange={(e) => setNoteDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:border-purple-500 text-slate-100 resize-none"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    isCreatingNote ||
                    noteTitle.trim() === "" ||
                    noteDescription.trim() === ""
                  }
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded transition-colors disabled:opacity-50"
                >
                  {isCreatingNote ? "Guardando..." : "Guardar Nota"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
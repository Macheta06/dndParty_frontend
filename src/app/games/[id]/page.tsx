"use client";

import { io, Socket } from "socket.io-client";
import { use, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { gameService } from "@/services/game.service";
import { GameDetail } from "@/types/game";
import Link from "next/link";

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

    socket.on(
      "hpUpdated",
      (data: { characterId: number; current_hp: number }) => {
        setGame((prevGame) => {
          if (!prevGame) return prevGame;

          return {
            ...prevGame,
            characters: prevGame.characters.map((char) =>
              char.id === data.characterId
                ? { ...char, current_hp: data.current_hp }
                : char,
            ),
          };
        });
      },
    );

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

      setGame({
        ...game,
        characters: game.characters.map((char) =>
          char.id === Number(selectedCharId)
            ? { ...char, current_hp: Number(newHp) }
            : char,
        ),
      });

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
          <div className="text-right">
            <span
              className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border ${isMaster ? "bg-purple-500/10 text-purple-400 border-purple-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"}`}
            >
              {isMaster ? "Dungeon Master" : "Jugador"}
            </span>
          </div>
        </header>

        {/* Layout Principal: Grid dividido */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda (2/3): Lista de Personajes (Visible para todos) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-amber-500 mb-4">El Grupo</h2>

            {game.characters?.length === 0 ? (
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
          </div>

          {/* Columna Derecha (1/3): Panel del Master (Renderizado Condicional) */}
          {isMaster && (
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
                <button className="w-full py-2 bg-slate-900 border border-slate-700 hover:border-purple-500 text-slate-300 rounded transition-colors text-sm">
                  + Crear Enemigo (NPC)
                </button>
                <button className="w-full py-2 bg-slate-900 border border-slate-700 hover:border-purple-500 text-slate-300 rounded transition-colors text-sm">
                  + Añadir Nota Oculta
                </button>
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
                    const char = game?.characters.find((c) => c.id === charId);
                    if (char) setNewHp(char.current_hp);
                  }}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:border-purple-500 text-slate-100"
                >
                  <option value="">-- Elige un héroe --</option>
                  {game?.characters.map((char) => (
                    <option key={char.id} value={char.id}>
                      {char.name} (Actual: {char.current_hp}/{char.max_hp} HP)
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
    </div>
  );
}

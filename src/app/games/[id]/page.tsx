"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { gameService } from "@/services/game.service";
import { GameDetail } from "@/types/game";
import Link from "next/link";

export default function GameRoomPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [game, setGame] = useState<GameDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const gameId = params.id;

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
                <button className="w-full py-2 bg-slate-900 border border-slate-700 hover:border-purple-500 text-slate-300 rounded transition-colors text-sm">
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
    </div>
  );
}

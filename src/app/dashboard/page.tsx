"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { characterService } from "@/services/character.service";
import { gameService } from "@/services/game.service";
import { Character } from "@/types/character";
import { Game } from "@/types/game";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [userCharacters, userGames] = await Promise.all([
          characterService.getMyCharacters(),
          gameService.getMyGames(),
        ]);
        setCharacters(userCharacters);
        setGames(userGames);
      } catch (err: unknown) {
        console.error("Error cargando datos del dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <p className="text-amber-500 font-semibold text-lg animate-pulse">
          Cargando tus aventuras...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      {/* Header */}
      <header className="max-w-6xl mx-auto flex justify-between items-center pb-6 mb-8 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-bold text-amber-500">
            D&D Party Manager
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Bienvenido,{" "}
            <span className="text-slate-200 font-medium">{user?.name}</span>
          </p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm border border-slate-700 transition-colors"
        >
          Cerrar Sesión
        </button>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sección: Mis Partidas como DM */}
        <section className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-amber-400">
              Mis Partidas (DM)
            </h2>
            <Link
              href="/games/new"
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              + Nueva Partida
            </Link>
          </div>

          {games.length === 0 ? (
            <p className="text-slate-500 text-sm italic py-4">
              No has creado ninguna partida todavía.
            </p>
          ) : (
            <ul className="space-y-3">
              {games.map((game) => (
                <li
                  key={game.id}
                  className="p-4 bg-slate-900/60 rounded-lg border border-slate-700/50 flex justify-between items-center hover:border-amber-500/50 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-slate-200">{game.name}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Código de sala:{" "}
                      <span className="font-mono text-amber-400 bg-slate-800 px-2 py-0.5 rounded">
                        {game.joinCode}
                      </span>
                    </p>
                  </div>
                  <Link
                    href={`/games/${game.id}`}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 rounded text-xs transition-colors"
                  >
                    Entrar a la Sala
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Sección: Mis Personajes */}
        <section className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-amber-400">Mis Personajes</h2>
            <div className="flex gap-2">
              <Link
                href="/games/join"
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                Unirse a Sala
              </Link>
              <Link
                href="/characters/new"
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                + Crear Héroe
              </Link>
            </div>
          </div>

          {characters.length === 0 ? (
            <p className="text-slate-500 text-sm italic py-4">
              Aún no tienes ningún personaje creado.
            </p>
          ) : (
            <ul className="space-y-3">
              {characters.map((char) => (
                <li
                  key={char.id}
                  className="p-4 bg-slate-900/60 rounded-lg border border-slate-700/50 flex justify-between items-center hover:border-amber-500/50 transition-colors"
                >
                  <div>
                    <Link
                      href={`/characters/${char.id}`}
                      className="font-semibold text-slate-200 hover:text-amber-400 transition-colors"
                    >
                      {char.name}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {char.race} {char.class} — Nivel {char.level}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Vida: {char.current_hp} / {char.max_hp} HP
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/characters/${char.id}`}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 rounded text-xs transition-colors"
                    >
                      Ver Ficha
                    </Link>
                    {char.game ? (
                      <Link
                        href={`/games/${char.game.id}`}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs transition-colors"
                      >
                        Entrar a: {char.game.name}
                      </Link>
                    ) : (
                      <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded border border-slate-700">
                        Sin Partida
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

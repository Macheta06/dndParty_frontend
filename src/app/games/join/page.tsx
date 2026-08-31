"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { gameService } from "@/services/game.service";
import { characterService } from "@/services/character.service";
import { Character } from "@/types/character";
import axios from "axios";

export default function JoinGamePage() {
  const router = useRouter();

  const [joinCode, setJoinCode] = useState("");
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | "">(
    "",
  );
  const [characters, setCharacters] = useState<Character[]>([]);

  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCharacters() {
      try {
        const data = await characterService.getMyCharacters();
        const available = data.filter((c) => !c.game);
        setCharacters(available);
      } catch (err) {
        console.error("Error cargando personajes:", err);
      } finally {
        setLoadingCharacters(false);
      }
    }
    loadCharacters();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCharacterId) {
      setError("Debes seleccionar un personaje");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const result = await gameService.joinGame({
        joinCode: joinCode.trim().toUpperCase(),
        characterId: Number(selectedCharacterId),
      });
      router.push(`/games/${result.game.id}`);
    } catch (err: unknown) {
      let errorMessage = "Error al unirse a la sala";
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as
          | { message?: string | string[] }
          | undefined;
        if (responseData?.message) {
          errorMessage = Array.isArray(responseData.message)
            ? responseData.message.join(", ")
            : responseData.message;
        }
      }
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-xs text-amber-500 hover:underline"
          >
            ← Volver al Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-100 mt-2">
            Unirse a una Partida
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pídele el código de sala a tu Dungeon Master.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">
              Código de la Sala (6 caracteres)
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Ej: A4F9B2"
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-500 text-slate-100 font-mono tracking-widest uppercase"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">
              Selecciona tu Personaje
            </label>

            {loadingCharacters ? (
              <p className="text-xs text-slate-500 py-2">
                Cargando tus héroes...
              </p>
            ) : characters.length === 0 ? (
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-700 text-xs text-slate-400">
                No tienes personajes disponibles (o todos ya están en una
                partida).{" "}
                <Link
                  href="/characters/new"
                  className="text-amber-500 underline"
                >
                  Crea uno primero
                </Link>
              </div>
            ) : (
              <select
                required
                value={selectedCharacterId}
                onChange={(e) => setSelectedCharacterId(Number(e.target.value))}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-500 text-slate-100"
              >
                <option value="">-- Elige un héroe --</option>
                {characters.map((char) => (
                  <option key={char.id} value={char.id}>
                    {char.name} ({char.race} {char.class} - Nivel {char.level})
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || characters.length === 0}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 mt-4"
          >
            {submitting ? "Uniéndose..." : "Entrar a la Sala"}
          </button>
        </form>
      </div>
    </div>
  );
}

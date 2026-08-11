"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { gameService } from "@/services/game.service";
import axios from "axios";

export default function NewGamePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await gameService.createGame({ name });
      router.push("/dashboard");
    } catch (err: unknown) {
      let errorMessage = "Error al crear la partida";
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
      setLoading(false);
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
            Crear Nueva Partida
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Como Dungeon Master, serás el guía de esta aventura.
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
              Nombre de la Campaña / Mesa
            </label>
            <input
              type="text"
              required
              maxLength={50}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: La Mina Perdida de Phandelver"
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-amber-500 text-slate-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 mt-4"
          >
            {loading ? "Generando sala..." : "Crear Sala y Obtener Código"}
          </button>
        </form>
      </div>
    </div>
  );
}

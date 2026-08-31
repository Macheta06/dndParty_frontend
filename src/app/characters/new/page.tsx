"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  characterService,
  CreateCharacterDto,
} from "@/services/character.service";
import axios from "axios";

export default function NewCharacterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateCharacterDto>({
    name: "",
    class: "Fighter",
    race: "Human",
    alignment: "True Neutral",
    background: "Folk Hero",
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    armor: 10,
    initiative: 0,
    speed: 30,
    max_hp: 10,
    current_hp: 10,
    hitDice: "1d10",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const created = await characterService.createCharacter(formData);
      router.push(`/characters/${created.id}`);
    } catch (err: unknown) {
      let errorMessage = "Error al forjar tu personaje";
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

  const STATS: (keyof CreateCharacterDto)[] = [
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma",
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header del Formulario */}
        <div className="bg-slate-950 px-8 py-6 border-b border-slate-700">
          <Link
            href="/dashboard"
            className="text-xs text-amber-500 hover:underline mb-2 inline-block"
          >
            ← Volver a la Taberna
          </Link>
          <h1 className="text-3xl font-bold text-slate-100">Forja de Héroe</h1>
          <p className="text-slate-400 text-sm mt-1">
            Completa los atributos de tu nuevo aventurero.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Sección 1: Información Básica */}
          <div>
            <h2 className="text-xl font-bold text-amber-500 mb-4 border-b border-slate-700 pb-2">
              Datos Básicos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm text-slate-300 mb-1">
                  Nombre del Personaje
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:border-amber-500 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Clase
                </label>
                <input
                  type="text"
                  name="class"
                  required
                  value={formData.class}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:border-amber-500 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Raza
                </label>
                <input
                  type="text"
                  name="race"
                  required
                  value={formData.race}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:border-amber-500 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">
                  Trasfondo
                </label>
                <input
                  type="text"
                  name="background"
                  required
                  value={formData.background}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:border-amber-500 text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Atributos y Combate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Stats Principales */}
            <div>
              <h2 className="text-xl font-bold text-amber-500 mb-4 border-b border-slate-700 pb-2">
                Atributos (1-20)
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {STATS.map((stat) => (
                  <div
                    key={stat}
                    className="bg-slate-900 p-2 rounded border border-slate-700 text-center"
                  >
                    <label className="block text-xs uppercase text-slate-400 mb-1">
                      {stat.substring(0, 3)}
                    </label>
                    <input
                      type="number"
                      name={stat}
                      min={1}
                      max={30}
                      value={formData[stat]} // Totalmente seguro
                      onChange={handleChange}
                      className="w-full bg-transparent text-center font-bold text-lg text-slate-100 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Combate */}
            <div>
              <h2 className="text-xl font-bold text-amber-500 mb-4 border-b border-slate-700 pb-2">
                Combate
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">
                    Clase de Armadura (AC)
                  </label>
                  <input
                    type="number"
                    name="armor"
                    required
                    min={0}
                    value={formData.armor}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:border-amber-500 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">
                    HP Máximo
                  </label>
                  <input
                    type="number"
                    name="max_hp"
                    required
                    min={1}
                    value={formData.max_hp}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:border-amber-500 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">
                    Velocidad (ft)
                  </label>
                  <input
                    type="number"
                    name="speed"
                    required
                    min={0}
                    value={formData.speed}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:border-amber-500 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">
                    Dado de Golpe (ej. 1d10)
                  </label>
                  <input
                    type="text"
                    name="hitDice"
                    required
                    value={formData.hitDice}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:border-amber-500 text-slate-100"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-lg transition-colors mt-8 disabled:opacity-50"
          >
            {loading ? "Invocando héroe..." : "Crear Personaje"}
          </button>
        </form>
      </div>
    </div>
  );
}

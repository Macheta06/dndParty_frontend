"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  characterService,
  CreateCharacterDto,
} from "@/services/character.service";
import {
  DND_CLASSES,
  DND_RACES,
  DND_BACKGROUNDS,
  DND_ALIGNMENTS,
  getClassDetail,
  getRaceDetail,
  getBackgroundDetail,
  getStartingEquipment,
  getStartingFeats,
  getStartingProficiencies,
  StatKey,
} from "@/constants/dnd";
import axios from "axios";

const STAT_NAMES: Record<StatKey, { short: string; full: string }> = {
  strength: { short: "FUE", full: "Fuerza" },
  dexterity: { short: "DES", full: "Destreza" },
  constitution: { short: "CON", full: "Constitución" },
  intelligence: { short: "INT", full: "Inteligencia" },
  wisdom: { short: "SAB", full: "Sabiduría" },
  charisma: { short: "CAR", full: "Carisma" },
};

function calculateDerivedStats(data: {
  class: string;
  race: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}) {
  const clsDetail = getClassDetail(data.class);
  const raceDetail = getRaceDetail(data.race);

  const conMod = Math.floor((data.constitution - 10) / 2);
  const dexMod = Math.floor((data.dexterity - 10) / 2);
  const wisMod = Math.floor((data.wisdom - 10) / 2);

  const baseHp = clsDetail?.baseHp ?? 10;
  const max_hp = Math.max(1, baseHp + conMod);
  const hitDice = clsDetail?.hitDice ?? "1d10";
  const speed = raceDetail?.speed ?? 30;

  let armor = 10 + dexMod;
  if (data.class.toLowerCase() === "barbarian") {
    armor = 10 + dexMod + conMod;
  } else if (data.class.toLowerCase() === "monk") {
    armor = 10 + dexMod + wisMod;
  }

  return {
    max_hp,
    current_hp: max_hp,
    hitDice,
    speed,
    armor,
    initiative: dexMod,
  };
}

export default function NewCharacterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateCharacterDto>(() => {
    const initialClass = "Fighter";
    const initialRace = "Human";
    const initialBackground = "Folk Hero";
    const derived = calculateDerivedStats({
      class: initialClass,
      race: initialRace,
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    });

    return {
      name: "",
      class: initialClass,
      race: initialRace,
      alignment: "True Neutral",
      background: initialBackground,
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
      ...derived,
    };
  });

  const selectedClassInfo = getClassDetail(formData.class);
  const selectedRaceInfo = getRaceDetail(formData.race);
  const selectedBackgroundInfo = getBackgroundDetail(formData.background);

  const startingPack = getStartingEquipment(formData.class, formData.background);
  const startingFeats = getStartingFeats(formData.background);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const val = type === "number" ? Number(value) : value;

    setFormData((prev) => {
      const next = { ...prev, [name]: val };
      const derived = calculateDerivedStats(next);
      return { ...next, ...derived };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const startingProfs = getStartingProficiencies(
        formData.background,
        formData.race,
      );

      const finalPayload: CreateCharacterDto = {
        ...formData,
        gold_coins: startingPack.startingGold,
        equipment: startingPack.equipment,
        feature_traits: startingFeats,
        proficiencies: startingProfs,
      };

      const created = await characterService.createCharacter(finalPayload);
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

  const STATS: StatKey[] = [
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
            Configura tu aventurero de acuerdo con las reglas oficiales de D&D (Manual del Jugador 2024).
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
                <label className="block text-sm text-slate-300 mb-1 font-semibold">
                  Nombre del Personaje
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej: Thorin Escudoderoble"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:border-amber-500 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1 font-semibold">
                  Clase
                </label>
                <select
                  name="class"
                  required
                  value={formData.class}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:border-amber-500 text-slate-100 font-medium"
                >
                  {DND_CLASSES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1 font-semibold">
                  Raza (Especie)
                </label>
                <select
                  name="race"
                  required
                  value={formData.race}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:border-amber-500 text-slate-100 font-medium"
                >
                  {DND_RACES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1 font-semibold">
                  Trasfondo (Manual 2024)
                </label>
                <select
                  name="background"
                  required
                  value={formData.background}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:border-amber-500 text-slate-100 font-medium"
                >
                  {DND_BACKGROUNDS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-300 mb-1 font-semibold">
                  Alineamiento
                </label>
                <select
                  name="alignment"
                  required
                  value={formData.alignment}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded focus:border-amber-500 text-slate-100 font-medium"
                >
                  {DND_ALIGNMENTS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ficha Guía de Clase, Raza, Trasfondo, Dote y Equipo Inicial */}
            <div className="mt-4 p-4 bg-slate-950/80 border border-amber-500/30 rounded-lg space-y-3">
              {/* Clase */}
              {selectedClassInfo && (
                <div className="space-y-1.5 border-b border-slate-800 pb-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-amber-400 font-bold text-sm flex items-center gap-1.5">
                      🛡️ Clase: {selectedClassInfo.label}
                    </span>
                    <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
                      Dado de Golpe: {selectedClassInfo.hitDice}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedClassInfo.description}
                  </p>
                  <div className="text-xs text-amber-200/90 font-medium bg-amber-950/30 p-2 rounded border border-amber-500/20">
                    <span className="font-bold text-amber-400">💡 Atributos Recomendados:</span>{" "}
                    {selectedClassInfo.statAdvice}
                  </div>
                </div>
              )}

              {/* Raza */}
              {selectedRaceInfo && (
                <div className="text-xs text-slate-300 flex items-center justify-between border-b border-slate-800 pb-2">
                  <span>
                    <strong className="text-slate-200">🧬 Raza ({selectedRaceInfo.label}):</strong>{" "}
                    Bonificador {selectedRaceInfo.statBonusText}
                  </span>
                  <span className="text-sky-400 font-mono">
                    Velocidad: {selectedRaceInfo.speed} ft
                  </span>
                </div>
              )}

              {/* Trasfondo y Dote */}
              {selectedBackgroundInfo && (
                <div className="space-y-1 text-xs text-slate-300 border-b border-slate-800 pb-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-amber-300">
                      📜 Trasfondo: {selectedBackgroundInfo.label}
                    </span>
                    <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-medium">
                      ✨ Dote de Origen: {selectedBackgroundInfo.feat}
                    </span>
                  </div>
                  <p className="text-slate-400 italic">
                    {selectedBackgroundInfo.description}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] pt-1">
                    <span className="text-emerald-400">
                      <strong>Competencias:</strong> {selectedBackgroundInfo.skills}
                    </span>
                    <span className="text-cyan-400">
                      <strong>Aumento de Atributos:</strong> {selectedBackgroundInfo.abilityOptions}
                    </span>
                  </div>
                </div>
              )}

              {/* Previsualización de Equipo Inicial */}
              <div className="text-xs space-y-1 pt-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 flex items-center gap-1">
                    🎒 Equipamiento Inicial Otorgado:
                  </span>
                  <span className="text-yellow-400 font-bold font-mono">
                    🪙 {startingPack.startingGold} PO iniciales
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {startingPack.displayEquipment.map((item) => (
                    <span
                      key={item.name}
                      className="bg-slate-900 border border-slate-700 text-slate-300 text-[11px] px-2 py-0.5 rounded"
                    >
                      {item.name} <strong className="text-amber-400 font-mono">x{item.quantity}</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sección 2: Puntuaciones de Atributos */}
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
              <h2 className="text-xl font-bold text-amber-500">
                Puntuaciones de Atributos (1-20)
              </h2>
              <span className="text-xs text-slate-400">
                ★ = Atributo recomendado para {selectedClassInfo?.label}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {STATS.map((stat) => {
                const isPrimary = selectedClassInfo?.primaryStats.includes(stat);
                const statInfo = STAT_NAMES[stat];
                const mod = Math.floor((formData[stat] - 10) / 2);
                const modStr = mod >= 0 ? `+${mod}` : `${mod}`;

                return (
                  <div
                    key={stat}
                    className={`p-3 rounded border text-center transition-all relative ${
                      isPrimary
                        ? "bg-amber-950/40 border-amber-500/80 ring-1 ring-amber-500/40 shadow-lg shadow-amber-500/5"
                        : "bg-slate-900 border-slate-700"
                    }`}
                  >
                    {isPrimary && (
                      <span className="absolute -top-2 -right-1 text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full shadow">
                        ★
                      </span>
                    )}
                    <label className="block text-xs uppercase font-bold text-slate-300 mb-0.5">
                      {statInfo.short}
                    </label>
                    <span className="block text-[10px] text-slate-400 mb-1">
                      {statInfo.full}
                    </span>
                    <input
                      type="number"
                      name={stat}
                      min={1}
                      max={30}
                      value={formData[stat]}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded py-1 text-center font-bold text-xl text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                    <span className="block text-xs font-semibold text-amber-400/90 mt-1.5 font-mono">
                      Mod: {modStr}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sección 3: Estadísticas de Combate Derivadas */}
          <div>
            <h2 className="text-xl font-bold text-amber-500 mb-4 border-b border-slate-700 pb-2">
              Estadísticas Calculadas (Nivel 1)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* HP Máximo */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-700 flex flex-col items-center justify-center text-center">
                <span className="text-xs uppercase text-slate-400 font-semibold mb-1">
                  Puntos de Vida (HP)
                </span>
                <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                  {formData.max_hp}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Base ({selectedClassInfo?.baseHp}) + Mod. CON
                </span>
              </div>

              {/* Clase de Armadura */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-700 flex flex-col items-center justify-center text-center">
                <span className="text-xs uppercase text-slate-400 font-semibold mb-1">
                  Clase de Armadura (AC)
                </span>
                <span className="text-3xl font-extrabold text-amber-400 font-mono">
                  {formData.armor}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  {formData.class.toLowerCase() === "barbarian"
                    ? "Defensa sin Armadura (10 + DES + CON)"
                    : formData.class.toLowerCase() === "monk"
                    ? "Defensa sin Armadura (10 + DES + SAB)"
                    : "Base sin Armadura (10 + DES)"}
                </span>
              </div>

              {/* Dado de Golpe */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-700 flex flex-col items-center justify-center text-center">
                <span className="text-xs uppercase text-slate-400 font-semibold mb-1">
                  Dado de Golpe
                </span>
                <span className="text-3xl font-extrabold text-purple-400 font-mono">
                  {formData.hitDice}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Fijo por Clase ({selectedClassInfo?.label})
                </span>
              </div>

              {/* Velocidad */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-700 flex flex-col items-center justify-center text-center">
                <span className="text-xs uppercase text-slate-400 font-semibold mb-1">
                  Velocidad
                </span>
                <span className="text-3xl font-extrabold text-sky-400 font-mono">
                  {formData.speed} <span className="text-sm font-normal text-slate-400">ft</span>
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Base Racial ({selectedRaceInfo?.label})
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-lg transition-colors mt-8 disabled:opacity-50 shadow-lg shadow-amber-600/20"
          >
            {loading ? "Invocando héroe..." : "Crear Personaje"}
          </button>
        </form>
      </div>
    </div>
  );
}

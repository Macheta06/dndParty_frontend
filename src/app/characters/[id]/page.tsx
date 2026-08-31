"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { characterService } from "@/services/character.service";
import { Character } from "@/types/character";
import axios from "axios";

const STAT_LABELS: Record<string, string> = {
  strength: "FUE",
  dexterity: "DES",
  constitution: "CON",
  intelligence: "INT",
  wisdom: "SAB",
  charisma: "CAR",
};

const STAT_KEYS = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const;

function getModifier(stat: number): string {
  const mod = Math.floor((stat - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function getHpColor(current: number, max: number): string {
  if (max === 0) return "bg-slate-600";
  const pct = current / max;
  if (pct > 0.5) return "bg-emerald-500";
  if (pct > 0.25) return "bg-yellow-500";
  return "bg-red-500";
}

export default function CharacterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Character>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await characterService.getCharacterById(id);
        if (!cancelled) {
          setCharacter(data);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        let msg = "Error al cargar el personaje";
        if (axios.isAxiosError(err)) {
          const resp = err.response?.data as
            | { message?: string | string[] }
            | undefined;
          if (resp?.message) {
            msg = Array.isArray(resp.message)
              ? resp.message.join(", ")
              : resp.message;
          }
        }
        setError(msg);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const startEditing = () => {
    if (!character) return;
    setEditData({ ...character });
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditData({});
  };

  const handleFieldChange = (
    field: keyof Character,
    value: string | number,
  ) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleJsonFieldChange = (field: keyof Character, raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      setEditData((prev) => ({ ...prev, [field]: parsed }));
    } catch {
      // keep the raw string while typing; save will parse it
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await characterService.updateCharacter(id, editData);
      setCharacter(updated);
      setEditing(false);
      setEditData({});
    } catch (err: unknown) {
      let msg = "Error al guardar";
      if (axios.isAxiosError(err)) {
        const resp = err.response?.data as
          | { message?: string | string[] }
          | undefined;
        if (resp?.message) {
          msg = Array.isArray(resp.message)
            ? resp.message.join(", ")
            : resp.message;
        }
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Estás seguro de que quieres desactivar este personaje?")) {
      return;
    }
    setDeleting(true);
    try {
      await characterService.deleteCharacter(id);
      router.push("/dashboard");
    } catch (err: unknown) {
      let msg = "Error al desactivar el personaje";
      if (axios.isAxiosError(err)) {
        const resp = err.response?.data as
          | { message?: string | string[] }
          | undefined;
        if (resp?.message) {
          msg = Array.isArray(resp.message)
            ? resp.message.join(", ")
            : resp.message;
        }
      }
      setError(msg);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <p className="text-amber-500 font-semibold text-lg animate-pulse">
          Cargando ficha de personaje...
        </p>
      </div>
    );
  }

  if (error && !character) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-lg">{error}</p>
        <Link
          href="/dashboard"
          className="text-amber-500 hover:underline text-sm"
        >
          ← Volver al Dashboard
        </Link>
      </div>
    );
  }

  if (!character) return null;

  const e = editing ? editData : character;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="text-xs text-amber-500 hover:underline inline-block"
        >
          ← Volver al Dashboard
        </Link>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 underline text-red-300"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Sección 1 — Cabecera */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              {editing ? (
                <input
                  type="text"
                  value={String(e.name ?? "")}
                  onChange={(ev) => handleFieldChange("name", ev.target.value)}
                  className="w-full text-3xl font-bold bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 focus:border-amber-500"
                />
              ) : (
                <h1 className="text-3xl font-bold text-amber-500">
                  {character.name}
                </h1>
              )}
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-400">
                {editing ? (
                  <>
                    <input
                      type="text"
                      value={String(e.class ?? "")}
                      onChange={(ev) =>
                        handleFieldChange("class", ev.target.value)
                      }
                      placeholder="Clase"
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 w-28 focus:border-amber-500"
                    />
                    <input
                      type="text"
                      value={String(e.race ?? "")}
                      onChange={(ev) =>
                        handleFieldChange("race", ev.target.value)
                      }
                      placeholder="Raza"
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 w-28 focus:border-amber-500"
                    />
                    <input
                      type="number"
                      value={Number(e.level ?? 1)}
                      onChange={(ev) =>
                        handleFieldChange("level", Number(ev.target.value))
                      }
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 w-16 focus:border-amber-500"
                    />
                    <input
                      type="text"
                      value={String(e.alignment ?? "")}
                      onChange={(ev) =>
                        handleFieldChange("alignment", ev.target.value)
                      }
                      placeholder="Alineamiento"
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 w-36 focus:border-amber-500"
                    />
                    <input
                      type="text"
                      value={String(e.background ?? "")}
                      onChange={(ev) =>
                        handleFieldChange("background", ev.target.value)
                      }
                      placeholder="Trasfondo"
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 w-36 focus:border-amber-500"
                    />
                  </>
                ) : (
                  <>
                    <span>
                      {character.class} — Nivel {character.level}
                    </span>
                    <span>{character.race}</span>
                    <span>{character.alignment}</span>
                    <span>{character.background}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {character.game && (
                <Link
                  href={`/games/${character.game.id}`}
                  className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-xs hover:bg-emerald-500/20 transition-colors"
                >
                  {character.game.name}
                </Link>
              )}
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={startEditing}
                  disabled={!!character.game}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title={character.game ? "No se puede editar un personaje en una partida activa" : undefined}
                >
                  Editar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sección 2 — Stats */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-amber-400 mb-4 border-b border-slate-700 pb-2">
            Atributos
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {STAT_KEYS.map((key) => (
              <div
                key={key}
                className="bg-slate-900 p-3 rounded border border-slate-700 text-center"
              >
                <span className="block text-xs uppercase text-slate-400 mb-1">
                  {STAT_LABELS[key]}
                </span>
                {editing ? (
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={Number(e[key] ?? 10)}
                    onChange={(ev) =>
                      handleFieldChange(key, Number(ev.target.value))
                    }
                    className="w-full bg-transparent text-center font-bold text-lg text-slate-100 focus:outline-none"
                  />
                ) : (
                  <>
                    <span className="block text-2xl font-bold text-slate-100">
                      {character[key]}
                    </span>
                    <span className="block text-xs text-slate-400">
                      {getModifier(character[key] as number)}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sección 3 — Combate */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-amber-400 mb-4 border-b border-slate-700 pb-2">
            Combate
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* HP */}
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">
                Puntos de Golpe
              </label>
              {editing ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    value={Number(e.current_hp ?? 0)}
                    onChange={(ev) =>
                      handleFieldChange("current_hp", Number(ev.target.value))
                    }
                    className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-center focus:border-amber-500"
                  />
                  <span className="text-slate-500 self-center">/</span>
                  <input
                    type="number"
                    min={1}
                    value={Number(e.max_hp ?? 1)}
                    onChange={(ev) =>
                      handleFieldChange("max_hp", Number(ev.target.value))
                    }
                    className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-center focus:border-amber-500"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Temp"
                    value={Number(e.temporary_hp ?? 0)}
                    onChange={(ev) =>
                      handleFieldChange(
                        "temporary_hp",
                        Number(ev.target.value),
                      )
                    }
                    className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-center focus:border-amber-500"
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline gap-1 text-lg font-bold">
                    <span className="text-slate-100">
                      {character.current_hp}
                    </span>
                    {character.temporary_hp > 0 && (
                      <span className="text-blue-400 text-sm">
                        (+{character.temporary_hp})
                      </span>
                    )}
                    <span className="text-slate-500">
                      / {character.max_hp}
                    </span>
                  </div>
                  <div className="mt-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getHpColor(character.current_hp, character.max_hp)}`}
                      style={{
                        width: `${Math.max(0, Math.min(100, (character.current_hp / character.max_hp) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* AC */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">CA</label>
              {editing ? (
                <input
                  type="number"
                  min={0}
                  value={Number(e.armor ?? 0)}
                  onChange={(ev) =>
                    handleFieldChange("armor", Number(ev.target.value))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-center focus:border-amber-500"
                />
              ) : (
                <span className="text-xl font-bold text-slate-100">
                  {character.armor}
                </span>
              )}
            </div>

            {/* Initiative */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Iniciativa
              </label>
              {editing ? (
                <input
                  type="number"
                  value={Number(e.initiative ?? 0)}
                  onChange={(ev) =>
                    handleFieldChange("initiative", Number(ev.target.value))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-center focus:border-amber-500"
                />
              ) : (
                <span className="text-xl font-bold text-slate-100">
                  {getModifier(character.dexterity)} ({character.initiative})
                </span>
              )}
            </div>

            {/* Speed */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Velocidad
              </label>
              {editing ? (
                <input
                  type="number"
                  min={0}
                  value={Number(e.speed ?? 0)}
                  onChange={(ev) =>
                    handleFieldChange("speed", Number(ev.target.value))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-center focus:border-amber-500"
                />
              ) : (
                <span className="text-xl font-bold text-slate-100">
                  {character.speed} ft
                </span>
              )}
            </div>
          </div>

          {/* Hit Dice */}
          <div className="mt-4">
            <label className="block text-xs text-slate-400 mb-1">
              Dado de Golpe
            </label>
            {editing ? (
              <input
                type="text"
                value={String(e.hitDice ?? "")}
                onChange={(ev) =>
                  handleFieldChange("hitDice", ev.target.value)
                }
                className="w-32 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-amber-500"
              />
            ) : (
              <span className="text-slate-200">{character.hitDice}</span>
            )}
          </div>
        </div>

        {/* Sección 4 — Economía */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-amber-400 mb-4 border-b border-slate-700 pb-2">
            Economía
          </h2>
          <div className="flex gap-6">
            {(
              [
                ["gold_coins", "Oro", "text-yellow-400"],
                ["silver_coins", "Plata", "text-slate-300"],
                ["copper_coins", "Cobre", "text-amber-700"],
              ] as const
            ).map(([key, label, color]) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1">
                  {label}
                </label>
                {editing ? (
                  <input
                    type="number"
                    min={0}
                    value={Number(e[key] ?? 0)}
                    onChange={(ev) =>
                      handleFieldChange(key, Number(ev.target.value))
                    }
                    className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-amber-500"
                  />
                ) : (
                  <span className={`text-lg font-bold ${color}`}>
                    {character[key]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sección 5 — Personalidad */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-amber-400 mb-4 border-b border-slate-700 pb-2">
            Personalidad
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(
              [
                ["personality_traits", "Rasgos de Personalidad"],
                ["ideals", "Ideales"],
                ["bonds", "Vínculos"],
                ["flaws", "Defectos"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1">
                  {label}
                </label>
                {editing ? (
                  <textarea
                    value={String(e[key] ?? "")}
                    onChange={(ev) =>
                      handleFieldChange(key, ev.target.value)
                    }
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 text-sm focus:border-amber-500 resize-none"
                  />
                ) : (
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">
                    {character[key] || (
                      <span className="text-slate-600 italic">Sin definir</span>
                    )}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sección 6 — Apariencia */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-amber-400 mb-4 border-b border-slate-700 pb-2">
            Apariencia
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(
              [
                ["age", "Edad"],
                ["height", "Altura"],
                ["weight", "Peso"],
                ["skin", "Piel"],
                ["hair", "Cabello"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1">
                  {label}
                </label>
                {editing ? (
                  <input
                    type={key === "skin" ? "text" : "number"}
                    value={String(e[key] ?? "")}
                    onChange={(ev) =>
                      handleFieldChange(
                        key,
                        key === "skin" ? ev.target.value : Number(ev.target.value),
                      )
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-amber-500"
                  />
                ) : (
                  <span className="text-sm text-slate-300">
                    {character[key] != null
                      ? String(character[key])
                      : "—"}
                  </span>
                )}
              </div>
            ))}
          </div>
          {/* appearance_img */}
          <div className="mt-4">
            <label className="block text-xs text-slate-400 mb-1">
              Imagen de Apariencia
            </label>
            {editing ? (
              <input
                type="text"
                value={String(e.appearance_img ?? "")}
                onChange={(ev) =>
                  handleFieldChange("appearance_img", ev.target.value)
                }
                placeholder="URL de imagen"
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-amber-500"
              />
            ) : character.appearance_img ? (
              <img
                src={character.appearance_img}
                alt={`Apariencia de ${character.name}`}
                className="max-w-xs rounded border border-slate-700 mt-2"
              />
            ) : (
              <span className="text-sm text-slate-600 italic">
                Sin imagen
              </span>
            )}
          </div>
        </div>

        {/* Sección 7 — Historia y Aliados */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-amber-400 mb-4 border-b border-slate-700 pb-2">
            Historia y Aliados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Historia
              </label>
              {editing ? (
                <textarea
                  value={String(e.story ?? "")}
                  onChange={(ev) => handleFieldChange("story", ev.target.value)}
                  rows={5}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 text-sm focus:border-amber-500 resize-none"
                />
              ) : (
                <p className="text-sm text-slate-300 whitespace-pre-wrap">
                  {character.story || (
                    <span className="text-slate-600 italic">
                      Sin historia definida
                    </span>
                  )}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Aliados
              </label>
              {editing ? (
                <textarea
                  value={String(e.allies ?? "")}
                  onChange={(ev) =>
                    handleFieldChange("allies", ev.target.value)
                  }
                  rows={5}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 text-sm focus:border-amber-500 resize-none"
                />
              ) : (
                <p className="text-sm text-slate-300 whitespace-pre-wrap">
                  {character.allies || (
                    <span className="text-slate-600 italic">
                      Sin aliados definidos
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sección 8 — Equipo, Proficiencies, Spells */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-amber-400 mb-4 border-b border-slate-700 pb-2">
            Equipo y Habilidades
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(
              [
                ["equipment", "Equipamiento"],
                ["proficiencies", "Competencias"],
                ["spells", "Hechizos"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1">
                  {label}
                </label>
                {editing ? (
                  <textarea
                    value={JSON.stringify(e[key] ?? [], null, 2)}
                    onChange={(ev) =>
                      handleJsonFieldChange(key, ev.target.value)
                    }
                    rows={6}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 text-xs font-mono focus:border-amber-500 resize-none"
                  />
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {Array.isArray(character[key]) &&
                    (character[key] as unknown[]).length > 0 ? (
                      (character[key] as unknown[]).map(
                        (item: unknown, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300"
                          >
                            {typeof item === "string"
                              ? item
                              : JSON.stringify(item)}
                          </span>
                        ),
                      )
                    ) : (
                      <span className="text-slate-600 italic text-xs">
                        Vacío
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Experiencia, Proficiency Bonus, Inspiration */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex flex-wrap gap-6">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Experiencia
              </label>
              {editing ? (
                <input
                  type="number"
                  min={0}
                  value={Number(e.exp ?? 0)}
                  onChange={(ev) =>
                    handleFieldChange("exp", Number(ev.target.value))
                  }
                  className="w-28 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-amber-500"
                />
              ) : (
                <span className="text-lg font-bold text-slate-100">
                  {character.exp} XP
                </span>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Bono de Competencia
              </label>
              {editing ? (
                <input
                  type="number"
                  min={0}
                  value={Number(e.proficiency ?? 2)}
                  onChange={(ev) =>
                    handleFieldChange("proficiency", Number(ev.target.value))
                  }
                  className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-amber-500"
                />
              ) : (
                <span className="text-lg font-bold text-slate-100">
                  +{character.proficiency}
                </span>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Inspiración
              </label>
              {editing ? (
                <input
                  type="number"
                  min={0}
                  value={Number(e.inspiration ?? 0)}
                  onChange={(ev) =>
                    handleFieldChange("inspiration", Number(ev.target.value))
                  }
                  className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-amber-500"
                />
              ) : (
                <span className="text-lg font-bold text-slate-100">
                  {character.inspiration}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Botón Desactivar */}
        {!editing && (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex justify-between items-center">
            {character.game ? (
              <p className="text-xs text-slate-400">
                Este personaje está en la partida{" "}
                <span className="text-emerald-400 font-semibold">{character.game.name}</span>.
                No puede ser editado ni desactivado hasta que el DM lo saque de la sala.
              </p>
            ) : (
              <span />
            )}
            <button
              onClick={handleDelete}
              disabled={deleting || !!character.game}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={character.game ? "No se puede desactivar un personaje en una partida activa" : undefined}
            >
              {deleting ? "Desactivando..." : "Desactivar Personaje"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

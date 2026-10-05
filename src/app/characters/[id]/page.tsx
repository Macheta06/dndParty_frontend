"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { characterService } from "@/services/character.service";
import { Character } from "@/types/character";
import { SRD_ITEMS, SrdItem } from "@/constants/item-catalog";
import { apiErrorMessage } from "@/lib/api-error";
import EquipButton from "@/components/EquipButton";
import {
  SLOT_ICONS,
  SLOT_LABELS,
  describeItemStats,
  findCatalogItem,
  getAllowedSlots,
  normalizeItemName,
  resolveItem,
} from "@/lib/equipment";
import {
  DND_CLASSES,
  DND_RACES,
  DND_BACKGROUNDS,
  DND_ALIGNMENTS,
  DND_SKILLS,
  getClassLabel,
  getRaceLabel,
  getBackgroundLabel,
  getAlignmentLabel,
  getProficiencyBonus,
  getStartingProficiencies,
  getProficiencySource,
  getStartingFeats,
  EquipmentItem,
  EquipmentSlot,
  FeatItem,
} from "@/constants/dnd";
import { CharacterSheetSkeleton } from "@/components/Skeletons";
import axios from "axios";

const STAT_LABELS: Record<string, string> = {
  strength: "FUE",
  dexterity: "DES",
  constitution: "CON",
  intelligence: "INT",
  wisdom: "SAB",
  charisma: "CAR",
};

const STAT_NAMES_FULL: Record<string, string> = {
  strength: "Fuerza",
  dexterity: "Destreza",
  constitution: "Constitución",
  intelligence: "Inteligencia",
  wisdom: "Sabiduría",
  charisma: "Carisma",
};

const STAT_KEYS = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const;

const SLOTS = ["armor", "shield", "weapon-main", "weapon-offhand"] as const;

function getModifier(stat: number): string {
  const mod = Math.floor((stat - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/** Copia del item sin el slot (desequipado). */
function stripSlot(item: EquipmentItem): EquipmentItem {
  const copy: EquipmentItem = { ...item };
  delete copy.slot;
  return copy;
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

  // Controles interactivos de Economía y Vida en vivo
  const [editingCoin, setEditingCoin] = useState<
    "gold_coins" | "silver_coins" | "copper_coins" | null
  >(null);
  const [coinInputValue, setCoinInputValue] = useState<string>("");

  // Controles interactivos de Equipamiento y Dotes
  const [isAddingEquip, setIsAddingEquip] = useState(false);
  const [newEquipName, setNewEquipName] = useState("");
  const [newEquipQty, setNewEquipQty] = useState(1);
  const [newEquipDesc, setNewEquipDesc] = useState("");

  const [isAddingFeat, setIsAddingFeat] = useState(false);
  const [newFeatName, setNewFeatName] = useState("");
  const [newFeatCategory, setNewFeatCategory] = useState("Dote de Origen");
  const [newFeatDesc, setNewFeatDesc] = useState("");
  const [pickedEquip, setPickedEquip] = useState<SrdItem | null>(null);

  // Inventario resuelto contra el catálogo (los items legados ganan stats)
  const resolvedEquipment = useMemo(
    () => ((character?.equipment as EquipmentItem[]) || []).map(resolveItem),
    [character?.equipment],
  );

  const equippedSlots = useMemo(() => {
    const map: Partial<Record<(typeof SLOTS)[number], EquipmentItem>> = {};
    for (const item of resolvedEquipment) {
      if (item.slot) map[item.slot] = item;
    }
    return map;
  }, [resolvedEquipment]);

  // Autocompletado del catálogo SRD al escribir el nombre del objeto
  const equipSuggestions = useMemo(() => {
    const query = normalizeItemName(newEquipName);
    if (query.length < 2) return [];
    return SRD_ITEMS.filter((item) =>
      normalizeItemName(item.name).includes(query),
    ).slice(0, 7);
  }, [newEquipName]);

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
    if (
      !window.confirm(
        "¿Estás seguro de que quieres desactivar este personaje?",
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      await characterService.deleteCharacter(id);
      router.push("/dashboard");
    } catch (err: unknown) {
      let msg = "Error al eliminar personaje";
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

  // Handlers para interactividad rápida de monedas
  const handleQuickCoinUpdate = async (
    coinField: "gold_coins" | "silver_coins" | "copper_coins",
    delta: number,
  ) => {
    if (!character) return;
    const currentVal = Number(character[coinField] ?? 0);
    const newVal = Math.max(0, currentVal + delta);

    setCharacter((prev) => (prev ? { ...prev, [coinField]: newVal } : null));

    try {
      await characterService.updateCharacter(id, { [coinField]: newVal });
    } catch {
      setCharacter((prev) => (prev ? { ...prev, [coinField]: currentVal } : null));
      setError("Error al guardar monedas");
    }
  };

  const handleSaveDirectCoin = async (
    coinField: "gold_coins" | "silver_coins" | "copper_coins",
    valStr: string,
  ) => {
    if (!character) return;
    const parsed = parseInt(valStr, 10);
    const newVal = isNaN(parsed) ? 0 : Math.max(0, parsed);
    const currentVal = Number(character[coinField] ?? 0);

    setEditingCoin(null);
    setCharacter((prev) => (prev ? { ...prev, [coinField]: newVal } : null));

    try {
      await characterService.updateCharacter(id, { [coinField]: newVal });
    } catch {
      setCharacter((prev) => (prev ? { ...prev, [coinField]: currentVal } : null));
      setError("Error al guardar monedas");
    }
  };

  // Handler para ajuste rápido de Puntos de Vida (Daño / Curación)
  const handleQuickHpUpdate = async (delta: number) => {
    if (!character) return;
    const currentHp = Number(character.current_hp ?? 0);
    const maxHp = Number(character.max_hp ?? 1);
    const newHp = Math.max(0, Math.min(maxHp, currentHp + delta));

    setCharacter((prev) => (prev ? { ...prev, current_hp: newHp } : null));

    try {
      await characterService.updateCharacter(id, { current_hp: newHp });
    } catch {
      setCharacter((prev) => (prev ? { ...prev, current_hp: currentHp } : null));
      setError("Error al actualizar puntos de vida");
    }
  };

  // Handler para conmutar competencia de habilidad
  const handleToggleProficiency = async (skillName: string) => {
    if (!character) return;
    const currentProfs = (character.proficiencies as string[]) || [];
    const isProf = currentProfs.includes(skillName);
    const updated = isProf
      ? currentProfs.filter((s) => s !== skillName)
      : [...currentProfs, skillName];

    setCharacter((prev) => (prev ? { ...prev, proficiencies: updated } : null));

    try {
      await characterService.updateCharacter(id, { proficiencies: updated });
    } catch {
      setCharacter((prev) => (prev ? { ...prev, proficiencies: currentProfs } : null));
      setError("Error al actualizar la competencia");
    }
  };

  // Handlers para Inventario interactivo
  const handleUpdateItemQty = async (itemName: string, delta: number) => {
    if (!character) return;
    const currentEquip = (character.equipment as EquipmentItem[]) || [];
    const updated = currentEquip
      .map((item) => {
        if (item.name === itemName) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as EquipmentItem[];

    setCharacter((prev) => (prev ? { ...prev, equipment: updated } : null));

    try {
      await characterService.updateCharacter(id, { equipment: updated });
    } catch {
      setCharacter((prev) => (prev ? { ...prev, equipment: currentEquip } : null));
      setError("Error al actualizar inventario");
    }
  };

  const handleAddEquipmentItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!character || !newEquipName.trim()) return;

    const currentEquip = (character.equipment as EquipmentItem[]) || [];
    const catalogHit = pickedEquip ?? findCatalogItem(newEquipName);
    const finalName = catalogHit ? catalogHit.name : newEquipName.trim();
    const existingIndex = currentEquip.findIndex(
      (i) => i.name.toLowerCase() === finalName.toLowerCase(),
    );

    let updated: EquipmentItem[];
    if (existingIndex >= 0) {
      updated = currentEquip.map((item, idx) =>
        idx === existingIndex
          ? { ...item, quantity: item.quantity + newEquipQty }
          : item,
      );
    } else {
      updated = [
        ...currentEquip,
        {
          name: finalName,
          quantity: Math.max(1, newEquipQty),
          description: newEquipDesc.trim() || undefined,
          ...(catalogHit?.category && { category: catalogHit.category }),
          ...(catalogHit?.stats && { stats: catalogHit.stats }),
        },
      ];
    }

    setNewEquipName("");
    setNewEquipQty(1);
    setNewEquipDesc("");
    setPickedEquip(null);
    setIsAddingEquip(false);

    setCharacter((prev) => (prev ? { ...prev, equipment: updated } : null));

    try {
      const saved = await characterService.updateCharacter(id, {
        equipment: updated,
      });
      // El servidor recalcula la CA: reflejamos el valor devuelto.
      if (saved?.armor !== undefined) {
        setCharacter((prev) => (prev ? { ...prev, armor: saved.armor } : null));
      }
    } catch (err: unknown) {
      setCharacter((prev) => (prev ? { ...prev, equipment: currentEquip } : null));
      setError(apiErrorMessage(err, "Error al agregar objeto"));
    }
  };

  /**
   * Equipa/desequipa un objeto. El servidor valida los slots (una sola
   * armadura, manos ocupadas por armas a dos manos, etc.) y recalcula la CA.
   */
  const handleToggleEquip = async (
    item: EquipmentItem,
    slot?: EquipmentSlot,
  ) => {
    if (!character) return;
    const currentEquip = (character.equipment as EquipmentItem[]) || [];

    const target = currentEquip.find(
      (i) => i.name.toLowerCase() === item.name.toLowerCase(),
    );
    if (!target) return;

    const updated = target.slot
      ? currentEquip.map((i) => (i.name === target.name ? stripSlot(i) : i))
      : currentEquip.map((i) =>
          i.name === target.name
            ? { ...i, slot: slot ?? getAllowedSlots(i)[0] }
            : i,
        );

    setCharacter((prev) => (prev ? { ...prev, equipment: updated } : null));

    try {
      const saved = await characterService.updateCharacter(id, {
        equipment: updated,
      });
      if (saved?.armor !== undefined) {
        setCharacter((prev) => (prev ? { ...prev, armor: saved.armor } : null));
      }
    } catch (err: unknown) {
      setCharacter((prev) => (prev ? { ...prev, equipment: currentEquip } : null));
      setError(apiErrorMessage(err, "Error al equipar el objeto"));
    }
  };

  const handleRemoveFeat = async (featName: string) => {
    if (!character) return;
    const currentFeats = (character.feature_traits as FeatItem[]) || [];
    const updated = currentFeats.filter((f) => f.name !== featName);

    setCharacter((prev) => (prev ? { ...prev, feature_traits: updated } : null));

    try {
      await characterService.updateCharacter(id, { feature_traits: updated });
    } catch {
      setCharacter((prev) => (prev ? { ...prev, feature_traits: currentFeats } : null));
      setError("Error al quitar rasgo");
    }
  };

  const handleAddFeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!character || !newFeatName.trim()) return;

    const currentFeats = (character.feature_traits as FeatItem[]) || [];
    const updated = [
      ...currentFeats,
      {
        name: newFeatName.trim(),
        category: newFeatCategory.trim() || "Dote",
        description: newFeatDesc.trim(),
      },
    ];

    setNewFeatName("");
    setNewFeatCategory("Dote de Origen");
    setNewFeatDesc("");
    setIsAddingFeat(false);

    setCharacter((prev) => (prev ? { ...prev, feature_traits: updated } : null));

    try {
      await characterService.updateCharacter(id, { feature_traits: updated });
    } catch {
      setCharacter((prev) => (prev ? { ...prev, feature_traits: currentFeats } : null));
      setError("Error al agregar dote o rasgo");
    }
  };

  if (loading) {
    return <CharacterSheetSkeleton />;
  }

  if (error && !character) {
    return (
      <div className="min-h-screen bg-slate-800/50 text-slate-100 flex flex-col items-center justify-center gap-4">
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
  const currentEquipment = resolvedEquipment;
  const armorEquipped = equippedSlots.armor;
  const shieldEquipped = equippedSlots.shield;
  const acBreakdown = [
    armorEquipped
      ? `${armorEquipped.name} (base ${armorEquipped.stats?.acBase ?? "?"})`
      : "Sin armadura (base 10)",
    shieldEquipped ? `+ Escudo ${shieldEquipped.stats?.acBase ?? 2}` : null,
    `DES ${getModifier(character.dexterity)}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const currentFeats =
    (character.feature_traits as FeatItem[]) &&
    (character.feature_traits as FeatItem[]).length > 0
      ? (character.feature_traits as FeatItem[])
      : getStartingFeats(character.background);

  return (
    <div className="min-h-screen bg-slate-800/50 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="text-xs text-amber-500 hover:underline inline-block"
        >
          ← Volver al Dashboard
        </Link>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-xs underline text-red-300 ml-4"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Sección 1 — Cabecera */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl">
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
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-400">
                {editing ? (
                  <>
                    <select
                      value={String(e.class ?? "")}
                      onChange={(ev) =>
                        handleFieldChange("class", ev.target.value)
                      }
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-amber-500"
                    >
                      {DND_CLASSES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={String(e.race ?? "")}
                      onChange={(ev) =>
                        handleFieldChange("race", ev.target.value)
                      }
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-amber-500"
                    >
                      {DND_RACES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={Number(e.level ?? 1)}
                      onChange={(ev) =>
                        handleFieldChange("level", Number(ev.target.value))
                      }
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 w-16 focus:border-amber-500"
                    />
                    <select
                      value={String(e.alignment ?? "")}
                      onChange={(ev) =>
                        handleFieldChange("alignment", ev.target.value)
                      }
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-amber-500"
                    >
                      {DND_ALIGNMENTS.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={String(e.background ?? "")}
                      onChange={(ev) =>
                        handleFieldChange("background", ev.target.value)
                      }
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:border-amber-500"
                    >
                      {DND_BACKGROUNDS.map((b) => (
                        <option key={b.value} value={b.value}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-700 text-slate-200 font-medium">
                      {getClassLabel(character.class)} (Nivel {character.level})
                    </span>
                    <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-700 text-slate-300">
                      {getRaceLabel(character.race)}
                    </span>
                    <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-700 text-slate-300">
                      {getAlignmentLabel(character.alignment)}
                    </span>
                    <span className="bg-slate-900 px-2.5 py-1 rounded border border-slate-700 text-slate-300">
                      {getBackgroundLabel(character.background)}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {character.game && (
                <Link
                  href={`/games/${character.game.id}`}
                  className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-xs hover:bg-emerald-500/20 transition-colors flex items-center gap-1 font-semibold"
                >
                  🎮 Partida: {character.game.name}
                </Link>
              )}
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Guardar Ficha"}
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
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs font-semibold transition-colors"
                >
                  ✏️ Editar Datos Base
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sección 2 — Stats Principales y Competencias */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700 pb-2">
            <h2 className="text-lg font-bold text-amber-400">
              Puntuaciones de Atributos y Competencias
            </h2>
            <span className="text-xs text-slate-400">
              Haz clic en cualquier habilidad para marcar o desmarcar competencia
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {STAT_KEYS.map((key) => {
              const statSkills = DND_SKILLS.filter((s) => s.stat === key);
              const currentProfs = (character.proficiencies as string[]) || [];
              const profBonus = getProficiencyBonus(character.level);

              return (
                <div
                  key={key}
                  className="bg-slate-900 rounded-lg border border-slate-700 p-4 space-y-3 flex flex-col justify-between shadow-sm"
                >
                  {/* Encabezado del Atributo */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div>
                      <span className="text-sm uppercase font-extrabold text-amber-400 tracking-wider">
                        {STAT_LABELS[key]}
                      </span>
                      <span className="text-xs text-slate-400 ml-2 font-medium">
                        ({STAT_NAMES_FULL[key]})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {editing ? (
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={Number(e[key] ?? 10)}
                          onChange={(ev) =>
                            handleFieldChange(key, Number(ev.target.value))
                          }
                          className="w-14 bg-slate-950 border border-slate-700 rounded text-center font-bold text-base text-slate-100 focus:outline-none focus:border-amber-500"
                        />
                      ) : (
                        <>
                          <span className="text-xl font-bold text-slate-100 font-mono">
                            {character[key]}
                          </span>
                          <span className="text-xs font-bold text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {getModifier(character[key] as number)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Lista de Competencias asociadas */}
                  <div className="space-y-1.5 flex-1">
                    {statSkills.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic py-2 text-center">
                        Sin competencias de característica
                      </p>
                    ) : (
                      statSkills.map((skill) => {
                        const isProf = currentProfs.includes(skill.name);
                        const statVal = Number(character[key] ?? 10);
                        const statMod = Math.floor((statVal - 10) / 2);
                        const totalMod = statMod + (isProf ? profBonus : 0);
                        const modStr =
                          totalMod >= 0 ? `+${totalMod}` : `${totalMod}`;
                        const source = getProficiencySource(
                          skill.name,
                          character.background,
                          character.race,
                        );

                        return (
                          <div
                            key={skill.id}
                            onClick={() => handleToggleProficiency(skill.name)}
                            className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-all ${
                              isProf
                                ? "bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/60"
                                : "bg-slate-950/60 hover:bg-slate-950 border border-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={isProf}
                                readOnly
                                className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900 cursor-pointer"
                              />
                              <span
                                className={`truncate ${
                                  isProf
                                    ? "font-semibold text-slate-100"
                                    : "text-slate-300"
                                }`}
                              >
                                {skill.name}
                              </span>
                              {source && (
                                <span
                                  className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-medium shrink-0"
                                  title={`Competencia de base otorgada por tu ${source}`}
                                >
                                  {source === "trasfondo" ? "Trasfondo" : "Raza"}
                                </span>
                              )}
                            </div>
                            <span
                              className={`font-mono font-bold ml-2 ${
                                isProf ? "text-amber-400" : "text-slate-400"
                              }`}
                            >
                              {modStr}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sección 3 — Combate (Interactiva) */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-amber-400 border-b border-slate-700 pb-2 flex justify-between items-center">
            <span>Combate y Salud</span>
            <span className="text-xs font-normal text-slate-400">
              Ajusta tu vida directamente con los botones + / -
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
            {/* Control Interactivo de HP */}
            <div className="md:col-span-3 bg-slate-950 p-4 rounded-xl border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase text-slate-400 font-semibold">
                  Puntos de Golpe (HP)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleQuickHpUpdate(-5)}
                    className="px-2 py-0.5 bg-red-950/80 hover:bg-red-900 border border-red-700/50 text-red-300 text-xs font-mono font-bold rounded"
                    title="-5 HP"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => handleQuickHpUpdate(-1)}
                    className="px-2 py-0.5 bg-red-950/80 hover:bg-red-900 border border-red-700/50 text-red-300 text-xs font-mono font-bold rounded"
                    title="-1 HP"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => handleQuickHpUpdate(1)}
                    className="px-2 py-0.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 text-xs font-mono font-bold rounded"
                    title="+1 HP"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => handleQuickHpUpdate(5)}
                    className="px-2 py-0.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 text-xs font-mono font-bold rounded"
                    title="+5 HP"
                  >
                    +5
                  </button>
                </div>
              </div>

              {editing ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min={0}
                    value={Number(e.current_hp ?? 0)}
                    onChange={(ev) =>
                      handleFieldChange("current_hp", Number(ev.target.value))
                    }
                    className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-center font-mono font-bold focus:border-amber-500"
                  />
                  <span className="text-slate-500 font-bold">/</span>
                  <input
                    type="number"
                    min={1}
                    value={Number(e.max_hp ?? 1)}
                    onChange={(ev) =>
                      handleFieldChange("max_hp", Number(ev.target.value))
                    }
                    className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-center font-mono font-bold focus:border-amber-500"
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline gap-2 text-2xl font-bold font-mono">
                    <span className="text-emerald-400">
                      {character.current_hp}
                    </span>
                    {character.temporary_hp > 0 && (
                      <span className="text-blue-400 text-sm font-normal">
                        (+{character.temporary_hp} temp)
                      </span>
                    )}
                    <span className="text-slate-500 text-base">
                      / {character.max_hp} MAX
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
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

            {/* CA */}
            <div
              className="bg-slate-950 p-4 rounded-xl border border-slate-700 text-center"
              title={acBreakdown}
            >
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">
                Clase Armadura (AC)
              </label>
              <span className="text-2xl font-extrabold text-amber-400 font-mono">
                {character.armor}
              </span>
              <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                {acBreakdown}
              </p>
            </div>

            {/* Dado de Golpe */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-700 text-center">
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">
                Dado de Golpe
              </label>
              <span className="text-2xl font-extrabold text-purple-400 font-mono">
                {character.hitDice}
              </span>
            </div>

            {/* Bonificador de Competencia */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-700 text-center">
              <label className="block text-xs uppercase text-slate-400 font-semibold mb-1">
                Bonif. Competencia
              </label>
              <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                +{getProficiencyBonus(character.level)}
              </span>
            </div>
          </div>
        </div>

        {/* Sección 4 — Dotes y Rasgos de Origen (Manual 2024) */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              ✨ Dotes y Rasgos de Origen (D&D 2024)
            </h2>
            <button
              onClick={() => setIsAddingFeat(!isAddingFeat)}
              className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded font-semibold transition-colors"
            >
              {isAddingFeat ? "Cancelar" : "+ Agregar Dote / Rasgo"}
            </button>
          </div>

          {/* Formulario rápido para agregar Dote */}
          {isAddingFeat && (
            <form
              onSubmit={handleAddFeat}
              className="bg-slate-950 p-4 rounded-lg border border-purple-500/40 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Nombre de la Dote o Rasgo
                  </label>
                  <input
                    type="text"
                    required
                    value={newFeatName}
                    onChange={(e) => setNewFeatName(e.target.value)}
                    placeholder="Ej: Iniciado en la Magia (Druida)"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 text-sm focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={newFeatCategory}
                    onChange={(e) => setNewFeatCategory(e.target.value)}
                    placeholder="Ej: Dote de Origen (Nivel 1)"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 text-sm focus:border-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Descripción o Beneficios
                </label>
                <textarea
                  rows={2}
                  value={newFeatDesc}
                  onChange={(e) => setNewFeatDesc(e.target.value)}
                  placeholder="Describe los efectos o conjuros que otorga esta dote..."
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 text-sm focus:border-purple-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded transition-colors"
              >
                Guardar Dote en Ficha
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentFeats.length === 0 ? (
              <p className="text-slate-500 italic text-sm md:col-span-2">
                No hay dotes registradas. Al crear un personaje con trasfondo 2024, su dote de origen aparecerá aquí.
              </p>
            ) : (
              currentFeats.map((feat) => (
                <div
                  key={feat.name}
                  className="bg-slate-950 p-4 rounded-lg border border-slate-700 flex flex-col justify-between space-y-2 relative group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-amber-300 text-sm">
                      {feat.name}
                    </span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-mono">
                      {feat.category || "Dote"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {feat.description}
                  </p>
                  <button
                    onClick={() => handleRemoveFeat(feat.name)}
                    className="text-[10px] text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity self-end pt-1"
                  >
                    Eliminar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sección 5 — Equipamiento e Inventario Completo */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              🎒 Equipamiento e Inventario
            </h2>
            <button
              onClick={() => setIsAddingEquip(!isAddingEquip)}
              className="text-xs bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded font-semibold transition-colors"
            >
              {isAddingEquip ? "Cancelar" : "+ Agregar Objeto"}
            </button>
          </div>

          {/* Formulario rápido para agregar objeto */}
          {isAddingEquip && (
            <form
              onSubmit={handleAddEquipmentItem}
              className="bg-slate-950 p-4 rounded-lg border border-amber-500/40 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 relative">
                  <label className="block text-xs text-slate-300 mb-1">
                    Nombre del Objeto / Arma / Armadura
                  </label>
                  <input
                    type="text"
                    required
                    value={newEquipName}
                    onChange={(e) => {
                      setNewEquipName(e.target.value);
                      setPickedEquip(null);
                    }}
                    placeholder="Ej: Poción de Curación"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 text-sm focus:border-amber-500"
                  />
                  {equipSuggestions.length > 0 &&
                    !equipSuggestions.some(
                      (s) =>
                        normalizeItemName(s.name) ===
                        normalizeItemName(newEquipName),
                    ) && (
                      <ul className="absolute z-20 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded shadow-lg max-h-52 overflow-y-auto">
                        {equipSuggestions.map((s) => (
                          <li key={s.name}>
                            <button
                              type="button"
                              onClick={() => {
                                setNewEquipName(s.name);
                                setPickedEquip(s);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
                            >
                              <span className="font-semibold">{s.name}</span>
                              <span className="text-slate-500 ml-1">
                                · {s.category}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newEquipQty}
                    onChange={(e) => setNewEquipQty(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 text-sm focus:border-amber-500 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">
                  Notas / Descripción (Opcional)
                </label>
                <input
                  type="text"
                  value={newEquipDesc}
                  onChange={(e) => setNewEquipDesc(e.target.value)}
                  placeholder="Ej: Recupera 2d4 + 2 HP"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 text-sm focus:border-amber-500"
                />
              </div>
              {pickedEquip && (
                <p className="text-[11px] text-amber-400/80">
                  ✓ Del catálogo — {pickedEquip.category}
                  {pickedEquip.stats?.acBase !== undefined &&
                    ` · CA ${pickedEquip.stats.acBase}`}
                  {pickedEquip.stats?.damage &&
                    ` · ${pickedEquip.stats.damage} ${pickedEquip.stats.damageType ?? ""}`}
                </p>
              )}
              <button
                type="submit"
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded transition-colors"
              >
                Guardar Objeto en Inventario
              </button>
            </form>
          )}

          {/* Panel de slots: qué tiene equipado, visible para jugador y DM */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SLOTS.map((slot) => {
              const equipped = equippedSlots[slot];
              return (
                <div
                  key={slot}
                  className={`rounded-lg px-3 py-2.5 border ${
                    equipped
                      ? "bg-amber-950/50 border-amber-700/60"
                      : "bg-slate-950/60 border-slate-800"
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wide opacity-70 block">
                    <span className="mr-1">{SLOT_ICONS[slot]}</span>
                    {SLOT_LABELS[slot]}
                  </span>
                  <span
                    className={`text-xs truncate block ${
                      equipped
                        ? "font-bold text-amber-200"
                        : "italic text-slate-600"
                    }`}
                  >
                    {equipped ? equipped.name : "— libre —"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {currentEquipment.length === 0 ? (
              <p className="text-slate-500 italic text-sm md:col-span-3">
                El inventario está vacío.
              </p>
            ) : (
              currentEquipment.map((item) => {
                const statLine = describeItemStats(item);
                const isEquipped = Boolean(item.slot);
                return (
                  <div
                    key={item.name}
                    className={`p-3 rounded-lg border flex items-center justify-between gap-2 shadow-inner ${
                      isEquipped
                        ? "bg-amber-950/40 border-amber-700/60"
                        : "bg-slate-950 border-slate-800"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <span
                        className={`font-semibold text-xs truncate block ${
                          isEquipped ? "text-amber-300" : "text-slate-200"
                        }`}
                      >
                        {isEquipped && (
                          <span className="mr-1">{SLOT_ICONS[item.slot!]}</span>
                        )}
                        {item.name}
                      </span>
                      {statLine && (
                        <span className="text-[11px] text-slate-500 block truncate">
                          {statLine}
                        </span>
                      )}
                      {item.description && (
                        <span className="text-[11px] text-slate-400 block truncate">
                          {item.description}
                        </span>
                      )}
                      <span className="mt-1.5 inline-block">
                        <EquipButton
                          item={item}
                          equipped={isEquipped}
                          canEquip
                          equipment={currentEquipment}
                          onToggle={handleToggleEquip}
                        />
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleUpdateItemQty(item.name, -1)}
                        className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono rounded border border-slate-700"
                        title="Restar 1"
                      >
                        -
                      </button>
                      <span className="text-amber-400 font-bold font-mono text-xs px-1">
                        x{item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateItemQty(item.name, 1)}
                        className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono rounded border border-slate-700"
                        title="Sumar 1"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sección 6 — Economía y Monedas (Interactiva en vivo) */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
            <h2 className="text-lg font-bold text-amber-400">
              Economía y Bolsa de Monedas
            </h2>
            <span className="text-xs text-slate-400">
              Usa los botones + / - o haz clic en la cifra para ingresar un valor exacto
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(
              [
                [
                  "gold_coins",
                  "Piezas de Oro (PO)",
                  "text-yellow-400",
                  "bg-yellow-500/10",
                  "border-yellow-500/30",
                  "🪙",
                ],
                [
                  "silver_coins",
                  "Piezas de Plata (PP)",
                  "text-slate-200",
                  "bg-slate-400/10",
                  "border-slate-400/30",
                  "⚪",
                ],
                [
                  "copper_coins",
                  "Piezas de Cobre (PC)",
                  "text-amber-600",
                  "bg-amber-700/10",
                  "border-amber-700/30",
                  "🟤",
                ],
              ] as const
            ).map(([key, label, textColor, bgColor, borderColor, icon]) => {
              const currentVal = Number(character[key] ?? 0);
              const isEditingThis = editingCoin === key;

              return (
                <div
                  key={key}
                  className={`${bgColor} ${borderColor} border p-4 rounded-xl flex flex-col items-center justify-between gap-3 shadow-md relative`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wide">
                    <span>{icon}</span>
                    <span>{label}</span>
                  </div>

                  {/* Edición directa por clic */}
                  {isEditingThis ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        autoFocus
                        value={coinInputValue}
                        onChange={(e) => setCoinInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            handleSaveDirectCoin(key, coinInputValue);
                          if (e.key === "Escape") setEditingCoin(null);
                        }}
                        className="w-24 bg-slate-950 border border-amber-500 rounded px-2 py-1 text-center font-bold text-xl text-slate-100 focus:outline-none font-mono"
                      />
                      <button
                        onClick={() =>
                          handleSaveDirectCoin(key, coinInputValue)
                        }
                        className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold transition-colors"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingCoin(key);
                        setCoinInputValue(String(currentVal));
                      }}
                      title="Haz clic para editar la cifra exacta"
                      className={`text-3xl font-extrabold font-mono ${textColor} hover:scale-105 transition-transform cursor-pointer px-4 py-1 rounded bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-amber-500/50`}
                    >
                      {currentVal}
                    </button>
                  )}

                  {/* Botones de acción rápida +/- */}
                  <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleQuickCoinUpdate(key, -10)}
                      disabled={currentVal < 10}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-mono font-bold text-slate-300 rounded transition-colors"
                      title="Restar 10"
                    >
                      -10
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCoinUpdate(key, -1)}
                      disabled={currentVal < 1}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-mono font-bold text-slate-300 rounded transition-colors"
                      title="Restar 1"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCoinUpdate(key, 1)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-emerald-400 rounded transition-colors"
                      title="Sumar 1"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickCoinUpdate(key, 10)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-emerald-400 rounded transition-colors"
                      title="Sumar 10"
                    >
                      +10
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

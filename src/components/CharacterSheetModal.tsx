"use client";

import { useEffect, useMemo, useState } from "react";
import { Character } from "@/types/character";
import { characterService } from "@/services/character.service";
import { useAuth } from "@/context/AuthContext";
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
  getProficiencySource,
  getStartingFeats,
  EquipmentItem,
  EquipmentSlot,
  FeatItem,
} from "@/constants/dnd";

interface CharacterSheetModalProps {
  characterId: number;
  initialCharacter?: Character | null;
  onClose: () => void;
  isMaster?: boolean;
}

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

export default function CharacterSheetModal({
  characterId,
  initialCharacter,
  onClose,
  isMaster = false,
}: CharacterSheetModalProps) {
  const { user } = useAuth();
  const [character, setCharacter] = useState<Character | null>(
    initialCharacter ?? null,
  );
  const [loading, setLoading] = useState<boolean>(!initialCharacter);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"stats" | "inventory" | "feats" | "story">("stats");

  // Inventario resuelto contra el catálogo (items legados ganan categoría/stats)
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

  // Edición general para el dueño
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Character>>({});
  const [saving, setSaving] = useState(false);

  // Formularios de inventario y dotes
  const [isAddingEquip, setIsAddingEquip] = useState(false);
  const [newEquipName, setNewEquipName] = useState("");
  const [newEquipQty, setNewEquipQty] = useState(1);
  const [newEquipDesc, setNewEquipDesc] = useState("");
  const [pickedEquip, setPickedEquip] = useState<SrdItem | null>(null);

  // Sugestiones del catálogo SRD para autocompletar el nombre del objeto
  const equipSuggestions = useMemo(() => {
    const query = normalizeItemName(newEquipName);
    if (query.length < 2) return [];
    return SRD_ITEMS.filter((item) =>
      normalizeItemName(item.name).includes(query),
    ).slice(0, 7);
  }, [newEquipName]);

  const [isAddingFeat, setIsAddingFeat] = useState(false);
  const [newFeatName, setNewFeatName] = useState("");
  const [newFeatCategory, setNewFeatCategory] = useState("Dote de Origen");
  const [newFeatDesc, setNewFeatDesc] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (initialCharacter && initialCharacter.id === characterId) {
        setCharacter(initialCharacter);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await characterService.getCharacterById(characterId);
        if (!cancelled) setCharacter(data);
      } catch (err: unknown) {
        if (!cancelled) {
          console.error("Error al cargar la hoja de personaje:", err);
          setError("No se pudo cargar la hoja completa del personaje.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [characterId, initialCharacter]);

  const isOwner = Boolean(user?.id && character?.userId === user.id);

  // Handlers para interactividad del dueño
  const handleQuickHpUpdate = async (delta: number) => {
    if (!character || !isOwner) return;
    const currentHp = Number(character.current_hp ?? 0);
    const maxHp = Number(character.max_hp ?? 1);
    const newHp = Math.max(0, Math.min(maxHp, currentHp + delta));

    setCharacter((prev) => (prev ? { ...prev, current_hp: newHp } : null));

    try {
      await characterService.updateCharacter(characterId, { current_hp: newHp });
    } catch {
      setCharacter((prev) => (prev ? { ...prev, current_hp: currentHp } : null));
      setError("Error al actualizar HP");
    }
  };

  const handleQuickCoinUpdate = async (
    coinField: "gold_coins" | "silver_coins" | "copper_coins",
    delta: number,
  ) => {
    if (!character || !isOwner) return;
    const currentVal = Number(character[coinField] ?? 0);
    const newVal = Math.max(0, currentVal + delta);

    setCharacter((prev) => (prev ? { ...prev, [coinField]: newVal } : null));

    try {
      await characterService.updateCharacter(characterId, { [coinField]: newVal });
    } catch {
      setCharacter((prev) => (prev ? { ...prev, [coinField]: currentVal } : null));
      setError("Error al guardar monedas");
    }
  };

  const handleToggleProficiency = async (skillName: string) => {
    if (!character || !isOwner) return;
    const currentProfs = (character.proficiencies as string[]) || [];
    const isProf = currentProfs.includes(skillName);
    const updated = isProf
      ? currentProfs.filter((s) => s !== skillName)
      : [...currentProfs, skillName];

    setCharacter((prev) => (prev ? { ...prev, proficiencies: updated } : null));

    try {
      await characterService.updateCharacter(characterId, { proficiencies: updated });
    } catch {
      setCharacter((prev) => (prev ? { ...prev, proficiencies: currentProfs } : null));
      setError("Error al actualizar la competencia");
    }
  };

  const handleUpdateItemQty = async (itemName: string, delta: number) => {
    if (!character || !isOwner) return;
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
      await characterService.updateCharacter(characterId, { equipment: updated });
    } catch {
      setCharacter((prev) => (prev ? { ...prev, equipment: currentEquip } : null));
      setError("Error al actualizar inventario");
    }
  };

  const handleAddEquipmentItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!character || !isOwner || !newEquipName.trim()) return;

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
      const saved = await characterService.updateCharacter(characterId, {
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
   * Equipa/desequipa un objeto. El servidor valida los slots y recalcula la
   * CA; los conflictos (arma a dos manos vs escudo) vuelven como `error`.
   */
  const handleToggleEquip = async (
    item: EquipmentItem,
    slot?: EquipmentSlot,
  ) => {
    if (!character || !isOwner) return;
    const currentEquip = (character.equipment as EquipmentItem[]) || [];

    const target = currentEquip.find(
      (i) => i.name.toLowerCase() === item.name.toLowerCase(),
    );
    if (!target) return;

    const updated = target.slot
      ? currentEquip.map((i) =>
          i.name === target.name ? stripSlot(i) : i,
        )
      : currentEquip.map((i) =>
          i.name === target.name
            ? { ...i, slot: slot ?? getAllowedSlots(i)[0] }
            : i,
        );

    setCharacter((prev) => (prev ? { ...prev, equipment: updated } : null));

    try {
      const saved = await characterService.updateCharacter(characterId, {
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
    if (!character || !isOwner) return;
    const currentFeats = (character.feature_traits as FeatItem[]) || [];
    const updated = currentFeats.filter((f) => f.name !== featName);

    setCharacter((prev) => (prev ? { ...prev, feature_traits: updated } : null));

    try {
      await characterService.updateCharacter(characterId, { feature_traits: updated });
    } catch {
      setCharacter((prev) => (prev ? { ...prev, feature_traits: currentFeats } : null));
      setError("Error al quitar rasgo");
    }
  };

  const handleAddFeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!character || !isOwner || !newFeatName.trim()) return;

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
      await characterService.updateCharacter(characterId, { feature_traits: updated });
    } catch {
      setCharacter((prev) => (prev ? { ...prev, feature_traits: currentFeats } : null));
      setError("Error al agregar dote");
    }
  };

  const startEditing = () => {
    if (!character) return;
    setEditData({ ...character });
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditData({});
  };

  const handleFieldChange = (field: keyof Character, value: unknown) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!character || !isOwner) return;
    setSaving(true);
    try {
      const updated = await characterService.updateCharacter(characterId, editData);
      setCharacter(updated);
      setEditing(false);
      setEditData({});
    } catch (err: unknown) {
      console.error("Error guardando datos:", err);
      setError("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl w-full max-w-2xl text-center shadow-2xl space-y-4">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-300 text-sm font-medium">
            Cargando la hoja de personaje...
          </p>
        </div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 border border-red-500/40 p-6 rounded-2xl w-full max-w-md text-center shadow-2xl space-y-4">
          <p className="text-red-400 font-semibold">{error || "Personaje no encontrado."}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-bold rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const currentProficiencies = (character.proficiencies as string[]) || [];
  const profBonus = getProficiencyBonus(character.level);
  const currentEquipment = resolvedEquipment;
  const equippedBySlot = equippedSlots;

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

  const eData = editing ? editData : character;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-800 border border-amber-500/40 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="bg-slate-900/90 p-4 sm:p-6 border-b border-slate-700/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {editing ? (
                <input
                  type="text"
                  value={String(eData.name ?? "")}
                  onChange={(ev) => handleFieldChange("name", ev.target.value)}
                  className="text-2xl font-bold bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-100 focus:border-amber-500"
                />
              ) : (
                <h2 className="text-2xl font-bold text-amber-400">
                  {character.name}
                </h2>
              )}

              {isOwner ? (
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[11px] font-bold uppercase tracking-wider">
                  ✏️ Tu Ficha (Editable)
                </span>
              ) : isMaster ? (
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded text-[11px] font-bold uppercase tracking-wider">
                  👁️ Vista de Dungeon Master
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded text-[11px] font-bold uppercase tracking-wider">
                  👁️ Vista de Jugador
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400">
              {getClassLabel(character.class)} Nivel {character.level} •{" "}
              {getRaceLabel(character.race)} • {getBackgroundLabel(character.background)} •{" "}
              {getAlignmentLabel(character.alignment)}
            </p>
          </div>

          {/* Controls & Quick Stats */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {isOwner && (
              <>
                {editing ? (
                  <div className="flex gap-1">
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs transition-colors disabled:opacity-50"
                    >
                      {saving ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startEditing}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 rounded-lg text-xs font-semibold transition-colors"
                  >
                    ✏️ Editar Base
                  </button>
                )}
              </>
            )}

            <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                HP
              </span>
              <span className="text-sm font-bold font-mono text-emerald-400">
                {character.current_hp} / {character.max_hp}
              </span>
            </div>

            <div
              className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-center"
              title={acBreakdown}
            >
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                CA
              </span>
              <span className="text-sm font-bold font-mono text-amber-300">
                {character.armor}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 text-slate-400 hover:text-slate-100 rounded-xl transition-colors text-lg font-bold ml-2"
              title="Cerrar Ficha"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-700/80 bg-slate-900/40 px-4 sm:px-6 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab("stats")}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === "stats"
                ? "border-amber-400 text-amber-400 bg-slate-800/50"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            📊 Atributos & Habilidades
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === "inventory"
                ? "border-amber-400 text-amber-400 bg-slate-800/50"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            🎒 Inventario ({currentEquipment.length}) & Monedas
          </button>
          <button
            onClick={() => setActiveTab("feats")}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === "feats"
                ? "border-amber-400 text-amber-400 bg-slate-800/50"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            ✨ Dotes & Rasgos ({currentFeats.length})
          </button>
          <button
            onClick={() => setActiveTab("story")}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === "story"
                ? "border-amber-400 text-amber-400 bg-slate-800/50"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            📜 Trasfondo & Historia
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Controles de ajuste rápido de HP para el dueño */}
          {isOwner && (
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 uppercase">
                  Control Rápido de Vida (HP):
                </span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {character.current_hp} / {character.max_hp}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleQuickHpUpdate(-5)}
                  className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 border border-red-700/50 text-red-300 text-xs font-mono font-bold rounded-lg transition-colors"
                >
                  -5 HP
                </button>
                <button
                  onClick={() => handleQuickHpUpdate(-1)}
                  className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 border border-red-700/50 text-red-300 text-xs font-mono font-bold rounded-lg transition-colors"
                >
                  -1 HP
                </button>
                <button
                  onClick={() => handleQuickHpUpdate(1)}
                  className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 text-xs font-mono font-bold rounded-lg transition-colors"
                >
                  +1 HP
                </button>
                <button
                  onClick={() => handleQuickHpUpdate(5)}
                  className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 text-xs font-mono font-bold rounded-lg transition-colors"
                >
                  +5 HP
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: ATRIBUTOS Y HABILIDADES */}
          {activeTab === "stats" && (
            <div className="space-y-6">
              {/* Grid de Atributos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {STAT_KEYS.map((key) => {
                  const val = Number(editing ? (eData[key] ?? 10) : character[key]);
                  const mod = getModifier(val);
                  return (
                    <div
                      key={key}
                      className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 text-center space-y-1 shadow-sm"
                    >
                      <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider block">
                        {STAT_LABELS[key]}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {STAT_NAMES_FULL[key]}
                      </span>
                      {editing && isOwner ? (
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={val}
                          onChange={(ev) =>
                            handleFieldChange(key, Number(ev.target.value))
                          }
                          className="w-14 bg-slate-950 border border-slate-700 rounded text-center font-bold text-base text-slate-100 focus:outline-none focus:border-amber-500 mx-auto block"
                        />
                      ) : (
                        <div className="text-2xl font-black text-slate-100 font-mono">
                          {val}
                        </div>
                      )}
                      <div className="inline-block text-xs font-bold text-amber-300 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {mod}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Lista de Competencias y Habilidades */}
              <div className="bg-slate-900/70 border border-slate-700/80 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-bold text-amber-400">
                    Competencias de Habilidad (D&D 5e)
                  </h3>
                  {isOwner && (
                    <span className="text-[11px] text-slate-400 italic">
                      Haz clic para activar o desactivar tus competencias
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {DND_SKILLS.map((skill) => {
                    const isProf = currentProficiencies.includes(skill.name);
                    const statVal = Number(character[skill.stat] ?? 10);
                    const statMod = Math.floor((statVal - 10) / 2);
                    const totalMod = statMod + (isProf ? profBonus : 0);
                    const modStr = totalMod >= 0 ? `+${totalMod}` : `${totalMod}`;
                    const source = getProficiencySource(
                      skill.name,
                      character.background,
                      character.race,
                    );

                    return (
                      <div
                        key={skill.id}
                        onClick={() => isOwner && handleToggleProficiency(skill.name)}
                        className={`flex items-center justify-between p-2 rounded-lg text-xs border ${
                          isOwner ? "cursor-pointer transition-all" : ""
                        } ${
                          isProf
                            ? "bg-amber-500/10 border-amber-500/30 text-slate-100"
                            : "bg-slate-950/40 border-slate-800/80 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isProf}
                            readOnly
                            disabled={!isOwner}
                            className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900 cursor-pointer"
                          />
                          <span className="truncate font-medium">
                            {skill.name}
                          </span>
                          {source && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded border border-amber-500/30 shrink-0">
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
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVENTARIO Y MONEDAS */}
          {activeTab === "inventory" && (
            <div className="space-y-6">
              {/* Monedero */}
              <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-amber-400 border-b border-slate-800 pb-2">
                  Monedero de la Compañía
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Oro */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 text-center space-y-2">
                    <span className="text-xs text-amber-400 font-bold block">
                      🪙 Oro (GP)
                    </span>
                    <span className="text-2xl font-bold font-mono text-slate-100">
                      {character.gold_coins ?? 0}
                    </span>
                    {isOwner && (
                      <div className="flex justify-center gap-1 pt-1">
                        <button
                          onClick={() => handleQuickCoinUpdate("gold_coins", -10)}
                          className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded"
                        >
                          -10
                        </button>
                        <button
                          onClick={() => handleQuickCoinUpdate("gold_coins", -1)}
                          className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleQuickCoinUpdate("gold_coins", 1)}
                          className="px-2 py-0.5 bg-slate-800 text-amber-300 text-[10px] font-mono rounded"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleQuickCoinUpdate("gold_coins", 10)}
                          className="px-2 py-0.5 bg-slate-800 text-amber-300 text-[10px] font-mono rounded"
                        >
                          +10
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Plata */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-500/30 text-center space-y-2">
                    <span className="text-xs text-slate-300 font-bold block">
                      🪙 Plata (SP)
                    </span>
                    <span className="text-2xl font-bold font-mono text-slate-100">
                      {character.silver_coins ?? 0}
                    </span>
                    {isOwner && (
                      <div className="flex justify-center gap-1 pt-1">
                        <button
                          onClick={() => handleQuickCoinUpdate("silver_coins", -10)}
                          className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded"
                        >
                          -10
                        </button>
                        <button
                          onClick={() => handleQuickCoinUpdate("silver_coins", -1)}
                          className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleQuickCoinUpdate("silver_coins", 1)}
                          className="px-2 py-0.5 bg-slate-800 text-slate-200 text-[10px] font-mono rounded"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleQuickCoinUpdate("silver_coins", 10)}
                          className="px-2 py-0.5 bg-slate-800 text-slate-200 text-[10px] font-mono rounded"
                        >
                          +10
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Cobre */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-amber-700/30 text-center space-y-2">
                    <span className="text-xs text-amber-600 font-bold block">
                      🪙 Cobre (CP)
                    </span>
                    <span className="text-2xl font-bold font-mono text-slate-100">
                      {character.copper_coins ?? 0}
                    </span>
                    {isOwner && (
                      <div className="flex justify-center gap-1 pt-1">
                        <button
                          onClick={() => handleQuickCoinUpdate("copper_coins", -10)}
                          className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded"
                        >
                          -10
                        </button>
                        <button
                          onClick={() => handleQuickCoinUpdate("copper_coins", -1)}
                          className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleQuickCoinUpdate("copper_coins", 1)}
                          className="px-2 py-0.5 bg-slate-800 text-amber-500 text-[10px] font-mono rounded"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleQuickCoinUpdate("copper_coins", 10)}
                          className="px-2 py-0.5 bg-slate-800 text-amber-500 text-[10px] font-mono rounded"
                        >
                          +10
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Lista de Objetos */}
              <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-bold text-amber-400">
                    Objetos & Equipo Poseído ({currentEquipment.length})
                  </h3>
                  {isOwner && (
                    <button
                      onClick={() => setIsAddingEquip(!isAddingEquip)}
                      className="text-xs text-amber-400 hover:underline font-semibold"
                    >
                      {isAddingEquip ? "✕ Cancelar" : "+ Agregar Objeto"}
                    </button>
                  )}
                </div>

                {isAddingEquip && isOwner && (
                  <form
                    onSubmit={handleAddEquipmentItem}
                    className="p-3 bg-slate-950 border border-amber-500/40 rounded-xl space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="relative sm:col-span-2">
                        <input
                          type="text"
                          required
                          placeholder="Nombre del objeto..."
                          value={newEquipName}
                          onChange={(e) => {
                            setNewEquipName(e.target.value);
                            setPickedEquip(null);
                          }}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100"
                        />
                        {equipSuggestions.length > 0 &&
                          !equipSuggestions.some(
                            (s) =>
                              normalizeItemName(s.name) ===
                              normalizeItemName(newEquipName),
                          ) && (
                            <ul className="absolute z-20 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded shadow-lg max-h-44 overflow-y-auto">
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
                      <input
                        type="number"
                        min={1}
                        placeholder="Cantidad..."
                        value={newEquipQty}
                        onChange={(e) => setNewEquipQty(Number(e.target.value))}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 font-mono"
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
                    <input
                      type="text"
                      placeholder="Descripción u observaciones (opcional)..."
                      value={newEquipDesc}
                      onChange={(e) => setNewEquipDesc(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100"
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded transition-colors"
                    >
                      Guardar Objeto
                    </button>
                  </form>
                )}

                {/* Panel de slots: qué tiene equipado, visible para jugador y DM */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SLOTS.map((slot) => {
                    const equipped = equippedBySlot[slot];
                    return (
                      <div
                        key={slot}
                        className={`rounded-lg px-2.5 py-2 border text-[11px] ${
                          equipped
                            ? "bg-amber-950/50 border-amber-700/60 text-amber-200"
                            : "bg-slate-950/60 border-slate-800 text-slate-600"
                        }`}
                      >
                        <span className="mr-1">{SLOT_ICONS[slot]}</span>
                        <span className="opacity-70">{SLOT_LABELS[slot]}</span>
                        <p
                          className={`truncate ${
                            equipped ? "font-semibold text-xs" : "italic"
                          }`}
                        >
                          {equipped ? equipped.name : "— libre —"}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {currentEquipment.length === 0 ? (
                  <p className="text-slate-500 italic text-xs py-2 text-center">
                    Sin objetos registrados en la mochila.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {currentEquipment.map((item, idx) => {
                      const statLine = describeItemStats(item);
                      const isEquipped = Boolean(item.slot);
                      return (
                        <div
                          key={`${item.name}-${idx}`}
                          className={`p-3 rounded-lg border flex justify-between items-start gap-3 ${
                            isEquipped
                              ? "bg-amber-950/40 border-amber-700/60"
                              : "bg-slate-950 border-slate-800"
                          }`}
                        >
                          <div>
                            <span className="font-semibold text-xs">
                              <span
                                className={
                                  isEquipped ? "text-amber-300" : "text-slate-200"
                                }
                              >
                                {isEquipped && (
                                  <span className="mr-1">
                                    {SLOT_ICONS[item.slot!]}
                                  </span>
                                )}
                                {item.name}
                              </span>
                            </span>
                            {statLine && (
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {statLine}
                              </p>
                            )}
                            {item.description && (
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <EquipButton
                              item={item}
                              equipped={isEquipped}
                              canEquip={isOwner}
                              onToggle={handleToggleEquip}
                            />
                            {isOwner && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleUpdateItemQty(item.name, -1)}
                                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded"
                                >
                                  -
                                </button>
                                <button
                                  onClick={() => handleUpdateItemQty(item.name, 1)}
                                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded"
                                >
                                  +
                                </button>
                              </div>
                            )}
                            <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              x{item.quantity}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DOTES Y RASGOS */}
          {activeTab === "feats" && (
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-amber-400">
                  Dotes y Rasgos Especiales ({currentFeats.length})
                </h3>
                {isOwner && (
                  <button
                    onClick={() => setIsAddingFeat(!isAddingFeat)}
                    className="text-xs text-amber-400 hover:underline font-semibold"
                  >
                    {isAddingFeat ? "✕ Cancelar" : "+ Agregar Dote"}
                  </button>
                )}
              </div>

              {isAddingFeat && isOwner && (
                <form
                  onSubmit={handleAddFeat}
                  className="p-3 bg-slate-950 border border-purple-500/40 rounded-xl space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Nombre de la dote o rasgo..."
                      value={newFeatName}
                      onChange={(e) => setNewFeatName(e.target.value)}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100"
                    />
                    <input
                      type="text"
                      placeholder="Categoría (ej: Dote de Origen, Rasgo Racial)..."
                      value={newFeatCategory}
                      onChange={(e) => setNewFeatCategory(e.target.value)}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Descripción y beneficios..."
                    value={newFeatDesc}
                    onChange={(e) => setNewFeatDesc(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded transition-colors"
                  >
                    Guardar Dote
                  </button>
                </form>
              )}

              {currentFeats.length === 0 ? (
                <p className="text-slate-500 italic text-xs py-2 text-center">
                  Sin dotes registradas.
                </p>
              ) : (
                <div className="space-y-3">
                  {currentFeats.map((feat, idx) => (
                    <div
                      key={`${feat.name}-${idx}`}
                      className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-100 text-xs flex items-center gap-2">
                          <span>{feat.name}</span>
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.2 rounded font-normal">
                            {feat.category}
                          </span>
                        </h4>
                        {isOwner && (
                          <button
                            onClick={() => handleRemoveFeat(feat.name)}
                            className="text-slate-500 hover:text-red-400 text-xs font-bold px-1"
                            title="Quitar dote"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
                        {feat.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TRASFONDO E HISTORIA */}
          {activeTab === "story" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-900/80 border border-slate-700/80 p-3.5 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-amber-400 block">
                    Rasgos de Personalidad
                  </span>
                  <p className="text-xs text-slate-300 italic whitespace-pre-wrap">
                    {character.personality_traits || "Sin información."}
                  </p>
                </div>
                <div className="bg-slate-900/80 border border-slate-700/80 p-3.5 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-amber-400 block">
                    Ideales
                  </span>
                  <p className="text-xs text-slate-300 italic whitespace-pre-wrap">
                    {character.ideals || "Sin información."}
                  </p>
                </div>
                <div className="bg-slate-900/80 border border-slate-700/80 p-3.5 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-amber-400 block">
                    Vínculos
                  </span>
                  <p className="text-xs text-slate-300 italic whitespace-pre-wrap">
                    {character.bonds || "Sin información."}
                  </p>
                </div>
                <div className="bg-slate-900/80 border border-slate-700/80 p-3.5 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-amber-400 block">
                    Defectos
                  </span>
                  <p className="text-xs text-slate-300 italic whitespace-pre-wrap">
                    {character.flaws || "Sin información."}
                  </p>
                </div>
              </div>

              {character.story && (
                <div className="bg-slate-900/80 border border-slate-700/80 p-4 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-amber-400 block">
                    Historia de Trasfondo
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {character.story}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-900/90 p-4 border-t border-slate-700/80 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs font-bold rounded-xl transition-colors"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
}

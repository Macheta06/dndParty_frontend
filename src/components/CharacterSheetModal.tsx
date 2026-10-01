"use client";

import { useEffect, useState } from "react";
import { Character } from "@/types/character";
import { characterService } from "@/services/character.service";
import {
  DND_SKILLS,
  getClassLabel,
  getRaceLabel,
  getBackgroundLabel,
  getAlignmentLabel,
  getProficiencyBonus,
  getProficiencySource,
  getStartingFeats,
  EquipmentItem,
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

function getModifier(stat: number): string {
  const mod = Math.floor((stat - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export default function CharacterSheetModal({
  characterId,
  initialCharacter,
  onClose,
  isMaster = false,
}: CharacterSheetModalProps) {
  const [character, setCharacter] = useState<Character | null>(
    initialCharacter ?? null,
  );
  const [loading, setLoading] = useState<boolean>(!initialCharacter);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"stats" | "inventory" | "feats" | "story">("stats");

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
  const currentEquipment = (character.equipment as EquipmentItem[]) || [];
  const currentFeats =
    (character.feature_traits as FeatItem[]) &&
    (character.feature_traits as FeatItem[]).length > 0
      ? (character.feature_traits as FeatItem[])
      : getStartingFeats(character.background);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-800 border border-amber-500/40 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="bg-slate-900/90 p-4 sm:p-6 border-b border-slate-700/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold text-amber-400">
                {character.name}
              </h2>
              {isMaster && (
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded text-[11px] font-bold uppercase tracking-wider">
                  👁️ Vista de DM
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {getClassLabel(character.class)} Nivel {character.level} •{" "}
              {getRaceLabel(character.race)} • {getBackgroundLabel(character.background)} •{" "}
              {getAlignmentLabel(character.alignment)}
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                HP
              </span>
              <span className="text-sm font-bold font-mono text-emerald-400">
                {character.current_hp} / {character.max_hp}
              </span>
            </div>
            <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                CA (Armadura)
              </span>
              <span className="text-sm font-bold font-mono text-amber-300">
                {character.armor}
              </span>
            </div>
            <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Proficiencia
              </span>
              <span className="text-sm font-bold font-mono text-blue-400">
                +{profBonus}
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
          {/* TAB 1: ATRIBUTOS Y HABILIDADES */}
          {activeTab === "stats" && (
            <div className="space-y-6">
              {/* Grid de Atributos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {STAT_KEYS.map((key) => {
                  const val = Number(character[key] ?? 10);
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
                      <div className="text-2xl font-black text-slate-100 font-mono">
                        {val}
                      </div>
                      <div className="inline-block text-xs font-bold text-amber-300 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {mod}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Lista de Competencias y Habilidades */}
              <div className="bg-slate-900/70 border border-slate-700/80 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-amber-400 border-b border-slate-800 pb-2">
                  Competencias de Habilidad (D&D 5e)
                </h3>
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
                        className={`flex items-center justify-between p-2 rounded-lg text-xs border ${
                          isProf
                            ? "bg-amber-500/10 border-amber-500/30 text-slate-100"
                            : "bg-slate-950/40 border-slate-800/80 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isProf ? "bg-amber-400" : "bg-slate-700"
                            }`}
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
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-950 p-3 rounded-lg border border-amber-500/30">
                    <span className="text-xs text-amber-400 font-bold block">
                      🪙 Oro (GP)
                    </span>
                    <span className="text-xl font-bold font-mono text-slate-100">
                      {character.gold_coins ?? 0}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-500/30">
                    <span className="text-xs text-slate-300 font-bold block">
                      🪙 Plata (SP)
                    </span>
                    <span className="text-xl font-bold font-mono text-slate-100">
                      {character.silver_coins ?? 0}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-amber-700/30">
                    <span className="text-xs text-amber-600 font-bold block">
                      🪙 Cobre (CP)
                    </span>
                    <span className="text-xl font-bold font-mono text-slate-100">
                      {character.copper_coins ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Lista de Objetos */}
              <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-amber-400 border-b border-slate-800 pb-2">
                  Objetos & Equipo Poseído ({currentEquipment.length})
                </h3>
                {currentEquipment.length === 0 ? (
                  <p className="text-slate-500 italic text-xs py-2 text-center">
                    Sin objetos registrados en la mochila.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {currentEquipment.map((item, idx) => (
                      <div
                        key={`${item.name}-${idx}`}
                        className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-start gap-3"
                      >
                        <div>
                          <span className="font-semibold text-slate-200 text-xs">
                            {item.name}
                          </span>
                          {item.description && (
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shrink-0">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DOTES Y RASGOS */}
          {activeTab === "feats" && (
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-amber-400 border-b border-slate-800 pb-2">
                Dotes y Rasgos Especiales ({currentFeats.length})
              </h3>
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

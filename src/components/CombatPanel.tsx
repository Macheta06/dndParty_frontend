"use client";

import { useMemo, useState } from "react";
import { Socket } from "socket.io-client";

import type { EquipmentItem } from "@/constants/dnd";
import type { Character } from "@/types/character";
import type { AdvantageMode } from "@/types/game";
import { resolveItem } from "@/lib/equipment";

interface CombatPanelProps {
  socket: Socket | null;
  gameId: string;
  /** Personajes y NPC de la sala: todos se pueden atacar. */
  characters: Character[];
  /** El PJ propio; el DM no tiene, así que elige a mano. */
  userId?: number;
  isMaster: boolean;
}

const ADVANTAGE_OPTIONS: AdvantageMode[] = [
  "disadvantage",
  "normal",
  "advantage",
];

const ADVANTAGE_LABELS: Record<AdvantageMode, string> = {
  normal: "Normal",
  advantage: "Ventaja",
  disadvantage: "Desventaja",
};

const SELECT_CLASS =
  "w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-100 text-xs focus:border-amber-500";

/**
 * Lo que el personaje tiene empuñado: mano principal, si no la secundaria.
 * Solo cuenta si el catálogo le dio daño — un arma sin dado no ataca.
 */
function equippedWeapon(character: Character | null): EquipmentItem | null {
  if (!character) return null;

  const weapons = ((character.equipment as EquipmentItem[]) ?? [])
    .map(resolveItem)
    .filter(
      (item) =>
        (item.slot === "weapon-main" || item.slot === "weapon-offhand") &&
        Boolean(item.stats?.damage),
    );

  const main = weapons.find((item) => item.slot === "weapon-main");
  return main ?? weapons[0] ?? null;
}

/**
 * Pide un ataque al server: quién, contra quién y con qué ventaja.
 *
 * No calcula nada: el arma, el atributo y la competencia los resuelve el
 * server, así que el resultado que aparece en el historial es el que se jugó.
 * Si no hay arma equipada se deshabilita el botón con el motivo en lugar de
 * mandar algo que siempre fallaría.
 */
export default function CombatPanel({
  socket,
  gameId,
  characters,
  userId,
  isMaster,
}: CombatPanelProps) {
  const [attackerId, setAttackerId] = useState<number | null>(null);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [advantage, setAdvantage] = useState<AdvantageMode>("normal");

  // Se derivan de la lista: si aún no hay personajes o cambian, se recalcula
  // sin efectos que puedan dejar la selección apuntando a nadie.
  const attackers = useMemo(
    () =>
      characters.filter(
        (character) => isMaster || character.userId === userId,
      ),
    [characters, isMaster, userId],
  );
  const currentAttackerId = attackers.some((c) => c.id === attackerId)
    ? attackerId
    : (attackers[0]?.id ?? null);
  const attacker = attackers.find((c) => c.id === currentAttackerId) ?? null;

  const targets = useMemo(
    () => characters.filter((character) => character.id !== currentAttackerId),
    [characters, currentAttackerId],
  );
  const currentTargetId = targets.some((c) => c.id === targetId)
    ? targetId
    : (targets[0]?.id ?? null);
  const target = targets.find((c) => c.id === currentTargetId) ?? null;

  const weapon = useMemo(() => equippedWeapon(attacker), [attacker]);

  const blockedReason = !socket
    ? "Sin conexión con la sala"
    : attackers.length === 0
      ? "Nadie de tu grupo puede atacar todavía"
      : !weapon
        ? `${attacker?.name ?? "Este personaje"} no tiene arma equipada`
        : !target
          ? "Elige a quién se ataca"
          : null;

  const handleAttack = () => {
    if (blockedReason || !currentAttackerId || !currentTargetId) return;

    socket?.emit("attack", {
      gameId,
      attackerId: currentAttackerId,
      targetId: currentTargetId,
      advantage,
    });
  };

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow space-y-3">
      <h3 className="text-sm font-bold text-slate-400">⚔ Atacar</h3>

      {attackers.length === 0 ? (
        <p className="text-slate-500 italic text-xs">
          Todavía no hay personajes que puedan atacar.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="block text-[10px] uppercase tracking-wide text-slate-500">
                Atacante
              </span>
              <select
                aria-label="Atacante"
                value={currentAttackerId ?? ""}
                onChange={(event) => setAttackerId(Number(event.target.value))}
                className={SELECT_CLASS}
              >
                {attackers.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.name}
                    {character.is_npc ? " (NPC)" : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="block text-[10px] uppercase tracking-wide text-slate-500">
                Objetivo
              </span>
              <select
                aria-label="Objetivo"
                value={currentTargetId ?? ""}
                onChange={(event) => setTargetId(Number(event.target.value))}
                className={SELECT_CLASS}
              >
                {targets.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.name} · CA {character.armor}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* El arma sale de la hoja: no se la elige aquí. */}
          <div className="rounded bg-slate-900/60 border border-slate-700/60 px-2 py-1.5 text-[11px]">
            {weapon?.stats?.damage ? (
              <span className="text-amber-300 font-semibold">
                {weapon.name}{" "}
                <span className="text-slate-400 font-mono font-normal">
                  {weapon.stats.damage} {weapon.stats.damageType}
                </span>
              </span>
            ) : (
              <span className="text-slate-500 italic">Sin arma equipada</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 mr-1">Modo</span>
            {ADVANTAGE_OPTIONS.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setAdvantage(mode)}
                aria-pressed={advantage === mode}
                className={`text-[11px] px-2 py-0.5 rounded border font-semibold transition-colors ${
                  advantage === mode
                    ? "border-amber-500/60 bg-amber-500/15 text-amber-300"
                    : "border-slate-700 text-slate-400 hover:border-slate-500"
                }`}
              >
                {ADVANTAGE_LABELS[mode]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAttack}
            disabled={Boolean(blockedReason)}
            title={blockedReason ?? undefined}
            className="w-full py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⚔ Atacar
          </button>

          {blockedReason && (
            <p className="text-[11px] text-amber-400/80">{blockedReason}</p>
          )}
        </>
      )}
    </div>
  );
}

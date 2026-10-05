"use client";

import { useState } from "react";
import {
  AbilityStat,
  AdvantageMode,
  AttackRollResult,
  CharacterRollResult,
  RollEntry,
  isAttack,
  isCharacterRoll,
} from "@/types/game";

interface RollHistoryProps {
  history: RollEntry[];
}

const ABILITY_LABELS: Record<AbilityStat, string> = {
  strength: "Fuerza",
  dexterity: "Destreza",
  constitution: "Constitución",
  intelligence: "Inteligencia",
  wisdom: "Sabiduría",
  charisma: "Carisma",
};

function advantageLabel(advantage: AdvantageMode): string | null {
  if (advantage === "advantage") return "Ventaja";
  if (advantage === "disadvantage") return "Desventaja";
  return null;
}

function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

/** Con ventaja o desventaja se tiran dos dados y solo cuenta uno. */
function formatDice(roll: { dice: number[]; kept: number }): string {
  const all = roll.dice.join(" + ");
  return roll.dice.length > 1 ? `(${all}) → ${roll.kept}` : all;
}

/** Daño del arma: los dados y encima el atributo, por ejemplo `5 + 3`. */
function formatDamage(roll: AttackRollResult): string {
  const dice = roll.damageDice?.join(" + ") ?? "0";
  const bonus = roll.abilityModifier;

  if (bonus === 0) return dice;
  return `${dice} ${bonus > 0 ? "+" : "-"} ${Math.abs(bonus)}`;
}

function CharacterRollCard({ roll }: { roll: CharacterRollResult }) {
  const adv = advantageLabel(roll.advantage);

  return (
    <div className="bg-slate-950 p-3.5 rounded-lg border border-amber-500/40 space-y-2 shadow-inner">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-amber-400 truncate">
          {roll.characterName}
        </span>
        <span className="text-[11px] font-semibold text-slate-300 shrink-0">
          {roll.label}
          {adv && <span className="text-slate-500"> · {adv}</span>}
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-3 pt-1">
        <div className="text-xs text-slate-400 space-y-0.5 min-w-0">
          <div className="font-mono text-slate-300 truncate">
            {formatDice(roll)}
          </div>
          <div>
            Mod {formatModifier(roll.modifier)}
            {roll.proficient && (
              <span className="text-amber-300"> · competente</span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-3xl font-extrabold font-mono text-amber-400 tracking-tight">
            {roll.total}
          </div>
          {roll.dc !== undefined && (
            <div
              className={`text-[11px] font-bold font-mono ${
                roll.success ? "text-emerald-400" : "text-red-400"
              }`}
            >
              DC {roll.dc} {roll.success ? "✓" : "✗"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CharacterRollRow({ roll }: { roll: CharacterRollResult }) {
  const adv = advantageLabel(roll.advantage);

  return (
    <div className="flex items-center justify-between gap-2 text-xs p-2 bg-slate-900/80 rounded border border-slate-800 hover:border-slate-700 transition-colors">
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-slate-200">
          {roll.characterName}
        </span>
        <span className="text-slate-500 mx-1">tiró</span>
        <span className="font-mono text-amber-400">{roll.label}</span>
        {adv && <span className="text-slate-600"> ({adv})</span>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {roll.dc !== undefined && (
          <span
            className={`text-[10px] font-bold font-mono ${
              roll.success ? "text-emerald-400" : "text-red-400"
            }`}
          >
            DC {roll.dc}
          </span>
        )}
        <span className="text-[11px] text-slate-400 font-mono">
          {formatModifier(roll.modifier)}
        </span>
        <span className="font-extrabold text-amber-400 font-mono text-sm">
          {roll.total}
        </span>
      </div>
    </div>
  );
}

function AttackCard({ roll }: { roll: AttackRollResult }) {
  const adv = advantageLabel(roll.advantage);

  return (
    <div className="bg-slate-950 p-3.5 rounded-lg border border-red-500/40 space-y-2 shadow-inner">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-red-400 truncate">
          {roll.attackerName}
          <span className="mx-1.5 text-slate-500">⚔</span>
          <span className="text-slate-300">{roll.targetName}</span>
        </span>
        <span className="text-[11px] font-semibold text-slate-300 shrink-0">
          {roll.weapon}
          {adv && <span className="text-slate-500"> · {adv}</span>}
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-3 pt-1">
        <div className="text-xs text-slate-400 space-y-0.5 min-w-0">
          <div className="font-mono text-slate-300 truncate">
            {formatDice(roll)}
          </div>
          <div>
            Mod {formatModifier(roll.modifier)}
            <span className="text-slate-500">
              {" "}
              · {ABILITY_LABELS[roll.ability]}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-3xl font-extrabold font-mono text-red-400 tracking-tight">
            {roll.total}
          </div>
          <div className="text-[11px] font-bold font-mono text-slate-400">
            CA {roll.targetAc}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 pt-1.5 space-y-0.5">
        <p
          className={`text-xs font-bold ${roll.hit ? "text-emerald-400" : "text-red-400"}`}
        >
          {roll.hit
            ? roll.critical
              ? "¡Crítico! ✓"
              : "¡Golpe! ✓"
            : "Fallo ✗"}
        </p>
        {roll.hit && roll.damageTotal !== undefined && (
          <p className="text-xs text-slate-300">
            Daño{" "}
            <span className="font-mono font-bold text-amber-300">
              {roll.damageTotal}
            </span>{" "}
            <span className="text-slate-500">
              ({formatDamage(roll)}) · {roll.damageType}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

function AttackRow({ roll }: { roll: AttackRollResult }) {
  const adv = advantageLabel(roll.advantage);

  return (
    <div className="flex items-center justify-between gap-2 text-xs p-2 bg-slate-900/80 rounded border border-slate-800 hover:border-slate-700 transition-colors">
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-slate-200">{roll.attackerName}</span>
        <span className="text-slate-500 mx-1">atacó a</span>
        <span className="font-semibold text-slate-200">{roll.targetName}</span>
        <span className="text-slate-600"> ({roll.weapon}</span>
        {adv && <span className="text-slate-600">, {adv.toLowerCase()}</span>}
        <span className="text-slate-600">)</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`text-[10px] font-bold ${roll.hit ? "text-emerald-400" : "text-red-400"}`}
        >
          {roll.hit ? "✓" : "✗"}
        </span>
        <span className="text-[11px] text-slate-400 font-mono">
          {roll.total} vs CA {roll.targetAc}
        </span>
        {roll.hit && roll.damageTotal !== undefined && (
          <span className="text-[11px] text-amber-300 font-mono font-bold">
            {roll.damageTotal}
          </span>
        )}
      </div>
    </div>
  );
}

export default function RollHistory({ history }: RollHistoryProps) {
  const [showFullHistory, setShowFullHistory] = useState(false);

  const latestRoll = history.length > 0 ? history[history.length - 1] : null;
  const reversedHistory = [...history].reverse();

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow space-y-3">
      <h3 className="text-sm font-bold text-slate-400 flex items-center justify-between">
        <span>🎲 Resultado de Dados</span>
        {history.length > 0 && (
          <span className="text-[10px] text-slate-500 font-normal">
            Total: {history.length} tiradas
          </span>
        )}
      </h3>

      {/* Tarjeta del Último Resultado Destacado */}
      {!latestRoll ? (
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700/50 text-center">
          <p className="text-slate-500 italic text-xs">
            No hay tiradas recientes. Selecciona un dado para lanzar.
          </p>
        </div>
      ) : isAttack(latestRoll) ? (
        <AttackCard roll={latestRoll} />
      ) : isCharacterRoll(latestRoll) ? (
        <CharacterRollCard roll={latestRoll} />
      ) : (
        <div className="bg-slate-950 p-3.5 rounded-lg border border-amber-500/40 space-y-2 shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400">
              {latestRoll.userName}
            </span>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {latestRoll.formula}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-xs text-slate-400">
              Dados:{" "}
              <span className="font-mono text-slate-300">
                ({latestRoll.rolls.join(" + ")})
              </span>
            </span>
            <div className="text-right">
              <span className="text-3xl font-extrabold font-mono text-amber-400 tracking-tight">
                {latestRoll.total}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Botón para desplegar historial completo */}
      {history.length > 0 && (
        <button
          type="button"
          onClick={() => setShowFullHistory(!showFullHistory)}
          className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-950 text-slate-300 text-xs font-semibold rounded border border-slate-700 hover:border-slate-500 transition-colors flex items-center justify-center gap-1.5"
        >
          <span>
            {showFullHistory
              ? "▲ Ocultar historial"
              : "📜 Ver todo el historial"}
          </span>
          <span className="text-[10px] text-amber-400 font-mono">
            ({history.length})
          </span>
        </button>
      )}

      {/* Desplegable de Historial Completo */}
      {showFullHistory && history.length > 0 && (
        <div className="max-h-60 overflow-y-auto space-y-1.5 pt-2 border-t border-slate-700/80 pr-1">
          {reversedHistory.map((roll, idx) =>
            isAttack(roll) ? (
              <AttackRow key={idx} roll={roll} />
            ) : isCharacterRoll(roll) ? (
              <CharacterRollRow key={idx} roll={roll} />
            ) : (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 text-xs p-2 bg-slate-900/80 rounded border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-200">
                    {roll.userName}
                  </span>
                  <span className="text-slate-500 mx-1">tiró</span>
                  <span className="font-mono text-amber-400">
                    {roll.formula}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-slate-400 font-mono">
                    ({roll.rolls.join(",")})
                  </span>
                  <span className="font-extrabold text-amber-400 font-mono text-sm">
                    {roll.total}
                  </span>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

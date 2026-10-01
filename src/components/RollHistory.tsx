"use client";

import { useState } from "react";
import { DiceRollResult } from "@/types/game";

interface RollHistoryProps {
  history: DiceRollResult[];
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
          className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-950 text-slate-300 text-xs font-semibold rounded border border-slate-700 hover:border-slate-600 transition-colors flex items-center justify-center gap-1.5"
        >
          <span>{showFullHistory ? "▲ Ocultar historial" : "📜 Ver todo el historial"}</span>
          <span className="text-[10px] text-amber-400 font-mono">
            ({history.length})
          </span>
        </button>
      )}

      {/* Desplegable de Historial Completo */}
      {showFullHistory && history.length > 0 && (
        <div className="max-h-60 overflow-y-auto space-y-1.5 pt-2 border-t border-slate-700/80 pr-1">
          {reversedHistory.map((roll, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-2 text-xs p-2 bg-slate-900/80 rounded border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-slate-200">
                  {roll.userName}
                </span>
                <span className="text-slate-500 mx-1">tiró</span>
                <span className="font-mono text-amber-400">{roll.formula}</span>
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
          ))}
        </div>
      )}
    </div>
  );
}

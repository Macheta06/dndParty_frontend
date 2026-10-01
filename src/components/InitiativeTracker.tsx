"use client";

import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { InitiativeState, InitiativeEntry, GameDetail } from "@/types/game";
import { Character } from "@/types/character";

interface InitiativeTrackerProps {
  socket: Socket | null;
  game: GameDetail;
  isMaster: boolean;
}

export default function InitiativeTracker({
  socket,
  game,
  isMaster,
}: InitiativeTrackerProps) {
  const [initiative, setInitiative] = useState<InitiativeState | null>(
    game.initiative ?? null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scores, setScores] = useState<Record<number, number>>({});

  useEffect(() => {
    setInitiative(game.initiative ?? null);
  }, [game.initiative]);

  useEffect(() => {
    if (!socket) return;

    const handleUpdated = (state: InitiativeState) => setInitiative(state);
    const handleAdvanced = (state: InitiativeState) => setInitiative(state);
    const handleCleared = () => setInitiative(null);

    socket.on("initiativeUpdated", handleUpdated);
    socket.on("turnAdvanced", handleAdvanced);
    socket.on("initiativeCleared", handleCleared);

    return () => {
      socket.off("initiativeUpdated", handleUpdated);
      socket.off("turnAdvanced", handleAdvanced);
      socket.off("initiativeCleared", handleCleared);
    };
  }, [socket]);

  const allParticipants: Array<{
    type: "character" | "npc";
    id: number;
    name: string;
  }> = [
    ...game.characters.map((c: Character) => ({
      type: "character" as const,
      id: c.id,
      name: c.name,
    })),
    ...game.npcs.map((n: Character) => ({
      type: "npc" as const,
      id: n.id,
      name: n.name,
    })),
  ];

  const handleSetInitiative = () => {
    if (!socket || !game) return;

    const entries: InitiativeEntry[] = allParticipants
      .filter((p) => scores[p.id] !== undefined)
      .map((p) => ({
        type: p.type,
        id: p.id,
        name: p.name,
        score: scores[p.id] ?? 0,
      }));

    if (entries.length === 0) return;

    socket.emit("setInitiative", { gameId: game.id, entries });
    setIsModalOpen(false);
  };

  const handleAdvanceTurn = () => {
    if (!socket || !game) return;
    socket.emit("advanceTurn", { gameId: game.id });
  };

  const handleClearInitiative = () => {
    if (!socket || !game) return;
    socket.emit("clearInitiative", { gameId: game.id });
  };

  return (
    <div className="bg-slate-800 p-5 rounded-xl border border-amber-500/30 shadow-lg">
      {/* Header flexible sin solapamiento */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-bold text-amber-400 flex items-center gap-2">
            ⚔️ Iniciativa
          </h2>
          {initiative && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
              Ronda {initiative.round}
            </span>
          )}
        </div>

        {isMaster && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                const initial: Record<number, number> = {};
                allParticipants.forEach((p) => {
                  initial[p.id] = 0;
                });
                setScores(initial);
                setIsModalOpen(true);
              }}
              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-400 rounded-lg text-xs font-semibold transition-all"
            >
              + Establecer
            </button>
            {initiative && (
              <>
                <button
                  onClick={handleAdvanceTurn}
                  className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                >
                  ▶ Turno
                </button>
                <button
                  onClick={handleClearInitiative}
                  className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-400 rounded-lg text-xs font-semibold transition-all"
                >
                  Limpiar
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {!initiative ? (
        <p className="text-slate-500 italic text-sm text-center py-2">
          No hay combate activo.
        </p>
      ) : (
        <div className="space-y-2">
          {initiative.entries.map((entry, idx) => {
            const isCurrent = idx === initiative.currentTurn;
            return (
              <div
                key={`${entry.type}-${entry.id}`}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all border ${
                  isCurrent
                    ? "bg-amber-500/15 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)] text-slate-100"
                    : "bg-slate-900/80 border-slate-700/60 hover:border-slate-600 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-md shrink-0 ${
                      isCurrent
                        ? "bg-amber-500 text-slate-950 font-black"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      entry.type === "character"
                        ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                        : "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]"
                    }`}
                    title={entry.type === "character" ? "Jugador" : "Enemigo"}
                  />
                  <span
                    className={`font-semibold truncate text-sm ${
                      isCurrent ? "text-amber-300 font-bold" : "text-slate-200"
                    }`}
                  >
                    {entry.name}
                  </span>
                  {isCurrent && (
                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider rounded border border-amber-500/40 shrink-0">
                      TURNO
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">
                    Inic
                  </span>
                  <span
                    className={`font-mono text-sm font-bold px-2 py-0.5 rounded bg-slate-950/70 border ${
                      isCurrent
                        ? "text-amber-400 border-amber-500/40"
                        : "text-slate-300 border-slate-700/60"
                    }`}
                  >
                    {entry.score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para establecer iniciativa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-amber-500/40 p-6 rounded-2xl w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-amber-400 mb-1 flex items-center gap-2">
              ⚔️ Establecer Iniciativa
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Ingresa el valor de iniciativa para cada participante.
            </p>

            <div className="space-y-2.5">
              {allParticipants.map((p) => (
                <div
                  key={`${p.type}-${p.id}`}
                  className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-xl border border-slate-700/60"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        p.type === "character" ? "bg-emerald-400" : "bg-red-400"
                      }`}
                    />
                    <div>
                      <span className="text-sm font-medium text-slate-200 block">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {p.type === "character" ? "Jugador" : "Enemigo (NPC)"}
                      </span>
                    </div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={scores[p.id] ?? ""}
                    onChange={(e) =>
                      setScores((prev) => ({
                        ...prev,
                        [p.id]:
                          e.target.value === "" ? 0 : Number(e.target.value),
                      }))
                    }
                    className="w-20 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-base font-bold text-center focus:border-amber-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            {allParticipants.length === 0 && (
              <p className="text-slate-500 italic text-sm mt-2 text-center">
                No hay participantes en la sala.
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSetInitiative}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-sm rounded-xl transition-colors shadow-lg"
              >
                Iniciar Combate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
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

  // Listen for socket events
  if (socket) {
    socket.off("initiativeUpdated");
    socket.off("turnAdvanced");
    socket.off("initiativeCleared");

    socket.on("initiativeUpdated", (state: InitiativeState) => {
      setInitiative(state);
    });
    socket.on("turnAdvanced", (state: InitiativeState) => {
      setInitiative(state);
    });
    socket.on("initiativeCleared", () => {
      setInitiative(null);
    });
  }

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-amber-500/30 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-amber-400">
          Iniciativa
          {initiative && (
            <span className="text-sm font-normal text-slate-400 ml-2">
              Ronda {initiative.round}
            </span>
          )}
        </h2>
        {isMaster && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                const initial: Record<number, number> = {};
                allParticipants.forEach((p) => {
                  initial[p.id] = 0;
                });
                setScores(initial);
                setIsModalOpen(true);
              }}
              className="px-3 py-1 bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-300 rounded text-xs transition-colors"
            >
              + Establecer
            </button>
            {initiative && (
              <>
                <button
                  onClick={handleAdvanceTurn}
                  className="px-3 py-1 bg-slate-900 border border-slate-700 hover:border-emerald-500 text-slate-300 rounded text-xs transition-colors"
                >
                  Siguiente Turno
                </button>
                <button
                  onClick={handleClearInitiative}
                  className="px-3 py-1 bg-slate-900 border border-slate-700 hover:border-red-500 text-red-400 rounded text-xs transition-colors"
                >
                  Limpiar
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {!initiative ? (
        <p className="text-slate-500 italic text-sm">
          No hay combate activo.
        </p>
      ) : (
        <div className="space-y-1">
          {initiative.entries.map((entry, idx) => {
            const isCurrent = idx === initiative.currentTurn;
            return (
              <div
                key={`${entry.type}-${entry.id}`}
                className={`flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
                  isCurrent
                    ? "bg-amber-500/15 border border-amber-500/50 text-amber-300"
                    : "bg-slate-900 border border-transparent text-slate-400"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 w-4">
                    {idx + 1}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      entry.type === "character"
                        ? "bg-emerald-400"
                        : "bg-red-400"
                    }`}
                  />
                  <span className="font-medium">{entry.name}</span>
                  {isCurrent && (
                    <span className="text-xs text-amber-400 font-bold">
                      ◀ TURN
                    </span>
                  )}
                </div>
                <span className="font-mono font-bold">{entry.score}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para establecer iniciativa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-amber-500/50 p-6 rounded-xl w-full max-w-md shadow-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-amber-400 mb-4">
              Establecer Iniciativa
            </h3>

            <div className="space-y-3">
              {allParticipants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        p.type === "character"
                          ? "bg-emerald-400"
                          : "bg-red-400"
                      }`}
                    />
                    <span className="text-sm text-slate-200">{p.name}</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={scores[p.id] ?? ""}
                    onChange={(e) =>
                      setScores((prev) => ({
                        ...prev,
                        [p.id]: e.target.value === "" ? 0 : Number(e.target.value),
                      }))
                    }
                    className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-100 text-sm text-center"
                  />
                </div>
              ))}
            </div>

            {allParticipants.length === 0 && (
              <p className="text-slate-500 italic text-sm mt-2">
                No hay participantes en la sala.
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSetInitiative}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded transition-colors"
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

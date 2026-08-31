"use client";

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { DiceRollResult } from "@/types/game";

interface RollHistoryProps {
  socket: Socket | null;
}

const MAX_HISTORY = 10;

export default function RollHistory({ socket }: RollHistoryProps) {
  const [history, setHistory] = useState<DiceRollResult[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    const handleRoll = (data: DiceRollResult) => {
      setHistory((prev) => {
        const next = [...prev, data];
        return next.length > MAX_HISTORY ? next.slice(-MAX_HISTORY) : next;
      });
    };

    socket.on("diceRolled", handleRoll);
    return () => {
      socket.off("diceRolled", handleRoll);
    };
  }, [socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow">
      <h3 className="text-sm font-bold text-slate-400 mb-3">
        Historial de Tiradas
      </h3>

      <div className="max-h-48 overflow-y-auto space-y-1.5">
        {history.length === 0 ? (
          <p className="text-slate-500 italic text-xs">
            No hay tiradas recientes.
          </p>
        ) : (
          history.map((roll, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-2 text-xs py-1 border-b border-slate-700/50 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <span className="font-mono text-slate-300">
                  {roll.userName}
                </span>
                <span className="text-slate-500 mx-1">tiró</span>
                <span className="font-mono text-amber-400">{roll.formula}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-bold text-slate-200">{roll.total}</span>
                <span className="text-slate-600">
                  ({roll.rolls.join(",")})
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

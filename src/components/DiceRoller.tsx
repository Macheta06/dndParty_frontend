"use client";

import { useState, useCallback } from "react";
import { Socket } from "socket.io-client";

interface DiceRollerProps {
  socket: Socket | null;
}

const QUICK_DICE = ["1d20", "1d6", "1d8", "1d10", "1d12", "1d100"] as const;

export default function DiceRoller({ socket }: DiceRollerProps) {
  const [formula, setFormula] = useState("");
  const emitRoll = useCallback(
    (f: string) => {
      if (!socket || f.trim() === "") return;
      socket.emit("rollDice", { formula: f.trim() });
      setFormula("");
    },
    [socket],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    emitRoll(formula);
  };

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow">
      <h3 className="text-sm font-bold text-slate-400 mb-3">Tirar Dados</h3>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="2d6+3"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 text-sm font-mono placeholder:text-slate-600 focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={!socket || formula.trim() === ""}
          className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded transition-colors disabled:opacity-50"
        >
          Tirar
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {QUICK_DICE.map((d) => (
          <button
            key={d}
            onClick={() => emitRoll(d)}
            disabled={!socket}
            className="px-2.5 py-1 bg-slate-900 border border-slate-700 hover:border-amber-500 text-slate-400 hover:text-amber-400 text-xs font-mono rounded transition-colors disabled:opacity-50"
          >
            {d}
          </button>
        ))}
      </div>

    </div>
  );
}

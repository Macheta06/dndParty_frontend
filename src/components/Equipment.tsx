"use client";

import { useState } from "react";
import { Socket } from "socket.io-client";

interface EquipmentItem {
  name: string;
  quantity: number;
  description?: string;
}

interface EquipmentProps {
  socket: Socket | null;
  gameId: string;
  characterId: number;
  equipment: unknown[];
  isOwner: boolean;
}

export default function Equipment({
  socket,
  gameId,
  characterId,
  equipment,
  isOwner,
}: EquipmentProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState<number | "">("");
  const [itemDescription, setItemDescription] = useState("");

  const items = equipment as EquipmentItem[];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemName.trim() === "" || itemQuantity === "" || itemQuantity <= 0 || !socket)
      return;

    socket.emit("addEquipment", {
      gameId,
      characterId,
      name: itemName.trim(),
      quantity: Number(itemQuantity),
      description: itemDescription.trim() || undefined,
    });

    setItemName("");
    setItemQuantity("");
    setItemDescription("");
    setIsAddOpen(false);
  };

  const handleRemove = (name: string, quantity: number) => {
    if (!socket) return;
    socket.emit("removeEquipment", { gameId, characterId, name, quantity });
  };

  return (
    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-400">Inventario</h3>
        {isOwner && (
          <button
            onClick={() => setIsAddOpen(!isAddOpen)}
            className="text-xs text-amber-400 hover:text-amber-300"
          >
            {isAddOpen ? "Cancelar" : "+ Agregar"}
          </button>
        )}
      </div>

      {isAddOpen && (
        <form onSubmit={handleAdd} className="space-y-2 mb-3 bg-slate-900 rounded p-2">
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Nombre del objeto"
            className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 text-xs focus:border-amber-500"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={itemQuantity}
              onChange={(e) =>
                setItemQuantity(e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder="Cant."
              min={1}
              className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 text-xs focus:border-amber-500"
            />
            <input
              type="text"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              placeholder="Descripción (opcional)"
              className="flex-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 text-xs focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={itemName.trim() === "" || itemQuantity === "" || itemQuantity <= 0}
            className="w-full py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded transition-colors disabled:opacity-50"
          >
            Agregar
          </button>
        </form>
      )}

      <div className="max-h-40 overflow-y-auto space-y-1">
        {items.length === 0 ? (
          <p className="text-slate-500 italic text-xs">Inventario vacío.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between bg-slate-900 rounded px-2 py-1"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-200 truncate">
                  {item.name}
                  {item.description && (
                    <span className="text-slate-500 ml-1">({item.description})</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs text-amber-400 font-bold">
                  x{item.quantity}
                </span>
                {isOwner && (
                  <button
                    onClick={() => handleRemove(item.name, 1)}
                    className="text-xs text-red-400 hover:text-red-300"
                    title="Quitar 1"
                  >
                    -
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

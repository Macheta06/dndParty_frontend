"use client";

import { useMemo, useState } from "react";
import { Socket } from "socket.io-client";

import type { EquipmentItem as EquipmentItemT } from "@/constants/dnd";
import { SRD_ITEMS, SrdItem } from "@/constants/item-catalog";
import {
  SLOT_ICONS,
  SLOT_LABELS,
  describeItemStats,
  findCatalogItem,
  getAllowedSlots,
  isEquippable,
  normalizeItemName,
  resolveItem,
} from "@/lib/equipment";

const SLOTS = ["armor", "shield", "weapon-main", "weapon-offhand"] as const;

interface EquipmentProps {
  socket: Socket | null;
  gameId: string;
  characterId: number;
  equipment: unknown[];
  isOwner: boolean;
}

/** Autocompletado contra el catálogo SRD. Selecciona el nombre y rellena categoría/stats. */
function NameAutocomplete({
  value,
  onChange,
  onPick,
  onClearPick,
}: {
  value: string;
  onChange: (value: string) => void;
  onPick: (item: SrdItem) => void;
  onClearPick: () => void;
}) {
  const matches = useMemo(() => {
    const query = normalizeItemName(value);
    if (query.length < 2) return [];
    return SRD_ITEMS.filter((item) =>
      normalizeItemName(item.name).includes(query),
    ).slice(0, 7);
  }, [value]);

  const exact = matches.find(
    (item) => normalizeItemName(item.name) === normalizeItemName(value),
  );

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          onClearPick();
        }}
        placeholder="Nombre del objeto"
        className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-100 text-xs focus:border-amber-500"
      />
      {matches.length > 0 && !exact && (
        <ul className="absolute z-20 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded shadow-lg max-h-40 overflow-y-auto">
          {matches.map((item) => (
            <li key={item.name}>
              <button
                type="button"
                onClick={() => onPick(item)}
                className="w-full text-left px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
              >
                <span className="font-semibold">{item.name}</span>
                <span className="text-slate-500 ml-1">
                  · {SLOT_LABELS_SAFE(item.category)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Etiqueta legible de una categoría (para el dropdown y los badges). */
function SLOT_LABELS_SAFE(category: string): string {
  switch (category) {
    case "weapon":
      return "Arma";
    case "armor":
      return "Armadura";
    case "shield":
      return "Escudo";
    case "ammo":
      return "Munición";
    case "consumable":
      return "Consumible";
    case "tool":
      return "Herramienta";
    case "magic":
      return "Mágico";
    default:
      return "Equipo";
  }
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
  const [picked, setPicked] = useState<SrdItem | null>(null);

  const items = useMemo(
    () => (equipment as EquipmentItemT[]).map(resolveItem),
    [equipment],
  );

  const equippedBySlot = useMemo(() => {
    const map: Partial<Record<(typeof SLOTS)[number], EquipmentItemT>> = {};
    for (const item of items) {
      if (item.slot) map[item.slot] = item;
    }
    return map;
  }, [items]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemName.trim() === "" || itemQuantity === "" || itemQuantity <= 0 || !socket)
      return;

    const catalogHit = picked ?? findCatalogItem(itemName);

    socket.emit("addEquipment", {
      gameId,
      characterId,
      name: catalogHit ? catalogHit.name : itemName.trim(),
      quantity: Number(itemQuantity),
      description: itemDescription.trim() || undefined,
      category: catalogHit?.category,
      stats: catalogHit?.stats,
    });

    setItemName("");
    setItemQuantity("");
    setItemDescription("");
    setPicked(null);
    setIsAddOpen(false);
  };

  const handleRemove = (name: string, quantity: number) => {
    if (!socket) return;
    socket.emit("removeEquipment", { gameId, characterId, name, quantity });
  };

  const handleToggle = (item: EquipmentItemT) => {
    if (!socket) return;
    socket.emit("toggleEquipment", {
      gameId,
      characterId,
      name: item.name,
      ...(item.slot ? {} : { slot: getAllowedSlots(item)[0] }),
    });
  };

  const renderRow = (item: EquipmentItemT) => {
    const statLine = describeItemStats(item);
    const equippable = isEquippable(item);
    const isEquipped = Boolean(item.slot);

    return (
      <div
        key={item.name}
        className={`rounded px-2 py-1 ${
          isEquipped ? "bg-amber-950/40 border border-amber-700/60" : "bg-slate-900"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs truncate">
              <span className={isEquipped ? "text-amber-300 font-semibold" : "text-slate-200"}>
                {isEquipped && (
                  <span className="mr-1">{SLOT_ICONS[item.slot!]}</span>
                )}
                {item.name}
              </span>
              <span className="text-amber-400 font-bold ml-1">x{item.quantity}</span>
            </p>
            {statLine && <p className="text-[10px] text-slate-500">{statLine}</p>}
            {item.description && (
              <p className="text-[10px] text-slate-600 italic truncate">{item.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-2 shrink-0">
            {equippable && isOwner && (
              <button
                onClick={() => handleToggle(item)}
                className={`text-xs px-1.5 py-0.5 rounded border ${
                  isEquipped
                    ? "border-amber-600 text-amber-300 hover:bg-amber-900/50"
                    : "border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500"
                }`}
                title={
                  isEquipped
                    ? `Desequipar (${SLOT_LABELS[item.slot!]})`
                    : `Equipar en ${SLOT_LABELS[getAllowedSlots(item)[0]]}`
                }
              >
                {isEquipped ? "Desequipar" : "Equipar"}
              </button>
            )}
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
      </div>
    );
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
          <NameAutocomplete
            value={itemName}
            onChange={setItemName}
            onPick={setPicked}
            onClearPick={() => setPicked(null)}
          />
          {picked && (
            <p className="text-[10px] text-amber-400/80">
              Catálogo: {SLOT_LABELS_SAFE(picked.category)}
              {picked.stats?.acBase !== undefined && ` · CA ${picked.stats.acBase}`}
              {picked.stats?.damage && ` · ${picked.stats.damage} ${picked.stats.damageType ?? ""}`}
            </p>
          )}
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

      {/* Panel de slots: qué tiene equipado el personaje, visible para todos */}
      <div className="grid grid-cols-2 gap-1 mb-3">
        {SLOTS.map((slot) => {
          const equipped = equippedBySlot[slot];
          return (
            <div
              key={slot}
              className={`rounded px-1.5 py-1 border text-[10px] ${
                equipped
                  ? "bg-amber-950/50 border-amber-700/60 text-amber-200"
                  : "bg-slate-900/60 border-slate-700/60 text-slate-600"
              }`}
            >
              <span className="mr-1">{SLOT_ICONS[slot]}</span>
              <span className="opacity-70">{SLOT_LABELS[slot]}</span>
              <p className={`truncate ${equipped ? "font-semibold" : "italic"}`}>
                {equipped ? equipped.name : "— libre —"}
              </p>
            </div>
          );
        })}
      </div>

      <div className="max-h-56 overflow-y-auto space-y-1">
        {items.length === 0 ? (
          <p className="text-slate-500 italic text-xs">Inventario vacío.</p>
        ) : (
          items.map(renderRow)
        )}
      </div>
    </div>
  );
}

"use client";

import type { EquipmentItem, EquipmentSlot } from "@/constants/dnd";
import {
  SLOT_LABELS,
  getAllowedSlots,
  isEquippable,
} from "@/lib/equipment";

interface EquipButtonProps {
  item: EquipmentItem;
  /** Estado real (resuelto) del item en el inventario. */
  equipped: boolean;
  /** Solo el dueño del personaje o el DM pueden cambiar equipamiento. */
  canEquip: boolean;
  /**
   * Alterna el equipamiento. `slot` solo se pasa al equipar: si el objeto ya
   * estaba equipado se desequipa sin importar el slot recibido.
   */
  onToggle: (item: EquipmentItem, slot?: EquipmentSlot) => void;
}

/**
 * Botón de equipar/desequipar compartido por las tres vistas de inventario.
 *
 * Un arma a una mano admite dos slots, así que ofrece las dos manos en lugar
 * de elegir en silencio: la alternativa es que «Arma secundaria» nunca sea
 * alcanzable desde la UI.
 */
export default function EquipButton({
  item,
  equipped,
  canEquip,
  onToggle,
}: EquipButtonProps) {
  if (!canEquip || !isEquippable(item)) return null;

  if (equipped) {
    return (
      <button
        type="button"
        onClick={() => onToggle(item)}
        className="text-[11px] px-2 py-0.5 rounded border font-semibold border-amber-600 text-amber-300 hover:bg-amber-900/50"
        title={`Desequipar (${SLOT_LABELS[item.slot!]})`}
      >
        Desequipar
      </button>
    );
  }

  const allowed = getAllowedSlots(item);

  if (allowed.length === 1) {
    return (
      <button
        type="button"
        onClick={() => onToggle(item, allowed[0])}
        className="text-[11px] px-2 py-0.5 rounded border font-semibold border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500"
        title={`Equipar en ${SLOT_LABELS[allowed[0]]}`}
      >
        Equipar
      </button>
    );
  }

  return (
    <span className="inline-flex gap-1">
      {allowed.map((slot) => (
        <button
          key={slot}
          type="button"
          onClick={() => onToggle(item, slot)}
          className="text-[11px] px-1.5 py-0.5 rounded border font-semibold border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500"
          title={`Equipar en ${SLOT_LABELS[slot]}`}
        >
          {slot === "weapon-main" ? "Principal" : "Secundaria"}
        </button>
      ))}
    </span>
  );
}

"use client";

import type { EquipmentItem, EquipmentSlot } from "@/constants/dnd";
import {
  SLOT_LABELS,
  getAllowedSlots,
  isEquippable,
  slotConflict,
} from "@/lib/equipment";

interface EquipButtonProps {
  item: EquipmentItem;
  /** Estado real (resuelto) del item en el inventario. */
  equipped: boolean;
  /** Solo el dueño del personaje o el DM pueden cambiar equipamiento. */
  canEquip: boolean;
  /** Inventario completo, para descartar los slots que ya están ocupados. */
  equipment: EquipmentItem[];
  /**
   * Alterna el equipamiento. `slot` solo se pasa al equipar: si el objeto ya
   * estaba equipado se desequipa sin importar el slot recibido.
   */
  onToggle: (item: EquipmentItem, slot?: EquipmentSlot) => void;
}

const IDLE_BUTTON =
  "text-[11px] px-2 py-0.5 rounded border font-semibold border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500";

/**
 * Botón de equipar/desequipar compartido por las tres vistas de inventario.
 *
 * Un arma a una mano admite dos slots, así que ofrece las dos manos en lugar
 * de elegir en silencio. Los slots que no caben en las manos disponibles no
 * se ofrecen: en vez de mandar un click que el server va a rechazar, queda
 * un botón deshabilitado con el motivo.
 */
export default function EquipButton({
  item,
  equipped,
  canEquip,
  equipment,
  onToggle,
}: EquipButtonProps) {
  if (!canEquip || !isEquippable(item)) return null;

  if (equipped) {
    return (
      <button
        type="button"
        onClick={() => onToggle(item)}
        className={`${IDLE_BUTTON} border-amber-600 text-amber-300 hover:bg-amber-900/50`}
        title={`Desequipar (${SLOT_LABELS[item.slot!]})`}
      >
        Desequipar
      </button>
    );
  }

  const allowed = getAllowedSlots(item);
  const available = allowed.filter(
    (slot) => slotConflict(item, slot, equipment) === null,
  );

  if (available.length === 0) {
    const reason =
      slotConflict(item, allowed[0], equipment) ?? "Las manos están ocupadas";

    return (
      <button
        type="button"
        disabled
        className={`${IDLE_BUTTON} opacity-50 cursor-not-allowed`}
        title={reason}
      >
        Equipar
      </button>
    );
  }

  if (available.length === 1) {
    const slot = available[0];
    return (
      <button
        type="button"
        onClick={() => onToggle(item, slot)}
        className={IDLE_BUTTON}
        title={`Equipar en ${SLOT_LABELS[slot]}`}
      >
        Equipar
      </button>
    );
  }

  return (
    <span className="inline-flex gap-1">
      {available.map((slot) => (
        <button
          key={slot}
          type="button"
          onClick={() => onToggle(item, slot)}
          className={IDLE_BUTTON}
          title={`Equipar en ${SLOT_LABELS[slot]}`}
        >
          {slot === "weapon-main" ? "Principal" : "Secundaria"}
        </button>
      ))}
    </span>
  );
}

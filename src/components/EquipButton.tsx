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

/** Nombre corto de las manos, que son los únicos slots con más de un hueco. */
const HAND_LABELS: Partial<Record<EquipmentSlot, string>> = {
  "weapon-main": "Principal",
  "weapon-offhand": "Secundaria",
};

/**
 * Botón de equipar/desequipar compartido por las tres vistas de inventario.
 *
 * Un arma a una mano admite dos slots, así que ofrece las dos manos en lugar
 * de elegir en silencio. Con el arma principal ocupada solo queda la
 * secundaria —cambiar de arma principal exige desequipar antes— y lo que no
 * cabe en las manos libres no se ofrece: en vez de mandar un click que el
 * server va a rechazar, queda un botón deshabilitado con los motivos.
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
    // Si no cabe en ningún hueco, el tooltip junta todos los motivos: con la
    // mano principal ocupada y el escudo puesto, "desequipar el arma" no basta.
    const reasons = allowed
      .map((slot) => slotConflict(item, slot, equipment))
      .filter((reason): reason is string => reason !== null);

    const reason =
      reasons.length > 0 ? reasons.join(" · ") : "Las manos están ocupadas";

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
    // Si el objeto admite varios huecos y solo queda uno libre, el nombre del
    // botón dice a dónde va: nunca se elige en silencio.
    const label =
      allowed.length > 1 ? (HAND_LABELS[slot] ?? "Equipar") : "Equipar";

    return (
      <button
        type="button"
        onClick={() => onToggle(item, slot)}
        className={IDLE_BUTTON}
        title={`Equipar en ${SLOT_LABELS[slot]}`}
      >
        {label}
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
          {HAND_LABELS[slot] ?? SLOT_LABELS[slot]}
        </button>
      ))}
    </span>
  );
}

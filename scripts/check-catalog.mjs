/**
 * Cruza los nombres de objetos entre:
 *  - lo que otorga el sistema al crear personajes (client/constants/dnd.ts)
 *  - el catálogo del cliente (client/constants/item-catalog.ts)
 *  - el catálogo de equipamiento del server (server/src/characters/equipment.catalog.ts)
 *
 * Un nombre que no resuelve NO es equipable y no computa CA.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const clientSrc = join(here, "..", "src");
const serverSrc = join(here, "..", "..", "server", "src");

const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const clientCatalog = readFileSync(
  join(clientSrc, "constants", "item-catalog.ts"),
  "utf8",
);
const serverCatalog = readFileSync(
  join(serverSrc, "characters", "equipment.catalog.ts"),
  "utf8",
);
const dnd = readFileSync(join(clientSrc, "constants", "dnd.ts"), "utf8");

// Nombres del catálogo del cliente: primer argumento de w()/wr()/a()/g()
const clientNames = new Set();
for (const m of clientCatalog.matchAll(/^\s*(?:w|wr|a|g)\(\s*"([^"]+)"/gm)) {
  clientNames.add(norm(m[1]));
}
for (const m of clientCatalog.matchAll(/name:\s*"([^"]+)"/g)) {
  clientNames.add(norm(m[1]));
}

// Nombres de armadura/escudo/arma del server: claves de EQUIP_CATALOG
const serverKeys = new Set();
const inCatalog = serverCatalog.slice(
  serverCatalog.indexOf("EQUIP_CATALOG"),
);
for (const m of inCatalog.matchAll(/^\s{2}'?([a-záéíóúñü0-9 ]+)'?:\s*\{/gmi)) {
  serverKeys.add(norm(m[1]));
}
// claves entre comillas simples simples ('cota de mallas': {...})
for (const m of inCatalog.matchAll(/^\s*'([^']+)':\s*\{/gm)) {
  serverKeys.add(norm(m[1]));
}

// Nombres que otorga el sistema
const granted = new Set();
for (const m of dnd.matchAll(/name:\s*'([^']+)'/g)) granted.add(norm(m[1]));
for (const m of dnd.matchAll(/name:\s*"([^"]+)"/g)) granted.add(norm(m[1]));

// Las competencias (DND_SKILLS) no son objetos: excluirlas del reporte.
// Igual los "packs" (Equipo de explorador…), que son contenedores.
const skillsSection = dnd.slice(dnd.indexOf("DND_SKILLS"));
const skillNames = new Set();
for (const m of skillsSection.matchAll(/name:\s*'([^']+)'/g)) {
  skillNames.add(norm(m[1]));
}

const isPack = (n) => n.startsWith("equipo de ");
const isSkill = (n) => skillNames.has(n);

console.log(`Catálogo cliente: ${clientNames.size} nombres`);
console.log(`Catálogo server (equipables): ${serverKeys.size} nombres`);
console.log(`Objetos otorgados por el sistema: ${granted.size} nombres\n`);

const grantedNotInClient = [...granted].filter(
  (n) => !clientNames.has(n) && !isPack(n) && !isSkill(n),
);
console.log(
  `\n⚠ Otorgados que NO resuelven en el catálogo del cliente (excl. packs/skills): ${grantedNotInClient.length}`,
);
for (const n of grantedNotInClient) console.log(`   - ${n}`);

// Del catálogo del cliente, los equipables (weapon/armor/shield) deben estar en el server
const clientEquipable = [];
for (const m of clientCatalog.matchAll(
  /^\s*(?:w|wr|a)\(\s*"([^"]+)"/gm,
)) {
  clientEquipable.push(norm(m[1]));
}
for (const m of clientCatalog.matchAll(
  /name:\s*"([^"]+)",\s*\n\s*category:\s*"(shield|armor)"/g,
)) {
  clientEquipable.push(norm(m[1]));
}
const clientEquipableNotInServer = [...new Set(clientEquipable)].filter(
  (n) => !serverKeys.has(n),
);
console.log(
  `\n⚠ Equipables del cliente que NO están en el catálogo del server: ${clientEquipableNotInServer.length}`,
);
for (const n of clientEquipableNotInServer) console.log(`   - ${n}`);

// ── Daño de armas ───────────────────────────────────────────────
// Un `damage` distinto entre repos haría que los ataques tiren otro dado
// sin que nadie se dé cuenta, así que se cruza igual que los nombres.
const clientWeaponDamage = new Map();
for (const m of clientCatalog.matchAll(
  /^\s*(?:w|wr)\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"/gm,
)) {
  clientWeaponDamage.set(norm(m[1]), {
    damage: m[2],
    damageType: norm(m[3]),
  });
}

// Chunks del catálogo del server: de una clave a la siguiente.
const entryStarts = [
  ...inCatalog.matchAll(/^ {2}(?:'([^']+)'|([a-záéíóúñü0-9 ]+)): \{/gmi),
];
const serverWeapons = new Map();
entryStarts.forEach((m, i) => {
  const start = m.index;
  const end =
    i + 1 < entryStarts.length ? entryStarts[i + 1].index : inCatalog.length;
  const body = inCatalog.slice(start, end);
  if (!/category:\s*'weapon'/.test(body)) return;
  const damage = body.match(/damage:\s*'([^']+)'/);
  const damageType = body.match(/damageType:\s*'([^']+)'/);
  serverWeapons.set(norm(m[1] ?? m[2]), {
    damage: damage ? damage[1] : null,
    damageType: damageType ? damageType[1] : null,
  });
});

const damageMismatch = [];
for (const [name, expected] of clientWeaponDamage) {
  const actual = serverWeapons.get(name);
  if (!actual) continue; // ya lo reporta el cruce de nombres
  if (
    actual.damage !== expected.damage ||
    actual.damageType !== expected.damageType
  ) {
    damageMismatch.push({ name, expected, actual });
  }
}

console.log(
  `\n⚠ Armas con daño desalineado cliente ↔ server: ${damageMismatch.length}`,
);
for (const d of damageMismatch) {
  console.log(
    `   - ${d.name}: server ${d.actual.damage ?? "sin daño"}/${
      d.actual.damageType ?? "sin tipo"
    } — cliente ${d.expected.damage}/${d.expected.damageType}`,
  );
}

const weaponsWithoutDamage = [...serverWeapons].filter(
  ([, v]) => !v.damage || !v.damageType,
);
console.log(`\n⚠ Armas del server sin daño: ${weaponsWithoutDamage.length}`);
for (const [n] of weaponsWithoutDamage) console.log(`   - ${n}`);

// Gate: cualquier desalineación rompe equipar, computar CA o atacar.
const failed =
  grantedNotInClient.length > 0 ||
  clientEquipableNotInServer.length > 0 ||
  damageMismatch.length > 0 ||
  weaponsWithoutDamage.length > 0;

if (failed) {
  console.error("\n✗ Catálogo desalineado.");
  process.exit(1);
}

console.log("\n✓ Catálogo alineado (cliente ↔ server ↔ objetos otorgados).");

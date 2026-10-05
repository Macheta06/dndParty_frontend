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

// Gate: cualquier desalineación rompe equipar o computar CA.
const failed =
  grantedNotInClient.length > 0 || clientEquipableNotInServer.length > 0;

if (failed) {
  console.error("\n✗ Catálogo desalineado.");
  process.exit(1);
}

console.log("\n✓ Catálogo alineado (cliente ↔ server ↔ objetos otorgados).");

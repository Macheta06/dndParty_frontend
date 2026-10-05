import type { EquipmentCategory, EquipmentStats } from "@/constants/dnd";

export interface SrdItem {
  name: string;
  category: EquipmentCategory;
  description?: string;
  stats?: EquipmentStats;
}

/** Arma: daño, tipo, propiedades y alcance. */
function w(
  name: string,
  damage: string,
  damageType: string,
  properties: string[],
  extra: Partial<EquipmentStats> = {},
): SrdItem {
  return {
    name,
    category: "weapon",
    description: properties.join(", "),
    stats: { damage, damageType, properties, ...extra },
  };
}

/** Arma a distancia con alcance en pies (corto/largo). */
function wr(
  name: string,
  damage: string,
  damageType: string,
  properties: string[],
  range: string,
  extra: Partial<EquipmentStats> = {},
): SrdItem {
  return {
    name,
    category: "weapon",
    description: `${properties.join(", ")}, alcance ${range} pies`,
    stats: { damage, damageType, properties, range, ...extra },
  };
}

/** Armadura. */
function a(
  name: string,
  acBase: number,
  acFormula: NonNullable<EquipmentStats["acFormula"]>,
  description: string,
  extra: Partial<EquipmentStats> = {},
): SrdItem {
  return {
    name,
    category: "armor",
    description,
    stats: { acBase, acFormula, ...extra },
  };
}

/** Objeto de equipo (no equipable). */
function g(name: string, description?: string): SrdItem {
  return { name, category: "gear", description };
}

/**
 * Catálogo de objetos del SRD de D&D 5.1 (licencia CC-BY 4.0).
 * Se usa para autocompletar al agregar un objeto y para resolver los
 * items legados que solo guardan el nombre.
 */
export const SRD_ITEMS: SrdItem[] = [
  // ══ Armas sencillas cuerpo a cuerpo ══════════════════════════
  w("Garrote", "1d4", "contundente", ["Ligera"], { twoHanded: false }),
  w("Daga", "1d4", "perforante", ["Fina", "Ligera", "Arrojadiza 20/60"], {
    finesse: true,
  }),
  w("Gran maza", "1d8", "contundente", ["A dos manos"], { twoHanded: true }),
  w("Maza", "1d6", "contundente", []),
  w("Bastón", "1d6", "perforante", ["Versátil 1d8"]),
  w("Hoz", "1d4", "cortante", ["Ligera"]),
  w("Lanza", "1d6", "perforante", ["Arrojadiza 20/60", "Versátil 1d8"]),
  w("Lanza corta", "1d6", "perforante", ["Versátil 1d8"]),
  w("Hacha de mano", "1d6", "cortante", ["Ligera", "Arrojadiza 20/60"]),
  w("Martillo ligero", "1d4", "contundente", ["Ligera", "Arrojadiza 20/40"]),
  w("Jabalina", "1d6", "perforante", ["Arrojadiza 30/120"]),

  // ══ Armas sencillas a distancia ══════════════════════════════
  wr("Ballesta ligera", "1d8", "perforante", ["A dos manos", "Carga"], "80/320", {
    twoHanded: true,
  }),
  wr("Dardo", "1d4", "perforante", ["Fina", "Ligera", "Arrojadiza 20/60"], "20/60", {
    finesse: true,
  }),
  wr("Honda", "1d4", "contundente", [], "30/120"),

  // ══ Armas marciales cuerpo a cuerpo ══════════════════════════
  w("Hacha de batalla", "1d8", "cortante", ["Versátil 1d10"]),
  w("Mangual", "1d8", "contundente", []),
  w("Alabarda", "1d10", "cortante", ["Pesada", "A dos manos", "Alcance 10 pies"], {
    twoHanded: true,
  }),
  w("Gran hacha", "1d12", "cortante", ["Pesada", "A dos manos"], {
    twoHanded: true,
  }),
  w("Gran espada", "2d6", "cortante", ["Pesada", "A dos manos"], {
    twoHanded: true,
  }),
  w("Guadaña de guerra", "1d10", "cortante", ["Pesada", "A dos manos", "Alcance 10 pies"], {
    twoHanded: true,
  }),
  w("Lanza de jinete", "1d12", "perforante", ["Alcance 10 pies"]),
  w("Espada larga", "1d8", "cortante", ["Versátil 1d10"]),
  w("Mazo de guerra", "2d6", "contundente", ["Pesada", "A dos manos"], {
    twoHanded: true,
  }),
  w("Estrella de la mañana", "1d8", "perforante", []),
  w("Pica", "1d10", "perforante", ["Pesada", "A dos manos", "Alcance 10 pies"], {
    twoHanded: true,
  }),
  w("Estoque", "1d8", "perforante", ["Fina"], { finesse: true }),
  w("Cimitarra", "1d6", "cortante", ["Fina", "Ligera"], { finesse: true }),
  w("Espada corta", "1d6", "perforante", ["Fina", "Ligera"], { finesse: true }),
  w("Tridente", "1d6", "perforante", ["Arrojadiza 20/60", "Versátil 1d8"]),
  w("Pico de guerra", "1d8", "perforante", []),
  w("Martillo de guerra", "1d8", "contundente", ["Versátil 1d10"]),
  w("Látigo", "1d4", "cortante", ["Fina", "Alcance 10 pies"], { finesse: true }),

  // ══ Armas marciales a distancia ══════════════════════════════
  wr("Ballesta pesada", "1d10", "perforante", ["A dos manos", "Carga"], "100/400", {
    twoHanded: true,
  }),
  wr("Arco largo", "1d8", "perforante", ["A dos manos"], "150/600", {
    twoHanded: true,
  }),
  wr("Arco corto", "1d6", "perforante", ["A dos manos"], "80/320", {
    twoHanded: true,
  }),
  wr("Ballesta de mano", "1d6", "perforante", ["Fina", "Ligera", "Carga"], "30/120", {
    finesse: true,
  }),

  // ══ Armaduras ════════════════════════════════════════════════
  a("Armadura acolchada", 11, "dex", "Armadura ligera, sigilo en desventaja", {
    stealthDisadvantage: true,
  }),
  a("Armadura de cuero", 11, "dex", "Armadura ligera"),
  a("Armadura de cuero tachonado", 12, "dex", "Armadura ligera"),
  a("Armadura de pieles", 12, "dex-capped", "Armadura media"),
  a("Camisa de cota", 13, "dex-capped", "Armadura media"),
  a("Cota de escamas", 14, "dex-capped", "Armadura media, sigilo en desventaja", {
    stealthDisadvantage: true,
  }),
  a("Coraza", 14, "dex-capped", "Armadura media"),
  a("Media armadura", 15, "dex-capped", "Armadura media, sigilo en desventaja", {
    stealthDisadvantage: true,
  }),
  a("Armadura de anillos", 14, "flat", "Armadura pesada, sigilo en desventaja", {
    stealthDisadvantage: true,
  }),
  a("Cota de mallas", 16, "flat", "Armadura pesada, requisito FUE 13", {
    strengthReq: 13,
    stealthDisadvantage: true,
  }),
  a("Armadura de bandas", 17, "flat", "Armadura pesada, requisito FUE 15", {
    strengthReq: 15,
    stealthDisadvantage: true,
  }),
  a("Armadura de placas", 18, "flat", "Armadura pesada, requisito FUE 15", {
    strengthReq: 15,
    stealthDisadvantage: true,
  }),

  // ══ Escudos ══════════════════════════════════════════════════
  {
    name: "Escudo",
    category: "shield",
    description: "+2 a la CA",
    stats: { acBase: 2 },
  },
  {
    name: "Escudo de madera",
    category: "shield",
    description: "+2 a la CA",
    stats: { acBase: 2 },
  },

  // ══ Munición ═════════════════════════════════════════════════
  { name: "Flechas", category: "ammo", description: "Munición para arcos" },
  { name: "Virotes", category: "ammo", description: "Munición para ballestas" },
  { name: "Balas de honda", category: "ammo", description: "Munición para hondas" },

  // ══ Consumibles ══════════════════════════════════════════════
  { name: "Poción de curación", category: "consumable", description: "Recupera 2d4 + 2 PV" },
  { name: "Poción de mayor curación", category: "consumable", description: "Recupera 4d4 + 4 PV" },
  { name: "Poción de resistencia", category: "consumable", description: "+1d4 a una tirada de salvación" },
  { name: "Poción de velocidad", category: "consumable", description: "+10 pies de velocidad y acción extra" },
  { name: "Aceite", category: "consumable", description: "Alumbrante o inflamable" },
  { name: "Antídoto", category: "consumable", description: "Neutraliza un veneno" },
  { name: "Poción de invisibilidad", category: "consumable", description: "Invisible 1 hora" },

  // ══ Herramientas ═════════════════════════════════════════════
  { name: "Herramientas de ladrón", category: "tool", description: "Forjar cerraduras y desactivar trampas" },
  { name: "Herramientas de artesano", category: "tool", description: "Crear y reparar objetos" },
  { name: "Herramientas de falsificación", category: "tool", description: "Imitar documentos y sellos" },
  { name: "Herramientas de inventores", category: "tool", description: "Dispositivos mecánicos" },
  { name: "Herramientas de herboristería", category: "tool", description: "Preparar venenos y pociones" },
  { name: "Herramientas de alquimia", category: "tool", description: "Crear pociones y ácidos" },
  { name: "Kit de herboristería", category: "tool", description: "Identificar plantas" },
  { name: "Kit de disfraz", category: "tool", description: "Cambiar de apariencia" },
  { name: "Kit de maquillaje", category: "tool", description: "Aplicar maquillaje escénico" },
  { name: "Kit de medicina", category: "tool", description: "Estabilizar y diagnosticar" },
  { name: "Kit de calendario", category: "tool", description: "Predecir el clima" },
  { name: "Kit de navegación", category: "tool", description: "Orientarse en alta mar" },
  { name: "Kit de pintor", category: "tool", description: "Crear pinturas y mapas" },
  { name: "Kit de escriba", category: "tool", description: "Copiar pergaminos" },
  { name: "Kit de perforación", category: "tool", description: "Tallar runas y gemas" },
  { name: "Kit de piedras preciosas", category: "tool", description: "Evaluar y tallar gemas" },
  { name: "Instrumento musical", category: "tool", description: "Tocar en actuaciones" },
  { name: "Lúd (Instrumento musical)", category: "tool", description: "Foco de conjuración bárdico" },
  { name: "Balanza de comerciante", category: "tool", description: "Pesar mercancías" },
  { name: "Herramientas de cultivo", category: "tool", description: "Trabajo agrícola" },

  // ══ Equipo de aventurero ═════════════════════════════════════
  g("Mochila", "Contenedor de aventuras, capacidad 30 lb"),
  g("Saco de dormir", "Petate para descansar"),
  g("Kit de cocina", "Cazuela, cubiertos y utensilios"),
  g("Yesca y pedernal", "Para encender fuego"),
  g("Antorcha", "Luz en radio de 20 pies, 1 hora"),
  g("Raciones de viaje", "Comida seca, 1 día por ración"),
  g("Odre de agua", "Recipiente para 4 pintas"),
  g("Cuerda de cáñamo (50 pies)", "Cuerda resistente"),
  g("Cuerda de seda (50 pies)", "Cuerda ligera y fuerte"),
  g("Palanca", "Ventaja en FUE para forzar"),
  g("Martillo", "Martillo de mano"),
  g("Clavijas de hierro", "Para escalar o fijar"),
  g("Bolsa de canicas", "Para hacer tropezar"),
  g("Campana pequeña", "Señal o aviso"),
  g("Vela", "Luz tenue"),
  g("Linterna sorda", "Luz sin revelar la fuente"),
  g("Frasco de aceite", "Combustible o lubricante"),
  g("Manta", "Abrigarse"),
  g("Cepillo de limosna", "Para limosnas o limpieza"),
  g("Bloque de incienso", "Componente ritual"),
  g("Incensario", "Quemar incienso"),
  g("Vestimentas de culto", "Ropas ceremoniales"),
  g("Libro de estudio", "Libro de referencia"),
  g("Frasco de tinta", "Tinta para escribir"),
  g("Pluma de escribir", "Para escribir"),
  g("Pluma de escriba", "Para escribir"),
  g("Hoja de pergamino", "Superficie de escritura"),
  g("Hoja de papel fino", "Papel de calidad"),
  g("Bolsa de arena fina", "Ciega o marca terreno"),
  g("Cuchillo pequeño", "Cuchillo de cocina o utilidad"),
  g("Cofre", "Caja fuerte de madera"),
  g("Estuche de pergaminos", "Protege documentos"),
  g("Ropa fina aristocrática", "Vestimenta elegante"),
  g("Lámpara", "Luz brillante"),
  g("Vial de perfume", "Aroma agradable"),
  g("Cera de sellar", "Sellar documentos"),
  g("Jabón", "Limpieza personal"),
  g("Disfraz de actuación", "Ropa para representar"),
  g("Disfraz fino", "Ropa elegante para engañar"),
  g("Ropa de viajero", "Ropa cómoda para caminar"),
  g("Ropa de trabajo resistente", "Ropa duradera"),
  g("Ropa oscura con capucha", "Ropa para moverse en la sombra"),
  g("Ropa de erudito", "Ropa de estudioso"),
  g("Ropa sencilla de ermitaño", "Ropa humilde"),
  g("Ropa de viajero fina", "Ropa elegante para comerciar"),
  g("Espejo de acero", "Refleja imagen, 1 pulgada circular"),
  g("Perfume", "Aroma agradable"),
  g("Cazuela de hierro", "Olla para cocinar"),
  g("Manta de invierno", "Abrigarse del frío"),
  g("Estuche con notas de descubrimiento", "Documentos de investigación"),
  g("Carta de presentación del gremio", "Recomendación gremial"),
  g("Carta de un colega erudito", "Correspondencia"),
  g("Libro de contabilidad", "Registro de cuentas"),
  g("Libro de oraciones", "Texto sagrado"),
  g("Pergaminos de oraciones", "Pergaminos con rezos"),
  g("Libro de hechizos", "Contiene conjuros preparados"),
  g("Bolsa de componentes mágicos", "Componente verbal y somático"),
  g("Símbolo sagrado", "Foco de conjuración divina"),
  g("Foco druídico (Muérdago)", "Foco de conjuración druídica"),
  g("Foco arcano (Cristal)", "Foco de conjuración arcana"),
  g("Foco arcano (Vara)", "Foco de conjuración arcana"),
  g("Virotes de ballesta", "Munición para ballesta"),
  g("Armadura de cuero (Equipo)", ""),
  g("Botellas vacías", "Para contener líquidos"),
  g("Cadenas (10 pies)", "Cadenas de hierro"),
  g("Cuero (10 pies)", "Tira de cuero"),
  g("Garfio", "Para enganchar o escalar"),
  g("Gancho de escalada", "Para trepar"),
  g("Hilo (50 pies)", "Hilo fino"),
  g("Espinacas", ""),
  g("Palo de mantequilla", ""),
  g("Plato de hojalata", "Vajilla ligera"),
  g("Tenedor de hojalata", "Utensilio de comer"),
  g("Cuchara de hojalata", "Utensilio de comer"),
  g("Barcaza inflable", "Bote desmontable"),
  g("Remo", "Para mover embarcaciones"),
  g("Cuerda de araire", "Para arar tierra"),
  g("Bolsa de componentes", "Bolsa con componentes arcanos"),
  g("Kit de carpintero", "Herramientas de carpintería"),
  g("Kit de albañil", "Herramientas de albañilería"),
  g("Instrumento de viento", "Instrumento musical de viento"),
  g("Instrumento de percusión", "Instrumento musical de percusión"),
  g("Instrumento de cuerda", "Instrumento musical de cuerda"),
  g("Atambor", "Instrumento musical"),
  g("Laúd", "Instrumento musical de cuerda"),
  g("Flauta pan", "Instrumento musical"),
  g("Silbato de cazador", "Para señales"),
  g("Sombrero con plumas", "Prenda decorativa"),
  g("Calabaza vacía", "Contenedor improvisado"),
  g("Bolsa de 100 fichas de PVC", "Fichas de conteo"),
  g("Huesos de dados", "Para lanzar dados"),
  g("Juego de cartas", "Para jugar"),
  g("Dados de bolas", "Juego de azar"),
  g("Lentejuelas", "Decoración"),
  g("Maqueta de barco", "Maqueta decorativa"),
  g("Mapa del tesoro", "Mapa con tesoros"),
  g("Incienso y tiras de papel", "Componente ritual"),
  g("Palo de incienso", "Componente ritual"),
  g("Polvo de tiza", "Para trazar círculos"),
  g("Símbolo de metal", "Símbolo sagrado"),
  g("Reliquia", "Objeto sagrado"),
  g("Vestimentas", "Ropas ceremoniales"),
  g("Aceite sagrado", "Aceite bendito"),
  g("Ropa de payaso", "Ropa colorida"),
  g("Maquillaje", "Para pintar la cara"),
  g("Máscara", "Cubre el rostro"),
  g("Tinta de caligrafía", "Tinta para dibujar"),
  g("Pluma de ave", "Pluma para escribir"),
  g("Tintero", "Recipiente para tinta"),
  g("Kit de buril", "Herramienta para grabar"),
  g("Mortero y mano", "Para moler ingredientes"),
  g("Papel de arroz", "Papel fino"),
  g("Pluma de escritura", "Pluma para escribir"),
  g("Tela de lino", "Tela para envolver"),
  g("Bálsamo", "Ungüento curativo"),
  g("Cera de lacre", "Para sellar"),
  g("Perfume agradable", "Aroma agradable"),
  g("Aguja de coser", "Para coser"),
  g("Hilo grueso", "Hilo resistente"),
  g("Grasa", "Lubricante"),
  g("Yeso", "Para inmovilizar"),
  g("Tijeras", "Para cortar tela"),
  g("Aguja de tejer", "Para tejer"),
  g("Tinte", "Para colorear"),

  // ══ Objetos de trasfondo (otorgados por el sistema) ══════════
  g("Kit de disfraces", "Cambiar de apariencia"),
  g("Herramientas de cartógrafo", "Trazar y leer mapas"),
  g("Aljaba", "Estuche para flechas"),
  g("Grilletes", "Restringir muñegas, CA 20, FUE 20 para romper"),
  g("Pergaminos", "Pergaminos en blanco"),
  g("Pergamino de linaje", "Documento que acredita linaje"),
  g("Libro de registro", "Registro de cuentas o entradas"),
  g("Insignia de guardia", "Insignia que acredita el rango"),
  g("Insignia de rango", "Insignia que acredita el rango"),
  g("Amuleto de la suerte", "Talismán de buena fortuna"),
  g("Anillo de sello de la casa", "Sello familiar"),
  g("Navaja marina", "Cuchillo de cubierta"),
  g("Navaja marinera", "Cuchillo de cubierta"),
  g("Juego de dados o cartas", "Para jugar o hacer trampas"),
  g("Mapa de la ciudad", "Plano urbano"),
  g("Bolsa de viaje", "Bolsa para pertenencias"),
  g("Tienda de campaña (2 personas)", "Refugio para dos"),
  g("Ropa de viaje fina", "Ropa elegante para viajar"),
  g("Ropa de viaje resistente", "Ropa duradera para caminar"),
  g("Ropa de trabajo de marinero", "Ropa resistente al agua"),
  g("Ropa de servicio", "Ropa de servidor o asistente"),
  g("Ropa de campaña", "Ropa de campaña o expedición"),
  g("Ropa gastada", "Ropa en mal estado"),
];

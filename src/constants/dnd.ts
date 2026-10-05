export type StatKey =
  | 'strength'
  | 'dexterity'
  | 'constitution'
  | 'intelligence'
  | 'wisdom'
  | 'charisma';

export interface ClassDetail {
  value: string;
  label: string;
  hitDice: string;
  baseHp: number;
  primaryStats: StatKey[];
  description: string;
  statAdvice: string;
}

export interface RaceDetail {
  value: string;
  label: string;
  speed: number;
  statBonusText: string;
  recommendedStats: StatKey[];
}

export interface BackgroundDetail {
  value: string;
  label: string;
  feat: string;
  abilityOptions: string;
  skills: string;
  description: string;
}

export type EquipmentCategory =
  | 'weapon'
  | 'armor'
  | 'shield'
  | 'ammo'
  | 'gear'
  | 'consumable'
  | 'tool'
  | 'magic';

export type EquipmentSlot = 'armor' | 'shield' | 'weapon-main' | 'weapon-offhand';

export type AcFormula = 'flat' | 'dex' | 'dex-capped';

export interface EquipmentStats {
  acBase?: number;
  acFormula?: AcFormula;
  damage?: string;
  damageType?: string;
  properties?: string[];
  range?: string;
  twoHanded?: boolean;
  finesse?: boolean;
  strengthReq?: number;
  stealthDisadvantage?: boolean;
}

export interface EquipmentItem {
  name: string;
  quantity: number;
  description?: string;
  /** Tipo del objeto. Si falta se resuelve contra el catálogo. */
  category?: EquipmentCategory;
  /** Si tiene slot, el objeto está equipado. */
  slot?: EquipmentSlot;
  stats?: EquipmentStats;
}

export interface FeatItem {
  name: string;
  category: string;
  description: string;
}

export const DND_CLASSES: ClassDetail[] = [
  {
    value: 'Barbarian',
    label: 'Bárbaro',
    hitDice: '1d12',
    baseHp: 12,
    primaryStats: ['strength', 'constitution'],
    description:
      'Un fiero guerrero de trasfondo primitivo que entra en una furia de batalla.',
    statAdvice:
      'Prioriza Fuerza (FUE) para tus ataques cuerpo a cuerpo y Constitución (CON) para tu vida y Defensa sin Armadura.',
  },
  {
    value: 'Fighter',
    label: 'Guerrero',
    hitDice: '1d10',
    baseHp: 10,
    primaryStats: ['strength', 'dexterity', 'constitution'],
    description:
      'Un maestro del combate experto en una gran variedad de armas y armaduras.',
    statAdvice:
      'Prioriza Fuerza (FUE) para armas pesadas o Destreza (DES) para armas sutiles/a distancia, junto con Constitución (CON).',
  },
  {
    value: 'Monk',
    label: 'Monje',
    hitDice: '1d8',
    baseHp: 8,
    primaryStats: ['dexterity', 'wisdom'],
    description:
      'Un maestro de las artes marciales que canaliza el poder de su cuerpo y espíritu.',
    statAdvice:
      'Prioriza Destreza (DES) para tus ataques y Sabiduría (SAB) para tu Defensa sin Armadura y habilidades de Ki.',
  },
  {
    value: 'Rogue',
    label: 'Pícaro',
    hitDice: '1d8',
    baseHp: 8,
    primaryStats: ['dexterity'],
    description:
      'Un especialista en sigilo, vulnerabilidades de los enemigos y habilidades diversas.',
    statAdvice:
      'Prioriza Destreza (DES) para maximizar tu Ataque Furtivo, Clase de Armadura y sigilo.',
  },
  {
    value: 'Paladin',
    label: 'Paladín',
    hitDice: '1d10',
    baseHp: 10,
    primaryStats: ['strength', 'charisma'],
    description: 'Un guerrero sagrado ligado a un juramento solemne.',
    statAdvice:
      'Prioriza Fuerza (FUE) para combatir y Carisma (CAR) para tus hechizos y auras de protección.',
  },
  {
    value: 'Ranger',
    label: 'Explorador',
    hitDice: '1d10',
    baseHp: 10,
    primaryStats: ['dexterity', 'wisdom'],
    description: 'Un cazador hábil y combatiente del mundo salvaje.',
    statAdvice:
      'Prioriza Destreza (DES) para combate a distancia/sutil y Sabiduría (SAB) para tu magia de la naturaleza.',
  },
  {
    value: 'Artificer',
    label: 'Artífice',
    hitDice: '1d8',
    baseHp: 8,
    primaryStats: ['intelligence'],
    description:
      'Un maestro de la invención que infunde objetos con magia arcana.',
    statAdvice:
      'Prioriza Inteligencia (INT) para tus inventos y conjuros, seguido de Constitución o Destreza.',
  },
  {
    value: 'Bard',
    label: 'Bardo',
    hitDice: '1d8',
    baseHp: 8,
    primaryStats: ['charisma'],
    description:
      'Un ejecutor de magia musical que inspira aliados y manipula enemigos.',
    statAdvice:
      'Prioriza Carisma (CAR) para tus conjuros e Inspiración Bárdica, seguido de Destreza (DES).',
  },
  {
    value: 'Cleric',
    label: 'Clérigo',
    hitDice: '1d8',
    baseHp: 8,
    primaryStats: ['wisdom'],
    description:
      'Un campeón sacerdotal que esgrime magia divina al servicio de una deidad.',
    statAdvice:
      'Prioriza Sabiduría (SAB) para tus conjuros y Fuerza o Constitución según tu armadura.',
  },
  {
    value: 'Druid',
    label: 'Druida',
    hitDice: '1d8',
    baseHp: 8,
    primaryStats: ['wisdom'],
    description:
      'Un guardián que adopta formas animales y lanza hechizos de la naturaleza.',
    statAdvice:
      'Prioriza Sabiduría (SAB) para tu poder mágico y Constitución (CON) para tus formas salvajes.',
  },
  {
    value: 'Sorcerer',
    label: 'Hechicero',
    hitDice: '1d6',
    baseHp: 6,
    primaryStats: ['charisma'],
    description:
      'Un lanzador de conjuros con magia innata concedida por su herencia o linaje.',
    statAdvice:
      'Prioriza Carisma (CAR) para tu poder mágico y Constitución (CON) para resistir daños.',
  },
  {
    value: 'Warlock',
    label: 'Brujo',
    hitDice: '1d8',
    baseHp: 8,
    primaryStats: ['charisma'],
    description:
      'Un practicante de magia derivado de un pacto con un patrón extraplanar.',
    statAdvice:
      'Prioriza Carisma (CAR) para tus ataques mágicos e invocaciones de tu Patrón.',
  },
  {
    value: 'Wizard',
    label: 'Mago',
    hitDice: '1d6',
    baseHp: 6,
    primaryStats: ['intelligence'],
    description:
      'Un estudioso erudito capaz de manipular las leyes de la realidad con magia.',
    statAdvice:
      'Prioriza Inteligencia (INT) para tus conjuros y preparar tu libro de hechizos.',
  },
];

export const DND_RACES: RaceDetail[] = [
  {
    value: 'Dragonborn',
    label: 'Dracónido',
    speed: 30,
    statBonusText: '+2 Fuerza, +1 Carisma',
    recommendedStats: ['strength', 'charisma'],
  },
  {
    value: 'Dwarf',
    label: 'Enano',
    speed: 25,
    statBonusText: '+2 Constitución',
    recommendedStats: ['constitution'],
  },
  {
    value: 'Elf',
    label: 'Elfo',
    speed: 30,
    statBonusText: '+2 Destreza',
    recommendedStats: ['dexterity'],
  },
  {
    value: 'Gnome',
    label: 'Gnomo',
    speed: 25,
    statBonusText: '+2 Inteligencia',
    recommendedStats: ['intelligence'],
  },
  {
    value: 'Half-Elf',
    label: 'Semielfo',
    speed: 30,
    statBonusText: '+2 Carisma, +1 a otros dos atributos',
    recommendedStats: ['charisma'],
  },
  {
    value: 'Halfling',
    label: 'Mediano',
    speed: 25,
    statBonusText: '+2 Destreza',
    recommendedStats: ['dexterity'],
  },
  {
    value: 'Half-Orc',
    label: 'Semiorco',
    speed: 30,
    statBonusText: '+2 Fuerza, +1 Constitución',
    recommendedStats: ['strength', 'constitution'],
  },
  {
    value: 'Human',
    label: 'Humano',
    speed: 30,
    statBonusText: '+1 a todos los atributos',
    recommendedStats: [
      'strength',
      'dexterity',
      'constitution',
      'intelligence',
      'wisdom',
      'charisma',
    ],
  },
  {
    value: 'Tiefling',
    label: 'Tiflin (Tiefling)',
    speed: 30,
    statBonusText: '+2 Carisma, +1 Inteligencia',
    recommendedStats: ['charisma', 'intelligence'],
  },
];

// Lista Oficial en Español (Manual del Jugador 2024)
export const DND_BACKGROUNDS: BackgroundDetail[] = [
  {
    value: 'Acolyte',
    label: 'Acólito',
    feat: 'Iniciado en la Magia (Clérigo)',
    abilityOptions: 'Sabiduría, Inteligencia o Carisma',
    skills: 'Perspicacia y Religión',
    description:
      'Dedicaste tu juventud al servicio de un templo o santuario sagrado.',
  },
  {
    value: 'Entertainer',
    label: 'Animador',
    feat: 'Músico (Musician)',
    abilityOptions: 'Fuerza, Destreza o Carisma',
    skills: 'Acrobacias e Interpretación',
    description:
      'Cautivas a las multitudes mediante música, danza, teatro o poesía.',
  },
  {
    value: 'Artisan',
    label: 'Artesano',
    feat: 'Artesano (Crafter)',
    abilityOptions: 'Fuerza, Destreza o Inteligencia',
    skills: 'Investigación y Persuasión',
    description:
      'Comenzaste como aprendiz de un gremio aprendiendo a fabricar bienes.',
  },
  {
    value: 'Farmer',
    label: 'Campesino',
    feat: 'Vigoroso (Tough)',
    abilityOptions: 'Fuerza, Constitución o Sabiduría',
    skills: 'Trato con Animales y Naturaleza',
    description:
      'Trabajaste la tierra cultivando cosechas y criando ganado en el campo.',
  },
  {
    value: 'Charlatan',
    label: 'Charlatán',
    feat: 'Hábil (Skilled)',
    abilityOptions: 'Destreza, Constitución o Carisma',
    skills: 'Engaño y Juego de Manos',
    description:
      'Dominas el arte de los disfraces, la manipulación y la persuasión engatusadora.',
  },
  {
    value: 'Merchant',
    label: 'Comerciante',
    feat: 'Afortunado (Lucky)',
    abilityOptions: 'Constitución, Inteligencia o Carisma',
    skills: 'Trato con Animales y Persuasión',
    description:
      'Compraste y vendiste mercancías viajando entre rutas comerciales.',
  },
  {
    value: 'Criminal',
    label: 'Criminal',
    feat: 'Alerta (Alert)',
    abilityOptions: 'Destreza, Constitución o Inteligencia',
    skills: 'Engaño y Sigilo',
    description:
      'Tienes un pasado en los bajos fondos violando la ley y evadiendo guardias.',
  },
  {
    value: 'Hermit',
    label: 'Ermitaño',
    feat: 'Curandero (Healer)',
    abilityOptions: 'Constitución, Sabiduría o Carisma',
    skills: 'Medicina y Religión',
    description:
      'Viviste en aislamiento contemplativo descubriendo verdades profundas.',
  },
  {
    value: 'Sage',
    label: 'Erudito',
    feat: 'Iniciado en la Magia (Mago)',
    abilityOptions: 'Constitución, Inteligencia o Sabiduría',
    skills: 'Saber Arcano e Historia',
    description:
      'Pasaste años estudiando tomos antiguos y pergaminos en librerías o academias.',
  },
  {
    value: 'Scribe',
    label: 'Escriba',
    feat: 'Hábil (Skilled)',
    abilityOptions: 'Destreza, Inteligencia o Sabiduría',
    skills: 'Investigación y Percepción',
    description:
      'Registraste leyes, textos sagrados y documentos oficiales para eruditos.',
  },
  {
    value: 'Guard',
    label: 'Guardia',
    feat: 'Alerta (Alert)',
    abilityOptions: 'Fuerza, Inteligencia o Sabiduría',
    skills: 'Atletismo y Percepción',
    description:
      'Serviste protegiendo puertas, murallas o personalidades en guarniciones urbanas.',
  },
  {
    value: 'Guide',
    label: 'Guía',
    feat: 'Iniciado en la Magia (Druida)',
    abilityOptions: 'Destreza, Constitución o Sabiduría',
    skills: 'Sigilo y Supervivencia',
    description:
      'Conoces los caminos salvajes y guías a viajeros por senderos peligrosos.',
  },
  {
    value: 'Sailor',
    label: 'Marinero',
    feat: 'Matón de Taberna (Tavern Brawler)',
    abilityOptions: 'Fuerza, Destreza o Constitución',
    skills: 'Atletismo y Percepción',
    description:
      'Navegaste los mares enfrentando tormentas, barcos enemigos y monstruos.',
  },
  {
    value: 'Noble',
    label: 'Noble',
    feat: 'Hábil (Skilled)',
    abilityOptions: 'Fuerza, Inteligencia o Carisma',
    skills: 'Historia y Persuasión',
    description:
      'Naciste o perteneces a la aristocracia y alta sociedad de la región.',
  },
  {
    value: 'Soldier',
    label: 'Soldado',
    feat: 'Atacante Salvaje (Savage Attacker)',
    abilityOptions: 'Fuerza, Destreza o Constitución',
    skills: 'Atletismo e Intimidación',
    description:
      'Entrenaste en una milicia o ejército participando en batallas reales.',
  },
  {
    value: 'Wayfarer',
    label: 'Vagabundo',
    feat: 'Afortunado (Lucky)',
    abilityOptions: 'Destreza, Sabiduría o Carisma',
    skills: 'Perspicacia y Sigilo',
    description:
      'Creciste sin un hogar fijo viajando continuamente y adaptándote a todo.',
  },
];

export const DND_ALIGNMENTS = [
  { value: 'Lawful Good', label: 'Legal Bueno' },
  { value: 'Neutral Good', label: 'Neutral Bueno' },
  { value: 'Chaotic Good', label: 'Caótico Bueno' },
  { value: 'Lawful Neutral', label: 'Legal Neutral' },
  { value: 'True Neutral', label: 'Neutral Puro' },
  { value: 'Chaotic Neutral', label: 'Caótico Neutral' },
  { value: 'Lawful Evil', label: 'Legal Malvado' },
  { value: 'Neutral Evil', label: 'Neutral Malvado' },
  { value: 'Chaotic Evil', label: 'Caótico Malvado' },
];

export function getClassDetail(value: string): ClassDetail | undefined {
  return DND_CLASSES.find(
    (c) => c.value.toLowerCase() === value.toLowerCase(),
  );
}

export function getRaceDetail(value: string): RaceDetail | undefined {
  return DND_RACES.find((r) => r.value.toLowerCase() === value.toLowerCase());
}

export function getBackgroundDetail(
  value: string,
): BackgroundDetail | undefined {
  return DND_BACKGROUNDS.find(
    (b) =>
      b.value.toLowerCase() === value.toLowerCase() ||
      b.label.toLowerCase() === value.toLowerCase(),
  );
}

export function getClassLabel(value: string): string {
  const found = getClassDetail(value);
  return found ? found.label : value;
}

export function getRaceLabel(value: string): string {
  const found = getRaceDetail(value);
  return found ? found.label : value;
}

export function getBackgroundLabel(value: string): string {
  const found = getBackgroundDetail(value);
  return found ? found.label : value;
}

export function getAlignmentLabel(value: string): string {
  const found = DND_ALIGNMENTS.find(
    (a) =>
      a.value.toLowerCase() === value.toLowerCase() ||
      a.label.toLowerCase() === value.toLowerCase(),
  );
  return found ? found.label : value;
}

export const PACK_CONTENTS: Record<string, EquipmentItem[]> = {
  'equipo de explorador': [
    { name: 'Mochila', quantity: 1, description: 'Contenedor de aventuras (capacidad 30 lb)' },
    { name: 'Saco de dormir', quantity: 1, description: 'Petate cómodo para descansar' },
    { name: 'Kit de cocina', quantity: 1, description: 'Cazuela, cubiertos y utensilios básicos' },
    { name: 'Yesca y pedernal', quantity: 1, description: 'Para encender fuego' },
    { name: 'Antorcha', quantity: 10, description: 'Luz brillante en radio de 20 pies' },
    { name: 'Raciones de viaje', quantity: 10, description: 'Comida seca para 1 día por ración' },
    { name: 'Odre de agua', quantity: 1, description: 'Recipiente para líquidos (4 pintas)' },
    { name: 'Cuerda de cáñamo (50 pies)', quantity: 1, description: 'Cuerda resistente para escalar y sujetar' },
  ],
  'equipo de mazmorreo': [
    { name: 'Mochila', quantity: 1 },
    { name: 'Palanca', quantity: 1, description: 'Ventaja en pruebas de Fuerza para forzar' },
    { name: 'Martillo', quantity: 1 },
    { name: 'Clavijas de hierro', quantity: 10 },
    { name: 'Antorcha', quantity: 10 },
    { name: 'Yesca y pedernal', quantity: 1 },
    { name: 'Raciones de viaje', quantity: 10 },
    { name: 'Odre de agua', quantity: 1 },
    { name: 'Cuerda de cáñamo (50 pies)', quantity: 1 },
  ],
  'equipo de ladrón': [
    { name: 'Mochila', quantity: 1 },
    { name: 'Bolsa de canicas', quantity: 1, description: 'Para hacer tropezar perseguidores' },
    { name: 'Cuerda de cáñamo (50 pies)', quantity: 1 },
    { name: 'Campana pequeña', quantity: 1 },
    { name: 'Vela', quantity: 5 },
    { name: 'Palanca', quantity: 1 },
    { name: 'Martillo', quantity: 1 },
    { name: 'Clavijas de hierro', quantity: 10 },
    { name: 'Linterna sorda', quantity: 1 },
    { name: 'Frasco de aceite', quantity: 2 },
    { name: 'Raciones de viaje', quantity: 5 },
    { name: 'Yesca y pedernal', quantity: 1 },
    { name: 'Odre de agua', quantity: 1 },
  ],
  'equipo de sacerdote': [
    { name: 'Mochila', quantity: 1 },
    { name: 'Manta', quantity: 1 },
    { name: 'Vela', quantity: 10 },
    { name: 'Yesca y pedernal', quantity: 1 },
    { name: 'Cepillo de limosna', quantity: 1 },
    { name: 'Bloque de incienso', quantity: 2 },
    { name: 'Incensario', quantity: 1 },
    { name: 'Vestimentas de culto', quantity: 1 },
    { name: 'Raciones de viaje', quantity: 2 },
    { name: 'Odre de agua', quantity: 1 },
  ],
  'equipo de erudito': [
    { name: 'Mochila', quantity: 1 },
    { name: 'Libro de estudio', quantity: 1 },
    { name: 'Frasco de tinta', quantity: 1 },
    { name: 'Pluma de escribir', quantity: 1 },
    { name: 'Hoja de pergamino', quantity: 10 },
    { name: 'Bolsa de arena fina', quantity: 1 },
    { name: 'Cuchillo pequeño', quantity: 1 },
  ],
  'equipo de diplomático': [
    { name: 'Cofre', quantity: 1 },
    { name: 'Estuche de pergaminos', quantity: 2 },
    { name: 'Ropa fina aristocrática', quantity: 1 },
    { name: 'Frasco de tinta', quantity: 1 },
    { name: 'Pluma de escribir', quantity: 1 },
    { name: 'Lámpara', quantity: 1 },
    { name: 'Frasco de aceite', quantity: 2 },
    { name: 'Hoja de papel fino', quantity: 5 },
    { name: 'Vial de perfume', quantity: 1 },
    { name: 'Cera de sellar', quantity: 1 },
    { name: 'Jabón', quantity: 1 },
  ],
  'equipo de artista': [
    { name: 'Mochila', quantity: 1 },
    { name: 'Saco de dormir', quantity: 1 },
    { name: 'Disfraz de actuación', quantity: 2 },
    { name: 'Vela', quantity: 5 },
    { name: 'Raciones de viaje', quantity: 5 },
    { name: 'Odre de agua', quantity: 1 },
    { name: 'Kit de maquillaje', quantity: 1 },
  ],
};

export function expandEquipmentPacks(items: EquipmentItem[]): EquipmentItem[] {
  const expandedList: EquipmentItem[] = [];

  for (const item of items) {
    const key = item.name.toLowerCase().trim();
    if (PACK_CONTENTS[key]) {
      const packItems = PACK_CONTENTS[key];
      for (const pItem of packItems) {
        expandedList.push({
          name: pItem.name,
          quantity: pItem.quantity * item.quantity,
          description: pItem.description,
        });
      }
    } else {
      expandedList.push(item);
    }
  }

  // Fusionar duplicados
  const combinedMap = new Map<string, EquipmentItem>();
  for (const item of expandedList) {
    if (combinedMap.has(item.name)) {
      const existing = combinedMap.get(item.name)!;
      existing.quantity += item.quantity;
      if (!existing.description && item.description) {
        existing.description = item.description;
      }
    } else {
      combinedMap.set(item.name, { ...item });
    }
  }

  return Array.from(combinedMap.values());
}

export function getStartingEquipment(
  className: string,
  backgroundName: string,
): {
  equipment: EquipmentItem[];
  displayEquipment: EquipmentItem[];
  startingGold: number;
} {
  const cls = className.toLowerCase();
  const bg = backgroundName.toLowerCase();

  let classItems: EquipmentItem[] = [];

  if (cls === 'barbarian' || cls === 'bárbaro') {
    classItems = [
      { name: 'Gran hacha', quantity: 1, description: 'Arma marcial a dos manos (1d12 cortante)' },
      { name: 'Hacha de mano', quantity: 2, description: 'Arma sencilla arrojadiza (1d6 cortante)' },
      { name: 'Equipo de explorador', quantity: 1 },
      { name: 'Jabalina', quantity: 4, description: 'Arma sencilla arrojadiza (1d6 perforante)' },
    ];
  } else if (cls === 'fighter' || cls === 'guerrero') {
    classItems = [
      { name: 'Espada larga', quantity: 1, description: 'Arma marcial versátil (1d8/1d10 cortante)' },
      { name: 'Escudo', quantity: 1, description: '+2 a la CA' },
      { name: 'Cota de mallas', quantity: 1, description: 'Armadura pesada (CA 16)' },
      { name: 'Ballesta ligera', quantity: 1, description: 'Arma a distancia (1d8 perforante)' },
      { name: 'Virotes de ballesta', quantity: 20 },
      { name: 'Equipo de mazmorreo', quantity: 1 },
    ];
  } else if (cls === 'monk' || cls === 'monje') {
    classItems = [
      { name: 'Lanza corta', quantity: 1, description: 'Arma sencilla versátil (1d6/1d8)' },
      { name: 'Dardo', quantity: 10, description: 'Arma sutil arrojadiza (1d4)' },
      { name: 'Equipo de explorador', quantity: 1 },
    ];
  } else if (cls === 'rogue' || cls === 'pícaro') {
    classItems = [
      { name: 'Estoque', quantity: 1, description: 'Arma sutil (1d8 perforante)' },
      { name: 'Arco corto', quantity: 1, description: 'Arma a distancia (1d6 perforante)' },
      { name: 'Flechas', quantity: 20 },
      { name: 'Daga', quantity: 2, description: 'Arma sutil arrojadiza (1d4)' },
      { name: 'Armadura de cuero', quantity: 1, description: 'Armadura ligera (CA 11 + DES)' },
      { name: 'Herramientas de ladrón', quantity: 1, description: 'Para desactivar trampas y forzar cerraduras' },
      { name: 'Equipo de ladrón', quantity: 1 },
    ];
  } else if (cls === 'paladin' || cls === 'paladín') {
    classItems = [
      { name: 'Espada larga', quantity: 1, description: 'Arma marcial versátil (1d8/1d10)' },
      { name: 'Escudo', quantity: 1, description: '+2 a la CA' },
      { name: 'Cota de mallas', quantity: 1, description: 'Armadura pesada (CA 16)' },
      { name: 'Jabalina', quantity: 5 },
      { name: 'Símbolo sagrado', quantity: 1, description: 'Canalizador de magia divina' },
      { name: 'Equipo de sacerdote', quantity: 1 },
    ];
  } else if (cls === 'ranger' || cls === 'explorador') {
    classItems = [
      { name: 'Espada corta', quantity: 2, description: 'Arma sutil (1d6 perforante)' },
      { name: 'Arco largo', quantity: 1, description: 'Arma a distancia (1d8 perforante)' },
      { name: 'Flechas', quantity: 20 },
      { name: 'Armadura de cuero tachonado', quantity: 1, description: 'Armadura ligera (CA 12 + DES)' },
      { name: 'Equipo de explorador', quantity: 1 },
    ];
  } else if (cls === 'artificer' || cls === 'artífice') {
    classItems = [
      { name: 'Daga', quantity: 2 },
      { name: 'Armadura de cuero tachonado', quantity: 1, description: 'Armadura ligera (CA 12 + DES)' },
      { name: 'Herramientas de inventores', quantity: 1, description: 'Para canalizar magia e infusiones' },
      { name: 'Equipo de explorador', quantity: 1 },
    ];
  } else if (cls === 'bard' || cls === 'bardo') {
    classItems = [
      { name: 'Estoque', quantity: 1, description: 'Arma sutil (1d8 perforante)' },
      { name: 'Lúd (Instrumento musical)', quantity: 1, description: 'Foco de conjuración bárdico' },
      { name: 'Armadura de cuero', quantity: 1 },
      { name: 'Daga', quantity: 1 },
      { name: 'Equipo de diplomático', quantity: 1 },
    ];
  } else if (cls === 'cleric' || cls === 'clérigo') {
    classItems = [
      { name: 'Maza', quantity: 1, description: 'Arma sencilla contundente (1d6)' },
      { name: 'Cota de escamas', quantity: 1, description: 'Armadura media (CA 14 + DES máx 2)' },
      { name: 'Escudo', quantity: 1, description: '+2 a la CA' },
      { name: 'Símbolo sagrado', quantity: 1 },
      { name: 'Equipo de sacerdote', quantity: 1 },
    ];
  } else if (cls === 'druid' || cls === 'druida') {
    classItems = [
      { name: 'Escudo de madera', quantity: 1, description: '+2 a la CA' },
      { name: 'Cimitarra', quantity: 1, description: 'Arma sutil (1d6 cortante)' },
      { name: 'Armadura de cuero', quantity: 1 },
      { name: 'Foco druídico (Muérdago)', quantity: 1, description: 'Foco de conjuración de la naturaleza' },
      { name: 'Equipo de explorador', quantity: 1 },
    ];
  } else if (cls === 'sorcerer' || cls === 'hechicero') {
    classItems = [
      { name: 'Ballesta ligera', quantity: 1 },
      { name: 'Virotes', quantity: 20 },
      { name: 'Foco arcano (Cristal)', quantity: 1 },
      { name: 'Daga', quantity: 2 },
      { name: 'Equipo de mazmorreo', quantity: 1 },
    ];
  } else if (cls === 'warlock' || cls === 'brujo') {
    classItems = [
      { name: 'Ballesta ligera', quantity: 1 },
      { name: 'Virotes', quantity: 20 },
      { name: 'Foco arcano (Vara)', quantity: 1 },
      { name: 'Armadura de cuero', quantity: 1 },
      { name: 'Daga', quantity: 2 },
      { name: 'Equipo de erudito', quantity: 1 },
    ];
  } else if (cls === 'wizard' || cls === 'mago') {
    classItems = [
      { name: 'Bastón', quantity: 1, description: 'Arma sencilla versátil (1d6/1d8)' },
      { name: 'Libro de hechizos', quantity: 1, description: 'Contiene tus conjuros preparados' },
      { name: 'Bolsa de componentes mágicos', quantity: 1 },
      { name: 'Equipo de erudito', quantity: 1 },
    ];
  }

  let backgroundItems: EquipmentItem[] = [];
  let startingGold = 15;

  if (bg === 'acolyte' || bg === 'acólito') {
    backgroundItems = [
      { name: 'Símbolo sagrado', quantity: 1 },
      { name: 'Libro de oraciones', quantity: 1 },
      { name: 'Pergaminos de oraciones', quantity: 10 },
      { name: 'Vestimentas de culto', quantity: 1 },
      { name: 'Raciones de viaje', quantity: 7 },
    ];
    startingGold = 8;
  } else if (bg === 'entertainer' || bg === 'animador') {
    backgroundItems = [
      { name: 'Lúd (Instrumento musical)', quantity: 1 },
      { name: 'Disfraz de actuación', quantity: 2 },
      { name: 'Espejo de acero', quantity: 1 },
      { name: 'Perfume', quantity: 1 },
    ];
    startingGold = 11;
  } else if (bg === 'artisan' || bg === 'artesano') {
    backgroundItems = [
      { name: 'Herramientas de artesano', quantity: 1 },
      { name: 'Carta de presentación del gremio', quantity: 1 },
      { name: 'Ropa de viajero', quantity: 1 },
    ];
    startingGold = 15;
  } else if (bg === 'farmer' || bg === 'campesino') {
    backgroundItems = [
      { name: 'Hoz', quantity: 1 },
      { name: 'Herramientas de cultivo', quantity: 1 },
      { name: 'Ropa de trabajo resistente', quantity: 1 },
      { name: 'Cazuela de hierro', quantity: 1 },
      { name: 'Saco de dormir', quantity: 1 },
    ];
    startingGold = 23;
  } else if (bg === 'charlatan' || bg === 'charlatán') {
    backgroundItems = [
      { name: 'Disfraz fino', quantity: 1 },
      { name: 'Kit de disfraces', quantity: 1 },
      { name: 'Herramientas de falsificación', quantity: 1 },
    ];
    startingGold = 15;
  } else if (bg === 'merchant' || bg === 'comerciante') {
    backgroundItems = [
      { name: 'Balanza de comerciante', quantity: 1 },
      { name: 'Libro de contabilidad', quantity: 1 },
      { name: 'Frasco de tinta', quantity: 1 },
      { name: 'Pluma de escribir', quantity: 1 },
      { name: 'Ropa de viaje fina', quantity: 1 },
    ];
    startingGold = 22;
  } else if (bg === 'criminal') {
    backgroundItems = [
      { name: 'Herramientas de ladrón', quantity: 1 },
      { name: 'Palanca', quantity: 1 },
      { name: 'Ropa oscura con capucha', quantity: 1 },
    ];
    startingGold = 16;
  } else if (bg === 'hermit' || bg === 'ermitaño') {
    backgroundItems = [
      { name: 'Estuche con notas de descubrimiento', quantity: 1 },
      { name: 'Manta de invierno', quantity: 1 },
      { name: 'Kit de herboristería', quantity: 1 },
      { name: 'Ropa sencilla de ermitaño', quantity: 1 },
    ];
    startingGold = 16;
  } else if (bg === 'sage' || bg === 'erudito') {
    backgroundItems = [
      { name: 'Frasco de tinta', quantity: 1 },
      { name: 'Pluma de escribir', quantity: 1 },
      { name: 'Cuchillo pequeño', quantity: 1 },
      { name: 'Carta de un colega erudito', quantity: 1 },
      { name: 'Ropa de erudito', quantity: 1 },
    ];
    startingGold = 8;
  } else if (bg === 'scribe' || bg === 'escriba') {
    backgroundItems = [
      { name: 'Frasco de tinta', quantity: 2 },
      { name: 'Pluma de escriba', quantity: 2 },
      { name: 'Pergaminos', quantity: 10 },
      { name: 'Libro de registro', quantity: 1 },
      { name: 'Lámpara', quantity: 1 },
    ];
    startingGold = 15;
  } else if (bg === 'guard' || bg === 'guardia') {
    backgroundItems = [
      { name: 'Lanza corta', quantity: 1 },
      { name: 'Insignia de guardia', quantity: 1 },
      { name: 'Grilletes', quantity: 1 },
      { name: 'Ropa de servicio', quantity: 1 },
    ];
    startingGold = 12;
  } else if (bg === 'guide' || bg === 'guía') {
    backgroundItems = [
      { name: 'Arco corto', quantity: 1, description: 'Arma a distancia (1d6 perforante)' },
      { name: 'Flechas', quantity: 20 },
      { name: 'Aljaba', quantity: 1, description: 'Contenedor para flechas' },
      { name: 'Herramientas de cartógrafo', quantity: 1, description: 'Para trazar mapas y orientarse' },
      { name: 'Saco de dormir', quantity: 1 },
      { name: 'Tienda de campaña (2 personas)', quantity: 1 },
      { name: 'Ropa de viaje resistente', quantity: 1 },
    ];
    startingGold = 10;
  } else if (bg === 'sailor' || bg === 'marinero') {
    backgroundItems = [
      { name: 'Navaja marinera', quantity: 1, description: 'Daga pequeña (1d4)' },
      { name: 'Cuerda de seda (50 pies)', quantity: 1 },
      { name: 'Amuleto de la suerte', quantity: 1 },
      { name: 'Ropa de trabajo de marinero', quantity: 1 },
    ];
    startingGold = 10;
  } else if (bg === 'noble') {
    backgroundItems = [
      { name: 'Ropa fina aristocrática', quantity: 1 },
      { name: 'Anillo de sello de la casa', quantity: 1 },
      { name: 'Pergamino de linaje', quantity: 1 },
      { name: 'Perfume', quantity: 1 },
    ];
    startingGold = 29;
  } else if (bg === 'soldier' || bg === 'soldado') {
    backgroundItems = [
      { name: 'Daga', quantity: 1 },
      { name: 'Juego de dados o cartas', quantity: 1 },
      { name: 'Insignia de rango', quantity: 1 },
      { name: 'Ropa de campaña', quantity: 1 },
    ];
    startingGold = 14;
  } else if (bg === 'wayfarer' || bg === 'vagabundo') {
    backgroundItems = [
      { name: 'Daga', quantity: 1 },
      { name: 'Herramientas de ladrón', quantity: 1 },
      { name: 'Mapa de la ciudad', quantity: 1 },
      { name: 'Saco de dormir', quantity: 1 },
      { name: 'Ropa gastada', quantity: 1 },
    ];
    startingGold = 16;
  } else {
    backgroundItems = [
      { name: 'Ropa de viaje resistente', quantity: 1 },
      { name: 'Bolsa de viaje', quantity: 1 },
    ];
    startingGold = 15;
  }

  // Combined raw items summary (for creation screen preview)
  const rawItems = [...classItems, ...backgroundItems];
  const summaryMap = new Map<string, EquipmentItem>();
  for (const item of rawItems) {
    if (summaryMap.has(item.name)) {
      const existing = summaryMap.get(item.name)!;
      existing.quantity += item.quantity;
    } else {
      summaryMap.set(item.name, { ...item });
    }
  }

  // Expanded items (all packs broken down into actual items for the character inventory)
  const expandedItems = expandEquipmentPacks(rawItems);

  return {
    equipment: expandedItems,
    displayEquipment: Array.from(summaryMap.values()),
    startingGold,
  };
}

export interface SkillDetail {
  id: string;
  name: string;
  stat: StatKey;
}

export const DND_SKILLS: SkillDetail[] = [
  { id: 'athletics', name: 'Atletismo', stat: 'strength' },
  { id: 'acrobatics', name: 'Acrobacias', stat: 'dexterity' },
  { id: 'sleight_of_hand', name: 'Juego de Manos', stat: 'dexterity' },
  { id: 'stealth', name: 'Sigilo', stat: 'dexterity' },
  { id: 'arcana', name: 'Saber Arcano', stat: 'intelligence' },
  { id: 'history', name: 'Historia', stat: 'intelligence' },
  { id: 'investigation', name: 'Investigación', stat: 'intelligence' },
  { id: 'nature', name: 'Naturaleza', stat: 'intelligence' },
  { id: 'religion', name: 'Religión', stat: 'intelligence' },
  { id: 'animal_handling', name: 'Trato con Animales', stat: 'wisdom' },
  { id: 'insight', name: 'Perspicacia', stat: 'wisdom' },
  { id: 'medicine', name: 'Medicina', stat: 'wisdom' },
  { id: 'perception', name: 'Percepción', stat: 'wisdom' },
  { id: 'survival', name: 'Supervivencia', stat: 'wisdom' },
  { id: 'deception', name: 'Engaño', stat: 'charisma' },
  { id: 'intimidation', name: 'Intimidación', stat: 'charisma' },
  { id: 'performance', name: 'Interpretación', stat: 'charisma' },
  { id: 'persuasion', name: 'Persuasión', stat: 'charisma' },
];

export function getProficiencyBonus(level: number): number {
  return Math.floor((Math.max(1, level) - 1) / 4) + 2;
}

export interface SaveDetail {
  id: string;
  name: string;
  stat: StatKey;
}

/**
 * Las 6 salvaciones de 5e.
 *
 * `name` es el string que se guarda en `proficiencies`, así que tiene que
 * calzar letra por letra con el `ROLLABLE_SAVES` del server: si no, la
 * competencia no se reconoce y la tirada sale sin bono.
 */
export const DND_SAVES: SaveDetail[] = [
  { id: 'save:strength', name: 'Salvación de Fuerza', stat: 'strength' },
  { id: 'save:dexterity', name: 'Salvación de Destreza', stat: 'dexterity' },
  {
    id: 'save:constitution',
    name: 'Salvación de Constitución',
    stat: 'constitution',
  },
  {
    id: 'save:intelligence',
    name: 'Salvación de Inteligencia',
    stat: 'intelligence',
  },
  { id: 'save:wisdom', name: 'Salvación de Sabiduría', stat: 'wisdom' },
  { id: 'save:charisma', name: 'Salvación de Carisma', stat: 'charisma' },
];

export function getStartingProficiencies(
  backgroundName: string,
  raceName: string,
): string[] {
  const bg = backgroundName.toLowerCase();
  const race = raceName.toLowerCase();
  const profs: string[] = [];

  // Competencias fijas por Trasfondo (Manual 2024)
  if (bg === 'acolyte' || bg === 'acólito') profs.push('Perspicacia', 'Religión');
  else if (bg === 'entertainer' || bg === 'animador') profs.push('Acrobacias', 'Interpretación');
  else if (bg === 'artisan' || bg === 'artesano') profs.push('Investigación', 'Persuasión');
  else if (bg === 'farmer' || bg === 'campesino') profs.push('Trato con Animales', 'Naturaleza');
  else if (bg === 'charlatan' || bg === 'charlatán') profs.push('Engaño', 'Juego de Manos');
  else if (bg === 'merchant' || bg === 'comerciante') profs.push('Trato con Animales', 'Persuasión');
  else if (bg === 'criminal') profs.push('Engaño', 'Sigilo');
  else if (bg === 'hermit' || bg === 'ermitaño') profs.push('Medicina', 'Religión');
  else if (bg === 'sage' || bg === 'erudito') profs.push('Saber Arcano', 'Historia');
  else if (bg === 'scribe' || bg === 'escriba') profs.push('Investigación', 'Percepción');
  else if (bg === 'guard' || bg === 'guardia') profs.push('Atletismo', 'Percepción');
  else if (bg === 'guide' || bg === 'guía') profs.push('Sigilo', 'Supervivencia');
  else if (bg === 'sailor' || bg === 'marinero') profs.push('Atletismo', 'Percepción');
  else if (bg === 'noble') profs.push('Historia', 'Persuasión');
  else if (bg === 'soldier' || bg === 'soldado') profs.push('Atletismo', 'Intimidación');
  else if (bg === 'wayfarer' || bg === 'vagabundo') profs.push('Perspicacia', 'Sigilo');

  // Competencias por Raza
  if (race === 'elf' || race === 'elfo') profs.push('Percepción');
  if (race === 'half-orc' || race === 'semiorco') profs.push('Intimidación');

  return Array.from(new Set(profs));
}

export function getProficiencySource(
  skillName: string,
  backgroundName: string,
  raceName: string,
): 'trasfondo' | 'raza' | null {
  const race = raceName.toLowerCase();

  // Raza
  if ((race === 'elf' || race === 'elfo') && skillName === 'Percepción') return 'raza';
  if ((race === 'half-orc' || race === 'semiorco') && skillName === 'Intimidación') return 'raza';

  // Trasfondo
  const bgProfs = getStartingProficiencies(backgroundName, '');
  if (bgProfs.includes(skillName)) return 'trasfondo';

  return null;
}

export function getStartingFeats(backgroundName: string): FeatItem[] {
  const bgDetail = getBackgroundDetail(backgroundName);
  if (!bgDetail) return [];

  return [
    {
      name: bgDetail.feat,
      category: 'Dote de Origen (Nivel 1)',
      description: `Otorgado por el trasfondo ${bgDetail.label}. Competencias: ${bgDetail.skills}. Opciones de mejora de característica: ${bgDetail.abilityOptions}.`,
    },
  ];
}


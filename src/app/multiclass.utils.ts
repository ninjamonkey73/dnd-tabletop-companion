import { Character, ClassLevel, PactMagicSlots, defaultCharacter } from './character.model';

export const CLASS_HIT_DIE: Record<string, number> = {
  barbarian: 12,
  fighter: 10,
  paladin: 10,
  ranger: 10,
  bard: 8,
  cleric: 8,
  druid: 8,
  monk: 8,
  rogue: 8,
  warlock: 8,
  artificer: 8,
  sorcerer: 6,
  wizard: 6,
};

export const FULL_CASTERS = ['bard', 'cleric', 'druid', 'sorcerer', 'wizard'];
export const HALF_CASTERS = ['paladin', 'ranger'];
export const ARTIFICER = 'artificer';
export const THIRD_CASTERS = ['eldritch knight', 'eldritch-knight', 'arcane trickster', 'arcane-trickster'];
export const PACT_CASTERS = ['warlock'];

export const MULTICLASS_SPELL_SLOTS: Record<number, number[]> = {
  1: [2, 0, 0, 0, 0, 0, 0, 0, 0],
  2: [3, 0, 0, 0, 0, 0, 0, 0, 0],
  3: [4, 2, 0, 0, 0, 0, 0, 0, 0],
  4: [4, 3, 0, 0, 0, 0, 0, 0, 0],
  5: [4, 3, 2, 0, 0, 0, 0, 0, 0],
  6: [4, 3, 3, 0, 0, 0, 0, 0, 0],
  7: [4, 3, 3, 1, 0, 0, 0, 0, 0],
  8: [4, 3, 3, 2, 0, 0, 0, 0, 0],
  9: [4, 3, 3, 3, 1, 0, 0, 0, 0],
  10: [4, 3, 3, 3, 2, 0, 0, 0, 0],
  11: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  12: [4, 3, 3, 3, 2, 1, 0, 0, 0],
  13: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  14: [4, 3, 3, 3, 2, 1, 1, 0, 0],
  15: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  16: [4, 3, 3, 3, 2, 1, 1, 1, 0],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

/**
 * Returns the sum of all class levels, capped at 20.
 */
export function getTotalLevel(classes: ClassLevel[] | undefined | null): number {
  if (!Array.isArray(classes) || classes.length === 0) {
    return 0;
  }
  const sum = classes.reduce((total, c) => total + (Number(c?.level) || 0), 0);
  return Math.max(0, Math.min(20, sum));
}

/**
 * Calculates proficiency bonus strictly from total level: Math.ceil(totalLevel / 4) + 1.
 */
export function getProficiencyBonus(
  classesOrLevel: ClassLevel[] | number | undefined | null
): number {
  const totalLevel =
    typeof classesOrLevel === 'number'
      ? Math.max(1, Math.min(20, classesOrLevel))
      : Math.max(1, getTotalLevel(classesOrLevel));
  return Math.ceil(totalLevel / 4) + 1;
}

/**
 * Groups hit dice by die size (e.g., "4d8 + 2d10").
 * Preserves the order in which die sizes first appear across classes.
 */
export function getHitDicePool(classes: ClassLevel[] | undefined | null): string {
  if (!Array.isArray(classes) || classes.length === 0) {
    return '';
  }

  const poolOrder: number[] = [];
  const poolCounts: Record<number, number> = {};

  for (const c of classes) {
    const lvl = Number(c?.level) || 0;
    if (lvl <= 0) continue;
    const clsKey = (c?.class || '').toLowerCase().trim();
    const die = CLASS_HIT_DIE[clsKey] ?? 8; // Default d8 for unknown classes
    if (poolCounts[die] === undefined) {
      poolCounts[die] = 0;
      poolOrder.push(die);
    }
    poolCounts[die] += lvl;
  }

  return poolOrder
    .filter((die) => poolCounts[die] > 0)
    .map((die) => `${poolCounts[die]}d${die}`)
    .join(' + ');
}

/**
 * Returns the level for a specific class (case-insensitive).
 */
export function getClassLevel(
  classes: ClassLevel[] | undefined | null,
  className: string
): number {
  if (!Array.isArray(classes)) return 0;
  const target = (className || '').toLowerCase().trim();
  const match = classes.find(
    (c) => (c?.class || '').toLowerCase().trim() === target
  );
  return match ? Math.max(0, Number(match.level) || 0) : 0;
}

/**
 * Returns whether character has at least 1 level in the given class.
 */
export function hasClass(
  classes: ClassLevel[] | undefined | null,
  className: string
): boolean {
  return getClassLevel(classes, className) > 0;
}

/**
 * Calculate Effective Caster Level (ECL) for standard multiclass spellcasting:
 * Full Casters + floor(Half Casters / 2) + floor(Third Casters / 3) + ceil(Artificer / 2)
 */
export function getEffectiveCasterLevel(
  classes: ClassLevel[] | undefined | null
): number {
  if (!Array.isArray(classes)) return 0;
  let full = 0;
  let half = 0;
  let third = 0;
  let artificer = 0;

  for (const c of classes) {
    const name = (c?.class || '').toLowerCase().trim();
    const lvl = Math.max(0, Number(c?.level) || 0);
    const sub = (c?.subclass || '').toLowerCase().trim();

    if (FULL_CASTERS.includes(name)) {
      full += lvl;
    } else if (HALF_CASTERS.includes(name)) {
      half += lvl;
    } else if (name === ARTIFICER) {
      artificer += lvl;
    } else if (
      (name === 'fighter' || name === 'rogue') &&
      lvl >= 3 &&
      THIRD_CASTERS.includes(sub)
    ) {
      third += lvl;
    } else if (THIRD_CASTERS.includes(name)) {
      third += lvl;
    }
  }

  const artContribution = artificer > 0 ? Math.ceil(artificer / 2) : 0;
  const ecl =
    full + Math.floor(half / 2) + Math.floor(third / 3) + artContribution;
  return Math.min(20, Math.max(0, ecl));
}

/**
 * Returns multiclass shared spell slots for the given Effective Caster Level.
 */
export function getMulticlassSpellSlots(ecl: number): number[] {
  const cappedEcl = Math.max(0, Math.min(20, Math.floor(ecl)));
  if (cappedEcl === 0) {
    return [0, 0, 0, 0, 0, 0, 0, 0, 0];
  }
  return MULTICLASS_SPELL_SLOTS[cappedEcl] || [0, 0, 0, 0, 0, 0, 0, 0, 0];
}

/**
 * Returns Warlock Pact Magic slots for a given Warlock level.
 */
export function getPactMagicSlots(warlockLevel: number): {
  slots: number;
  slotLevel: number;
} {
  const lvl = Math.max(0, Math.min(20, Math.floor(warlockLevel)));
  if (lvl === 0) return { slots: 0, slotLevel: 0 };
  if (lvl === 1) return { slots: 1, slotLevel: 1 };
  const slotLevel = Math.min(5, Math.ceil(lvl / 2));
  const slots = lvl >= 17 ? 4 : lvl >= 11 ? 3 : 2;
  return { slots, slotLevel };
}

/**
 * Class feature selectors
 */
export function hasKi(
  characterOrClasses:
    | Character
    | ClassLevel[]
    | { classes?: ClassLevel[]; class?: string }
    | undefined
    | null
): boolean {
  if (!characterOrClasses) return false;
  const classes = Array.isArray(characterOrClasses)
    ? characterOrClasses
    : characterOrClasses.classes;
  const single = !Array.isArray(characterOrClasses)
    ? characterOrClasses.class
    : undefined;
  return hasClass(classes, 'Monk') || single === 'Monk';
}

export function hasRage(
  characterOrClasses:
    | Character
    | ClassLevel[]
    | { classes?: ClassLevel[]; class?: string }
    | undefined
    | null
): boolean {
  if (!characterOrClasses) return false;
  const classes = Array.isArray(characterOrClasses)
    ? characterOrClasses
    : characterOrClasses.classes;
  const single = !Array.isArray(characterOrClasses)
    ? characterOrClasses.class
    : undefined;
  return hasClass(classes, 'Barbarian') || single === 'Barbarian';
}

export function hasWildShape(
  characterOrClasses:
    | Character
    | ClassLevel[]
    | { classes?: ClassLevel[]; class?: string; level?: number }
    | undefined
    | null
): boolean {
  if (!characterOrClasses) return false;
  const classes = Array.isArray(characterOrClasses)
    ? characterOrClasses
    : characterOrClasses.classes;
  const druidLevel = getClassLevel(classes, 'Druid');
  if (druidLevel >= 2) return true;
  if (!Array.isArray(characterOrClasses)) {
    if (
      characterOrClasses.class === 'Druid' &&
      (characterOrClasses.level ?? 0) >= 2
    ) {
      return true;
    }
  }
  return false;
}

export function hasSneakAttack(
  characterOrClasses:
    | Character
    | ClassLevel[]
    | { classes?: ClassLevel[]; class?: string }
    | undefined
    | null
): boolean {
  if (!characterOrClasses) return false;
  const classes = Array.isArray(characterOrClasses)
    ? characterOrClasses
    : characterOrClasses.classes;
  const single = !Array.isArray(characterOrClasses)
    ? characterOrClasses.class
    : undefined;
  return hasClass(classes, 'Rogue') || single === 'Rogue';
}

export function hasSpellSlots(
  characterOrClasses:
    | Character
    | ClassLevel[]
    | {
        classes?: ClassLevel[];
        spellSlots?: number[];
        pactSlots?: PactMagicSlots;
        class?: string;
      }
    | undefined
    | null
): boolean {
  if (!characterOrClasses) return false;
  if (!Array.isArray(characterOrClasses)) {
    if (
      Array.isArray(characterOrClasses.spellSlots) &&
      characterOrClasses.spellSlots.some((s) => s > 0)
    ) {
      return true;
    }
    if (
      characterOrClasses.pactSlots &&
      characterOrClasses.pactSlots.max > 0
    ) {
      return true;
    }
  }
  const classes = Array.isArray(characterOrClasses)
    ? characterOrClasses
    : characterOrClasses.classes;
  const ecl = getEffectiveCasterLevel(classes);
  if (ecl > 0) return true;
  const warlockLvl = getClassLevel(classes, 'Warlock');
  if (warlockLvl > 0) return true;
  return false;
}

export function getAvailableStatSections(
  character: Character
): Array<'ki' | 'rage' | 'wild' | 'slots' | 'sneakAttack'> {
  const arr: Array<'ki' | 'rage' | 'wild' | 'slots' | 'sneakAttack'> = [];
  if (hasKi(character)) arr.push('ki');
  if (hasRage(character)) arr.push('rage');
  if (hasWildShape(character)) arr.push('wild');
  if (hasSpellSlots(character)) arr.push('slots');
  if (hasSneakAttack(character)) arr.push('sneakAttack');
  return arr;
}

/**
 * User-facing summary string (e.g., "Druid (Land: Coast) 6 / Fighter 2 (Lvl 8)")
 */
export function formatClassSummary(
  classes: ClassLevel[] | undefined | null
): string {
  if (!Array.isArray(classes) || classes.length === 0) {
    return 'No Class (Lvl 0)';
  }
  const valid = classes.filter((c) => (c?.class || '').trim().length > 0);
  const total = getTotalLevel(classes);
  if (valid.length === 0) {
    return `Select Class (Lvl ${total})`;
  }
  const parts = valid.map((c) => {
    const className = c.class.trim();
    const subclass = (c.subclass || '').trim();
    const subdomain = (c.subdomain || '').trim();

    let details = '';
    if (subclass && subdomain) {
      details = ` (${subclass}: ${subdomain})`;
    } else if (subclass) {
      details = ` (${subclass})`;
    } else if (subdomain) {
      details = ` (${subdomain})`;
    }

    return `${className}${details} ${c.level}`;
  }).join(' / ');
  return `${parts} (Lvl ${total})`;
}

/**
 * State hydration & backward-compatibility migration helper.
 * If legacy `{ class, level }` is detected in storage/URL/state, normalize it to
 * `classes: [{ class, level }]` automatically.
 */
export function migrateLegacyCharacter(raw: any): Character {
  if (!raw || typeof raw !== 'object') {
    return { ...defaultCharacter };
  }

  let classes: ClassLevel[] = [];

  if (Array.isArray(raw.classes) && raw.classes.length > 0) {
    classes = raw.classes.map((c: any) => ({
      class: typeof c?.class === 'string' ? c.class.trim() : '',
      level: Math.max(1, Math.min(20, Number(c?.level) || 1)),
      subclass: typeof c?.subclass === 'string' ? c.subclass.trim() : '',
      subdomain: typeof c?.subdomain === 'string' ? c.subdomain.trim() : '',
    }));
  } else if (raw.class !== undefined || raw.level !== undefined) {
    // Legacy single-class detected
    const legacyClass = typeof raw.class === 'string' ? raw.class.trim() : '';
    const legacyLevel = Math.max(1, Math.min(20, Number(raw.level) || 1));
    if (legacyClass || raw.level !== undefined) {
      classes = [
        {
          class: legacyClass,
          level: legacyLevel,
          subclass: typeof raw.subclass === 'string' ? raw.subclass.trim() : '',
          subdomain: typeof raw.subdomain === 'string' ? raw.subdomain.trim() : '',
        },
      ];
    }
  } else if (Array.isArray(raw.classes)) {
    classes = [];
  }

  const warlockLvl = getClassLevel(classes, 'Warlock');
  let pactSlots: PactMagicSlots = { level: 0, max: 0, current: 0 };
  if (warlockLvl > 0) {
    const pactInfo = getPactMagicSlots(warlockLvl);
    const existingPact = raw.pactSlots;
    const current =
      existingPact && typeof existingPact.current === 'number'
        ? Math.max(0, Math.min(pactInfo.slots, existingPact.current))
        : pactInfo.slots;
    pactSlots = {
      level: pactInfo.slotLevel,
      max: pactInfo.slots,
      current,
    };
  } else if (raw.pactSlots && typeof raw.pactSlots === 'object') {
    pactSlots = {
      level: Number(raw.pactSlots.level) || 0,
      max: Number(raw.pactSlots.max) || 0,
      current: Number(raw.pactSlots.current) || 0,
    };
  }

  const result: Character = {
    ...defaultCharacter,
    ...raw,
    classes,
    pactSlots,
  };

  // Ensure arrays and required structures
  if (!Array.isArray(result.spellSlots)) result.spellSlots = [];
  if (!Array.isArray(result.spellSlotsRemaining))
    result.spellSlotsRemaining = [];
  if (!Array.isArray(result.deathSaveSuccess))
    result.deathSaveSuccess = [false, false, false];
  if (!Array.isArray(result.deathSaveFailure))
    result.deathSaveFailure = [false, false, false];
  if (!Array.isArray(result.resources)) result.resources = [];

  return result;
}

export {
  migrateLegacyCharacter as normalizeCharacter,
  migrateLegacyCharacter as hydrateCharacter,
};

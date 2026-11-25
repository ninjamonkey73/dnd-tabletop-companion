import { describe, it, expect } from 'vitest';
import {
  getTotalLevel,
  getProficiencyBonus,
  getHitDicePool,
  getClassLevel,
  hasClass,
  getEffectiveCasterLevel,
  getMulticlassSpellSlots,
  getPactMagicSlots,
  migrateLegacyCharacter,
  hasKi,
  hasRage,
  hasWildShape,
  hasSneakAttack,
  hasSpellSlots,
  formatClassSummary,
} from './multiclass.utils';
import { Character, ClassLevel, defaultCharacter } from './character.model';

describe('multiclass.utils', () => {
  describe('getTotalLevel', () => {
    it('should return 0 for empty or null array', () => {
      expect(getTotalLevel([])).toBe(0);
      expect(getTotalLevel(null)).toBe(0);
      expect(getTotalLevel(undefined)).toBe(0);
    });

    it('should sum all class levels', () => {
      const classes: ClassLevel[] = [
        { class: 'Druid', level: 4 },
        { class: 'Fighter', level: 2 },
      ];
      expect(getTotalLevel(classes)).toBe(6);
    });

    it('should cap total level at 20', () => {
      const classes: ClassLevel[] = [
        { class: 'Druid', level: 12 },
        { class: 'Fighter', level: 15 },
      ];
      expect(getTotalLevel(classes)).toBe(20);
    });
  });

  describe('getProficiencyBonus', () => {
    it('should calculate bonus strictly from total level', () => {
      expect(getProficiencyBonus(1)).toBe(2);
      expect(getProficiencyBonus(4)).toBe(2);
      expect(getProficiencyBonus(5)).toBe(3);
      expect(getProficiencyBonus(8)).toBe(3);
      expect(getProficiencyBonus(9)).toBe(4);
      expect(getProficiencyBonus(12)).toBe(4);
      expect(getProficiencyBonus(13)).toBe(5);
      expect(getProficiencyBonus(16)).toBe(5);
      expect(getProficiencyBonus(17)).toBe(6);
      expect(getProficiencyBonus(20)).toBe(6);
    });

    it('should accept classes array', () => {
      const classes: ClassLevel[] = [
        { class: 'Druid', level: 4 },
        { class: 'Fighter', level: 2 },
      ]; // total 6 -> +3
      expect(getProficiencyBonus(classes)).toBe(3);
    });
  });

  describe('getHitDicePool', () => {
    it('should group hit dice by die size preserving appearance order', () => {
      const classes: ClassLevel[] = [
        { class: 'Druid', level: 4 }, // d8
        { class: 'Fighter', level: 2 }, // d10
      ];
      expect(getHitDicePool(classes)).toBe('4d8 + 2d10');
    });

    it('should merge identical die sizes from different classes', () => {
      const classes: ClassLevel[] = [
        { class: 'Cleric', level: 3 }, // d8
        { class: 'Fighter', level: 2 }, // d10
        { class: 'Monk', level: 2 }, // d8
      ];
      expect(getHitDicePool(classes)).toBe('5d8 + 2d10');
    });

    it('should return empty string for no classes', () => {
      expect(getHitDicePool([])).toBe('');
      expect(getHitDicePool(null)).toBe('');
    });
  });

  describe('getClassLevel and hasClass', () => {
    const classes: ClassLevel[] = [
      { class: 'Druid', level: 4 },
      { class: 'Rogue', level: 1 },
    ];

    it('should find class case-insensitively', () => {
      expect(getClassLevel(classes, 'Druid')).toBe(4);
      expect(getClassLevel(classes, 'druid')).toBe(4);
      expect(getClassLevel(classes, 'DRUID ')).toBe(4);
      expect(getClassLevel(classes, 'Rogue')).toBe(1);
      expect(getClassLevel(classes, 'Fighter')).toBe(0);
    });

    it('should return true/false with hasClass', () => {
      expect(hasClass(classes, 'druid')).toBe(true);
      expect(hasClass(classes, 'monk')).toBe(false);
    });
  });

  describe('getEffectiveCasterLevel (ECL)', () => {
    it('should sum full casters directly', () => {
      const classes: ClassLevel[] = [
        { class: 'Cleric', level: 3 },
        { class: 'Wizard', level: 2 },
      ];
      expect(getEffectiveCasterLevel(classes)).toBe(5);
    });

    it('should calculate floor(half casters / 2)', () => {
      const classes: ClassLevel[] = [
        { class: 'Paladin', level: 5 }, // floor(5/2) = 2
        { class: 'Ranger', level: 4 }, // floor(4/2) = 2
      ];
      expect(getEffectiveCasterLevel(classes)).toBe(4);
    });

    it('should round up Artificer: ceil(artificer / 2)', () => {
      const classes: ClassLevel[] = [
        { class: 'Artificer', level: 5 }, // ceil(5/2) = 3
        { class: 'Wizard', level: 3 },
      ];
      expect(getEffectiveCasterLevel(classes)).toBe(6);
    });

    it('should calculate floor(third casters / 3) for Fighter Eldritch Knight and Rogue Arcane Trickster', () => {
      const classes: ClassLevel[] = [
        { class: 'Fighter', level: 6, subclass: 'Eldritch Knight' }, // floor(6/3) = 2
        { class: 'Wizard', level: 2 },
      ];
      expect(getEffectiveCasterLevel(classes)).toBe(4);
    });

    it('should ignore third casters under level 3', () => {
      const classes: ClassLevel[] = [
        { class: 'Fighter', level: 2, subclass: 'Eldritch Knight' },
        { class: 'Wizard', level: 2 },
      ];
      expect(getEffectiveCasterLevel(classes)).toBe(2);
    });

    it('should exclude Warlock from ECL', () => {
      const classes: ClassLevel[] = [
        { class: 'Warlock', level: 5 },
        { class: 'Sorcerer', level: 3 },
      ];
      expect(getEffectiveCasterLevel(classes)).toBe(3);
    });
  });

  describe('getMulticlassSpellSlots', () => {
    it('should return 0 slots for ECL 0', () => {
      expect(getMulticlassSpellSlots(0)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    });

    it('should return correct slots for ECL 1', () => {
      expect(getMulticlassSpellSlots(1)).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0]);
    });

    it('should return correct slots for ECL 5', () => {
      expect(getMulticlassSpellSlots(5)).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0]);
    });

    it('should cap at ECL 20', () => {
      expect(getMulticlassSpellSlots(25)).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1]);
    });
  });

  describe('getPactMagicSlots', () => {
    it('should return correct pact slots by Warlock level', () => {
      expect(getPactMagicSlots(0)).toEqual({ slots: 0, slotLevel: 0 });
      expect(getPactMagicSlots(1)).toEqual({ slots: 1, slotLevel: 1 });
      expect(getPactMagicSlots(2)).toEqual({ slots: 2, slotLevel: 1 });
      expect(getPactMagicSlots(3)).toEqual({ slots: 2, slotLevel: 2 });
      expect(getPactMagicSlots(5)).toEqual({ slots: 2, slotLevel: 3 });
      expect(getPactMagicSlots(9)).toEqual({ slots: 2, slotLevel: 5 });
      expect(getPactMagicSlots(11)).toEqual({ slots: 3, slotLevel: 5 });
      expect(getPactMagicSlots(17)).toEqual({ slots: 4, slotLevel: 5 });
    });
  });

  describe('formatClassSummary', () => {
    it('should format summary with subclass and subdomain', () => {
      const classes: ClassLevel[] = [
        { class: 'Druid', level: 6, subclass: 'Circle of the Land', subdomain: 'Coast' },
        { class: 'Fighter', level: 2 },
      ];
      expect(formatClassSummary(classes)).toBe(
        'Druid (Circle of the Land: Coast) 6 / Fighter 2 (Lvl 8)'
      );
    });

    it('should format summary with subclass only', () => {
      const classes: ClassLevel[] = [
        { class: 'Fighter', level: 3, subclass: 'Champion' },
      ];
      expect(formatClassSummary(classes)).toBe('Fighter (Champion) 3 (Lvl 3)');
    });
  });

  describe('migrateLegacyCharacter', () => {
    it('should migrate legacy single class and initialize pactSlots', () => {
      const legacy = {
        name: 'Conan',
        class: 'Barbarian',
        level: 5,
      };
      const migrated = migrateLegacyCharacter(legacy);
      expect(migrated.classes).toEqual([
        { class: 'Barbarian', level: 5, subclass: '', subdomain: '' },
      ]);
      expect(migrated.pactSlots).toEqual({ level: 0, max: 0, current: 0 });
    });

    it('should normalize subclass, subdomain and compute pactSlots for Warlock', () => {
      const raw = {
        name: 'Locke',
        classes: [
          { class: 'Warlock', level: 5 },
        ],
      };
      const migrated = migrateLegacyCharacter(raw);
      expect(migrated.classes[0].subclass).toBe('');
      expect(migrated.classes[0].subdomain).toBe('');
      expect(migrated.pactSlots).toEqual({ level: 3, max: 2, current: 2 });
    });
  });

  describe('Class Feature Predicates', () => {
    it('should detect Ki only for Monks', () => {
      expect(hasKi([{ class: 'Monk', level: 2 }])).toBe(true);
      expect(hasKi([{ class: 'Fighter', level: 2 }])).toBe(false);
    });

    it('should detect Rage only for Barbarians', () => {
      expect(hasRage([{ class: 'Barbarian', level: 1 }])).toBe(true);
      expect(hasRage([{ class: 'Fighter', level: 1 }])).toBe(false);
    });

    it('should detect Wild Shape only for Druid level >= 2', () => {
      expect(hasWildShape([{ class: 'Druid', level: 1 }])).toBe(false);
      expect(hasWildShape([{ class: 'Druid', level: 2 }])).toBe(true);
    });

    it('should detect Sneak Attack only for Rogues', () => {
      expect(hasSneakAttack([{ class: 'Rogue', level: 1 }])).toBe(true);
      expect(hasSneakAttack([{ class: 'Fighter', level: 1 }])).toBe(false);
    });

    it('should detect spell slots for casters or warlock pact slots', () => {
      expect(hasSpellSlots([{ class: 'Wizard', level: 1 }])).toBe(true);
      expect(hasSpellSlots([{ class: 'Warlock', level: 1 }])).toBe(true);
      expect(hasSpellSlots([{ class: 'Fighter', level: 1 }])).toBe(false);
    });
  });
});

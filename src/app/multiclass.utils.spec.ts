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
} from './multiclass.utils';
import { ClassLevel, defaultCharacter } from './character.model';

describe('multiclass.utils', () => {
  describe('getTotalLevel', () => {
    it('should return 0 for empty or undefined classes', () => {
      expect(getTotalLevel([])).toBe(0);
      expect(getTotalLevel(undefined)).toBe(0);
      expect(getTotalLevel(null)).toBe(0);
    });

    it('should calculate total level for a single class', () => {
      const classes: ClassLevel[] = [{ class: 'Fighter', level: 5 }];
      expect(getTotalLevel(classes)).toBe(5);
    });

    it('should sum all class levels across multiple classes', () => {
      const classes: ClassLevel[] = [
        { class: 'Druid', level: 4 },
        { class: 'Fighter', level: 2 },
      ];
      expect(getTotalLevel(classes)).toBe(6);
    });

    it('should cap total level at 20', () => {
      const classes: ClassLevel[] = [
        { class: 'Wizard', level: 15 },
        { class: 'Cleric', level: 10 },
      ];
      expect(getTotalLevel(classes)).toBe(20);
    });

    it('should not allow negative levels to reduce below 0', () => {
      const classes: ClassLevel[] = [{ class: 'Rogue', level: -3 }];
      expect(getTotalLevel(classes)).toBe(0);
    });
  });

  describe('getProficiencyBonus', () => {
    it('should strictly follow Math.ceil(totalLevel / 4) + 1', () => {
      // Levels 1-4 => +2
      expect(getProficiencyBonus(1)).toBe(2);
      expect(getProficiencyBonus(4)).toBe(2);

      // Levels 5-8 => +3
      expect(getProficiencyBonus(5)).toBe(3);
      expect(getProficiencyBonus(8)).toBe(3);

      // Levels 9-12 => +4
      expect(getProficiencyBonus(9)).toBe(4);
      expect(getProficiencyBonus(12)).toBe(4);

      // Levels 13-16 => +5
      expect(getProficiencyBonus(13)).toBe(5);
      expect(getProficiencyBonus(16)).toBe(5);

      // Levels 17-20 => +6
      expect(getProficiencyBonus(17)).toBe(6);
      expect(getProficiencyBonus(20)).toBe(6);
    });

    it('should calculate proficiency bonus strictly from total level, not individual class levels', () => {
      // 4 Druid + 2 Fighter = total level 6.
      // Individual: Druid 4 (+2), Fighter 2 (+2).
      // Total level 6 MUST yield +3!
      const classes: ClassLevel[] = [
        { class: 'Druid', level: 4 },
        { class: 'Fighter', level: 2 },
      ];
      expect(getProficiencyBonus(classes)).toBe(3);
    });
  });

  describe('getHitDicePool', () => {
    it('should return empty string for empty or null classes', () => {
      expect(getHitDicePool([])).toBe('');
      expect(getHitDicePool(undefined)).toBe('');
      expect(getHitDicePool(null)).toBe('');
    });

    it('should return correct dice for a single class', () => {
      expect(getHitDicePool([{ class: 'Barbarian', level: 5 }])).toBe('5d12');
      expect(getHitDicePool([{ class: 'Fighter', level: 3 }])).toBe('3d10');
      expect(getHitDicePool([{ class: 'Wizard', level: 2 }])).toBe('2d6');
    });

    it('should group hit dice by die size preserving appearance order (e.g., 4d8 + 2d10)', () => {
      const classes: ClassLevel[] = [
        { class: 'Druid', level: 4 },
        { class: 'Fighter', level: 2 },
      ];
      expect(getHitDicePool(classes)).toBe('4d8 + 2d10');
    });

    it('should combine classes that share the same hit die size', () => {
      const classes: ClassLevel[] = [
        { class: 'Fighter', level: 2 },
        { class: 'Paladin', level: 3 },
      ];
      // Both Fighter and Paladin use d10 -> 5d10
      expect(getHitDicePool(classes)).toBe('5d10');
    });

    it('should default unknown/custom classes to d8', () => {
      const classes: ClassLevel[] = [{ class: 'Blood Mage', level: 3 }];
      expect(getHitDicePool(classes)).toBe('3d8');
    });
  });

  describe('getClassLevel and hasClass', () => {
    const classes: ClassLevel[] = [
      { class: 'Druid', level: 4 },
      { class: 'Rogue', level: 1 },
    ];

    it('should find class level case-insensitively', () => {
      expect(getClassLevel(classes, 'Druid')).toBe(4);
      expect(getClassLevel(classes, 'druid')).toBe(4);
      expect(getClassLevel(classes, 'DRUID ')).toBe(4);
      expect(getClassLevel(classes, 'Rogue')).toBe(1);
      expect(getClassLevel(classes, 'Fighter')).toBe(0);
    });

    it('should check if class exists', () => {
      expect(hasClass(classes, 'druid')).toBe(true);
      expect(hasClass(classes, 'Rogue')).toBe(true);
      expect(hasClass(classes, 'Paladin')).toBe(false);
    });
  });

  describe('Multiclass Spellcasting', () => {
    it('should calculate Effective Caster Level (ECL)', () => {
      // Wizard 3 (full) + Cleric 2 (full) = 5
      expect(
        getEffectiveCasterLevel([
          { class: 'Wizard', level: 3 },
          { class: 'Cleric', level: 2 },
        ])
      ).toBe(5);

      // Sorcerer 3 (full) + Paladin 4 (half -> floor(4/2) = 2) = 5
      expect(
        getEffectiveCasterLevel([
          { class: 'Sorcerer', level: 3 },
          { class: 'Paladin', level: 4 },
        ])
      ).toBe(5);

      // Artificer 3 (ceil(3/2) = 2) + Wizard 2 = 4
      expect(
        getEffectiveCasterLevel([
          { class: 'Artificer', level: 3 },
          { class: 'Wizard', level: 2 },
        ])
      ).toBe(4);
    });

    it('should return correct multiclass spell slots from table', () => {
      const slotsLvl5 = getMulticlassSpellSlots(5);
      expect(slotsLvl5).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0]);

      const slotsLvl1 = getMulticlassSpellSlots(1);
      expect(slotsLvl1).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0]);
    });

    it('should calculate Warlock Pact Magic slots separately', () => {
      expect(getPactMagicSlots(1)).toEqual({ slots: 1, slotLevel: 1 });
      expect(getPactMagicSlots(2)).toEqual({ slots: 2, slotLevel: 1 });
      expect(getPactMagicSlots(3)).toEqual({ slots: 2, slotLevel: 2 });
      expect(getPactMagicSlots(5)).toEqual({ slots: 2, slotLevel: 3 });
      expect(getPactMagicSlots(11)).toEqual({ slots: 3, slotLevel: 5 });
      expect(getPactMagicSlots(17)).toEqual({ slots: 4, slotLevel: 5 });
    });
  });

  describe('migrateLegacyCharacter', () => {
    it('should return defaultCharacter when given empty/null input', () => {
      const result = migrateLegacyCharacter(null);
      expect(result).toEqual(defaultCharacter);
      expect(result.classes).toEqual([]);
    });

    it('should migrate legacy { class, level } to classes: [{ class, level }]', () => {
      const legacy = {
        name: 'Thorin',
        class: 'Fighter',
        level: 5,
        currentHP: 40,
        maxHP: 40,
      };

      const migrated = migrateLegacyCharacter(legacy);
      expect(migrated.name).toBe('Thorin');
      expect(migrated.classes).toEqual([{ class: 'Fighter', level: 5 }]);
    });

    it('should handle legacy string levels and clamp them between 1 and 20', () => {
      const legacy = {
        name: 'Merlin',
        class: 'Wizard',
        level: '25' as any,
      };

      const migrated = migrateLegacyCharacter(legacy);
      expect(migrated.classes).toEqual([{ class: 'Wizard', level: 20 }]);
    });

    it('should default level to 1 if legacy character has class but missing level', () => {
      const legacy = {
        name: 'Conan',
        class: 'Barbarian',
      };

      const migrated = migrateLegacyCharacter(legacy);
      expect(migrated.classes).toEqual([{ class: 'Barbarian', level: 1 }]);
    });

    it('should preserve existing classes array if already multiclassed', () => {
      const modern = {
        name: 'Jaheira',
        classes: [
          { class: 'Druid', level: 4 },
          { class: 'Fighter', level: 2 },
        ],
      };

      const migrated = migrateLegacyCharacter(modern);
      expect(migrated.classes).toEqual([
        { class: 'Druid', level: 4 },
        { class: 'Fighter', level: 2 },
      ]);
    });

    it('should ensure all character arrays and properties are initialized', () => {
      const partial = {
        name: 'Empty',
        classes: [],
      };

      const migrated = migrateLegacyCharacter(partial);
      expect(Array.isArray(migrated.spellSlots)).toBe(true);
      expect(Array.isArray(migrated.spellSlotsRemaining)).toBe(true);
      expect(Array.isArray(migrated.deathSaveSuccess)).toBe(true);
      expect(Array.isArray(migrated.deathSaveFailure)).toBe(true);
      expect(Array.isArray(migrated.resources)).toBe(true);
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { DndApiService } from './dnd-api.service';

describe('DndApiService', () => {
  let service: DndApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DndApiService],
    });
    service = TestBed.inject(DndApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getClasses', () => {
    it('should return all classes synchronously including PHB and non-PHB classes', async () => {
      const response = await firstValueFrom(service.getClasses());
      expect(response).toBeDefined();
      expect(response.count).toBe(13);
      expect(response.results.length).toBe(13);

      const indices = response.results.map((c) => c.index);
      expect(indices).toContain('barbarian');
      expect(indices).toContain('wizard');
      expect(indices).toContain('warlock');
      expect(indices).toContain('artificer');

      const names = response.results.map((c) => c.name);
      expect(names).toContain('Artificer');
      expect(names).toContain('Barbarian');
      expect(names).toContain('Wizard');
    });
  });

  describe('getClassLevel', () => {
    it('should return level data for Barbarian with rage count', async () => {
      const levelData = await firstValueFrom(service.getClassLevel('barbarian', 4));
      expect(levelData.level).toBe(4);
      expect(levelData.prof_bonus).toBe(2);
      expect(levelData.class_specific?.rage_count).toBe(3);
    });

    it('should return level data for Wizard with spellcasting slots', async () => {
      const levelData = await firstValueFrom(service.getClassLevel('wizard', 3));
      expect(levelData.level).toBe(3);
      expect(levelData.prof_bonus).toBe(2);
      expect(levelData.spellcasting).toBeDefined();
      expect(levelData.spellcasting?.['spell_slots_level_1']).toBe(4);
      expect(levelData.spellcasting?.['spell_slots_level_2']).toBe(2);
    });

    it('should return level data for Warlock with pact magic slots', async () => {
      const levelData = await firstValueFrom(service.getClassLevel('warlock', 3));
      expect(levelData.level).toBe(3);
      expect(levelData.prof_bonus).toBe(2);
      expect(levelData.pact_magic).toBeDefined();
      expect(levelData.pact_magic?.slots).toBe(2);
      expect(levelData.pact_magic?.slot_level).toBe(2);
    });

    it('should return level data for Artificer (non-PHB)', async () => {
      const levelData = await firstValueFrom(service.getClassLevel('artificer', 1));
      expect(levelData.level).toBe(1);
      expect(levelData.prof_bonus).toBe(2);
      expect(levelData.spellcasting?.['spell_slots_level_1']).toBe(2);
    });

    it('should handle case insensitivity and whitespace in class name', async () => {
      const levelData = await firstValueFrom(service.getClassLevel('  WiZaRd  ', 1));
      expect(levelData.level).toBe(1);
      expect(levelData.spellcasting?.['spell_slots_level_1']).toBe(2);
    });

    it('should return empty object for non-existent class or level', async () => {
      const missingClass = await firstValueFrom(service.getClassLevel('unknown', 1));
      expect(missingClass).toEqual({});

      const missingLevel = await firstValueFrom(service.getClassLevel('wizard', 99));
      expect(missingLevel).toEqual({});
    });
  });

  describe('getSubclasses', () => {
    it('should return subclasses for Fighter including PHB and non-PHB sources', async () => {
      const subclasses = await firstValueFrom(service.getSubclasses('fighter'));
      expect(subclasses.length).toBeGreaterThan(0);
      const battleMaster = subclasses.find((s) => s.index === 'battle-master');
      expect(battleMaster?.name).toBe('Battle Master');
      expect(battleMaster?.source).toBe('PHB');

      const eldritchKnight = subclasses.find((s) => s.index === 'eldritch-knight');
      expect(eldritchKnight?.caster_type).toBe('third');
    });

    it('should return empty array for unknown class', async () => {
      const subclasses = await firstValueFrom(service.getSubclasses('unknown'));
      expect(subclasses).toEqual([]);
    });
  });

  describe('getThirdCasterLevel', () => {
    it('should return third caster level progression', async () => {
      const level3 = await firstValueFrom(service.getThirdCasterLevel(3));
      expect(level3).toBeDefined();
      expect(level3?.level).toBe(3);
      expect(level3?.spellcasting?.spell_slots_level_1).toBe(2);
      expect(level3?.spellcasting?.spell_slots_level_2).toBe(0);
    });

    it('should return null for invalid third caster level', async () => {
      const level99 = await firstValueFrom(service.getThirdCasterLevel(99));
      expect(level99).toBeNull();
    });
  });

  describe('isSpellcaster', () => {
    it('should correctly determine spellcaster status', async () => {
      expect(await firstValueFrom(service.isSpellcaster('wizard', 1))).toBe(true);
      expect(await firstValueFrom(service.isSpellcaster('fighter', 1))).toBe(false);
      expect(await firstValueFrom(service.isSpellcaster('', 1))).toBe(false);
    });
  });
});

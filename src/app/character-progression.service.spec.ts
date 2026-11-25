import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CharacterProgressionService } from './character-progression.service';
import { CharacterStore } from './character.store';
import { DndApiService } from './dnd-api.service';
import { defaultCharacter } from './character.model';
import { of, throwError } from 'rxjs';

describe('CharacterProgressionService', () => {
  let service: CharacterProgressionService;
  let store: CharacterStore;
  let mockApi: {
    getClassLevel: ReturnType<typeof vi.fn>;
    getThirdCasterLevel: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockApi = {
      getClassLevel: vi.fn(),
      getThirdCasterLevel: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        CharacterProgressionService,
        CharacterStore,
        { provide: DndApiService, useValue: mockApi },
      ],
    });

    service = TestBed.inject(CharacterProgressionService);
    store = TestBed.inject(CharacterStore);
  });

  it('should set total level and hitDie when level is updated', async () => {
    store.setCharacter({
      ...defaultCharacter,
      classes: [{ class: 'Fighter', level: 12 }],
    });

    const error = await service.updateCharLevel({});
    expect(error).toBe('');
    expect(store.character().level).toBe(12);
    expect(store.character().hitDie).toBe(12);
  });

  it('should set Monk kiPoints when monk level > 1', async () => {
    store.setCharacter({
      ...defaultCharacter,
      classes: [{ class: 'Monk', level: 5 }],
    });

    await service.updateCharLevel({});
    expect(store.character().kiPoints).toBe(5);
  });

  it('should set Druid wildShapeRemaining when druid level >= 2', async () => {
    store.setCharacter({
      ...defaultCharacter,
      classes: [{ class: 'Druid', level: 3 }],
    });
    mockApi.getClassLevel.mockReturnValue(of({ spellcasting: {} }));

    await service.updateCharLevel({});
    expect(store.character().wildShapeRemaining).toBe(2);
  });

  it('should set Druid wildShapeRemaining to 999 when druid level is 20', async () => {
    store.setCharacter({
      ...defaultCharacter,
      classes: [{ class: 'Druid', level: 20 }],
    });
    mockApi.getClassLevel.mockReturnValue(of({ spellcasting: {} }));

    await service.updateCharLevel({});
    expect(store.character().wildShapeRemaining).toBe(999);
  });

  it('should set Barbarian rage and rageRemaining to 999 when barbarian level is 20', async () => {
    store.setCharacter({
      ...defaultCharacter,
      classes: [{ class: 'Barbarian', level: 20 }],
    });

    await service.updateCharLevel({});
    expect(store.character().rage).toBe(999);
    expect(store.character().rageRemaining).toBe(999);
  });

  it('should compute pactSlots for Warlock via getPactMagicSlots', async () => {
    store.setCharacter({
      ...defaultCharacter,
      classes: [{ class: 'Warlock', level: 5 }],
    });

    await service.updateCharLevel({});
    expect(store.character().pactSlots).toEqual({
      level: 3,
      max: 2,
      current: 2,
    });
  });

  it('should fetch third-caster spell slots for single-class Fighter (Eldritch Knight) lvl >= 3', async () => {
    store.setCharacter({
      ...defaultCharacter,
      classes: [{ class: 'Fighter', level: 3, subclass: 'eldritch-knight' }],
    });
    mockApi.getThirdCasterLevel.mockReturnValue(
      of({
        level: 3,
        prof_bonus: 2,
        spellcasting: {
          spell_slots_level_1: 2,
        },
      })
    );

    await service.updateCharLevel({});
    expect(mockApi.getThirdCasterLevel).toHaveBeenCalledWith(3);
    expect(store.character().spellSlots).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(store.character().spellSlotsRemaining).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('should query Barbarian rage count from API', async () => {
    store.setCharacter({
      ...defaultCharacter,
      classes: [{ class: 'Barbarian', level: 4 }],
    });
    mockApi.getClassLevel.mockReturnValue(
      of({ class_specific: { rage_count: 3 } })
    );

    await service.updateCharLevel({});
    expect(mockApi.getClassLevel).toHaveBeenCalledWith('barbarian', 4);
    expect(store.character().rage).toBe(3);
    expect(store.character().rageRemaining).toBe(3);
  });

  it('should calculate multiclass spell slots using ECL when 2+ casters exist', async () => {
    store.setCharacter({
      ...defaultCharacter,
      classes: [
        { class: 'Wizard', level: 3 },
        { class: 'Cleric', level: 2 },
      ],
    });

    await service.updateCharLevel({});
    // Wizard 3 + Cleric 2 = ECL 5
    // Level 5 slots in multiclass table: [4, 3, 2, 0, 0, 0, 0, 0, 0]
    expect(store.character().spellSlots).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0]);
    expect(store.character().spellSlotsRemaining).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0]);
    expect(mockApi.getClassLevel).not.toHaveBeenCalled();
  });

  it('should fetch single caster spell slots from API when 1 casting class exists', async () => {
    store.setCharacter({
      ...defaultCharacter,
      classes: [
        { class: 'Wizard', level: 3 },
        { class: 'Fighter', level: 2 },
      ],
    });
    mockApi.getClassLevel.mockReturnValue(
      of({
        spellcasting: {
          spell_slots_level_1: 4,
          spell_slots_level_2: 2,
        },
      })
    );

    await service.updateCharLevel({ wizard: 'wizard' });
    expect(mockApi.getClassLevel).toHaveBeenCalledWith('wizard', 3);
    expect(store.character().spellSlots).toEqual([4, 2, 0, 0, 0, 0, 0, 0, 0]);
    expect(store.character().spellSlotsRemaining).toEqual([4, 2, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('should clear spell slots if single caster API call fails', async () => {
    store.setCharacter({
      ...defaultCharacter,
      classes: [{ class: 'Bard', level: 2 }],
    });
    mockApi.getClassLevel.mockReturnValue(throwError(() => new Error('Network error')));

    await service.updateCharLevel({});
    expect(store.character().spellSlots).toEqual([]);
    expect(store.character().spellSlotsRemaining).toEqual([]);
  });

  it('should clear spell slots when no casting classes exist', async () => {
    store.setCharacter({
      ...defaultCharacter,
      classes: [
        { class: 'Fighter', level: 3 },
        { class: 'Rogue', level: 2 },
      ],
    });

    await service.updateCharLevel({});
    expect(store.character().spellSlots).toEqual([]);
    expect(store.character().spellSlotsRemaining).toEqual([]);
  });
});

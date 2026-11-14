import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { CharacterStore } from './character.store';
import { defaultCharacter } from './character.model';

describe('CharacterStore', () => {
  let store: CharacterStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CharacterStore],
    });
    store = TestBed.inject(CharacterStore);
  });

  it('should initialize with default character', () => {
    const char = store.character();
    expect(char).toBeDefined();
    expect(char.name).toBe(defaultCharacter.name);
    expect(store.fullHeal()).toBe(true);
  });

  it('should set full heal flag', () => {
    store.setFullHeal(false);
    expect(store.fullHeal()).toBe(false);
    store.setFullHeal(true);
    expect(store.fullHeal()).toBe(true);
  });

  it('should calculate percentHP correctly', () => {
    store.setCharacter({
      ...defaultCharacter,
      maxHP: 50,
      currentHP: 25,
    });
    expect(store.percentHP()).toBe(50);

    store.patchCharacter({ currentHP: 0 });
    expect(store.percentHP()).toBe(0);

    store.patchCharacter({ maxHP: 0, currentHP: 10 });
    expect(store.percentHP()).toBe(0);
  });

  it('should set and migrate character', () => {
    store.setCharacter({
      ...defaultCharacter,
      class: 'Rogue',
      level: 4,
      classes: [],
    });
    const c = store.character();
    expect(c.classes).toEqual([{ class: 'Rogue', level: 4 }]);
  });

  it('should patch character and migrate', () => {
    store.patchCharacter({
      class: 'Paladin',
      level: 3,
      classes: [],
    });
    const c = store.character();
    expect(c.classes).toEqual([{ class: 'Paladin', level: 3 }]);
  });

  describe('applyDamage', () => {
    it('should ignore non-positive damage', () => {
      store.setCharacter({ ...defaultCharacter, maxHP: 20, currentHP: 15, tempHP: 5 });
      store.applyDamage(0);
      expect(store.character().currentHP).toBe(15);
      expect(store.character().tempHP).toBe(5);

      store.applyDamage(-5);
      expect(store.character().currentHP).toBe(15);
      expect(store.character().tempHP).toBe(5);
    });

    it('should absorb damage with tempHP first', () => {
      store.setCharacter({ ...defaultCharacter, maxHP: 20, currentHP: 15, tempHP: 5 });
      store.applyDamage(3);
      expect(store.character().tempHP).toBe(2);
      expect(store.character().currentHP).toBe(15);
    });

    it('should spill damage into currentHP when tempHP is exceeded', () => {
      store.setCharacter({ ...defaultCharacter, maxHP: 20, currentHP: 15, tempHP: 5 });
      store.applyDamage(8);
      expect(store.character().tempHP).toBe(0);
      expect(store.character().currentHP).toBe(12);
    });

    it('should not reduce currentHP below 0', () => {
      store.setCharacter({ ...defaultCharacter, maxHP: 20, currentHP: 10, tempHP: 0 });
      store.applyDamage(50);
      expect(store.character().currentHP).toBe(0);
    });
  });

  describe('heal', () => {
    it('should ignore non-positive heal amounts', () => {
      store.setCharacter({ ...defaultCharacter, maxHP: 20, currentHP: 10 });
      store.heal(0);
      expect(store.character().currentHP).toBe(10);
      store.heal(-5);
      expect(store.character().currentHP).toBe(10);
    });

    it('should add to currentHP and reset death saves', () => {
      store.setCharacter({
        ...defaultCharacter,
        maxHP: 20,
        currentHP: 5,
        deathSaveSuccess: [true, false, false],
        deathSaveFailure: [true, true, false],
      });
      store.heal(5);
      const c = store.character();
      expect(c.currentHP).toBe(10);
      expect(c.stable).toBe(false);
      expect(c.deathSaveSuccess).toEqual([false, false, false]);
      expect(c.deathSaveFailure).toEqual([false, false, false]);
    });

    it('should cap currentHP at maxHP', () => {
      store.setCharacter({ ...defaultCharacter, maxHP: 20, currentHP: 18 });
      store.heal(10);
      expect(store.character().currentHP).toBe(20);
    });
  });

  describe('updateSpellSlot', () => {
    it('should update an existing slot clamped between 0 and max', () => {
      store.setCharacter({
        ...defaultCharacter,
        spellSlots: [4, 3],
        spellSlotsRemaining: [2, 1],
      });

      store.updateSpellSlot(0, 3, 4);
      expect(store.character().spellSlotsRemaining[0]).toBe(3);

      store.updateSpellSlot(0, 10, 4);
      expect(store.character().spellSlotsRemaining[0]).toBe(4);

      store.updateSpellSlot(0, -2, 4);
      expect(store.character().spellSlotsRemaining[0]).toBe(0);
    });

    it('should expand spellSlotsRemaining if updating beyond current length', () => {
      store.setCharacter({
        ...defaultCharacter,
        spellSlotsRemaining: [],
      });
      store.updateSpellSlot(2, 1, 3);
      expect(store.character().spellSlotsRemaining).toEqual([0, 0, 1]);
    });
  });
});

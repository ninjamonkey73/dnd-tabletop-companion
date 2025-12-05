import { Injectable, signal, computed, effect } from '@angular/core';
import { Character, defaultCharacter } from './character.model';

@Injectable({ providedIn: 'root' })
export class CharacterStore {
  // Signals
  private _character = signal<Character>({ ...defaultCharacter });
  private _fullHeal = signal<boolean>(false);

  // Public accessors
  character = computed(() => this._character());
  fullHeal = computed(() => this._fullHeal());

  // Derived/computed
  percentHP = computed(() => {
    const c = this._character();
    if (!c.maxHP || c.currentHP <= 0) return c.currentHP === 0 ? 0 : 0;
    return Math.round((c.currentHP / c.maxHP) * 100);
  });

  // Debounced persistence
  private saveTimeout: any;
  constructor() {}

  setCharacter(char: Character) {
    // Force new object reference to trigger signal update
    this._character.set({ ...char });
  }

  patchCharacter(patch: Partial<Character>) {
    this._character.update((c) => ({ ...c, ...patch }));
  }

  setFullHeal(v: boolean) {
    this._fullHeal.set(v);
  }

  applyDamage(amount: number) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    this._character.update((c) => {
      let remaining = amount;
      let tempHP = c.tempHP;
      if (tempHP > 0) {
        const absorbed = Math.min(tempHP, remaining);
        tempHP -= absorbed;
        remaining -= absorbed;
      }
      const currentHP = Math.max(0, c.currentHP - remaining);
      return { ...c, tempHP, currentHP };
    });
  }

  heal(amount: number) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    this._character.update((c) => {
      const currentHP = Math.min(c.maxHP, c.currentHP + amount);
      return {
        ...c,
        currentHP,
        stable: false,
        deathSaveSuccess: [false, false, false],
        deathSaveFailure: [false, false, false],
      };
    });
  }
}

import { Injectable, inject } from '@angular/core';
import { CharacterStore } from './character.store';

@Injectable({ providedIn: 'root' })
export class RestService {
  private store = inject(CharacterStore);

  shortRest(): void {
    const character = this.store.character();
    if (character.class === 'Monk') {
      this.store.patchCharacter({
        kiPoints: character.level > 1 ? character.level : 0,
      });
    } else if (character.class === 'Druid') {
      this.store.patchCharacter({
        wildShapeRemaining: character.level > 1 ? 2 : 0,
      });
    }
  }

  longRest(): void {
    const character = this.store.character();
    const fullHeal = this.store.fullHeal();

    const patches: any = {};
    if (character.class === 'Monk') {
      patches.kiPoints = character.level > 1 ? character.level : 0;
    } else if (character.class === 'Druid') {
      patches.wildShapeRemaining = character.level > 1 ? 2 : 0;
    } else if (character.class === 'Barbarian') {
      patches.rageRemaining = character.rage;
    }

    patches.spellSlotsRemaining = character.spellSlots.map((s) => s);

    // Hit die recovery logic
    const hitDie = character.hitDie;
    const level = character.level;
    let newHitDie = hitDie;
    if (hitDie < level) {
      const gain = Math.floor((level < 2 ? 2 : level) / 2);
      newHitDie = hitDie + gain > level ? level : hitDie + gain;
    }
    patches.hitDie = newHitDie;

    if (fullHeal) {
      patches.currentHP = character.maxHP;
    }
    patches.rageRemaining = character.rage;
    patches.tempHP = 0;
    patches.stable = false;

    this.store.patchCharacter(patches);
  }
}

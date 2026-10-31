import { Injectable, inject } from '@angular/core';
import { CharacterStore } from './character.store';

@Injectable({ providedIn: 'root' })
export class RestService {
  private store = inject(CharacterStore);

  shortRest(): void {
    const character = this.store.character();
    const patches: any = {};

    if (character.class === 'Monk') {
      patches.kiPoints = character.level > 1 ? character.level : 0;
    } else if (character.class === 'Druid') {
      patches.wildShapeRemaining = character.level > 1 ? 2 : 0;
    }

    // Reset resources marked with (SR:<value>)
    if (Array.isArray(character.resources)) {
      patches.resources = character.resources.map((resource) => {
        const match = resource.name?.match(/\(SR:\s*(\d+)\s*\)/i);
        if (match) {
          const resetValue = parseInt(match[1], 10);
          if (!isNaN(resetValue)) {
            return { ...resource, value: resetValue };
          }
        }
        return resource;
      });
    }

    if (Object.keys(patches).length > 0) {
      this.store.patchCharacter(patches);
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

    // Decrement non-zero exhaustion
    if (character.exhaustion > 0) {
      patches.exhaustion = character.exhaustion - 1;
    }

    // Reset resources marked with (LR:<value>)
    if (Array.isArray(character.resources)) {
      patches.resources = character.resources.map((resource) => {
        const match = resource.name?.match(/\(LR:\s*(\d+)\s*\)/i);
        if (match) {
          const resetValue = parseInt(match[1], 10);
          if (!isNaN(resetValue)) {
            return { ...resource, value: resetValue };
          }
        }
        return resource;
      });
    }

    this.store.patchCharacter(patches);
  }
}

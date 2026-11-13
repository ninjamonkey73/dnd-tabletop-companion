import { Injectable, inject } from '@angular/core';
import { CharacterStore } from './character.store';
import { getClassLevel, getTotalLevel } from './multiclass.utils';

@Injectable({ providedIn: 'root' })
export class RestService {
  private store = inject(CharacterStore);

  shortRest(): void {
    const character = this.store.character();
    const patches: any = {};

    const monkLevel =
      getClassLevel(character.classes, 'Monk') ||
      (character.class === 'Monk' ? character.level || 0 : 0);
    const druidLevel =
      getClassLevel(character.classes, 'Druid') ||
      (character.class === 'Druid' ? character.level || 0 : 0);

    if (monkLevel > 1) {
      patches.kiPoints = monkLevel;
    }
    if (druidLevel >= 2) {
      patches.wildShapeRemaining = 2;
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
    const monkLevel =
      getClassLevel(character.classes, 'Monk') ||
      (character.class === 'Monk' ? character.level || 0 : 0);
    const druidLevel =
      getClassLevel(character.classes, 'Druid') ||
      (character.class === 'Druid' ? character.level || 0 : 0);
    const barbarianLevel =
      getClassLevel(character.classes, 'Barbarian') ||
      (character.class === 'Barbarian' ? character.level || 0 : 0);

    if (monkLevel > 1) {
      patches.kiPoints = monkLevel;
    }
    if (druidLevel >= 2) {
      patches.wildShapeRemaining = 2;
    }
    if (barbarianLevel > 0) {
      patches.rageRemaining = character.rage;
    }

    patches.spellSlotsRemaining = character.spellSlots.map((s) => s);

    // Hit die recovery logic
    const hitDie = character.hitDie;
    const totalLevel =
      getTotalLevel(character.classes) || character.level || 1;
    let newHitDie = hitDie;
    if (hitDie < totalLevel) {
      const gain = Math.floor((totalLevel < 2 ? 2 : totalLevel) / 2);
      newHitDie = hitDie + gain > totalLevel ? totalLevel : hitDie + gain;
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

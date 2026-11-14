import { Injectable, inject } from '@angular/core';
import { CharacterStore } from './character.store';
import { DndApiService } from './dnd-api.service';
import { firstValueFrom } from 'rxjs';
import {
  getClassLevel,
  getTotalLevel,
  getEffectiveCasterLevel,
  getMulticlassSpellSlots,
} from './multiclass.utils';

@Injectable({ providedIn: 'root' })
export class CharacterProgressionService {
  private store = inject(CharacterStore);
  private api = inject(DndApiService);

  async updateCharLevel(
    classIndexByName: Record<string, string>
  ): Promise<string> {
    const character = this.store.character();
    let errorMsg = '';
    let rawLevel =
      Array.isArray(character.classes) && character.classes.length > 0
        ? character.classes.reduce((sum, c) => sum + (Number(c?.level) || 0), 0)
        : character.level || 1;
    let totalLevel = rawLevel;
    if (totalLevel < 1) {
      totalLevel = 1;
      errorMsg = 'Level cannot be less than 1.';
    } else if (totalLevel > 20) {
      totalLevel = 20;
      errorMsg = 'Level cannot be greater than 20.';
    }

    this.store.patchCharacter({ level: totalLevel, hitDie: totalLevel });

    const monkLevel =
      getClassLevel(character.classes, 'Monk') ||
      (character.class === 'Monk' ? totalLevel : 0);
    if (monkLevel > 1) {
      this.store.patchCharacter({ kiPoints: monkLevel });
    }

    const druidLevel =
      getClassLevel(character.classes, 'Druid') ||
      (character.class === 'Druid' ? totalLevel : 0);
    if (druidLevel >= 2) {
      this.store.patchCharacter({ wildShapeRemaining: 2 });
    }

    const barbLevel =
      getClassLevel(character.classes, 'Barbarian') ||
      (character.class === 'Barbarian' ? totalLevel : 0);
    if (barbLevel > 0) {
      try {
        const data = await firstValueFrom(
          this.api.getClassLevel('barbarian', barbLevel)
        );
        const count = data.class_specific?.rage_count;
        if (typeof count === 'number') {
          this.store.patchCharacter({ rage: count, rageRemaining: count });
        }
      } catch (e) {}
    }

    // Spellcasting logic
    const classes =
      character.classes && character.classes.length > 0
        ? character.classes
        : character.class
        ? [{ class: character.class, level: totalLevel }]
        : [];

    const castingClasses = classes.filter((c) => {
      const name = (c.class || '').toLowerCase().trim();
      return [
        'bard',
        'cleric',
        'druid',
        'sorcerer',
        'wizard',
        'paladin',
        'ranger',
        'artificer',
      ].includes(name);
    });

    if (castingClasses.length >= 2) {
      // Multiclass spellcasting rules (PHB)
      const ecl = getEffectiveCasterLevel(classes);
      const slots = getMulticlassSpellSlots(ecl);
      this.store.patchCharacter({
        spellSlots: slots,
        spellSlotsRemaining: slots.slice(),
      });
    } else if (castingClasses.length === 1) {
      const single = castingClasses[0];
      const clsName = (single.class || '').toLowerCase().trim();
      const clsSlug = classIndexByName[clsName] || clsName;
      try {
        const data = await firstValueFrom(
          this.api.getClassLevel(clsSlug, single.level)
        );
        const spellcasting = data.spellcasting;
        if (!spellcasting) {
          this.store.patchCharacter({
            spellSlots: [],
            spellSlotsRemaining: [],
          });
        } else {
          const slots: number[] = [];
          for (let i = 1; i <= 9; i++) {
            const key = `spell_slots_level_${i}`;
            slots.push(
              Object.prototype.hasOwnProperty.call(spellcasting, key)
                ? spellcasting[key]
                : 0
            );
          }
          this.store.patchCharacter({
            spellSlots: slots,
            spellSlotsRemaining: slots.slice(),
          });
        }
      } catch (e) {
        this.store.patchCharacter({
          spellSlots: [],
          spellSlotsRemaining: [],
        });
      }
    } else {
      const clsName = (character.class || '').toLowerCase().trim();
      if (!clsName) {
        this.store.patchCharacter({
          spellSlots: [],
          spellSlotsRemaining: [],
        });
      } else {
        const clsSlug = classIndexByName[clsName] || clsName;
        try {
          const data = await firstValueFrom(
            this.api.getClassLevel(clsSlug, totalLevel)
          );
          const spellcasting = data.spellcasting;
          if (!spellcasting) {
            this.store.patchCharacter({
              spellSlots: [],
              spellSlotsRemaining: [],
            });
          } else {
            const slots: number[] = [];
            for (let i = 1; i <= 9; i++) {
              const key = `spell_slots_level_${i}`;
              slots.push(
                Object.prototype.hasOwnProperty.call(spellcasting, key)
                  ? spellcasting[key]
                  : 0
              );
            }
            this.store.patchCharacter({
              spellSlots: slots,
              spellSlotsRemaining: slots.slice(),
            });
          }
        } catch (e) {
          this.store.patchCharacter({
            spellSlots: [],
            spellSlotsRemaining: [],
          });
        }
      }
    }

    return errorMsg;
  }
}

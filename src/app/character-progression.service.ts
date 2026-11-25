import { Injectable, inject } from '@angular/core';
import { CharacterStore } from './character.store';
import { DndApiService } from './dnd-api.service';
import { firstValueFrom } from 'rxjs';
import {
  getClassLevel,
  getTotalLevel,
  getEffectiveCasterLevel,
  getMulticlassSpellSlots,
  getPactMagicSlots,
  THIRD_CASTERS,
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
      try {
        const data = await firstValueFrom(
          this.api.getClassLevel('druid', druidLevel)
        );
        const uses = data.class_specific?.wild_shape_uses ?? (druidLevel === 20 ? 999 : 2);
        this.store.patchCharacter({ wildShapeRemaining: uses });
      } catch (e) {
        this.store.patchCharacter({ wildShapeRemaining: druidLevel === 20 ? 999 : 2 });
      }
    }

    const barbLevel =
      getClassLevel(character.classes, 'Barbarian') ||
      (character.class === 'Barbarian' ? totalLevel : 0);
    if (barbLevel > 0) {
      try {
        const data = await firstValueFrom(
          this.api.getClassLevel('barbarian', barbLevel)
        );
        const count = data.class_specific?.rage_count ?? (barbLevel === 20 ? 999 : 2);
        if (typeof count === 'number') {
          this.store.patchCharacter({ rage: count, rageRemaining: count });
        }
      } catch (e) {
        if (barbLevel === 20) {
          this.store.patchCharacter({ rage: 999, rageRemaining: 999 });
        }
      }
    }

    // Warlock Pact Magic logic
    const warlockLevel =
      getClassLevel(character.classes, 'Warlock') ||
      (character.class === 'Warlock' ? totalLevel : 0);
    if (warlockLevel > 0) {
      const pactInfo = getPactMagicSlots(warlockLevel);
      this.store.patchCharacter({
        pactSlots: {
          level: pactInfo.slotLevel,
          max: pactInfo.slots,
          current: pactInfo.slots,
        },
      });
    } else {
      this.store.patchCharacter({
        pactSlots: { level: 0, max: 0, current: 0 },
      });
    }

    // Spellcasting logic (standard spell slots, excluding Warlock)
    const classes =
      character.classes && character.classes.length > 0
        ? character.classes
        : character.class
        ? [{ class: character.class, level: totalLevel }]
        : [];

    const castingClasses = classes.filter((c) => {
      const name = (c.class || '').toLowerCase().trim();
      const sub = (c.subclass || '').toLowerCase().trim();
      const lvl = Math.max(0, Number(c.level) || 0);

      const isFullOrHalfOrArtificer = [
        'bard',
        'cleric',
        'druid',
        'sorcerer',
        'wizard',
        'paladin',
        'ranger',
        'artificer',
      ].includes(name);

      const isThirdCaster =
        (name === 'fighter' || name === 'rogue') &&
        lvl >= 3 &&
        THIRD_CASTERS.includes(sub);

      return isFullOrHalfOrArtificer || isThirdCaster;
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
      const subName = (single.subclass || '').toLowerCase().trim();
      const isThirdCaster =
        (clsName === 'fighter' || clsName === 'rogue') &&
        single.level >= 3 &&
        THIRD_CASTERS.includes(subName);

      if (isThirdCaster) {
        try {
          const thirdData = await firstValueFrom(
            this.api.getThirdCasterLevel(single.level)
          );
          const spellcasting = thirdData?.spellcasting;
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
                  ? (spellcasting as any)[key]
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
      }
    } else {
      this.store.patchCharacter({
        spellSlots: [],
        spellSlotsRemaining: [],
      });
    }

    return errorMsg;
  }
}

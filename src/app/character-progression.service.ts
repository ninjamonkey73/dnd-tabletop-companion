import { Injectable, inject } from '@angular/core';
import { CharacterStore } from './character.store';
import { DndApiService } from './dnd-api.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CharacterProgressionService {
  private store = inject(CharacterStore);
  private api = inject(DndApiService);

  async updateCharLevel(classIndexByName: Record<string, string>): Promise<string> {
    const character = this.store.character();
    let errorMsg = '';
    let level = character.level;
    if (level < 1) {
      level = 1;
      errorMsg = 'Level cannot be less than 1.';
    } else if (level > 20) {
      level = 20;
      errorMsg = 'Level cannot be greater than 20.';
    }

    this.store.patchCharacter({ level });

    if (character.class === 'Monk' && level > 1) {
      this.store.patchCharacter({ kiPoints: level });
    }

    if (character.class === 'Druid' && level > 1) {
      this.store.patchCharacter({ wildShapeRemaining: 2 });
    }

    this.store.patchCharacter({ hitDie: level });

    if (character.class === 'Barbarian') {
      try {
        const data = await firstValueFrom(this.api.getClassLevel('barbarian', level));
        const count = data.class_specific?.rage_count;
        if (typeof count === 'number') {
          this.store.patchCharacter({ rage: count, rageRemaining: count });
        }
      } catch (e) {}
    }

    const clsName = (character.class || '').toLowerCase().trim();
    if (!clsName) {
      this.store.patchCharacter({ spellSlots: [], spellSlotsRemaining: [] });
    } else {
      const clsSlug = classIndexByName[clsName] || clsName;
      try {
        const data = await firstValueFrom(this.api.getClassLevel(clsSlug, level));
        const spellcasting = data.spellcasting;
        if (!spellcasting) {
          this.store.patchCharacter({ spellSlots: [], spellSlotsRemaining: [] });
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
        this.store.patchCharacter({ spellSlots: [], spellSlotsRemaining: [] });
      }
    }
    
    return errorMsg;
  }
}

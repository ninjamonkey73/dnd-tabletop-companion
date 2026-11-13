import { Component, Input } from '@angular/core';
import { Character } from '../character.model';
import { getClassLevel } from '../multiclass.utils';

@Component({
  selector: 'app-sneak-attack',
  templateUrl: './sneak-attack.component.html',
  styleUrls: ['./sneak-attack.component.css'],
})
export class SneakAttackComponent {
  @Input() character!: Character;
  @Input() isCreatingNewCharacter!: boolean;

  // Calculate sneak attack value based on Rogue class level
  get sneakAttackValue(): number {
    if (!this.character) return 0;
    const rogueLevel = getClassLevel(this.character.classes, 'Rogue');
    if (rogueLevel > 0) {
      return Math.ceil(rogueLevel / 2);
    }
    if (this.character.class === 'Rogue' && this.character.level) {
      return Math.ceil(this.character.level / 2);
    }
    return 0;
  }
}

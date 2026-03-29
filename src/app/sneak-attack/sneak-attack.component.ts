import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Character } from '../character.model';

@Component({
  selector: 'app-sneak-attack',
  templateUrl: './sneak-attack.component.html',
  styleUrls: ['./sneak-attack.component.css'],
})
export class SneakAttackComponent {
  @Input() character!: Character;
  @Input() isCreatingNewCharacter!: boolean;

  // Calculate sneak attack value based on character level
  get sneakAttackValue(): number {
    if (!this.character || !this.character.level) return 0;
    return Math.ceil(this.character.level / 2);
  }

}

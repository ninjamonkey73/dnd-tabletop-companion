import { Component, Input, output } from '@angular/core';
import { Character } from '../character.model';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-spell-slots',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatFormFieldModule, MatInput],
  templateUrl: './spell-slots.component.html',
  styleUrls: ['./spell-slots.component.css'],
})
export class SpellSlotsComponent {
  @Input() character!: Character;
  @Input() isCreatingNewCharacter = false;
  readonly characterChange = output<Character>();

  onSlotChange() {
    this.characterChange.emit(this.character);
  }

  trackByIndex(i: number) {
    return i;
  }
}

import { Component, output, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { Character } from '../character.model';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-hit-dice',
  templateUrl: './hit-dice.component.html',
  styleUrls: ['./hit-dice.component.css'],
  imports: [FormsModule, MatFormFieldModule, MatCardModule, MatIcon],
})
export class HitDiceComponent {
  readonly character = input.required<Character>();
  readonly isCreatingNewCharacter = input<boolean>(false);
  readonly characterChange = output<Character>();

  ngOnInit(): void {}

  onHitDieChange() {
    this.characterChange.emit(this.character());
    
  }

  // Increment Hit Dice
incHitDie() {
  const current = this.character().hitDie;
  const max = this.character().level;

  if (current < max) {
    this.character().hitDie++;
    this.onHitDieChange();
  }
}

// Decrement Hit Dice
decHitDie() {
  const current = this.character().hitDie;

  if (current > 0) {
    this.character().hitDie--;
    this.onHitDieChange();
  }
}
}

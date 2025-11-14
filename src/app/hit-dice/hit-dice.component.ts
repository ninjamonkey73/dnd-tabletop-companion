import { Component, output, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatInput } from '@angular/material/input';
import { Character } from '../character.model';

@Component({
  selector: 'app-hit-dice',
  templateUrl: './hit-dice.component.html',
  styleUrls: ['./hit-dice.component.css'],
  imports: [FormsModule, MatFormFieldModule, MatCardModule, MatInput],
})
export class HitDiceComponent {
  readonly character = input.required<Character>();
  readonly isCreatingNewCharacter = input<boolean>(false);
  readonly characterChange = output<Character>();

  ngOnInit(): void {}

  onHitDieChange() {
    this.characterChange.emit(this.character());
  }
}

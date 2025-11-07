import { Component, Input, output } from '@angular/core';
import { Character } from '../character.model';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-wild-shape',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatFormFieldModule, MatInput],
  templateUrl: './wild-shape.component.html',
  styleUrls: ['./wild-shape.component.css'],
})
export class WildShapeComponent {
  @Input() character!: Character;
  @Input() isCreatingNewCharacter = false;
  readonly characterChange = output<Character>();

  onChange() {
    this.characterChange.emit(this.character);
  }
}

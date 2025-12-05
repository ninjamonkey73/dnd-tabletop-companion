import {
  Component,
  input,
  output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
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
export class WildShapeComponent implements OnChanges {
  readonly character = input.required<Character>();
  readonly isCreatingNewCharacter = input(false);
  readonly characterChange = output<Character>();

  wildShapeRemaining = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['character']?.currentValue) {
      this.wildShapeRemaining = this.character().wildShapeRemaining || 0;
    }
  }

  onWildShapeChange() {
    const c = this.character();
    c.wildShapeRemaining = this.wildShapeRemaining;
    this.characterChange.emit(c);
  }
}

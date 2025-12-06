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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-wild-shape',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
  ],
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

  incWildShape() {
    const c = this.character();
    const max = 2; // current template's max
    this.wildShapeRemaining = Math.min((this.wildShapeRemaining ?? 0) + 1, max);
    c.wildShapeRemaining = this.wildShapeRemaining;
    this.characterChange.emit(c);
  }

  decWildShape() {
    const c = this.character();
    this.wildShapeRemaining = Math.max((this.wildShapeRemaining ?? 0) - 1, 0);
    c.wildShapeRemaining = this.wildShapeRemaining;
    this.characterChange.emit(c);
  }
}

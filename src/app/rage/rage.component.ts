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
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-rage',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatFormFieldModule, MatIcon],
  templateUrl: './rage.component.html',
  styleUrls: ['./rage.component.css'],
})
export class RageComponent implements OnChanges {
  readonly character = input.required<Character>();
  readonly isCreatingNewCharacter = input(false);
  readonly characterChange = output<Character>();

  rageRemaining = 0;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['character']?.currentValue) {
      this.rageRemaining = this.character().rageRemaining || 0;
    }
  }

  onRageChange() {
    const c = this.character();
    c.rageRemaining = this.rageRemaining;
    this.characterChange.emit(c);
  }

  incRage() {
    if (this.rageRemaining < this.character().rage) {
      this.rageRemaining++;
      this.onRageChange();
    }
  }

  decRage() {
    if (this.rageRemaining > 0) {
      this.rageRemaining--;
      this.onRageChange();
    }
  }
}

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
  selector: 'app-rage',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatFormFieldModule, MatInput],
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
}

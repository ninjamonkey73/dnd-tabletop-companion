import { Component, output, input } from '@angular/core';
import { Character } from '../character.model';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-ki-points',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './ki-points.component.html',
  styleUrls: ['./ki-points.component.css'],
})
export class KiPointsComponent {
  readonly character = input.required<Character>();
  readonly isCreatingNewCharacter = input(false);
  readonly characterChange = output<Character>();

  incKi() {
    const c = this.character();
    const max = c.level ?? Infinity;
    c.kiPoints = Math.min((c.kiPoints ?? 0) + 1, max);
    this.characterChange.emit(c);
  }

  decKi() {
    const c = this.character();
    c.kiPoints = Math.max((c.kiPoints ?? 0) - 1, 0);
    this.characterChange.emit(c);
  }
}

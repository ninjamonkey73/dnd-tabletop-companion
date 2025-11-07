import { Component, Input, output } from '@angular/core';
import { Character } from '../character.model';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardContent } from '@angular/material/card';

@Component({
  selector: 'app-money',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInput,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardContent,
  ],
  templateUrl: './money.component.html',
  styleUrls: ['./money.component.css'],
})
export class MoneyComponent {
  @Input() character!: Character;
  @Input() isCreatingNewCharacter = false;
  // Parent will listen and call updateChar() to persist
  readonly characterChange = output<Character>();

  // Local field for +/- amount
  moneyDelta: number = 0;

  selectMoneyInput(event: FocusEvent): void {
    const input = event.target as HTMLInputElement | null;
    if (input && typeof input.select === 'function') {
      input.select();
    }
  }

  adjustMoney(type: 'cp' | 'sp' | 'gp' | 'pp', amount: number): void {
    if (
      !['cp', 'sp', 'gp', 'pp'].includes(type) ||
      !Number.isFinite(amount) ||
      amount === 0
    ) {
      return;
    }
    const current = this.character[type] || 0;
    const newValue = current + amount;
    if (newValue < 0) {
      alert(
        $localize`You cannot subtract more than you have! (${current} available)`
      );
      return;
    }
    this.character[type] = newValue;
    // Emit updated character so parent can save
    this.characterChange.emit(this.character);
    // Reset delta
    this.moneyDelta = 0;
  }
}

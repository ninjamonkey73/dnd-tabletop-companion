import {
  Component,
  input,
  output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Character } from '../character.model';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardContent } from '@angular/material/card';

@Component({
  selector: 'app-money',
  standalone: true,
  imports: [
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
export class MoneyComponent implements OnChanges {
  readonly character = input.required<Character>();
  readonly isCreatingNewCharacter = input(false);
  // Parent will listen and call updateChar() to persist
  readonly characterChange = output<Character>();

  cp = 0;
  sp = 0;
  gp = 0;
  pp = 0;

  moneyDelta = 0;

  coins = [
    { key: 'cp' as const, label: `Copper`, aria: 'copper' },
    { key: 'sp' as const, label: `Silver`, aria: 'silver' },
    { key: 'gp' as const, label: `Gold`, aria: 'gold' },
    { key: 'pp' as const, label: `Platinum`, aria: 'platinum' },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['character']?.currentValue) {
      const c = this.character();
      this.cp = c.cp || 0;
      this.sp = c.sp || 0;
      this.gp = c.gp || 0;
      this.pp = c.pp || 0;
    }
  }

  onMoneyChange() {
    const c = this.character();
    c.cp = this.cp;
    c.sp = this.sp;
    c.gp = this.gp;
    c.pp = this.pp;
    this.characterChange.emit(c);
  }

  selectMoneyInput(event: FocusEvent) {
    const target = event.target as HTMLInputElement | null;
    target?.select();
  }

  adjustMoney(coin: 'cp' | 'sp' | 'gp' | 'pp', delta: number) {
    const c = this.character();
    const current = (c[coin] ?? 0) as number;
    const next = Math.max(0, current + delta);
    c[coin] = next as any;
    this.moneyDelta = 0;
    this.characterChange.emit(c);
  }

  getCoinValue(key: 'cp' | 'sp' | 'gp' | 'pp') {
    const c = this.character();
    return (c[key] ?? 0) as number;
  }
}

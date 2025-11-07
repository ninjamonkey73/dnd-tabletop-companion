import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Character } from '../character.model';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatInput } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hp',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatCardModule,
    MatInput,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './hp.component.html',
  styleUrls: ['./hp.component.css'],
})
export class HpComponent implements OnChanges {
  @Input() character!: Character;
  @Input() isCreatingNewCharacter = false;
  @Input() percentHP = 0;
  @Input() deathSaveMessage: string | null = null;

  @Output() characterChange = new EventEmitter<Character>();
  @Output() hurt = new EventEmitter<number>(); // damage amount
  @Output() heal = new EventEmitter<number>(); // heal amount
  @Output() maxHpEditFinished = new EventEmitter<void>();

  changeVal: number | null = null;
  isEditingMaxHP = false;

  ngOnChanges(changes: SimpleChanges): void {
    // If parent recomputed percentHP, nothing else needed here.
  }

  startEditMaxHP() {
    this.isEditingMaxHP = true;
  }

  finishEditMaxHP() {
    this.isEditingMaxHP = false;
    this.characterChange.emit(this.character);
    this.maxHpEditFinished.emit();
  }

  onEnterMaxHP() {
    this.finishEditMaxHP();
  }

  onTempHpEnter() {
    this.characterChange.emit(this.character);
  }

  applyHurt() {
    if (this.changeVal === null || this.changeVal <= 0) {
      this.changeVal = null;
      return;
    }
    const dmg = this.changeVal;
    this.changeVal = null;
    this.hurt.emit(dmg);
  }

  applyHeal() {
    if (this.changeVal === null || this.changeVal <= 0) {
      this.changeVal = null;
      return;
    }
    const amt = this.changeVal;
    this.changeVal = null;
    this.heal.emit(amt);
  }
}

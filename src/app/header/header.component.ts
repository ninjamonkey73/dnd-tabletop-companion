import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { Character } from '../character.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatInputModule,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnChanges {
  // Character identity & selection
  @Input() selectedCharacter: string | null = null;
  @Input() savedCharacterNames: string[] = [];
  @Input() isCreatingNewCharacter = false;

  // Class/Level inputs
  @Input() character!: Character;
  @Input() classes: string[] = [];

  // Long rest full heal toggle
  @Input() fullHeal = false;

  // Outputs
  @Output() characterSelected = new EventEmitter<string>();
  @Output() deleteCharacter = new EventEmitter<string>();
  @Output() shortRest = new EventEmitter<void>();
  @Output() longRest = new EventEmitter<void>();
  @Output() fullHealChange = new EventEmitter<boolean>();
  @Output() classSelected = new EventEmitter<string>();
  @Output() levelChanged = new EventEmitter<number>();

  internalSelectedCharacter: string | null = null;
  internalFullHeal = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedCharacter']) {
      this.internalSelectedCharacter = this.selectedCharacter;
    }
    if (changes['fullHeal']) {
      this.internalFullHeal = this.fullHeal;
    }
  }

  onCharacterSelection(val: string) {
    this.internalSelectedCharacter = val;
    this.characterSelected.emit(val);
  }

  onDeleteClicked() {
    if (this.internalSelectedCharacter) {
      this.deleteCharacter.emit(this.internalSelectedCharacter);
    }
  }

  emitShortRest() {
    this.shortRest.emit();
  }

  emitLongRest() {
    this.longRest.emit();
  }

  onFullHealToggleChanged() {
    this.fullHealChange.emit(this.internalFullHeal);
  }

  onClassSelection(val: string) {
    this.classSelected.emit(val);
  }

  onLevelChange() {
    // Emit current level (already bound into character.level)
    this.levelChanged.emit(this.character.level);
  }
}

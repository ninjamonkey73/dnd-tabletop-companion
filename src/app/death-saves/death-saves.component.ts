import { Component, Input, Output, EventEmitter } from '@angular/core';
import { OnInit } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Character } from '../character.model';

@Component({
  selector: 'app-death-saves',
  templateUrl: './death-saves.component.html',
  styleUrl: './death-saves.component.css',
  imports: [MatIcon],
})
export class DeathSavesComponent implements OnInit {
  @Input() character!: Character;
  @Output() saveCharacter = new EventEmitter<Character>();
  @Output() deathSaveMessageChange = new EventEmitter<string | null>();

  ngOnInit(): void {
    this.syncDeathSavesFromCharacter(this.character);
  }

  ngOnChanges() {
    // React to character changes here
  }

  deathSaveMessage: string | null = null;
  deathSaveMessageTimeout: any = null;
  deathSaveSuccess: boolean[] = [false, false, false];
  deathSaveFailure: boolean[] = [false, false, false];

  toggleDeathSave(type: 'success' | 'failure', index: number): void {
    if (type === 'success') {
      this.deathSaveSuccess[index] = !this.deathSaveSuccess[index];
    } else {
      this.deathSaveFailure[index] = !this.deathSaveFailure[index];
    }
    if (this.deathSaveSuccess.every((val) => val)) {
      this.character.stable = true;
      this.deathSaveSuccess = [false, false, false];
      this.deathSaveFailure = [false, false, false];
      this.deathSaveMessage = null;
    } else if (this.deathSaveFailure.every((val) => val)) {
      this.deathSaveMessage = $localize`You are dead!`;
    } else {
      this.deathSaveMessage = null;
      this.character.stable = false;
    }
    this.syncDeathSavesToCharacter(this.character);
    this.saveCharacter.emit(this.character); // Notify parent to save
    this.deathSaveMessageChange.emit(this.deathSaveMessage); // Emit message change
  }

  public syncDeathSavesFromCharacter(character: Character) {
    this.deathSaveSuccess = character.deathSaveSuccess
      ? [...character.deathSaveSuccess]
      : [false, false, false];
    this.deathSaveFailure = character.deathSaveFailure
      ? [...character.deathSaveFailure]
      : [false, false, false];
  }

  public syncDeathSavesToCharacter(character: Character) {
    character.deathSaveSuccess = [...this.deathSaveSuccess];
    character.deathSaveFailure = [...this.deathSaveFailure];
  }
}

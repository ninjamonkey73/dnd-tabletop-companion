import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms'; // Import FormsModule for [(ngModel)]
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatCardModule, MatIconModule, MatFormField, MatInputModule, FormsModule, NgIf],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  character = {
    currentHP: 0,
    maxHP: 100,
    kiPoints: 2
  };

  changeVal: number | null = null; // Initialize as null
  percentHP = 0;
  isEditingMaxHP = false; // Flag to toggle edit mode

  ngOnInit(): void {
    const savedCharacter = localStorage.getItem('character');
    if (savedCharacter) {
      this.character = JSON.parse(savedCharacter);
    }
    this.updatePercentHP();
  }

  hurt(): void {
    this.character.currentHP = Math.max(0, this.character.currentHP - (this.changeVal ?? 0));
    this.changeVal = null;
    this.updatePercentHP();
    this.saveCharacterData();
  }

  heal(): void {
    this.character.currentHP = Math.min(this.character.maxHP, this.character.currentHP + (this.changeVal ?? 0));
    this.changeVal = null;
    this.updatePercentHP();
    this.saveCharacterData();
  }

  updatePercentHP(): void {
    this.percentHP = Math.round((this.character.currentHP / this.character.maxHP) * 100);
  }

  saveCharacterData(): void {
    localStorage.setItem('character', JSON.stringify(this.character));
  }

  editMaxHP(): void {
    this.isEditingMaxHP = !this.isEditingMaxHP; // Toggle edit mode
    if (!this.isEditingMaxHP) {
      this.saveCharacterData(); // Save changes when exiting edit mode
    }
  }

  onEnterMaxHP(): void {
    this.isEditingMaxHP = false; // Exit edit mode
    this.saveCharacterData(); // Save changes
  }

  updateKi(): void {
    this.saveCharacterData();
  }
}

import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms'; // Import FormsModule for [(ngModel)]
import { NgIf, NgForOf } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatCardModule, MatIconModule, MatFormField, MatInputModule, FormsModule, NgIf, MatSelectModule, NgForOf],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  character = {
    name: '',
    currentHP: 0,
    maxHP: 100,
    kiPoints: 2,
    class: '',
    cp: 0,
    sp: 0,
    gp: 0,
    pp: 0,
    level: 1
  };

  classes = ["Artificer","Barbarian","Bard","Cleric","Druid","Fighter","Monk","Paladin","Ranger","Rogue","Sorcerer","Warlock","Wizard"]

  levels: number[] = Array.from({ length: 20 }, (_, i) => i + 1); // Generate levels 1 through 20

  savedCharacterNames: string[] = []; // List of saved character names
  selectedCharacter: string | null = null; // Tracks the selected character
  isCreatingNewCharacter = false; // Flag to show the new character input field
  newCharacterName = ''; // Holds the name of the new character being created

  changeVal: number | null = null; // Initialize as null
  percentHP = 0;
  isEditingMaxHP = false; // Flag to toggle edit mode

  ngOnInit(): void {
    this.loadSavedCharacterNames();
  }

  loadSavedCharacterNames(): void {
    // Load all saved character names from localStorage
    this.savedCharacterNames = Object.keys(localStorage).filter((key) => {
      const character = localStorage.getItem(key);
      return character !== null && character.trim() !== ''; // Ensure valid entries
    });
  }

  onCharacterSelection(name: string): void {
    if (name === 'new') {
      // If "New Character" is selected, show the input field for a new name
      this.isCreatingNewCharacter = true;
      this.newCharacterName = '';
    } else {
      // Load the selected character's data
      this.isCreatingNewCharacter = false;
      const savedCharacter = localStorage.getItem(name);
      if (savedCharacter) {
        this.character = JSON.parse(savedCharacter);
      }
    }
  }

  createNewCharacter(): void {
    if (this.newCharacterName.trim()) {
      // Create a new character with the entered name
      this.character = {
        name: this.newCharacterName.trim(),
        currentHP: 0,
        maxHP: 100,
        kiPoints: 2,
        class: '',
        cp: 0,
        sp: 0,
        gp: 0,
        pp: 0,
        level: 1
      };
      this.saveCharacterData();
      this.isCreatingNewCharacter = false;
      this.newCharacterName = '';
    } else {
      console.error('Character name cannot be empty.');
    }
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
    if (this.character.name) {
      localStorage.setItem(this.character.name, JSON.stringify(this.character));
      this.loadSavedCharacterNames(); // Refresh the list of saved names
    } else {
      console.error('Character name is required to save data.');
    }
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

  updateChar(): void {
    this.saveCharacterData();
  }

  saveNewCharacter(): void {
    if (this.newCharacterName.trim()) {
      // Create a new character with the entered name
      this.character = {
        name: this.newCharacterName.trim(),
        currentHP: 0,
        maxHP: 100,
        kiPoints: 2,
        class: '',
        cp: 0,
        sp: 0,
        gp: 0,
        pp: 0,
        level: 1
      };

      this.saveCharacterData(); // Save the new character to localStorage
      this.loadSavedCharacterNames(); // Refresh the list of saved names
      this.selectedCharacter = this.character.name; // Set the dropdown to the new character
      this.isCreatingNewCharacter = false; // Hide the new character input field
      this.newCharacterName = ''; // Clear the input field
    } else {
      console.error('Character name cannot be empty.');
    }
  }

  deleteCharacter(name: string | null): void {
    if (name && name !== 'new') {
      if (confirm(`Are you sure you want to delete the character "${name}"?`)) {
        localStorage.removeItem(name); // Remove the character from localStorage
        this.loadSavedCharacterNames(); // Refresh the list of saved names
        this.selectedCharacter = null; // Reset the selected character
        this.character = {
          name: '',
          currentHP: 0,
          maxHP: 100,
          kiPoints: 2,
          class: '',
          cp: 0,
          sp: 0,
          gp: 0,
          pp: 0,
          level: 1
        }; // Reset the character object
      }
    }
  }
}

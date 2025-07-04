// ...existing code...

// (Removed duplicate death save state and method definitions)
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms'; // Import FormsModule for [(ngModel)]
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button'; // Import MatButtonModule for buttons
import { NgIf, NgFor } from '@angular/common'; // Import NgIf for conditional rendering

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MatCardModule,
    MatIconModule,
    MatFormField,
    MatInputModule,
    FormsModule,
    MatSelectModule,
    MatSlideToggle,
    MatButtonModule,
    NgIf,
    NgFor
    ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  // Death save state arrays (mirrored in character object)
  deathSaveSuccess: boolean[] = [false, false, false];
  deathSaveFailure: boolean[] = [false, false, false];

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
    level: 1,
    tempHP: 0,
    deathSaveSuccess: [false, false, false],
    deathSaveFailure: [false, false, false],
  };

  // Sync arrays to character before saving
  syncDeathSavesToCharacter() {
    this.character.deathSaveSuccess = [...this.deathSaveSuccess];
    this.character.deathSaveFailure = [...this.deathSaveFailure];
  }
  // Sync arrays from character after loading
  syncDeathSavesFromCharacter() {
    this.deathSaveSuccess = this.character.deathSaveSuccess
      ? [...this.character.deathSaveSuccess]
      : [false, false, false];
    this.deathSaveFailure = this.character.deathSaveFailure
      ? [...this.character.deathSaveFailure]
      : [false, false, false];
  }

  toggleDeathSave(type: 'success' | 'failure', index: number): void {
    if (type === 'success') {
      this.deathSaveSuccess[index] = !this.deathSaveSuccess[index];
    } else {
      this.deathSaveFailure[index] = !this.deathSaveFailure[index];
    }
    this.syncDeathSavesToCharacter();
    this.saveCharacterData();
  }

  lastCharacterSelected: string = '';

  fullHeal = false;

  classes = [
    'Artificer',
    'Barbarian',
    'Bard',
    'Cleric',
    'Druid',
    'Fighter',
    'Monk',
    'Paladin',
    'Ranger',
    'Rogue',
    'Sorcerer',
    'Warlock',
    'Wizard',
  ];

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
    this.loadLastSelectedCharacter();
    // Load the fullHeal toggle value from localStorage
    const savedFullHeal = localStorage.getItem('fullHeal');
    if (savedFullHeal !== null) {
      this.fullHeal = JSON.parse(savedFullHeal);
    }
    this.syncDeathSavesFromCharacter();
  }

  loadSavedCharacterNames(): void {
    // Load all saved character names from localStorage, excluding "lastSelectedCharacter" and "fullHeal"
    this.savedCharacterNames = Object.keys(localStorage).filter((key) => {
      const character = localStorage.getItem(key);
      return (
        key !== 'lastSelectedCharacter' &&
        key !== 'fullHeal' &&
        character !== null &&
        character.trim() !== ''
      ); // Exclude the keys
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
        this.selectedCharacter = name; // Update the selected character
        localStorage.setItem('lastSelectedCharacter', name); // Save the last selected character
        this.syncDeathSavesFromCharacter();
      }
    }
  }

  loadLastSelectedCharacter(): void {
    const lastCharacterName = localStorage.getItem('lastSelectedCharacter'); // Retrieve the last selected character name
    if (lastCharacterName) {
      const savedCharacter = localStorage.getItem(lastCharacterName); // Retrieve the character data
      if (savedCharacter) {
        this.character = JSON.parse(savedCharacter); // Load the character data
        this.selectedCharacter = lastCharacterName; // Set the dropdown to the last selected character
        this.syncDeathSavesFromCharacter();
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
        level: 1,
        tempHP: 0,
        deathSaveSuccess: [false, false, false],
        deathSaveFailure: [false, false, false],
      };
      this.syncDeathSavesFromCharacter();
      this.saveCharacterData();
      this.isCreatingNewCharacter = false;
      this.newCharacterName = '';
    } else {
      console.error('Character name cannot be empty.');
    }
  }

  hurt(): void {
    if (this.changeVal !== null && this.changeVal > 0) {
      let damage = this.changeVal;

      // Subtract from tempHP first
      if (this.character.tempHP > 0) {
        const tempDamage = Math.min(damage, this.character.tempHP);
        this.character.tempHP -= tempDamage;
        damage -= tempDamage;
      }

      // Subtract the remaining damage from currentHP
      this.character.currentHP = Math.max(0, this.character.currentHP - damage);

      // Reset changeVal and update percentHP
      this.changeVal = null;
      this.updatePercentHP();
      this.saveCharacterData();
    }
  }

  heal(): void {
    this.character.currentHP = Math.min(
      this.character.maxHP,
      this.character.currentHP + (this.changeVal ?? 0)
    );
    this.changeVal = null;
    this.updatePercentHP();
    this.saveCharacterData();
  }

  updatePercentHP(): void {
    this.percentHP = Math.round(
      (this.character.currentHP / this.character.maxHP) * 100
    );
  }

  saveCharacterData(): void {
    if (this.character.name) {
      this.syncDeathSavesToCharacter();
      localStorage.setItem(this.character.name, JSON.stringify(this.character)); // Save character data
      this.loadSavedCharacterNames(); // Refresh the list of saved names
      localStorage.setItem('lastSelectedCharacter', this.character.name); // Save the last selected character
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
    this.lastCharacterSelected = this.character.name;
    this.saveCharacterData();
  }

  updateCharLevel(): void {
    // Ensure level is between 1 and 20
    let errorMsg = '';
    if (this.character.level < 1) {
      this.character.level = 1;
      errorMsg = 'Level cannot be less than 1.';
    } else if (this.character.level > 20) {
      this.character.level = 20;
      errorMsg = 'Level cannot be greater than 20.';
    }
    // Update kiPoints based on level
    this.character.kiPoints =
      this.character.level > 1 ? this.character.level : 0; // Set kiPoints only if level > 1
    this.updatePercentHP();
    this.lastCharacterSelected = this.character.name;
    // Save the character data to localStorage
    this.saveCharacterData();
    if (errorMsg) {
      alert(errorMsg);
    }
  }

  saveNewCharacter(): void {
    if (this.newCharacterName.trim()) {
      // Create a new character with the entered name
      this.character = {
        name: this.newCharacterName.trim(),
        currentHP: 0,
        maxHP: 100,
        kiPoints: this.character.level > 1 ? this.character.level : 0, // Set kiPoints only if level > 1
        class: '',
        cp: 0,
        sp: 0,
        gp: 0,
        pp: 0,
        level: 1,
        tempHP: 0,
        deathSaveSuccess: [false, false, false],
        deathSaveFailure: [false, false, false],
      };

      this.syncDeathSavesFromCharacter();
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
          level: 1,
          tempHP: 0,
          deathSaveSuccess: [false, false, false],
          deathSaveFailure: [false, false, false],
        }; // Reset the character object
        this.syncDeathSavesFromCharacter();
      }
    }
  }

  shortRest() {
    if (this.character.class === 'Monk') {
      if (this.character.level === 1) {
        this.character.kiPoints = 0;
      } else {
        this.character.kiPoints = this.character.level;
      }
    }
  }

  longRest() {
    if (this.character.class === 'Monk') {
      if (this.character.level === 1) {
        this.character.kiPoints = 0;
      } else {
        this.character.kiPoints = this.character.level;
      }
    }
    if (this.fullHeal) {
      this.character.currentHP = this.character.maxHP;
    }
    this.character.tempHP = 0; // Reset tempHP on long rest
    this.updatePercentHP();
    this.updateChar();
  }

  saveHealToggle(): void {
    localStorage.setItem('fullHeal', JSON.stringify(this.fullHeal));
  }
}

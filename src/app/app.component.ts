import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { Character, defaultCharacter } from './character.model';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Location } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [
    MatCardModule,
    MatIconModule,
    MatFormField,
    MatInputModule,
    FormsModule,
    MatSelectModule,
    MatSlideToggle,
    MatButtonModule,
    CommonModule,
    MatTooltipModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  currentLocale: 'en' | 'es' = 'en';

  constructor(private location: Location) {}

  ngOnInit() {
    if (window.location.pathname.includes('/es/')) {
      this.currentLocale = 'es';
    } else {
      this.currentLocale = 'en';
    }
    this.loadSavedCharacterNames();
    this.loadLastSelectedCharacter();
    // Load the fullHeal toggle value from localStorage
    const savedFullHeal = localStorage.getItem('fullHeal');
    if (savedFullHeal !== null) {
      this.fullHeal = JSON.parse(savedFullHeal);
    }
    this.syncDeathSavesFromCharacter();
    this.fetchClassesFromAPI();
  }

  showingMoney = true;
  showingDeathSaves = true;
  classHasBeenSet: boolean = false;

  onClassSelection(selectedClass: string): void {
    // Only do the first-time action if class was not set before
    if (!this.classHasBeenSet && selectedClass) {
      this.classHasBeenSet = true;
      this.updateCharLevel();
    }
    this.updateChar();
  }

  deathSaveSuccess: boolean[] = [false, false, false];
  deathSaveFailure: boolean[] = [false, false, false];

  character: Character = { ...defaultCharacter };

  money: number = 0; // Holds the value for coin +/- input

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

  deathSaveMessage: string | null = null;
  deathSaveMessageTimeout: any = null;

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
    this.syncDeathSavesToCharacter();
    this.saveCharacterData();
  }

  lastCharacterSelected: string = '';

  fullHeal = false;

  classes: string[] = [];
  classesError: string | null = null;
  isLoadingClasses = false;
  /**
   * Fetches the list of classes from the D&D 5e API and sets the classes array.
   * Handles loading and error state.
   */
  fetchClassesFromAPI(): void {
    this.isLoadingClasses = true;
    this.classesError = null;
    fetch('https://www.dnd5eapi.co/api/2014/classes')
      .then((response) => {
        if (!response.ok) {
          throw new Error($localize`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data && Array.isArray(data.results)) {
          this.classes = data.results.map((c: any) => c.name);
        } else {
          this.classesError = $localize`API returned unexpected data.`;
        }
      })
      .catch((err) => {
        this.classesError = $localize`Failed to fetch classes from API.`;
        console.error($localize`Failed to fetch classes from API:`, err);
      })
      .finally(() => {
        this.isLoadingClasses = false;
      });
  }

  levels: number[] = Array.from({ length: 20 }, (_, i) => i + 1); // Generate levels 1 through 20

  savedCharacterNames: string[] = [];
  selectedCharacter: string | null = null;
  isCreatingNewCharacter = false;
  newCharacterName = '';

  changeVal: number | null = null;
  percentHP = 0;
  isEditingMaxHP = false;

  editingResourceNameId: number | null = null;

  startEditingResourceName(id: number) {
    this.editingResourceNameId = id;
  }

  stopEditingResourceName() {
    this.editingResourceNameId = null;
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
      this.classHasBeenSet = false;
    } else {
      // Load the selected character's data
      this.isCreatingNewCharacter = false;
      const savedCharacter = localStorage.getItem(name);
      if (savedCharacter) {
        const loaded = JSON.parse(savedCharacter);
        Object.assign(this.character, loaded);
        if (!Array.isArray(this.character.spellSlots))
          this.character.spellSlots = [];
        if (!Array.isArray(this.character.spellSlotsRemaining))
          this.character.spellSlotsRemaining = [];
        this.selectedCharacter = name;
        localStorage.setItem('lastSelectedCharacter', name);
        this.syncDeathSavesFromCharacter();
        this.classHasBeenSet = !!this.character.class;
      }
    }
  }

  loadLastSelectedCharacter(): void {
    const lastCharacterName = localStorage.getItem('lastSelectedCharacter');
    if (lastCharacterName) {
      const savedCharacter = localStorage.getItem(lastCharacterName);
      if (savedCharacter) {
        const loaded = JSON.parse(savedCharacter);
        Object.assign(this.character, loaded);
        if (!Array.isArray(this.character.spellSlots))
          this.character.spellSlots = [];
        if (!Array.isArray(this.character.spellSlotsRemaining))
          this.character.spellSlotsRemaining = [];
        this.selectedCharacter = lastCharacterName;
        this.syncDeathSavesFromCharacter();
      }
    }
  }

  createNewCharacter(): void {
    if (this.newCharacterName.trim()) {
      // Create a new character with the entered name
      this.saveNewCharacter();
      this.syncDeathSavesFromCharacter();
      this.saveCharacterData();
      this.isCreatingNewCharacter = false;
      this.newCharacterName = '';
    } else {
      console.error($localize`Character name cannot be empty.`);
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
    if (this.changeVal === null || this.changeVal <= 0) {
      console.error($localize`Change value must be a positive number to heal.`);
      this.changeVal = null;
      return;
    }
    this.character.currentHP = Math.min(
      this.character.maxHP,
      this.character.currentHP + (this.changeVal ?? 0)
    );
    this.changeVal = null;
    this.updatePercentHP();
    this.deathSaveSuccess = [false, false, false];
    this.deathSaveFailure = [false, false, false];
    this.character.stable = false;
    this.deathSaveMessage = null;
    this.syncDeathSavesToCharacter();
    this.saveCharacterData();
  }

  updatePercentHP(): void {
    this.percentHP =
      this.character.currentHP === 0
        ? 0
        : Math.round((this.character.currentHP / this.character.maxHP) * 100);
  }

  saveCharacterData(): void {
    if (this.character.name) {
      this.syncDeathSavesToCharacter();
      localStorage.setItem(this.character.name, JSON.stringify(this.character));
      this.loadSavedCharacterNames();
      localStorage.setItem('lastSelectedCharacter', this.character.name);
    } else {
      console.error($localize`Character name is required to save data.`);
    }
  }

  editMaxHP(): void {
    this.isEditingMaxHP = !this.isEditingMaxHP;
    if (!this.isEditingMaxHP) {
      this.saveCharacterData();
    }
  }

  onEnterMaxHP(): void {
    this.isEditingMaxHP = false;
    this.saveCharacterData();
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
      errorMsg = $localize`Level cannot be less than 1.`;
    } else if (this.character.level > 20) {
      this.character.level = 20;
      errorMsg = $localize`Level cannot be greater than 20.`;
    }
    if (this.character.class === 'Monk' && this.character.level > 1) {
      // Update kiPoints based on level
      this.character.kiPoints = this.character.level;
    }

    if (this.character.class === 'Barbarian') {
      // Fetch rage count from API and set it
      const url = `https://www.dnd5eapi.co/api/2014/classes/barbarian/levels/${this.character.level}`;
      fetch(url)
        .then((response) => {
          if (!response.ok)
            throw new Error($localize`Failed to fetch rage count`);
          return response.json();
        })
        .then((data) => {
          if (
            data.class_specific &&
            typeof data.class_specific.rage_count === 'number'
          ) {
            this.character.rage = data.class_specific.rage_count;
            this.character.rageRemaining = data.class_specific.rage_count;
          }
        })
        .catch((err) => {
          console.error($localize`Failed to fetch rage count:`, err);
        });
    }
    if (this.character.class === 'Druid' && this.character.level > 1) {
      this.character.wildShapeRemaining = 2;
    }

    this.character.hitDie = this.character.level;

    // Check for spellcasting asynchronously
    this.characterIsSpellcaster(
      this.character.class,
      this.character.level
    ).then(() => {
      this.updatePercentHP();
      this.lastCharacterSelected = this.character.name;
      // Save the character data to localStorage
      this.saveCharacterData();
      if (errorMsg) {
        alert(errorMsg);
      }
    });
    return; // Prevent duplicate save below
  }

  /**
   * Checks if the given class/level combination has spellcasting by calling the D&D 5e API.
   * If spellcasting is present, saves the spell slots to the character and returns true.
   * Otherwise, clears spell slots and returns false.
   */
  async characterIsSpellcaster(
    className: string,
    level?: number
  ): Promise<boolean> {
    if (!className) return false;
    const lvl = level ?? this.character.level;
    const url = `https://www.dnd5eapi.co/api/2014/classes/${className.toLowerCase()}/levels/${lvl}`;
    try {
      const response = await fetch(url);
      if (!response.ok) return false;
      const data = await response.json();
      if (data.spellcasting) {
        this.getSpellSlotsForLevel(data.spellcasting);
        return true;
      } else {
        this.character.spellSlots = [];
        return false;
      }
    } catch (e) {
      console.error(
        $localize`Failed to check spellcasting for`,
        className,
        $localize`level`,
        lvl,
        e
      );
      this.character.spellSlots = [];
      return false;
    }
  }

  /**
   * Saves the spell slot values from the spellcasting object to the character's spellSlots array.
   * @param spellcasting The spellcasting object from the API response.
   */
  getSpellSlotsForLevel(spellcasting: any): void {
    if (!spellcasting) {
      this.character.spellSlots = [];
      this.character.spellSlotsRemaining = [];
      return;
    }
    // Extract all keys that match 'spell_slots_level_X' and sort by level
    const slots: number[] = [];
    for (let i = 1; i <= 9; i++) {
      const key = `spell_slots_level_${i}`;
      if (spellcasting.hasOwnProperty(key)) {
        slots.push(spellcasting[key]);
      } else {
        slots.push(0);
      }
    }
    this.character.spellSlots = slots;
    this.syncSpellSlotsRemaining();
  }

  /**
   * Ensures spellSlotsRemaining is always an array of the same length as spellSlots,
   * with each value defaulting to the corresponding spellSlots value if undefined.
   */
  private syncSpellSlotsRemaining(): void {
    if (!this.character.spellSlots) {
      this.character.spellSlots = [];
    }
    if (!this.character.spellSlotsRemaining) {
      this.character.spellSlotsRemaining = [];
    }
    this.character.spellSlotsRemaining = this.character.spellSlots.map(
      (slot, i) => {
        // If already has a value for this slot, keep it, else default to max slots
        return this.character.spellSlotsRemaining &&
          typeof this.character.spellSlotsRemaining[i] === 'number'
          ? this.character.spellSlotsRemaining[i]
          : slot;
      }
    );
  }

  saveNewCharacter(): void {
    if (this.newCharacterName.trim()) {
      // Create a new character with the entered name
      this.character = defaultCharacter;
      this.character.name = this.newCharacterName.trim();

      this.syncDeathSavesFromCharacter();
      this.saveCharacterData();
      this.loadSavedCharacterNames();
      this.selectedCharacter = this.character.name;
      this.isCreatingNewCharacter = false;
      this.newCharacterName = '';
    } else {
      console.error($localize`Character name cannot be empty.`);
    }
  }

  deleteCharacter(name: string | null): void {
    if (name && name !== 'new') {
      if (
        confirm(
          $localize`Are you sure you want to delete the character "${name}"?`
        )
      ) {
        localStorage.removeItem(name);
        this.loadSavedCharacterNames();
        this.selectedCharacter = null;
        this.character = defaultCharacter;
        this.syncDeathSavesFromCharacter();
      }
    }
  }

  shortRest() {
    if (this.character.class === 'Monk') {
      this.character.kiPoints =
        this.character.level > 1 ? this.character.level : 0;
    } else if (this.character.class === 'Druid') {
      this.character.wildShapeRemaining = this.character.level > 1 ? 2 : 0;
    }
  }

  longRest() {
    if (this.character.class === 'Monk') {
      this.character.kiPoints =
        this.character.level > 1 ? this.character.level : 0;
    } else if (this.character.class === 'Druid') {
      this.character.wildShapeRemaining = this.character.level > 1 ? 2 : 0;
    } else if (this.character.class === 'Barbarian') {
      this.character.rageRemaining = this.character.rage;
    }
    this.character.spellSlotsRemaining = this.character.spellSlots.map(
      (slot) => slot
    );
    this.character.hitDie =
      this.character.hitDie < this.character.level
        ? this.character.hitDie + Math.floor(this.character.level / 2) >
          this.character.level
          ? this.character.level
          : this.character.hitDie +
            Math.floor(
              (this.character.level < 2 ? 2 : this.character.level) / 2
            )
        : this.character.hitDie;
    if (this.fullHeal) {
      this.character.currentHP = this.character.maxHP;
    }
    this.character.rageRemaining = this.character.rage;
    this.character.tempHP = 0;
    this.deathSaveSuccess = [false, false, false];
    this.deathSaveFailure = [false, false, false];
    this.character.stable = false;
    this.deathSaveMessage = null;
    this.character.spellSlotsRemaining = this.character.spellSlots.map(
      (slot) => slot
    );
    this.syncDeathSavesToCharacter();
    this.updatePercentHP();
    this.updateChar();
  }

  saveHealToggle(): void {
    localStorage.setItem('fullHeal', JSON.stringify(this.fullHeal));
  }

  /**
   * Selects all text in the money input when it receives focus.
   */
  selectMoneyInput(event: FocusEvent): void {
    const input = event.target as HTMLInputElement | null;
    if (input && typeof input.select === 'function') {
      input.select();
    }
  }

  /**
   * Adjusts the specified coin type (cp, sp, gp, pp) by the given amount (from the money input).
   * Ignores if money is 0 or not a number. Never allows negative totals.
   * @param type The coin type: 'cp', 'sp', 'gp', or 'pp'.
   * @param amount The amount to add (positive) or subtract (negative).
   */
  adjustMoney(type: 'cp' | 'sp' | 'gp' | 'pp', amount: number): void {
    if (
      !['cp', 'sp', 'gp', 'pp'].includes(type) ||
      !Number.isFinite(amount) ||
      amount === 0
    ) {
      return;
    }
    // Only allow integer math
    const current = this.character[type] || 0;
    const newValue = current + amount;
    if (newValue < 0) {
      alert(
        $localize`You cannot subtract more than you have! (${current} available)`
      );
      return;
    }
    this.character[type] = newValue;
    this.updateChar();
    this.money = 0; // Reset the money input after adjustment
  }
}

import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Character } from './character.model';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LanguageSwitcherComponent } from './language-switcher/language-switcher.component';
import { DeathSavesComponent } from './death-saves/death-saves.component';
import { HitDiceComponent } from './hit-dice/hit-dice.component';
import { RageComponent } from './rage/rage.component';
import { KiPointsComponent } from './ki-points/ki-points.component';
import { SpellSlotsComponent } from './spell-slots/spell-slots.component';
import { WildShapeComponent } from './wild-shape/wild-shape.component';
import { MoneyComponent } from './money/money.component';
import { ResourcesComponent } from './resources/resources.component';
import { HpComponent } from './hp/hp.component';
import { HeaderComponent } from './header/header.component';
import { CharacterStore } from './character.store';
import { DndApiService } from './dnd-api.service';
import { CloudSyncService } from './cloud-sync.service';
import { SyncStatusService } from './sync-status.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  imports: [
    MatCardModule,
    MatIconModule,
    MatFormField,
    MatInputModule,
    FormsModule,
    MatSelectModule,
    MatButtonModule,
    MatTooltipModule,
    LanguageSwitcherComponent,
    DeathSavesComponent,
    HitDiceComponent,
    RageComponent,
    KiPointsComponent,
    SpellSlotsComponent,
    WildShapeComponent,
    MoneyComponent,
    ResourcesComponent,
    HpComponent,
    HeaderComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit, OnInit {
  @ViewChild(DeathSavesComponent)
  deathSavesComponent!: DeathSavesComponent;

  constructor(
    private store: CharacterStore,
    private api: DndApiService,
    private cloud: CloudSyncService,
    private syncStatus: SyncStatusService,
    private authService: AuthService
  ) {
    this.syncStatus.pulled$.subscribe(() => {
      this.loadSavedCharacterNames();
      this.loadLastSelectedCharacter();
    });
  }

  // Derived from store; template keeps using `character`.
  get character(): Character {
    return this.store.character();
  }

  get percentHP(): number {
    return this.store.percentHP();
  }

  get fullHeal(): boolean {
    return this.store.fullHeal();
  }

  showingMoney = true;
  showingDeathSaves = true;
  classHasBeenSet = false;
  lastCharacterSelected = '';
  classes: string[] = [];
  classesError: string | null = null;
  isLoadingClasses = false;
  savedCharacterNames: string[] = [];
  selectedCharacter: string | null = null;
  isCreatingNewCharacter = false;
  newCharacterName = '';
  deathSaveMessage: string | null = null;

  ngOnInit(): void {
    this.loadSavedCharacterNames();
    this.loadLastSelectedCharacter();
    this.fetchClassesFromAPI();

    // If already authed at page access, pull immediately
    // (You can inject AuthService to check; or rely on CloudSyncService’s login effect)
    // Assuming you injected AuthService as `authService`:
    if (this.authService.isAuthed()) {
      this.cloud.pullSettings().then(() =>
        this.cloud.pullAllCharacters().then(() => {
          this.loadSavedCharacterNames();
          this.loadLastSelectedCharacter();
        })
      );
    }
  }

  ngAfterViewInit(): void {
    if (this.deathSavesComponent) {
      this.deathSavesComponent.syncDeathSavesFromCharacter(this.character);
    }
  }

  // --- Header interactions ---
  onFullHealToggle(value: boolean) {
    this.store.setFullHeal(value);
  }

  onHeaderLevelChanged(level: number) {
    this.store.patchCharacter({ level });
    this.updateCharLevel();
  }

  onHeaderClassSelected(cls: string) {
    this.onClassSelection(cls);
  }

  // --- Class selection & loading ---
  onClassSelection(selectedClass: string): void {
    if (!this.classHasBeenSet && selectedClass) {
      this.classHasBeenSet = true;
      this.store.patchCharacter({ class: selectedClass });
      this.updateCharLevel(); // includes save + signal push
    } else {
      this.store.patchCharacter({ class: selectedClass });
    }
    this.updateChar();
  }

  private isCharacterEntry(value: unknown): boolean {
    if (!value || typeof value !== 'object') return false;
    const c = value as any;
    return (
      typeof c.name === 'string' &&
      typeof c.currentHP === 'number' &&
      typeof c.maxHP === 'number' &&
      typeof c.level === 'number' &&
      Array.isArray(c.deathSaveSuccess) &&
      Array.isArray(c.deathSaveFailure)
    );
  }

  loadSavedCharacterNames(): void {
    const exclude = new Set(['lastSelectedCharacter', 'fullHeal']);
    const names: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || exclude.has(key)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);
        if (this.isCharacterEntry(parsed) && key.trim() !== '') {
          names.push(key);
        }
      } catch {
        // ignore non-JSON entries
      }
    }

    this.savedCharacterNames = names.sort();
  }

  onCharacterSelection(name: string): void {
    if (name === 'new') {
      this.isCreatingNewCharacter = true;
      this.newCharacterName = '';
      this.classHasBeenSet = false;
      this.selectedCharacter = 'new';
      return;
    }
    this.isCreatingNewCharacter = false;
    const saved = localStorage.getItem(name);
    if (saved) {
      const loaded = JSON.parse(saved);
      // Normalize arrays
      if (!Array.isArray(loaded.spellSlots)) loaded.spellSlots = [];
      if (!Array.isArray(loaded.spellSlotsRemaining))
        loaded.spellSlotsRemaining = [];
      this.store.setCharacter(loaded);
      this.selectedCharacter = name;
      localStorage.setItem('lastSelectedCharacter', name);
      this.deathSavesComponent?.syncDeathSavesFromCharacter(this.character);
      this.classHasBeenSet = !!loaded.class;
    }
  }

  loadLastSelectedCharacter(): void {
    const name = localStorage.getItem('lastSelectedCharacter');
    if (!name) return;
    const saved = localStorage.getItem(name);
    if (!saved) return;
    const loaded = JSON.parse(saved);
    if (!Array.isArray(loaded.spellSlots)) loaded.spellSlots = [];
    if (!Array.isArray(loaded.spellSlotsRemaining))
      loaded.spellSlotsRemaining = [];
    this.store.setCharacter(loaded);
    this.selectedCharacter = name;
    this.classHasBeenSet = !!loaded.class;
  }

  createNewCharacter(): void {
    if (!this.newCharacterName.trim()) {
      console.error(
        $localize`:@@errCharacterNameEmpty:Character name cannot be empty.`
      );
      return;
    }
    // Reuse saveNewCharacter (which sets store)
    this.saveNewCharacter();
    this.deathSavesComponent?.syncDeathSavesFromCharacter(this.character);
    this.saveCharacterData();
    this.isCreatingNewCharacter = false;
    this.newCharacterName = '';
  }

  saveNewCharacter(): void {
    if (!this.newCharacterName.trim()) {
      console.error(
        $localize`:@@errCharacterNameEmpty:Character name cannot be empty.`
      );
      return;
    }
    const fresh = {
      ...this.character,
      name: this.newCharacterName.trim(),
      currentHP: 0,
      maxHP: 0,
      kiPoints: 0,
      class: '',
      cp: 0,
      sp: 0,
      gp: 0,
      pp: 0,
      level: 1,
      tempHP: 0,
      deathSaveSuccess: [false, false, false],
      deathSaveFailure: [false, false, false],
      stable: false,
      spellSlots: [],
      spellSlotsRemaining: [],
      hitDie: 0,
      rage: 0,
      rageRemaining: 0,
      wildShapeRemaining: 0,
      resources: this.character.resources, // keep existing resource labels
    };
    this.store.setCharacter(fresh);
    this.selectedCharacter = fresh.name;
    this.isCreatingNewCharacter = false;
    this.newCharacterName = '';
  }

  async deleteCharacter(name: string | null): Promise<void> {
    if (!name || name === 'new') return;
    const ok = confirm(
      $localize`:@@confirmDeleteCharacter:Are you sure you want to delete the character "${name}"?`
    );
    if (!ok) return;

    try {
      await this.cloud.deleteCharacter(name);
    } catch {}

    localStorage.removeItem(name);
    if (localStorage.getItem('lastSelectedCharacter') === name) {
      localStorage.removeItem('lastSelectedCharacter');
    }
    this.loadSavedCharacterNames();
    this.selectedCharacter = null;

    this.store.setCharacter({
      ...this.character,
      name: '',
      currentHP: 0,
      maxHP: 0,
      kiPoints: 0,
      class: '',
      cp: 0,
      sp: 0,
      gp: 0,
      pp: 0,
      level: 1,
      tempHP: 0,
      deathSaveSuccess: [false, false, false],
      deathSaveFailure: [false, false, false],
      stable: false,
      spellSlots: [],
      spellSlotsRemaining: [],
      hitDie: 0,
      rage: 0,
      rageRemaining: 0,
      wildShapeRemaining: 0,
    });
    this.deathSavesComponent?.syncDeathSavesFromCharacter(this.character);
  }

  // --- Persistence ---
  saveCharacterData(): void {
    if (!this.character.name) {
      console.error(
        $localize`:@@errCharacterNameRequired:Character name is required to save data.`
      );
      return;
    }
    this.deathSavesComponent?.syncDeathSavesToCharacter(this.character);
    localStorage.setItem(this.character.name, JSON.stringify(this.character));
    this.loadSavedCharacterNames();
    localStorage.setItem('lastSelectedCharacter', this.character.name);
  }

  updateChar(): void {
    this.lastCharacterSelected = this.character.name;
    this.saveCharacterData();
    this.deathSavesComponent?.syncDeathSavesFromCharacter(this.character);
  }

  // --- Level / Class logic ---
  updateCharLevel(): void {
    let errorMsg = '';
    let level = this.character.level;
    if (level < 1) {
      level = 1;
      errorMsg = $localize`:@@errLevelTooLow:Level cannot be less than 1.`;
    } else if (level > 20) {
      level = 20;
      errorMsg = $localize`:@@errLevelTooHigh:Level cannot be greater than 20.`;
    }

    // Patch level first
    this.store.patchCharacter({ level });

    // Class-specific adjustments
    if (this.character.class === 'Monk' && level > 1) {
      this.store.patchCharacter({ kiPoints: level });
    }

    if (this.character.class === 'Barbarian') {
      this.api.getClassLevel('barbarian', level).subscribe({
        next: (data) => {
          const count = data.class_specific?.rage_count;
          if (typeof count === 'number') {
            this.store.patchCharacter({ rage: count, rageRemaining: count });
          }
        },
      });
    }

    if (this.character.class === 'Druid' && level > 1) {
      this.store.patchCharacter({ wildShapeRemaining: 2 });
    }

    // Hit dice equals level
    this.store.patchCharacter({ hitDie: level });

    // Spellcasting check
    this.api.isSpellcaster(this.character.class, level).subscribe(() => {
      this.lastCharacterSelected = this.character.name;
      this.saveCharacterData();
      if (errorMsg) alert(errorMsg);
    });
  }

  getSpellSlotsForLevel(spellcasting: any): void {
    if (!spellcasting) {
      this.store.patchCharacter({ spellSlots: [], spellSlotsRemaining: [] });
      return;
    }
    const slots: number[] = [];
    for (let i = 1; i <= 9; i++) {
      const key = `spell_slots_level_${i}`;
      slots.push(
        Object.prototype.hasOwnProperty.call(spellcasting, key)
          ? spellcasting[key]
          : 0
      );
    }
    // Initialize remaining to same values if absent
    this.store.patchCharacter({
      spellSlots: slots,
      spellSlotsRemaining: slots.slice(),
    });
  }

  // --- Rest actions ---
  shortRest(): void {
    if (this.character.class === 'Monk') {
      this.store.patchCharacter({
        kiPoints: this.character.level > 1 ? this.character.level : 0,
      });
    } else if (this.character.class === 'Druid') {
      this.store.patchCharacter({
        wildShapeRemaining: this.character.level > 1 ? 2 : 0,
      });
    }
  }

  longRest(): void {
    const patches: Partial<Character> = {};
    if (this.character.class === 'Monk') {
      patches.kiPoints = this.character.level > 1 ? this.character.level : 0;
    } else if (this.character.class === 'Druid') {
      patches.wildShapeRemaining = this.character.level > 1 ? 2 : 0;
    } else if (this.character.class === 'Barbarian') {
      patches.rageRemaining = this.character.rage;
    }

    patches.spellSlotsRemaining = this.character.spellSlots.map((s) => s);

    // Hit die recovery logic (retain original rules)
    const hitDie = this.character.hitDie;
    const level = this.character.level;
    let newHitDie = hitDie;
    if (hitDie < level) {
      const gain = Math.floor((level < 2 ? 2 : level) / 2);
      newHitDie = hitDie + gain > level ? level : hitDie + gain;
    }
    patches.hitDie = newHitDie;

    if (this.fullHeal) {
      patches.currentHP = this.character.maxHP;
    }
    patches.rageRemaining = this.character.rage;
    patches.tempHP = 0;
    patches.stable = false;

    this.store.patchCharacter(patches);

    if (this.deathSavesComponent) {
      this.deathSavesComponent.deathSaveSuccess = [false, false, false];
      this.deathSavesComponent.deathSaveFailure = [false, false, false];
      this.deathSavesComponent.deathSaveMessage = null;
      this.deathSavesComponent.syncDeathSavesToCharacter(this.character);
    }

    this.updateChar();
  }

  saveHealToggle(): void {
    this.store.setFullHeal(this.fullHeal);
  }

  // --- Child component events ---
  onHpCharacterChange(): void {
    // Child mutated local object reference; simply persist
    this.saveCharacterData();
  }

  onHurt(damage: number): void {
    this.store.applyDamage(damage);
    this.saveCharacterData();
  }

  onHeal(amount: number): void {
    this.store.heal(amount);
    if (this.deathSavesComponent) {
      this.deathSavesComponent.deathSaveSuccess = [false, false, false];
      this.deathSavesComponent.deathSaveFailure = [false, false, false];
      this.deathSavesComponent.deathSaveMessage = null;
      this.deathSavesComponent.syncDeathSavesToCharacter(this.character);
    }
    this.saveCharacterData();
  }

  onMaxHpEditFinished(): void {
    this.saveCharacterData();
  }

  fetchClassesFromAPI(): void {
    this.isLoadingClasses = true;
    this.classesError = null;
    this.api.getClasses().subscribe({
      next: (data) => {
        this.classes = Array.isArray(data.results)
          ? data.results.map((c) => c.name)
          : [];
        if (!this.classes.length) {
          this.classesError = $localize`:@@errApiUnexpected:API returned unexpected data.`;
        }
      },
      error: () => {
        this.classesError = $localize`:@@errClassesFetch:Failed to fetch classes from API.`;
      },
      complete: () => (this.isLoadingClasses = false),
    });
  }
}

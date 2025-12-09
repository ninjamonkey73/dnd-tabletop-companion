import { Component, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { Character } from './character.model';
import { MatTooltipModule } from '@angular/material/tooltip';
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
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { computed, signal } from '@angular/core';

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
    MatButtonToggleModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements AfterViewInit, OnInit {
  @ViewChild(DeathSavesComponent)
  deathSavesComponent!: DeathSavesComponent;
  private pendingSave = false;
  private pendingSaveClearTimer: any = null;

  constructor(
    private store: CharacterStore,
    private api: DndApiService,
    private cloud: CloudSyncService,
    private syncStatus: SyncStatusService,
    private authService: AuthService
  ) {
    // Warn/block refresh if a save is pending
    window.addEventListener('beforeunload', (e) => {
      if (this.pendingSave) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
    this.syncStatus.pulled$.subscribe(() => {
      this.loadSavedCharacterNames();
      this.loadLastSelectedCharacter();
    });
    this.syncStatus.status$.subscribe((s) => {
      // Clear pending save deterministically on push completion
      if (s.type === 'push') {
        if (s.status === 'ok' || s.status === 'error') {
          this.pendingSave = false;
          if (this.pendingSaveClearTimer) {
            clearTimeout(this.pendingSaveClearTimer);
            this.pendingSaveClearTimer = null;
          }
        }
        if (s.status === 'error') {
          console.error(`[Sync ${s.type}] ${s.message ?? 'error'}`, s.error);
        }
      } else if (s.status === 'error') {
        // Log other sync errors
        console.error(`[Sync ${s.type}] ${s.message ?? 'error'}`, s.error);
      }
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

  // Indicates a character has been loaded into the store
  get isCharacterLoaded(): boolean {
    const c = this.store.character();
    return !!c && typeof c.name === 'string' && c.name.trim().length > 0;
  }

  showingMoney = true;
  showingDeathSaves = true;
  // Toggle for stat sections (ki/rage/wild/spell slots)
  selectedStatSection: 'ki' | 'rage' | 'wild' | 'slots' | null = null;

  classHasBeenSet = false;
  lastCharacterSelected = '';
  classes: string[] = [];
  classesError: string | null = null;
  isLoadingClasses = false;
  savedCharacterNames: string[] = [];
  // Map UI class name -> API index/slug (both likely lowercase 2014 slugs)
  private classIndexByName: Record<string, string> = {};
  selectedCharacter: string | null = null;
  isCreatingNewCharacter = false;
  newCharacterName = '';
  deathSaveMessage: string | null = null;

  readonly selectedStatSectionSig = signal<
    'ki' | 'rage' | 'wild' | 'slots' | null
  >(this.selectedStatSection);

  readonly hasKiSig = computed(() => this.character.class === 'Monk');
  readonly hasRageSig = computed(() => this.character.class === 'Barbarian');
  readonly hasWildSig = computed(() => this.character.class === 'Druid');
  readonly hasSlotsSig = computed(
    () =>
      Array.isArray(this.character.spellSlots) &&
      this.character.spellSlots.some((s) => s > 0)
  );

  readonly availableStatSectionsSig = computed(() => {
    const arr: Array<'ki' | 'rage' | 'wild' | 'slots'> = [];
    if (this.hasKiSig()) arr.push('ki');
    if (this.hasRageSig()) arr.push('rage');
    if (this.hasWildSig()) arr.push('wild');
    if (this.hasSlotsSig()) arr.push('slots');
    return arr;
  });

  ngOnInit(): void {
    this.loadSavedCharacterNames();
    this.fetchClassesFromAPI();
    // Settings and lastSelectedCharacter are already loaded by APP_INITIALIZER when authed.
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

  async loadSavedCharacterNames(): Promise<void> {
    this.savedCharacterNames = await this.cloud.listCharacterNames();

    // If names exist, cancel auto "new" mode used for empty accounts
    if (
      this.savedCharacterNames.length > 0 &&
      this.isCreatingNewCharacter &&
      this.selectedCharacter === 'new'
    ) {
      this.isCreatingNewCharacter = false;
      this.newCharacterName = '';
      // Keep current selection if one is already loaded; otherwise
      // `loadLastSelectedCharacter()` (called after this) will load the last.
    }

    // If nothing exists after login/pull, default to new character mode
    if (!this.isCharacterLoaded && this.savedCharacterNames.length === 0) {
      this.isCreatingNewCharacter = true;
      this.selectedCharacter = 'new';
      this.newCharacterName = '';
    }
  }

  async onCharacterSelection(name: string): Promise<void> {
    if (name === 'new') {
      this.isCreatingNewCharacter = true;
      this.newCharacterName = '';
      this.classHasBeenSet = false;
      this.selectedCharacter = 'new';
      return;
    }
    this.isCreatingNewCharacter = false;
    const loaded = await this.cloud.getCharacter(name);
    if (!loaded) return;
    if (!Array.isArray(loaded.spellSlots)) loaded.spellSlots = [];
    if (!Array.isArray(loaded.spellSlotsRemaining))
      loaded.spellSlotsRemaining = [];
    this.store.setCharacter(loaded);
    this.refreshDeathSaveMessageFromCharacter();
    this.selectedCharacter = name;
    this.classHasBeenSet = !!loaded.class;
    this.deathSavesComponent?.syncDeathSavesFromCharacter(this.character);
    this.ensureSelectedStatSection();
    await this.persistSelectedCharacter();
  }

  async loadLastSelectedCharacter(): Promise<void> {
    // If a character is already loaded in memory, do not override it
    if (
      this.isCharacterLoaded &&
      this.selectedCharacter &&
      this.selectedCharacter !== 'new'
    ) {
      return;
    }
    const settings = await this.cloud.pullSettings();

    // Apply fullHeal even if there is no lastSelectedCharacter
    if (typeof settings?.fullHeal === 'boolean') {
      this.store.setFullHeal(settings.fullHeal);
    }

    const name = settings?.lastSelectedCharacter || null;
    if (!name) {
      // If there is no last selected and no saved names, enter creation mode
      if (!this.isCharacterLoaded && this.savedCharacterNames.length === 0) {
        this.isCreatingNewCharacter = true;
        this.selectedCharacter = 'new';
        this.newCharacterName = '';
      }
      return;
    }

    const loaded = await this.cloud.getCharacter(name);
    if (!loaded) return;

    if (!Array.isArray(loaded.spellSlots)) loaded.spellSlots = [];
    if (!Array.isArray(loaded.spellSlotsRemaining))
      loaded.spellSlotsRemaining = [];

    this.store.setCharacter(loaded);
    this.refreshDeathSaveMessageFromCharacter();
    this.selectedCharacter = name;
    this.classHasBeenSet = !!loaded.class;
    this.ensureSelectedStatSection();
  }

  async saveCharacterData(): Promise<void> {
    if (!this.character.name) {
      console.error('Character name is required to save data.');
      return;
    }
    // Mark save as pending to prevent accidental refresh during write
    this.pendingSave = true;
    this.deathSavesComponent?.syncDeathSavesToCharacter(this.character);
    // CloudSyncService effect will push changes; no local storage or names refresh here
    // Optimistically ensure the new name appears in the dropdown without reload
    if (this.character.name) {
      // Optimistic add so the dropdown includes it immediately
      const names = new Set(this.savedCharacterNames);
      names.add(this.character.name);
      this.savedCharacterNames = Array.from(names).sort();
      this.selectedCharacter = this.character.name;

      await this.persistSelectedCharacter();

      // Optional: schedule a background refresh to reconcile with Firestore
      setTimeout(() => this.loadSavedCharacterNames(), 1000);
    }
    // No timer-based clear; SyncStatusService will clear pendingSave on push completion
  }

  cancelNewCharacter(): void {
    this.isCreatingNewCharacter = false;
    this.newCharacterName = '';
    this.selectedCharacter = this.character.name || null;
  }

  async createNewCharacter(): Promise<void> {
    if (!this.newCharacterName.trim()) {
      console.error('Character name cannot be empty.');
      return;
    }
    // Reuse saveNewCharacter (which sets store)
    this.saveNewCharacter();
    this.deathSavesComponent?.syncDeathSavesFromCharacter(this.character);
    // Persist selection and refresh names
    if (this.character.name) {
      await this.persistSelectedCharacter();
      await this.loadSavedCharacterNames();
      this.selectedCharacter = this.character.name;
    }
    this.isCreatingNewCharacter = false;
    this.newCharacterName = '';

    // Actively switch to and load the new character to refresh all derived state
    if (this.character.name) {
      await this.onCharacterSelection(this.character.name);
    }
  }

  saveNewCharacter(): void {
    if (!this.newCharacterName.trim()) {
      console.error('Character name cannot be empty.');
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
    // Persist immediately so the cloud and UI reflect the new character
    this.updateChar();
  }

  async deleteCharacter(name: string | null): Promise<void> {
    if (!name || name === 'new') return;
    if (confirm(`Are you sure you want to delete the character "${name}"?`)) {
      try {
        await this.cloud.deleteCharacter(name);
      } catch {}
      await this.loadSavedCharacterNames();
      this.selectedCharacter = null;
      // Reset store to blank character (keep resources localized)
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
  }

  // --- Level / Class logic ---
  updateCharLevel(): void {
    let errorMsg = '';
    let level = this.character.level;
    if (level < 1) {
      level = 1;
      errorMsg = 'Level cannot be less than 1.';
    } else if (level > 20) {
      level = 20;
      errorMsg = 'Level cannot be greater than 20.';
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

    // Populate spell slots for spellcasting classes at this level
    const clsName = (this.character.class || '').toLowerCase().trim();
    if (!clsName) {
      // No class selected; clear any slots
      this.getSpellSlotsForLevel(null);
    } else {
      // Prefer API-declared index/slug; fall back to name lowercased
      const clsSlug = this.classIndexByName[clsName] || clsName;
      this.api.getClassLevel(clsSlug, level).subscribe((data) => {
        this.getSpellSlotsForLevel(data.spellcasting);
        this.ensureSelectedStatSection(); // auto-select 'slots' if it's the only available section
        this.lastCharacterSelected = this.character.name;
        this.saveCharacterData();
        if (errorMsg) alert(errorMsg);
      });
    }
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
    // Persist maxHP edits as well.
    this.store.patchCharacter({
      maxHP: this.character.maxHP,
    });
    this.saveCharacterData();
  }

  fetchClassesFromAPI(): void {
    this.isLoadingClasses = true;
    this.classesError = null;
    this.api.getClasses().subscribe({
      next: (data) => {
        const results = Array.isArray(data.results) ? data.results : [];
        // Populate display names
        this.classes = results.map((c) => c.name);
        // Build a lookup of name -> index (slug), normalized to lowercase keys
        this.classIndexByName = results.reduce<Record<string, string>>(
          (acc, c) => {
            const key = (c.name || '').toLowerCase().trim();
            if (key) acc[key] = (c.index || '').toLowerCase().trim();
            return acc;
          },
          {}
        );
        if (!this.classes.length) {
          this.classesError = 'API returned unexpected data.';
        }
      },
      error: () => {
        this.classesError = 'Failed to fetch classes from API.';
      },
      complete: () => (this.isLoadingClasses = false),
    });
  }

  async updateChar(): Promise<void> {
    // Persist current character via CloudSyncService effect
    this.lastCharacterSelected = this.character.name;
    this.saveCharacterData();

    // Keep death saves UI in sync with the store
    this.deathSavesComponent?.syncDeathSavesFromCharacter(this.character);
    this.refreshDeathSaveMessageFromCharacter();

    // Persist selection deterministically
    await this.persistSelectedCharacter();
    this.ensureSelectedStatSection();
  }

  onSpellSlotsChange(): void {
    // Mark save as pending immediately to guard against quick refresh
    this.pendingSave = true;
    this.store.patchCharacter({
      spellSlotsRemaining: this.character.spellSlotsRemaining,
    });
    this.saveCharacterData();
  }

  onSpellSlotRemainingChanged(ev: { index: number; value: number }): void {
    // Update only the targeted index to reduce churn
    const next = Array.isArray(this.character.spellSlotsRemaining)
      ? [...this.character.spellSlotsRemaining]
      : [];
    // Ensure array is long enough
    if (ev.index >= 0) {
      while (next.length <= ev.index) next.push(0);
      // Clamp to the max available slots at that level, if present
      const max =
        Array.isArray(this.character.spellSlots) &&
        this.character.spellSlots[ev.index] !== undefined
          ? this.character.spellSlots[ev.index]
          : Number.MAX_SAFE_INTEGER;
      const val =
        ev.value < 0 ? 0 : ev.value > max ? max : Math.floor(ev.value);
      next[ev.index] = val;
    }
    this.pendingSave = true;
    this.store.patchCharacter({ spellSlotsRemaining: next });
    this.saveCharacterData();
  }

  onWildShapeChange(): void {
    // Persist wildShapeRemaining from WildShapeComponent
    this.store.patchCharacter({
      wildShapeRemaining: this.character.wildShapeRemaining,
    });
    this.saveCharacterData();
  }

  // --- Stat Sections availability & selection ---
  hasKi(): boolean {
    return this.character.class === 'Monk';
  }
  hasRage(): boolean {
    return this.character.class === 'Barbarian';
  }
  hasWild(): boolean {
    return this.character.class === 'Druid';
  }
  hasSlots(): boolean {
    return (
      Array.isArray(this.character.spellSlots) &&
      this.character.spellSlots.some((s) => s > 0)
    );
  }
  availableStatSections(): Array<'ki' | 'rage' | 'wild' | 'slots'> {
    const arr: Array<'ki' | 'rage' | 'wild' | 'slots'> = [];
    if (this.hasKi()) arr.push('ki');
    if (this.hasRage()) arr.push('rage');
    if (this.hasWild()) arr.push('wild');
    if (this.hasSlots()) arr.push('slots');
    return arr;
  }
  ensureSelectedStatSection(): void {
    const available = this.availableStatSectionsSig();
    if (!available.length) {
      this.selectedStatSection = null;
      this.selectedStatSectionSig.set(null);
      return;
    }
    if (
      !this.selectedStatSection ||
      !available.includes(this.selectedStatSection)
    ) {
      const next = available[0];
      this.selectedStatSection = next;
      this.selectedStatSectionSig.set(next);
    }
  }
  setSelectedStatSection(section: 'ki' | 'rage' | 'wild' | 'slots'): void {
    this.selectedStatSection = section;
  }

  private refreshDeathSaveMessageFromCharacter(): void {
    const failures = this.character.deathSaveFailure || [false, false, false];
    if (failures.every((v) => v)) {
      this.deathSaveMessage = 'You are dead!';
    } else {
      this.deathSaveMessage = null;
    }
  }

  private async persistSelectedCharacter(): Promise<void> {
    try {
      const name = this.character.name;
      if (name && typeof name === 'string' && name.trim().length > 0) {
        await this.cloud.setLastSelectedCharacter(name);
      }
    } catch (e) {
      console.error('Failed to persist lastSelectedCharacter', e);
    }
  }

  onSectionToggle(val: 'money' | 'resources') {
    this.showingMoney = val === 'money';
  }

  onDeathHitToggle(val: 'death' | 'hit') {
    this.showingDeathSaves = val === 'death';
  }

  onChildCharacterChange(): void {
    this.pendingSave = true;
    this.saveCharacterData();
  }
}

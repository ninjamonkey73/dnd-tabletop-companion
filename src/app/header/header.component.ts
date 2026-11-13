import {
  Component,
  Output,
  EventEmitter,
  OnChanges,
  OnInit,
  SimpleChanges,
  input,
  inject,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { Character, ClassLevel } from '../character.model';
import { AuthService } from '../auth.service';
import { getTotalLevel, formatClassSummary } from '../multiclass.utils';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
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
export class HeaderComponent implements OnChanges, OnInit {
  // Character identity & selection
  readonly selectedCharacter = input<string | null>(null);
  readonly savedCharacterNames = input<string[]>([]);
  readonly isCreatingNewCharacter = input(false);

  // Class/Level inputs
  readonly character = input.required<Character>();
  readonly classes = input<string[]>([]);

  // Long rest full heal toggle
  readonly fullHeal = input(true);

  // Outputs
  @Output() characterSelected = new EventEmitter<string>();
  @Output() deleteCharacter = new EventEmitter<string>();
  @Output() shortRest = new EventEmitter<void>();
  @Output() longRest = new EventEmitter<void>();
  @Output() fullHealChange = new EventEmitter<boolean>();
  @Output() classSelected = new EventEmitter<string>();
  @Output() levelChanged = new EventEmitter<number>();
  @Output() classesChanged = new EventEmitter<ClassLevel[]>();

  internalSelectedCharacter: string | null = null;
  internalFullHeal = this.fullHeal(); // mirror input on init
  private auth = inject(AuthService);
  isDarkTheme = false;

  // Collapsible repeater state
  isExpanded = false;

  ngOnInit() {
    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark-theme');
      this.isDarkTheme = true;
    }
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    if (this.isDarkTheme) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedCharacter']) {
      this.internalSelectedCharacter = this.selectedCharacter();
    }
    if (changes['fullHeal']) {
      this.internalFullHeal = this.fullHeal();
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

  // --- Collapsible Repeater Helpers ---
  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
  }

  get characterClasses(): ClassLevel[] {
    const c = this.character();
    if (!c) return [];
    if (!Array.isArray(c.classes)) {
      c.classes = [];
    }
    if (c.classes.length === 0 && (c.class || c.level)) {
      c.classes = [
        {
          class: c.class || '',
          level: Math.max(1, Math.min(20, Number(c.level) || 1)),
        },
      ];
    } else if (c.classes.length === 0) {
      c.classes = [{ class: '', level: 1 }];
    }
    return c.classes;
  }

  get classSummary(): string {
    return formatClassSummary(this.character()?.classes);
  }

  get totalLevel(): number {
    return getTotalLevel(this.character()?.classes);
  }

  isClassSelectedInOtherRow(className: string, rowIndex: number): boolean {
    if (!className) return false;
    const target = className.toLowerCase().trim();
    return this.characterClasses.some(
      (c, idx) =>
        idx !== rowIndex && (c?.class || '').toLowerCase().trim() === target
    );
  }

  getMaxLevelForRow(index: number): number {
    const classes = this.characterClasses;
    const otherSum = classes.reduce(
      (sum, c, idx) => (idx === index ? sum : sum + (Number(c?.level) || 0)),
      0
    );
    return Math.max(1, 20 - otherSum);
  }

  onRowClassChange(index: number, newClass: string) {
    const classes = this.characterClasses;
    if (!classes[index]) return;
    classes[index].class = newClass;
    this.syncAndEmit();
  }

  onRowLevelChange(index: number, newLevel: any) {
    const classes = this.characterClasses;
    if (!classes[index]) return;
    const parsed = Number(newLevel);
    const maxAllowed = this.getMaxLevelForRow(index);
    const clamped = Math.max(
      1,
      Math.min(maxAllowed, isNaN(parsed) ? 1 : Math.floor(parsed))
    );
    classes[index].level = clamped;
    this.syncAndEmit();
  }

  changeRowLevel(index: number, delta: number) {
    const classes = this.characterClasses;
    if (!classes[index]) return;
    const current = Number(classes[index].level) || 1;
    this.onRowLevelChange(index, current + delta);
  }

  addClass() {
    if (this.totalLevel >= 20 || this.isCreatingNewCharacter()) return;
    const classes = this.characterClasses;
    const remaining = 20 - this.totalLevel;
    if (remaining <= 0) return;

    // Pick first available class from classes() that isn't already selected
    const available =
      this.classes().find(
        (c) =>
          !classes.some(
            (existing) =>
              (existing?.class || '').toLowerCase().trim() ===
              c.toLowerCase().trim()
          )
      ) || '';

    classes.push({ class: available, level: 1 });
    this.syncAndEmit();
  }

  removeClass(index: number) {
    const classes = this.characterClasses;
    if (classes.length > 1) {
      classes.splice(index, 1);
    } else {
      classes[0] = { class: '', level: 1 };
    }
    this.syncAndEmit();
  }

  syncAndEmit() {
    const char = this.character();
    const classes = this.characterClasses;
    const primaryClass =
      classes.find((c) => (c?.class || '').trim().length > 0)?.class || '';
    const total = getTotalLevel(classes);

    char.classes = classes;
    char.class = primaryClass;
    char.level = total;

    this.classSelected.emit(primaryClass);
    this.levelChanged.emit(total);
    this.classesChanged.emit(classes);
  }

  // Legacy single-class callbacks kept for test compatibility
  onClassSelection(val: string) {
    this.onRowClassChange(0, val);
  }

  onLevelChange() {
    this.syncAndEmit();
  }

  changeLevel(increment: number) {
    this.changeRowLevel(0, increment);
  }

  // Auth helpers
  get isAuthed() {
    return this.auth.isAuthed();
  }
  get authedUserEmail(): string | null {
    return this.auth.user()?.email ?? null;
  }
  async login() {
    await this.auth.loginWithGoogle();
  }
  async logout() {
    await this.auth.logout();
  }
}

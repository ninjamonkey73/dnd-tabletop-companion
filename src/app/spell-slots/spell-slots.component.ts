import {
  Component,
  input,
  output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Character } from '../character.model';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-spell-slots',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatFormFieldModule, MatInput],
  templateUrl: './spell-slots.component.html',
  styleUrls: ['./spell-slots.component.css'],
})
export class SpellSlotsComponent implements OnChanges {
  readonly character = input.required<Character>();
  readonly isCreatingNewCharacter = input(false);
  readonly characterChange = output<Character>();
  readonly remainingChanged = output<{ index: number; value: number }>();

  slots: number[] = [];
  remaining: number[] = [];
  private commitTimers: Array<any> = [];

  private arraysEqual(
    a: number[] | undefined,
    b: number[] | undefined
  ): boolean {
    if (!Array.isArray(a) && !Array.isArray(b)) return true;
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['character']?.currentValue) {
      const c = this.character();
      const nextSlots = Array.isArray(c.spellSlots) ? c.spellSlots : [];
      const nextRemaining = Array.isArray(c.spellSlotsRemaining)
        ? c.spellSlotsRemaining
        : [];

      // Only update local arrays if incoming values actually differ,
      // so quick successive edits don't get overwritten.
      if (!this.arraysEqual(this.slots, nextSlots)) {
        this.slots = [...nextSlots];
      }
      if (!this.arraysEqual(this.remaining, nextRemaining)) {
        this.remaining = [...nextRemaining];
      }
    }
  }

  onRemainingCommit(index: number) {
    // Ensure value is within valid range for this slot
    const max = this.slots[index] ?? 0;
    let val = this.remaining[index] ?? 0;
    if (val < 0) val = 0;
    if (val > max) val = max;
    this.remaining[index] = val;

    // Clear any pending debounce for this index and commit now
    if (this.commitTimers[index]) {
      clearTimeout(this.commitTimers[index]);
      this.commitTimers[index] = null;
    }

    const c = this.character();
    c.spellSlotsRemaining = [...this.remaining];
    this.characterChange.emit(c);
    // Also emit granular change for parent-side precise patch
    this.remainingChanged.emit({ index, value: this.remaining[index] });
  }

  onRemainingImmediateCommit(index: number, value: number) {
    // Update from ngModelChange and commit immediately
    const max = this.slots[index] ?? 0;
    let val = value ?? 0;
    if (val < 0) val = 0;
    if (val > max) val = max;
    this.remaining[index] = val;

    // Clear any pending debounce for this index
    if (this.commitTimers[index]) {
      clearTimeout(this.commitTimers[index]);
      this.commitTimers[index] = null;
    }

    const c = this.character();
    c.spellSlotsRemaining = [...this.remaining];
    this.characterChange.emit(c);
    this.remainingChanged.emit({ index, value: this.remaining[index] });
  }

  trackByIndex(i: number) {
    return i;
  }
}

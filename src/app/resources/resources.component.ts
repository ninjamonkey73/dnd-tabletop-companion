import {
  Component,
  input,
  output,
  OnChanges,
  SimpleChanges,
  ViewChildren,
  ElementRef,
  QueryList,
} from '@angular/core';
import { Character, Resource } from '../character.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardContent } from '@angular/material/card';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
      MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatCardContent,
  ],
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.css'],
})
export class ResourcesComponent implements OnChanges {
  readonly character = input.required<Character>();
  readonly isCreatingNewCharacter = input(false);
  readonly characterChange = output<Character>();

  localResources: Resource[] = [];

  private nextResourceId = 1;

  // Track which resource name is being edited
  editingResourceNameId: number | null = null;

  @ViewChildren('nameInput')
  nameInputs!: QueryList<ElementRef<HTMLInputElement>>;

  startEditingResourceName(index: number) {
    this.editingResourceNameId = index;
    // Defer focus until view updates
    setTimeout(() => {
      const el = this.nameInputs.get(index)?.nativeElement;
      if (el) {
        try {
          el.removeAttribute?.('readonly');
        } catch {}
        el.readOnly = false; // ensure editable
        // small delay to ensure input is visible/focused after any focus steal
        setTimeout(() => {
          el.focus();
          el.select(); // highlight current text
        }, 20);
      }
    });
  }

  stopEditingResourceName() {
    this.editingResourceNameId = null;
  }

  onNameBlur(index?: number) {
    // Commit the edited name/value to the character first, then close edit mode
    this.commitResources();
    this.stopEditingResourceName();
    // ensure change detection consumers see the update
    this.characterChange.emit(this.character());
  }

  onValueChange() {
    this.commitResources();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['character']?.currentValue) {
      const c = this.character();
      this.localResources = Array.isArray(c.resources) && c.resources.length
        ? [...c.resources]
        : [{ id: this.nextId(), name: 'Resource', value: 0 }];
      // Ensure nextResourceId is larger than any existing id
      const maxId = this.localResources.reduce((m, r) => Math.max(m, r.id || 0), 0);
      this.nextResourceId = maxId + 1;
    }
  }

  onResourceEdit() {
    this.commitResources();
  }

  addResource() {
    if (this.localResources.length >= 9) return; // keep reasonable cap
    this.localResources.push({ id: this.nextId(), name: `Resource`, value: 0 });
    this.commitResources();
    // focus last input after view update
    setTimeout(() => {
      const idx = this.localResources.length - 1;
      this.startEditingResourceName(idx);
    });
  }

  removeResource(index: number) {
    this.localResources.splice(index, 1);
    if (this.localResources.length === 0) {
      this.localResources.push({ id: this.nextId(), name: 'Resource', value: 0 });
    }
    this.commitResources();
  }

  adjustResource(index: number, delta: number) {
    const r = this.localResources[index];
    if (!r) return;
    r.value = Math.max(0, (r.value || 0) + delta);
    this.commitResources();
  }

  private commitResources() {
    const c = this.character();
    c.resources = [...this.localResources];
    this.characterChange.emit(c);
  }

  private nextId(): number {
    return this.nextResourceId++;
  }
}

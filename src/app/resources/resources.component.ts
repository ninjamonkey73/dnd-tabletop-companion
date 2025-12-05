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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardContent } from '@angular/material/card';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInput,
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
        el.readOnly = false; // ensure editable
        el.focus();
        el.select(); // highlight current text
      }
    });
  }

  stopEditingResourceName() {
    this.editingResourceNameId = null;
  }

  onNameBlur() {
    this.stopEditingResourceName();
    this.characterChange.emit(this.character());
  }

  onValueChange() {
    this.characterChange.emit(this.character());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['character']?.currentValue) {
      const c = this.character();
      this.localResources = Array.isArray(c.resources) ? [...c.resources] : [];
    }
  }

  onResourceEdit() {
    const c = this.character();
    c.resources = [...this.localResources];
    this.characterChange.emit(c);
  }
}

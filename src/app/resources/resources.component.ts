import { Component, Input, output } from '@angular/core';
import { Character } from '../character.model';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardContent } from '@angular/material/card';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [
    CommonModule,
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
export class ResourcesComponent {
  @Input() character!: Character;
  @Input() isCreatingNewCharacter = false;
  readonly characterChange = output<Character>();

  // Track which resource name is being edited
  editingResourceNameId: number | null = null;

  startEditingResourceName(id: number) {
    this.editingResourceNameId = id;
  }

  stopEditingResourceName() {
    this.editingResourceNameId = null;
  }

  onNameBlur() {
    this.stopEditingResourceName();
    this.characterChange.emit(this.character);
  }

  onValueChange() {
    this.characterChange.emit(this.character);
  }
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-new-character',
  imports: [MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule],
  templateUrl: './new-character.component.html',
  styleUrls: ['./new-character.component.css'],
})
export class NewCharacterComponent {
  @Input() newCharacterName: string = '';
  @Output() newCharacterNameChange = new EventEmitter<string>();
  @Output() create = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}

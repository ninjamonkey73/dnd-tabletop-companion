import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormField } from '@angular/material/form-field';
import { MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms'; // Import FormsModule for [(ngModel)]
import { DataService } from './data.service';

@Component({
  selector: 'app-root',
imports: [RouterOutlet, MatCardModule, MatIconModule, MatFormField, MatLabel, MatInputModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'dnd-tabletop-companion';
  character = { currentHP: 0, kiPoints: 0}; // Default value
  changeVal: number | null = null;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    // Load character data on initialization
    this.dataService.getCharacterData().subscribe(data => {
      this.character.currentHP = data.currentHP; // Adjust based on your JSON structure
      this.character.kiPoints = data.kiPoints;
    });
  }

  hurt(): void {
    this.character.currentHP = Math.max(0, this.character.currentHP - (this.changeVal ?? 0));
    this.saveCharacterData();
  }

  heal(): void {
    this.character.currentHP += this.changeVal ?? 0;
    this.saveCharacterData();
  }

  saveCharacterData(): void {
    const updatedData = { currentHP: this.character.currentHP, kiPoints: this.character.kiPoints }; // Adjust based on your JSON structure
    this.dataService.setCharacterData(updatedData).subscribe(response => {
      console.log('Character data saved:', response);
    });
  }
}
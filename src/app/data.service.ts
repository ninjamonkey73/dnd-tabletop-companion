import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { saveToLocalStorage, getFromLocalStorage } from '../utils/storage';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  // Example: Save character data
saveCharacter(character: any) {
  saveToLocalStorage('character', character);
}

loadCharacter() {
  const character = getFromLocalStorage('character');
  if (character) {
      console.log('Character loaded:', character);
      return character;
  } else {
      console.log('No character data found.');
      return null;
  }
}
}

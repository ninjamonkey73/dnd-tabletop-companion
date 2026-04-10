import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  // Placeholder: prefer `CloudSyncService` for persistence.
  saveCharacter(_: any): void {}
  loadCharacter(): null {
    return null;
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  // Placeholder methods; prefer CloudSyncService for persistence
  saveCharacter(_: any) {}
  loadCharacter() {
    return null;
  }
}

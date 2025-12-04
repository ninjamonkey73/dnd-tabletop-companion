import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SyncStatusService {
  private pulledSubject = new Subject<void>();
  pulled$ = this.pulledSubject.asObservable();
  emitPulled() {
    this.pulledSubject.next();
  }
}

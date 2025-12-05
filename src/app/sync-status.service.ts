import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface SyncEvent {
  type: 'push' | 'pull' | 'settings';
  status: 'ok' | 'error';
  message?: string;
  error?: unknown;
}

@Injectable({ providedIn: 'root' })
export class SyncStatusService {
  private pulledSubject = new Subject<void>();
  pulled$ = this.pulledSubject.asObservable();

  private statusSubject = new Subject<SyncEvent>();
  status$ = this.statusSubject.asObservable();

  emitPulled() {
    this.pulledSubject.next();
  }

  emitStatus(evt: SyncEvent) {
    this.statusSubject.next(evt);
  }
}

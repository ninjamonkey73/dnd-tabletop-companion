import { Injectable, signal, computed } from '@angular/core';
import { auth } from './firebase.init';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(null);
  readonly user = computed(() => this._user());
  readonly isAuthed = computed(() => !!this._user());

  constructor() {
    onAuthStateChanged(auth, (u) => this._user.set(u));
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      const code = typeof err?.code === 'string' ? err.code : '';
      const popupIssues = [
        'auth/popup-blocked',
        'auth/popup-closed-by-user',
        'auth/cancelled-popup-request',
        'auth/internal-error',
      ];
      if (popupIssues.includes(code) || this.isMobile()) {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw err;
    }
  }

  async completeRedirectLoginIfNeeded() {
    try {
      await getRedirectResult(auth);
    } catch {
      // no-op
    }
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  private isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  private isPopupLikelyBlocked() {
    // Heuristic: mobile browsers or user settings often block
    return this.isMobile();
  }
}

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
    if (this.isMobile() || this.isPopupLikelyBlocked()) {
      await signInWithRedirect(auth, provider);
      return;
    }
    await signInWithPopup(auth, provider);
  }

  async completeRedirectLoginIfNeeded() {
    try {
      await getRedirectResult(auth);
      // Auth state listener updates `_user` if a user is present.
    } catch {
      // Optional: log auth redirect error
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

import { Injectable, signal, computed } from '@angular/core';
import { auth, googleProvider } from './firebase.init';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
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
    await signInWithPopup(auth, googleProvider);
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }
}

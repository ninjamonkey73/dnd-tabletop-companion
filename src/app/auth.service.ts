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
    onAuthStateChanged(auth, (u) => {
      this._user.set(u);
      console.debug(
        '[Auth] State changed:',
        u ? { uid: u.uid, email: u.email } : null
      );
    });
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    console.debug('[Auth] Initiating Google login (popup first)...');
    try {
      await signInWithPopup(auth, provider);
      console.debug('[Auth] Popup login succeeded.');
    } catch (err: any) {
      const code = typeof err?.code === 'string' ? err.code : '';
      console.warn('[Auth] Popup login failed; code:', code, 'err:', err);
      const popupIssues = [
        'auth/popup-blocked',
        'auth/popup-closed-by-user',
        'auth/cancelled-popup-request',
        'auth/internal-error',
      ];
      if (popupIssues.includes(code) || this.isMobile()) {
        console.debug('[Auth] Falling back to redirect login...');
        await signInWithRedirect(auth, provider);
        return;
      }
      console.error('[Auth] Non-recoverable popup error; rethrowing.');
      throw err;
    }
  }

  async completeRedirectLoginIfNeeded() {
    console.debug('[Auth] Checking for redirect result...');
    try {
      const result = await getRedirectResult(auth);
      if (result?.user) {
        console.debug('[Auth] Redirect result user:', {
          uid: result.user.uid,
          email: result.user.email,
        });
      } else {
        console.debug('[Auth] No redirect result user.');
      }
      // Auth state listener updates `_user` if present.
    } catch (err) {
      console.warn('[Auth] Redirect result error:', err);
    }
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  private isMobile() {
    const ua = navigator.userAgent;
    const mobile = /Android|iPhone|iPad|iPod/i.test(ua);
    console.debug('[Auth] isMobile:', mobile, 'UA:', ua);
    return mobile;
  }

  private isPopupLikelyBlocked() {
    // Heuristic: mobile browsers or user settings often block
    return this.isMobile();
  }
}

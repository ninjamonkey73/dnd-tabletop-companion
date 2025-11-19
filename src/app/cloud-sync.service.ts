import { Injectable, effect } from '@angular/core';
import { CharacterStore } from './character.store';
import { AuthService } from './auth.service';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase.init';
import { Character } from './character.model';

interface SettingsDoc {
  lastSelectedCharacter?: string;
  fullHeal?: boolean;
  updatedAt?: any;
}

@Injectable({ providedIn: 'root' })
export class CloudSyncService {
  private writing = false;

  constructor(private store: CharacterStore, private auth: AuthService) {
    // Reactively push character changes
    effect(() => {
      const user = this.auth.user();
      const character = this.store.character();
      if (!user || !character.name) return;
      if (this.writing) return;
      this.pushCharacter(user.uid, character).catch(() => {});
    });

    // Reactively push settings
    effect(() => {
      const user = this.auth.user();
      const fullHeal = this.store.fullHeal();
      if (!user) return;
      if (this.writing) return;
      this.pushSettings(user.uid, {
        fullHeal,
      }).catch(() => {});
    });
  }

  // Pull all remote characters (populate localStorage for compatibility)
  async pullAllCharacters(): Promise<void> {
    const user = this.auth.user();
    if (!user) return;
    const snap = await getDocs(collection(db, 'users', user.uid, 'characters'));
    snap.forEach((docSnap) => {
      const data = docSnap.data() as Character;
      if (data && data.name) {
        localStorage.setItem(data.name, JSON.stringify(data));
      }
    });
  }

  async pullSettings(): Promise<void> {
    const user = this.auth.user();
    if (!user) return;
    const settingsRef = doc(db, 'users', user.uid, 'settings', 'app');
    const snap = await getDoc(settingsRef);
    if (snap.exists()) {
      const data = snap.data() as SettingsDoc;
      if (data.lastSelectedCharacter) {
        localStorage.setItem(
          'lastSelectedCharacter',
          data.lastSelectedCharacter
        );
      }
      if (typeof data.fullHeal === 'boolean') {
        localStorage.setItem('fullHeal', String(data.fullHeal));
      }
    }
  }

  private async pushCharacter(
    uid: string,
    character: Character
  ): Promise<void> {
    const ref = doc(db, 'users', uid, 'characters', character.name);
    await setDoc(
      ref,
      {
        ...character,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  private async pushSettings(
    uid: string,
    settings: Partial<SettingsDoc>
  ): Promise<void> {
    const ref = doc(db, 'users', uid, 'settings', 'app');
    await setDoc(
      ref,
      {
        ...settings,
        lastSelectedCharacter:
          localStorage.getItem('lastSelectedCharacter') || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}

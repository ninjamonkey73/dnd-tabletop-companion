import { Injectable, effect } from '@angular/core';
import { CharacterStore } from './character.store';
import { AuthService } from './auth.service';
import {
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  collection,
} from 'firebase/firestore';
import { db } from './firebase.init';
import { Character } from './character.model';
import { SyncStatusService } from './sync-status.service';

interface SettingsDoc {
  lastSelectedCharacter?: string;
  fullHeal?: boolean;
  updatedAt?: any;
}

@Injectable({ providedIn: 'root' })
export class CloudSyncService {
  private writing = false;
  private hasPulledForUid = new Set<string>(); // prevent repeated pulls per session

  constructor(
    private store: CharacterStore,
    private auth: AuthService,
    private syncStatus: SyncStatusService
  ) {
    // Push character changes
    effect(() => {
      const user = this.auth.user();
      const character = this.store.character();
      if (!user || !character.name || this.writing) return;
      this.pushCharacter(user.uid, character).catch(() => {});
    });

    // Push settings
    effect(() => {
      const user = this.auth.user();
      const fullHeal = this.store.fullHeal();
      if (!user || this.writing) return;
      this.pushSettings(user.uid, { fullHeal }).catch(() => {});
    });

    // Auto-pull once after login
    effect(() => {
      const user = this.auth.user();
      if (!user) return;
      const uid = user.uid;
      if (this.hasPulledForUid.has(uid)) return;

      Promise.all([this.pullSettings(), this.pullAllCharacters()])
        .then(() => {
          this.hasPulledForUid.add(uid);
          this.syncStatus.emitPulled();
        })
        .catch(() => {});
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

  async deleteCharacter(name: string): Promise<void> {
    const user = this.auth.user();
    if (!user || !name) return;
    await deleteDoc(doc(db, 'users', user.uid, 'characters', name));
    if (localStorage.getItem('lastSelectedCharacter') === name) {
      localStorage.removeItem('lastSelectedCharacter');
      await this.pushSettings(user.uid, { lastSelectedCharacter: undefined });
    }
  }
}

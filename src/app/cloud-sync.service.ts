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
  private pushCharTimer: any;
  private pushCharRetry = 0;
  private pushSettingsTimer: any;
  private pushSettingsRetry = 0;

  constructor(
    private store: CharacterStore,
    private auth: AuthService,
    private syncStatus: SyncStatusService
  ) {
    // Push character changes
    effect(() => {
      const user = this.auth.user();
      const character = this.store.character();
      if (!user || !character.name) return;
      this.schedulePushCharacter(user.uid, character);
    });

    // Push settings
    effect(() => {
      const user = this.auth.user();
      const fullHeal = this.store.fullHeal();
      if (!user) return;
      this.schedulePushSettings(user.uid, { fullHeal });
    });

    // Auto-pull once after login
    effect(() => {
      const user = this.auth.user();
      if (!user) return;
      const uid = user.uid;
      if (this.hasPulledForUid.has(uid)) return;

      this.pullSettings()
        .then(() => {
          this.hasPulledForUid.add(uid);
          this.syncStatus.emitPulled();
          this.syncStatus.emitStatus({ type: 'pull', status: 'ok' });
        })
        .catch((err) => {
          this.syncStatus.emitStatus({
            type: 'pull',
            status: 'error',
            message: 'Failed to pull settings',
            error: err,
          });
        });
    });
  }

  // List character names for the current user
  async listCharacterNames(): Promise<string[]> {
    const user = this.auth.user();
    if (!user) return [];
    const snap = await getDocs(collection(db, 'users', user.uid, 'characters'));
    const names: string[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as Character;
      if (data?.name) names.push(data.name);
    });
    names.sort();
    return names;
  }

  // Get a single character by name
  async getCharacter(name: string): Promise<Character | null> {
    const user = this.auth.user();
    if (!user || !name) return null;
    const ref = doc(db, 'users', user.uid, 'characters', name);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as Character;
  }

  async pullSettings(): Promise<SettingsDoc | null> {
    const user = this.auth.user();
    if (!user) return null;
    const settingsRef = doc(db, 'users', user.uid, 'settings', 'app');
    const snap = await getDoc(settingsRef);
    return snap.exists() ? (snap.data() as SettingsDoc) : null;
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

  async pushSettings(
    uid: string,
    settings: Partial<SettingsDoc>
  ): Promise<void> {
    const ref = doc(db, 'users', uid, 'settings', 'app');
    await setDoc(
      ref,
      {
        ...settings,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  async setLastSelectedCharacter(name: string | null): Promise<void> {
    const user = this.auth.user();
    if (!user) return;
    await this.pushSettings(user.uid, {
      lastSelectedCharacter: name ?? undefined,
    });
  }

  async deleteCharacter(name: string): Promise<void> {
    const user = this.auth.user();
    if (!user || !name) return;
    await deleteDoc(doc(db, 'users', user.uid, 'characters', name));
    // If the deleted was last-selected, clear it remotely
    const settings = await this.pullSettings();
    if (settings?.lastSelectedCharacter === name) {
      await this.pushSettings(user.uid, { lastSelectedCharacter: undefined });
    }
  }

  private schedulePushCharacter(uid: string, character: Character) {
    clearTimeout(this.pushCharTimer);
    this.pushCharTimer = setTimeout(
      () => this.performPushCharacter(uid, character),
      500
    );
  }

  private async performPushCharacter(uid: string, character: Character) {
    try {
      this.writing = true;
      await this.pushCharacter(uid, character);
      this.pushCharRetry = 0;
      this.syncStatus.emitStatus({ type: 'push', status: 'ok' });
    } catch (err) {
      this.syncStatus.emitStatus({
        type: 'push',
        status: 'error',
        message: 'Failed to save character',
        error: err,
      });
      if (this.pushCharRetry < 5) {
        const backoff = Math.min(16000, 500 * Math.pow(2, this.pushCharRetry));
        this.pushCharRetry++;
        setTimeout(() => this.performPushCharacter(uid, character), backoff);
      }
    } finally {
      this.writing = false;
    }
  }

  private schedulePushSettings(uid: string, settings: Partial<SettingsDoc>) {
    clearTimeout(this.pushSettingsTimer);
    this.pushSettingsTimer = setTimeout(
      () => this.performPushSettings(uid, settings),
      500
    );
  }

  private async performPushSettings(
    uid: string,
    settings: Partial<SettingsDoc>
  ) {
    try {
      this.writing = true;
      await this.pushSettings(uid, settings);
      this.pushSettingsRetry = 0;
      this.syncStatus.emitStatus({ type: 'settings', status: 'ok' });
    } catch (err) {
      this.syncStatus.emitStatus({
        type: 'settings',
        status: 'error',
        message: 'Failed to save settings',
        error: err,
      });
      if (this.pushSettingsRetry < 5) {
        const backoff = Math.min(
          16000,
          500 * Math.pow(2, this.pushSettingsRetry)
        );
        this.pushSettingsRetry++;
        setTimeout(() => this.performPushSettings(uid, settings), backoff);
      }
    } finally {
      this.writing = false;
    }
  }
}

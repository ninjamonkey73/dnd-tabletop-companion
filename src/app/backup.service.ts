import { Injectable } from '@angular/core';
import { Character } from './character.model';

interface BackupFile {
  version: number;
  timestamp: string;
  characters: Record<string, Character>;
  settings: {
    lastSelectedCharacter?: string;
    fullHeal?: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class BackupService {
  private exclude = new Set(['lastSelectedCharacter', 'fullHeal']);

  createBackup(): Blob {
    const characters: Record<string, Character> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || this.exclude.has(key)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.name) {
          characters[key] = parsed;
        }
      } catch {}
    }
    const settings = {
      lastSelectedCharacter:
        localStorage.getItem('lastSelectedCharacter') || undefined,
      fullHeal: localStorage.getItem('fullHeal') === 'true' ? true : undefined,
    };
    const backup: BackupFile = {
      version: 1,
      timestamp: new Date().toISOString(),
      characters,
      settings,
    };
    return new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
  }

  parseBackup(text: string): BackupFile | null {
    try {
      const obj = JSON.parse(text);
      if (
        !obj ||
        typeof obj.version !== 'number' ||
        typeof obj.characters !== 'object'
      )
        return null;
      return obj as BackupFile;
    } catch {
      return null;
    }
  }

  restoreBackup(data: BackupFile): void {
    Object.entries(data.characters).forEach(([name, c]) => {
      if (name && c) {
        localStorage.setItem(name, JSON.stringify(c));
      }
    });
    if (data.settings.lastSelectedCharacter) {
      localStorage.setItem(
        'lastSelectedCharacter',
        data.settings.lastSelectedCharacter
      );
    }
    if (typeof data.settings.fullHeal === 'boolean') {
      localStorage.setItem('fullHeal', String(data.settings.fullHeal));
    }
  }
}

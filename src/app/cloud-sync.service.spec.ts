import { vi } from 'vitest';

// Top-level mock for firebase/firestore
vi.mock('firebase/firestore', () => ({
  doc: vi.fn((_db, ...parts) => ({ path: parts.join('/') })),
  collection: vi.fn((_db, ...parts) => ({ path: parts.join('/') })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'MOCK_SERVER_TIMESTAMP'),
  onSnapshot: vi.fn(() => vi.fn()),
}));

import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CloudSyncService } from './cloud-sync.service';
import { CharacterStore } from './character.store';
import { AuthService } from './auth.service';
import { SyncStatusService } from './sync-status.service';
import { signal } from '@angular/core';
import { defaultCharacter } from './character.model';
import * as firestore from 'firebase/firestore';

describe('CloudSyncService', () => {
  let service: CloudSyncService;
  let store: CharacterStore;
  let mockAuth: {
    user: ReturnType<typeof signal>;
  };
  let syncStatus: SyncStatusService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockAuth = {
      user: signal<any>(null),
    };

    TestBed.configureTestingModule({
      providers: [
        CloudSyncService,
        CharacterStore,
        SyncStatusService,
        { provide: AuthService, useValue: mockAuth },
      ],
    });

    store = TestBed.inject(CharacterStore);
    syncStatus = TestBed.inject(SyncStatusService);
    service = TestBed.inject(CloudSyncService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Data Hydration & Fetching', () => {
    it('should list character names for authenticated user', async () => {
      mockAuth.user.set({ uid: 'user-123' });

      const mockDocs = [
        { data: () => ({ name: 'Thorin' }) },
        { data: () => ({ name: 'Gandalf' }) },
        { data: () => ({}) }, // missing name should be ignored
      ];
      vi.mocked(firestore.getDocs).mockResolvedValueOnce(mockDocs as any);

      const names = await service.listCharacterNames();
      expect(names).toEqual(['Gandalf', 'Thorin']);
      expect(firestore.collection).toHaveBeenCalledWith(undefined, 'users', 'user-123', 'characters');
    });

    it('should return empty list when user is not authenticated', async () => {
      mockAuth.user.set(null);
      const names = await service.listCharacterNames();
      expect(names).toEqual([]);
      expect(firestore.getDocs).not.toHaveBeenCalled();
    });

    it('should retrieve and hydrate legacy character with migrateLegacyCharacter', async () => {
      mockAuth.user.set({ uid: 'user-123' });

      // Legacy character with scalar class and level
      const legacyDocData = {
        name: 'Aragorn',
        class: 'Ranger',
        level: 5,
        currentHP: 45,
        maxHP: 45,
      };

      vi.mocked(firestore.getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => legacyDocData,
      } as any);

      const char = await service.getCharacter('Aragorn');
      expect(char).toBeDefined();
      expect(char?.name).toBe('Aragorn');
      expect(char?.classes).toEqual([{ class: 'Ranger', level: 5 }]);
    });

    it('should return null when character document does not exist', async () => {
      mockAuth.user.set({ uid: 'user-123' });
      vi.mocked(firestore.getDoc).mockResolvedValueOnce({
        exists: () => false,
      } as any);

      const char = await service.getCharacter('NonExistent');
      expect(char).toBeNull();
    });

    it('should pull settings from firestore', async () => {
      mockAuth.user.set({ uid: 'user-123' });
      vi.mocked(firestore.getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ lastSelectedCharacter: 'Legolas', fullHeal: true }),
      } as any);

      const settings = await service.pullSettings();
      expect(settings?.lastSelectedCharacter).toBe('Legolas');
      expect(settings?.fullHeal).toBe(true);
    });
  });

  describe('Character Deletion', () => {
    it('should delete character document and clear lastSelectedCharacter if matched', async () => {
      mockAuth.user.set({ uid: 'user-123' });

      // pullSettings returns that this character was last selected
      vi.mocked(firestore.getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ lastSelectedCharacter: 'Gimli' }),
      } as any);

      await service.deleteCharacter('Gimli');

      expect(firestore.deleteDoc).toHaveBeenCalled();
      // Should also clear lastSelectedCharacter in settings
      expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ lastSelectedCharacter: null }),
        { merge: true }
      );
    });
  });

  describe('Network Failure Retry & Error Handling', () => {
    it('should sanitize character data and push to firestore with serverTimestamp', async () => {
      mockAuth.user.set({ uid: 'user-123' });
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined as any);

      const emitSpy = vi.spyOn(syncStatus, 'emitStatus');

      // Trigger character change in store
      store.setCharacter({
        ...defaultCharacter,
        name: 'Frodo',
        classes: [{ class: 'Rogue', level: 3 }],
        currentHP: 20,
        maxHP: 20,
      });

      // Advance debounce timer (500ms)
      await vi.advanceTimersByTimeAsync(600);

      expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'users/user-123/characters/Frodo' }),
        expect.objectContaining({
          name: 'Frodo',
          classes: [{ class: 'Rogue', level: 3 }],
          updatedAt: 'MOCK_SERVER_TIMESTAMP',
        }),
        { merge: true }
      );

      expect(emitSpy).toHaveBeenCalledWith({ type: 'push', status: 'ok' });
    });

    it('should retry character push on network failure with exponential backoff', async () => {
      mockAuth.user.set({ uid: 'user-123' });
      const networkError = new Error('Network timeout');

      // First call fails, second call succeeds
      vi.mocked(firestore.setDoc)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(undefined as any);

      const emitSpy = vi.spyOn(syncStatus, 'emitStatus');

      store.setCharacter({
        ...defaultCharacter,
        name: 'Samwise',
        classes: [{ class: 'Fighter', level: 2 }],
      });

      // Advance debounce timer
      await vi.advanceTimersByTimeAsync(500);

      // Verify failure status was emitted
      expect(emitSpy).toHaveBeenCalledWith({
        type: 'push',
        status: 'error',
        message: 'Failed to save character',
        error: networkError,
      });

      // Advance retry timer (500ms * 2^0 = 500ms)
      await vi.advanceTimersByTimeAsync(600);

      // Verify second attempt succeeded
      expect(firestore.setDoc).toHaveBeenCalledTimes(2);
      expect(emitSpy).toHaveBeenCalledWith({ type: 'push', status: 'ok' });
    });

    it('should retry settings push on failure with backoff', async () => {
      mockAuth.user.set({ uid: 'user-123' });
      // Mock pullSettings so auto-pull effect finishes and marks hasPulledForUid
      vi.mocked(firestore.getDoc).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ lastSelectedCharacter: null, fullHeal: true }),
      } as any);

      // Allow auto-pull effect to settle
      await vi.advanceTimersByTimeAsync(100);

      const error = new Error('Firestore unavailable');
      vi.mocked(firestore.setDoc)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined as any);

      const emitSpy = vi.spyOn(syncStatus, 'emitStatus');

      // Changing fullHeal triggers the settings push effect
      store.setFullHeal(false);

      // Advance debounce timer (500ms)
      await vi.advanceTimersByTimeAsync(500);

      // Should emit error status on first failure
      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'settings', status: 'error' })
      );

      // Advance backoff time (500ms)
      await vi.advanceTimersByTimeAsync(600);

      expect(firestore.setDoc).toHaveBeenCalledTimes(2);
      expect(emitSpy).toHaveBeenCalledWith({ type: 'settings', status: 'ok' });
    });
  });
});

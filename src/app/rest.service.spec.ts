import { TestBed } from '@angular/core/testing';
import { RestService } from './rest.service';
import { CharacterStore } from './character.store';
import { defaultCharacter } from './character.model';
import { describe, it, expect, beforeEach } from 'vitest';

describe('RestService', () => {
  let service: RestService;
  let store: CharacterStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RestService);
    store = TestBed.inject(CharacterStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('shortRest resources reset', () => {
    it('should reset resource counter to the number specified in (SR:<number>)', () => {
      store.setCharacter({
        ...defaultCharacter,
        resources: [
          { id: 1, name: 'Second Wind (SR:1)', value: 0 },
          { id: 2, name: 'Action Surge (SR:2)', value: 1 },
          { id: 3, name: 'Torch', value: 5 },
          { id: 4, name: 'Maneuvers (SR: 4)', value: 1 },
          { id: 5, name: 'Long Rest Ability (LR:1)', value: 0 },
        ],
      });

      service.shortRest();

      const resources = store.character().resources;
      expect(resources.find((r) => r.id === 1)?.value).toBe(1);
      expect(resources.find((r) => r.id === 2)?.value).toBe(2);
      expect(resources.find((r) => r.id === 3)?.value).toBe(5); // untouched
      expect(resources.find((r) => r.id === 4)?.value).toBe(4);
      expect(resources.find((r) => r.id === 5)?.value).toBe(0); // untouched on short rest
    });

    it('should handle case insensitivity (sr:<number>) and ignore invalid numbers', () => {
      store.setCharacter({
        ...defaultCharacter,
        resources: [
          { id: 1, name: 'Warlock Slot (sr:2)', value: 0 },
          { id: 2, name: 'Invalid (SR:xyz)', value: 7 },
        ],
      });

      service.shortRest();

      const resources = store.character().resources;
      expect(resources.find((r) => r.id === 1)?.value).toBe(2);
      expect(resources.find((r) => r.id === 2)?.value).toBe(7);
    });

    it('should restore Monk ki points and Druid wild shape alongside resources on short rest', () => {
      store.setCharacter({
        ...defaultCharacter,
        class: 'Monk',
        level: 5,
        kiPoints: 1,
        resources: [{ id: 1, name: 'Ki Extra (SR:1)', value: 0 }],
      });

      service.shortRest();

      const character = store.character();
      expect(character.kiPoints).toBe(5);
      expect(character.resources.find((r) => r.id === 1)?.value).toBe(1);
    });
  });

  describe('longRest resources reset', () => {
    it('should reset resource counter to the number specified in (LR:<number>)', () => {
      store.setCharacter({
        ...defaultCharacter,
        resources: [
          { id: 1, name: 'Simon (LR:1)', value: 0 },
          { id: 2, name: 'Action Surge (LR:2)', value: 1 },
          { id: 3, name: 'Torch', value: 5 },
          { id: 4, name: 'Healing Potion (LR: 3)', value: 0 },
        ],
      });

      service.longRest();

      const resources = store.character().resources;
      expect(resources.find((r) => r.id === 1)?.value).toBe(1);
      expect(resources.find((r) => r.id === 2)?.value).toBe(2);
      expect(resources.find((r) => r.id === 3)?.value).toBe(5); // untouched
      expect(resources.find((r) => r.id === 4)?.value).toBe(3);
    });

    it('should handle case insensitivity (lr:<number>) and ignore invalid numbers', () => {
      store.setCharacter({
        ...defaultCharacter,
        resources: [
          { id: 1, name: 'Slot (lr:4)', value: 0 },
          { id: 2, name: 'Invalid (LR:abc)', value: 10 },
        ],
      });

      service.longRest();

      const resources = store.character().resources;
      expect(resources.find((r) => r.id === 1)?.value).toBe(4);
      expect(resources.find((r) => r.id === 2)?.value).toBe(10);
    });
  });
});

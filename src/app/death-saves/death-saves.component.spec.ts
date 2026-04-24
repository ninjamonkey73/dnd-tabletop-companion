import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeathSavesComponent } from './death-saves.component';
import { defaultCharacter } from '../character.model';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('DeathSavesComponent', () => {
  let component: DeathSavesComponent;
  let fixture: ComponentFixture<DeathSavesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeathSavesComponent],
      providers: [provideAnimationsAsync()]
    }).compileComponents();

    fixture = TestBed.createComponent(DeathSavesComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('character', { ...defaultCharacter });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle death save success correctly', () => {
    vi.spyOn(component.characterChange, 'emit');
    component.toggleDeathSave('success', 0);
    expect(component.deathSaveSuccess[0]).toBe(true);
    expect(component.characterChange.emit).toHaveBeenCalled();
  });

  it('should stabilize character after 3 successes', () => {
    component.deathSaveSuccess = [true, true, false];
    component.toggleDeathSave('success', 2); // Third success
    expect(component.character.stable).toBe(true);
    // Successes reset after stabilizing
    expect(component.deathSaveSuccess).toEqual([false, false, false]);
  });

  it('should mark character as dead after 3 failures', () => {
    component.deathSaveFailure = [true, true, false];
    component.toggleDeathSave('failure', 2); // Third failure
    expect(component.deathSaveMessage).toBe('You are dead!');
  });
});

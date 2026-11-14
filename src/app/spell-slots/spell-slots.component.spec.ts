import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpellSlotsComponent } from './spell-slots.component';
import { defaultCharacter } from '../character.model';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('SpellSlotsComponent', () => {
  let component: SpellSlotsComponent;
  let fixture: ComponentFixture<SpellSlotsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpellSlotsComponent],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(SpellSlotsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('character', {
      ...defaultCharacter,
      spellSlots: [4, 3, 2],
      spellSlotsRemaining: [2, 1, 0],
    });
    fixture.detectChanges();
  });

  it('should create and initialize slots and remaining', () => {
    expect(component).toBeTruthy();
    expect(component.slots).toEqual([4, 3, 2]);
    expect(component.remaining).toEqual([2, 1, 0]);
  });

  it('should increment remaining slot up to max', () => {
    const charChangeSpy = vi.spyOn(component.characterChange, 'emit');
    const remainingSpy = vi.spyOn(component.remainingChanged, 'emit');

    component.incSlot(0); // 2 -> 3 (max 4)
    expect(component.remaining[0]).toBe(3);
    expect(charChangeSpy).toHaveBeenCalled();
    expect(remainingSpy).toHaveBeenCalledWith({ index: 0, value: 3 });

    component.incSlot(0); // 3 -> 4 (max 4)
    expect(component.remaining[0]).toBe(4);

    component.incSlot(0); // 4 -> 4 (capped)
    expect(component.remaining[0]).toBe(4);
  });

  it('should decrement remaining slot down to 0', () => {
    const remainingSpy = vi.spyOn(component.remainingChanged, 'emit');

    component.decSlot(0); // 2 -> 1
    expect(component.remaining[0]).toBe(1);
    expect(remainingSpy).toHaveBeenCalledWith({ index: 0, value: 1 });

    component.decSlot(0); // 1 -> 0
    expect(component.remaining[0]).toBe(0);

    component.decSlot(0); // 0 -> 0 (clamped)
    expect(component.remaining[0]).toBe(0);
  });

  it('should clamp value on onRemainingCommit', () => {
    component.remaining[0] = 10;
    component.onRemainingCommit(0);
    expect(component.remaining[0]).toBe(4); // max for index 0 is 4

    component.remaining[0] = -5;
    component.onRemainingCommit(0);
    expect(component.remaining[0]).toBe(0);
  });
});

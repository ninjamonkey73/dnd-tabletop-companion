import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HitDiceComponent } from './hit-dice.component';
import { defaultCharacter } from '../character.model';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('HitDiceComponent', () => {
  let component: HitDiceComponent;
  let fixture: ComponentFixture<HitDiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HitDiceComponent],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(HitDiceComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('character', {
      ...defaultCharacter,
      hitDie: 2,
      classes: [
        { class: 'Fighter', level: 3 },
        { class: 'Wizard', level: 2 },
      ],
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute totalLevel and hitDicePool', () => {
    expect(component.totalLevel).toBe(5);
    expect(component.hitDicePool).toBe('3d10 + 2d6');
  });

  it('should increment hitDie up to totalLevel', () => {
    const emitSpy = vi.spyOn(component.characterChange, 'emit');
    component.incHitDie();
    expect(component.character().hitDie).toBe(3);
    expect(emitSpy).toHaveBeenCalled();

    // Increment up to max 5
    component.incHitDie();
    component.incHitDie();
    expect(component.character().hitDie).toBe(5);

    // Should not exceed 5
    component.incHitDie();
    expect(component.character().hitDie).toBe(5);
  });

  it('should decrement hitDie down to 0', () => {
    const emitSpy = vi.spyOn(component.characterChange, 'emit');
    component.decHitDie();
    expect(component.character().hitDie).toBe(1);
    expect(emitSpy).toHaveBeenCalled();

    component.decHitDie();
    expect(component.character().hitDie).toBe(0);

    // Should not go below 0
    component.decHitDie();
    expect(component.character().hitDie).toBe(0);
  });
});

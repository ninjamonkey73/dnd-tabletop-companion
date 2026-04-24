import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RageComponent } from './rage.component';
import { defaultCharacter } from '../character.model';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('RageComponent', () => {
  let component: RageComponent;
  let fixture: ComponentFixture<RageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RageComponent],
      providers: [provideAnimationsAsync()]
    }).compileComponents();

    fixture = TestBed.createComponent(RageComponent);
    component = fixture.componentInstance;
    // Set max rage to 3, and remaining to 1
    fixture.componentRef.setInput('character', { ...defaultCharacter, rage: 3, rageRemaining: 1 });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render remaining rage from character', () => {
    expect(component.rageRemaining).toBe(1);
  });

  it('should increment rage only up to max rage', () => {
    component.incRage(); // now 2
    component.incRage(); // now 3
    component.incRage(); // shouldn't go to 4
    expect(component.rageRemaining).toBe(3);
  });

  it('should decrement rage only down to zero', () => {
    component.decRage(); // now 0
    component.decRage(); // shouldn't go to -1
    expect(component.rageRemaining).toBe(0);
  });

  it('should emit changes when rage changes', () => {
    vi.spyOn(component.characterChange, 'emit');
    component.incRage();
    expect(component.characterChange.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        rageRemaining: 2
      })
    );
  });
});

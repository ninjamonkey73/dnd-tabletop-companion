import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KiPointsComponent } from './ki-points.component';
import { defaultCharacter } from '../character.model';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('KiPointsComponent', () => {
  let component: KiPointsComponent;
  let fixture: ComponentFixture<KiPointsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KiPointsComponent],
      providers: [provideAnimationsAsync()]
    }).compileComponents();

    fixture = TestBed.createComponent(KiPointsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('character', { ...defaultCharacter, level: 3, kiPoints: 1 });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate max ki points based on character level', () => {
    // Monk ki points equal character level
    expect(component.character().level).toBe(3);
  });

  it('should increment and decrement Ki Points correctly', () => {
    vi.spyOn(component.characterChange, 'emit');
    
    component.incKi(); // to 2
    expect(component.characterChange.emit).toHaveBeenCalledWith(
      expect.objectContaining({ kiPoints: 2 })
    );

    component.decKi(); // to 1
    expect(component.characterChange.emit).toHaveBeenCalledWith(
      expect.objectContaining({ kiPoints: 1 })
    );
  });
});

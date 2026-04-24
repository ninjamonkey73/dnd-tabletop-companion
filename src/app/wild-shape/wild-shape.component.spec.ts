import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WildShapeComponent } from './wild-shape.component';
import { defaultCharacter } from '../character.model';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('WildShapeComponent', () => {
  let component: WildShapeComponent;
  let fixture: ComponentFixture<WildShapeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WildShapeComponent],
      providers: [provideAnimationsAsync()]
    }).compileComponents();

    fixture = TestBed.createComponent(WildShapeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('character', { ...defaultCharacter, wildShapeRemaining: 1 });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should decrement wild shape when used', () => {
    vi.spyOn(component.characterChange, 'emit');
    component.decWildShape(); // 1 -> 0
    expect(component.characterChange.emit).toHaveBeenCalledWith(
      expect.objectContaining({ wildShapeRemaining: 0 })
    );
  });

  it('should increment wild shape', () => {
    vi.spyOn(component.characterChange, 'emit');
    component.incWildShape();
    expect(component.characterChange.emit).toHaveBeenCalled();
  });
});

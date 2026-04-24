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
      providers: [provideAnimationsAsync()]
    }).compileComponents();

    fixture = TestBed.createComponent(SpellSlotsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('character', { 
      ...defaultCharacter, 
      spellSlots: [4, 3, 2], 
      spellSlotsRemaining: [4, 3, 2] 
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});

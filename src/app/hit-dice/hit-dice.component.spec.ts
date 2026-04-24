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
      providers: [provideAnimationsAsync()]
    }).compileComponents();

    fixture = TestBed.createComponent(HitDiceComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('character', { ...defaultCharacter, hitDie: 2, level: 5 });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});

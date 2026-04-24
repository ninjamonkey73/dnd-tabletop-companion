import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SneakAttackComponent } from './sneak-attack.component';
import { defaultCharacter } from '../character.model';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('SneakAttackComponent', () => {
  let component: SneakAttackComponent;
  let fixture: ComponentFixture<SneakAttackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SneakAttackComponent],
      providers: [provideAnimationsAsync()]
    }).compileComponents();

    fixture = TestBed.createComponent(SneakAttackComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('character', { ...defaultCharacter, sneakAttack: 0 });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});

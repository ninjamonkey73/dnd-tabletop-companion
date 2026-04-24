import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MoneyComponent } from './money.component';
import { defaultCharacter } from '../character.model';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('MoneyComponent', () => {
  let component: MoneyComponent;
  let fixture: ComponentFixture<MoneyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoneyComponent],
      providers: [provideAnimationsAsync()]
    }).compileComponents();

    fixture = TestBed.createComponent(MoneyComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('character', { ...defaultCharacter, gp: 50, sp: 20 });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render correct initial coin values from character input', () => {
    expect(component.getCoinValue('gp')).toBe(50);
    expect(component.getCoinValue('sp')).toBe(20);
    expect(component.getCoinValue('cp')).toBe(0);
  });

  it('should adjust money positively and emit new character state', () => {
    vi.spyOn(component.characterChange, 'emit');
    component.adjustMoney('gp', 10);
    expect(component.characterChange.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        gp: 60
      })
    );
  });

  it('should not allow money to go negative', () => {
    vi.spyOn(component.characterChange, 'emit');
    component.adjustMoney('sp', -30);
    expect(component.characterChange.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        sp: 0
      })
    );
  });
});

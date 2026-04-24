import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HpComponent } from './hp.component';
import { defaultCharacter } from '../character.model';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('HpComponent', () => {
  let component: HpComponent;
  let fixture: ComponentFixture<HpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HpComponent],
      providers: [provideAnimationsAsync()]
    }).compileComponents();

    fixture = TestBed.createComponent(HpComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('character', { ...defaultCharacter, currentHP: 20, maxHP: 50 });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit heal event when applyHeal is called', () => {
    vi.spyOn(component.heal, 'emit');
    component.changeVal = 10;
    component.applyHeal();
    expect(component.heal.emit).toHaveBeenCalledWith(10);
    expect(component.changeVal).toBeNull();
  });

  it('should emit hurt event when applyHurt is called', () => {
    vi.spyOn(component.hurt, 'emit');
    component.changeVal = 15;
    component.applyHurt();
    expect(component.hurt.emit).toHaveBeenCalledWith(15);
    expect(component.changeVal).toBeNull();
  });

  it('should not emit heal/hurt events if changeVal is empty or negative', () => {
    vi.spyOn(component.heal, 'emit');
    component.changeVal = null;
    component.applyHeal();
    expect(component.heal.emit).not.toHaveBeenCalled();

    vi.spyOn(component.hurt, 'emit');
    component.changeVal = 0;
    component.applyHurt();
    expect(component.hurt.emit).not.toHaveBeenCalled();
  });
});

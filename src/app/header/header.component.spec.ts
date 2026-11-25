import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HeaderComponent } from './header.component';
import { AuthService } from '../auth.service';
import { signal } from '@angular/core';
import { defaultCharacter } from '../character.model';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    const mockAuthService = {
      user: signal(null),
      isAuthed: signal(false),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
      completeRedirectLoginIfNeeded: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        provideAnimationsAsync(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('character', {
      ...defaultCharacter,
      name: 'Test',
      classes: [{ class: 'Fighter', level: 3 }],
    });
    fixture.componentRef.setInput('classes', ['Barbarian', 'Cleric', 'Fighter', 'Wizard']);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle expansion state', () => {
    expect(component.isExpanded).toBe(false);
    component.toggleExpanded();
    expect(component.isExpanded).toBe(true);
    component.toggleExpanded();
    expect(component.isExpanded).toBe(false);
  });

  it('should calculate classSummary and totalLevel', () => {
    expect(component.totalLevel).toBe(3);
    expect(component.classSummary).toBe('Fighter 3 (Lvl 3)');
  });

  it('should detect if a class is selected in another row', () => {
    component.characterClasses.push({ class: 'Cleric', level: 2 });
    expect(component.isClassSelectedInOtherRow('fighter', 1)).toBe(true);
    expect(component.isClassSelectedInOtherRow('fighter', 0)).toBe(false);
    expect(component.isClassSelectedInOtherRow('wizard', 0)).toBe(false);
  });

  it('should calculate getMaxLevelForRow properly based on other rows', () => {
    // Current is Fighter 3. Max for Fighter is 20 - 0 = 20.
    expect(component.getMaxLevelForRow(0)).toBe(20);

    // Add Cleric 5. Total other level for Fighter is 5 => max 15.
    component.characterClasses.push({ class: 'Cleric', level: 5 });
    expect(component.getMaxLevelForRow(0)).toBe(15);
    expect(component.getMaxLevelForRow(1)).toBe(17);
  });

  describe('Subclasses and Subdomains', () => {
    it('should determine canSelectSubclass correctly based on class and level', () => {
      // Row 0 currently Fighter 3 (>= 3 -> true)
      expect(component.canSelectSubclass(0)).toBe(true);

      // Change Fighter to level 2 (< 3 -> false)
      component.characterClasses[0].level = 2;
      expect(component.canSelectSubclass(0)).toBe(false);

      // Change to Cleric 1 (>= 1 -> true)
      component.characterClasses[0].class = 'Cleric';
      component.characterClasses[0].level = 1;
      expect(component.canSelectSubclass(0)).toBe(true);

      // Change to Druid 1 (< 2 -> false), Druid 2 (>= 2 -> true)
      component.characterClasses[0].class = 'Druid';
      component.characterClasses[0].level = 1;
      expect(component.canSelectSubclass(0)).toBe(false);
      component.characterClasses[0].level = 2;
      expect(component.canSelectSubclass(0)).toBe(true);
    });

    it('should update subclass and reset subdomain on onRowSubclassChange', () => {
      const emitSpy = vi.spyOn(component.classesChanged, 'emit');
      component.characterClasses.length = 0;
      component.characterClasses.push({
        class: 'Druid',
        level: 3,
        subclass: 'circle-of-the-land',
        subdomain: 'coast',
      });

      component.onRowSubclassChange(0, 'circle-of-the-moon');
      expect(component.characterClasses[0].subclass).toBe('circle-of-the-moon');
      expect(component.characterClasses[0].subdomain).toBe('');
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should update subdomain on onRowSubdomainChange', () => {
      const emitSpy = vi.spyOn(component.classesChanged, 'emit');
      component.characterClasses.length = 0;
      component.characterClasses.push({
        class: 'Druid',
        level: 3,
        subclass: 'circle-of-the-land',
      });

      component.onRowSubdomainChange(0, 'arctic');
      expect(component.characterClasses[0].subdomain).toBe('arctic');
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should reset subclass and subdomain when onRowClassChange is called', () => {
      const emitSpy = vi.spyOn(component.classesChanged, 'emit');
      component.characterClasses.length = 0;
      component.characterClasses.push({
        class: 'Druid',
        level: 3,
        subclass: 'circle-of-the-land',
        subdomain: 'coast',
      });

      component.onRowClassChange(0, 'Wizard');
      expect(component.characterClasses[0].class).toBe('Wizard');
      expect(component.characterClasses[0].subclass).toBe('');
      expect(component.characterClasses[0].subdomain).toBe('');
      expect(emitSpy).toHaveBeenCalled();
    });
  });

  it('should add a class picking the first unselected class', () => {
    const emitSpy = vi.spyOn(component.classesChanged, 'emit');
    component.addClass();
    expect(component.characterClasses.length).toBe(2);
    // Barbarian is the first unselected from ['Barbarian', 'Cleric', 'Fighter', 'Wizard']
    expect(component.characterClasses[1]).toEqual({
      class: 'Barbarian',
      level: 1,
      subclass: '',
      subdomain: '',
    });
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should not add a class if totalLevel is 20', () => {
    fixture.componentRef.setInput('character', {
      ...defaultCharacter,
      classes: [{ class: 'Fighter', level: 20 }],
    });
    fixture.detectChanges();

    component.addClass();
    expect(component.characterClasses.length).toBe(1);
  });

  it('should clamp level on row level change', () => {
    const emitSpy = vi.spyOn(component.classesChanged, 'emit');
    component.onRowLevelChange(0, 25);
    expect(component.characterClasses[0].level).toBe(20);
    expect(emitSpy).toHaveBeenCalled();

    component.onRowLevelChange(0, -5);
    expect(component.characterClasses[0].level).toBe(1);
  });

  it('should change row level with delta', () => {
    component.changeRowLevel(0, 2);
    expect(component.characterClasses[0].level).toBe(5);

    component.changeRowLevel(0, -1);
    expect(component.characterClasses[0].level).toBe(4);
  });

  it('should remove a class row and emit', () => {
    component.addClass(); // now 2 classes
    expect(component.characterClasses.length).toBe(2);

    const emitSpy = vi.spyOn(component.classesChanged, 'emit');
    component.removeClass(1);
    expect(component.characterClasses.length).toBe(1);
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should reset single row to blank instead of deleting when only 1 class row remains', () => {
    expect(component.characterClasses.length).toBe(1);
    component.removeClass(0);
    expect(component.characterClasses.length).toBe(1);
    expect(component.characterClasses[0]).toEqual({
      class: '',
      level: 1,
      subclass: '',
      subdomain: '',
    });
  });

  it('should emit short and long rest events', () => {
    const shortSpy = vi.spyOn(component.shortRest, 'emit');
    const longSpy = vi.spyOn(component.longRest, 'emit');

    component.emitShortRest();
    expect(shortSpy).toHaveBeenCalled();

    component.emitLongRest();
    expect(longSpy).toHaveBeenCalled();
  });
});

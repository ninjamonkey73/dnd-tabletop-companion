import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpellSlotsComponent } from './spell-slots.component';

describe('SpellSlotsComponent', () => {
  let component: SpellSlotsComponent;
  let fixture: ComponentFixture<SpellSlotsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpellSlotsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpellSlotsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

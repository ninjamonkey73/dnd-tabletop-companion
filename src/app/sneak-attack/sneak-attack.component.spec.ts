import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SneakAttackComponent } from './sneak-attack.component';

describe('SneakAttackComponent', () => {
  let component: SneakAttackComponent;
  let fixture: ComponentFixture<SneakAttackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SneakAttackComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SneakAttackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

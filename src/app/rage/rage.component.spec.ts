import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RageComponent } from './rage.component';

describe('RageComponent', () => {
  let component: RageComponent;
  let fixture: ComponentFixture<RageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

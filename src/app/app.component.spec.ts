import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AuthService } from './auth.service';
import { signal } from '@angular/core';

describe('AppComponent', () => {
  beforeEach(async () => {
    const mockAuthService = {
      user: signal(null),
      isAuthed: signal(false),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
      completeRedirectLoginIfNeeded: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [{ provide: AuthService, useValue: mockAuthService }]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
  /* 
  it(`should have the 'dnd-tabletop-companion' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('dnd-tabletop-companion');
  }); */

});

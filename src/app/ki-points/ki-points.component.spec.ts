import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KiPointsComponent } from './ki-points.component';

describe('KiPointsComponent', () => {
  let component: KiPointsComponent;
  let fixture: ComponentFixture<KiPointsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KiPointsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KiPointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

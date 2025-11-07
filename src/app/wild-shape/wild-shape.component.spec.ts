import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WildShapeComponent } from './wild-shape.component';

describe('WildShapeComponent', () => {
  let component: WildShapeComponent;
  let fixture: ComponentFixture<WildShapeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WildShapeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WildShapeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

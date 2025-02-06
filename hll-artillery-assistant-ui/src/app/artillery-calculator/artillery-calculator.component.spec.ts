import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArtilleryCalculatorComponent } from './artillery-calculator.component';

describe('ArtilleryCalculatorComponent', () => {
  let component: ArtilleryCalculatorComponent;
  let fixture: ComponentFixture<ArtilleryCalculatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArtilleryCalculatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArtilleryCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

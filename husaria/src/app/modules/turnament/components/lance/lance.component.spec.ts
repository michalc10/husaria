import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanceComponent } from './lance.component';

describe('LanceComponent', () => {
  let component: LanceComponent;
  let fixture: ComponentFixture<LanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LanceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

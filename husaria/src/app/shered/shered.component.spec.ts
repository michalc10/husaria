import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SheredComponent } from './shered.component';

describe('SheredComponent', () => {
  let component: SheredComponent;
  let fixture: ComponentFixture<SheredComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SheredComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SheredComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

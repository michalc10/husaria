import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { TEST_IMPORTS, TEST_PROVIDERS } from 'src/app/testing/component-test-utils';

import { TurnamentComponent } from './turnament.component';

describe('TurnamentComponent', () => {
  let component: TurnamentComponent;
  let fixture: ComponentFixture<TurnamentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TurnamentComponent ],
      imports: [...TEST_IMPORTS, FormsModule],
      providers: TEST_PROVIDERS,
    })
    .compileComponents();

    fixture = TestBed.createComponent(TurnamentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

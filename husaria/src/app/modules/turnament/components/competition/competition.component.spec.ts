import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompetitionComponent } from './competition.component';
import { TurnamentModule } from '../../turnament.module';
import { TEST_IMPORTS, TEST_PROVIDERS } from 'src/app/testing/component-test-utils';

describe('CompetitionComponent', () => {
  let component: CompetitionComponent;
  let fixture: ComponentFixture<CompetitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...TEST_IMPORTS, TurnamentModule],
      providers: TEST_PROVIDERS,
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompetitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

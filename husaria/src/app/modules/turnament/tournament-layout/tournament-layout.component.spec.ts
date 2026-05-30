import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TournamentLayoutComponent } from './tournament-layout.component';
import { TurnamentModule } from '../turnament.module';
import { TEST_IMPORTS, TEST_PROVIDERS } from 'src/app/testing/component-test-utils';

describe('TournamentLayoutComponent', () => {
  let component: TournamentLayoutComponent;
  let fixture: ComponentFixture<TournamentLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...TEST_IMPORTS, TurnamentModule],
      providers: TEST_PROVIDERS,
    })
    .compileComponents();

    fixture = TestBed.createComponent(TournamentLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

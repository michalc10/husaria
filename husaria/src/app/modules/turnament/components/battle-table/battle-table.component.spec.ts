import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BattleTableComponent } from './battle-table.component';
import { TurnamentModule } from '../../turnament.module';
import { TEST_IMPORTS, TEST_PROVIDERS } from 'src/app/testing/component-test-utils';

describe('BattleTableComponent', () => {
  let component: BattleTableComponent;
  let fixture: ComponentFixture<BattleTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...TEST_IMPORTS, TurnamentModule],
      providers: TEST_PROVIDERS,
    })
    .compileComponents();

    fixture = TestBed.createComponent(BattleTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

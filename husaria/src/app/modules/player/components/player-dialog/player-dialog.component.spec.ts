import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerDialogComponent } from './player-dialog.component';
import { PlayerModule } from '../../player.module';
import { TEST_IMPORTS, TEST_PROVIDERS } from 'src/app/testing/component-test-utils';

describe('PlayerDialogComponent', () => {
  let component: PlayerDialogComponent;
  let fixture: ComponentFixture<PlayerDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...TEST_IMPORTS, PlayerModule],
      providers: TEST_PROVIDERS,
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { PlayerPointsService } from './playerPoints.service';
import { TEST_PROVIDERS } from 'src/app/testing/component-test-utils';

describe('playerPointsService', () => {
  let service: PlayerPointsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: TEST_PROVIDERS,
    });
    service = TestBed.inject(PlayerPointsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

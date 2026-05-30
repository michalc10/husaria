import { TestBed } from '@angular/core/testing';

import { TournamentService } from './tournament.service';
import { TEST_PROVIDERS } from 'src/app/testing/component-test-utils';

describe('TournamentService', () => {
  let service: TournamentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: TEST_PROVIDERS,
    });
    service = TestBed.inject(TournamentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { PlayerPointsService } from './playerPoints.service';

describe('playerPointsService', () => {
  let service: PlayerPointsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlayerPointsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

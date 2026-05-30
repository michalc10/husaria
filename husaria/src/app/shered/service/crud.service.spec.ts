import { TestBed } from '@angular/core/testing';

import { CrudService } from './crud.service';
import { TEST_PROVIDERS } from 'src/app/testing/component-test-utils';

describe('CrudService', () => {
  let service: CrudService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: TEST_PROVIDERS,
    });
    service = TestBed.inject(CrudService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

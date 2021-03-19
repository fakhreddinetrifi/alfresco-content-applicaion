import { TestBed } from '@angular/core/testing';

import { ZoubliService } from './zoubli.service';

describe('ZoubliService', () => {
  let service: ZoubliService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ZoubliService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

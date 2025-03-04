import { Test, TestingModule } from '@nestjs/testing';
import { LicensePlanService } from './license-plan.service';

describe('LicensePlanService', () => {
  let service: LicensePlanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LicensePlanService],
    }).compile();

    service = module.get<LicensePlanService>(LicensePlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

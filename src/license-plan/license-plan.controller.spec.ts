import { Test, TestingModule } from '@nestjs/testing';
import { LicensePlanController } from './license-plan.controller';

describe('LicensePlanController', () => {
  let controller: LicensePlanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LicensePlanController],
    }).compile();

    controller = module.get<LicensePlanController>(LicensePlanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

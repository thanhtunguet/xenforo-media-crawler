import { Test, TestingModule } from '@nestjs/testing';
import { XenforoCrawlerController } from './xenforo_crawler.controller';

describe('XenforoCrawlerController', () => {
  let controller: XenforoCrawlerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [XenforoCrawlerController],
    }).compile();

    controller = module.get<XenforoCrawlerController>(XenforoCrawlerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

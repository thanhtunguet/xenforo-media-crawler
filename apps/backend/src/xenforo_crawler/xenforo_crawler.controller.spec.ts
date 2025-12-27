import { Test, TestingModule } from '@nestjs/testing';
import { XenforoCrawlerController } from './xenforo_crawler.controller';
import { XenforoCrawlerService } from './xenforo_crawler.service';

describe('XenforoCrawlerController', () => {
  let controller: XenforoCrawlerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [XenforoCrawlerController],
      providers: [
        {
          provide: XenforoCrawlerService,
          useValue: {
            login: jest.fn(),
            listForums: jest.fn(),
            listThreads: jest.fn(),
            countThreadPages: jest.fn(),
            countPostPages: jest.fn(),
            getThread: jest.fn(),
            getThreadPosts: jest.fn(),
            syncAllThreadPosts: jest.fn(),
            downloadThreadMedia: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<XenforoCrawlerController>(XenforoCrawlerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

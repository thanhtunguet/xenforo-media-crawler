import { Test, TestingModule } from '@nestjs/testing';
import { SiteController } from './site.controller';
import { SiteService } from './site.service';
import { XenforoCrawlerService } from '../xenforo_crawler/xenforo_crawler.service';

describe('SiteController', () => {
  let controller: SiteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SiteController],
      providers: [
        {
          provide: SiteService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
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

    controller = module.get<SiteController>(SiteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

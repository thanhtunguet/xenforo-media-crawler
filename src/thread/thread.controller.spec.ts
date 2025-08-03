import { Test, TestingModule } from '@nestjs/testing';
import { ThreadController } from './thread.controller';
import { ThreadService } from './thread.service';

describe('ThreadController', () => {
  let controller: ThreadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThreadController],
      providers: [
        {
          provide: ThreadService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            getPosts: jest.fn(),
            getMedia: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ThreadController>(ThreadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

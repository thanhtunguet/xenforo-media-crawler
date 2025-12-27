import { Test, TestingModule } from '@nestjs/testing';
import { ThreadService } from './thread.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Thread } from '../_entities/Thread';
import { Post } from '../_entities/Post';

describe('ThreadService', () => {
  let service: ThreadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThreadService,
        {
          provide: getRepositoryToken(Thread),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Post),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ThreadService>(ThreadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

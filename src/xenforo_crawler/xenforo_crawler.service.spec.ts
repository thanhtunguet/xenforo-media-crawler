import { Test, TestingModule } from '@nestjs/testing';
import { XenforoCrawlerService } from './xenforo_crawler.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Site } from '../_entities/Site';
import { Forum } from '../_entities/Forum';
import { Thread } from '../_entities/Thread';
import { Post } from '../_entities/Post';
import { Media } from '../_entities/Media';
import { XenforoClientService } from './xenforo_client.service';
import { EntityManager } from 'typeorm';

describe('XenforoCrawlerService', () => {
  let service: XenforoCrawlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XenforoCrawlerService,
        {
          provide: XenforoClientService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Site),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Forum),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Thread),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Post),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Media),
          useValue: {},
        },
        {
          provide: EntityManager,
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              innerJoin: jest.fn(() => ({
                where: jest.fn(() => ({
                  andWhere: jest.fn(() => ({
                    getMany: jest.fn(),
                  })),
                  getMany: jest.fn(),
                })),
              })),
              update: jest.fn(() => ({
                set: jest.fn(() => ({
                  where: jest.fn(() => ({
                    execute: jest.fn(),
                  })),
                })),
              })),
            })),
            getTreeRepository: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<XenforoCrawlerService>(XenforoCrawlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

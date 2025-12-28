import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateThreadDto, ThreadDto, UpdateThreadDto } from './dto/thread.dto';
import { PostDto } from './dto/post.dto';
import { Thread } from '../_entities/Thread';
import { Post } from '../_entities/Post';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '../common/dto/pagination.dto';

@Injectable()
export class ThreadService {
  constructor(
    @InjectRepository(Thread)
    private threadRepository: Repository<Thread>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  // Get all threads with pagination
  async findAll(
    pagination: PaginationDto = new PaginationDto(),
    forumId?: number,
  ): Promise<PaginatedResponseDto<ThreadDto>> {
    const whereCondition: any = { deletedAt: null };
    if (forumId !== undefined) {
      whereCondition.forumId = String(forumId);
    }
    
    const [threads, totalItems] = await this.threadRepository.findAndCount({
      where: whereCondition,
      skip: pagination.skip,
      take: pagination.limit,
      order: { updatedAt: 'DESC' },
    });

    const totalPages = Math.ceil(totalItems / pagination.limit);

    return {
      items: threads.map((thread) => this.mapToThreadDto(thread)),
      meta: {
        totalItems,
        itemsPerPage: pagination.limit,
        currentPage: pagination.page,
        totalPages,
      },
    };
  }

  // Count threads
  async count(): Promise<number> {
    return this.threadRepository.count({
      where: { deletedAt: null },
    });
  }

  // Get thread by id
  async findOne(id: number): Promise<ThreadDto> {
    const thread = await this.threadRepository.findOne({
      where: { id, deletedAt: null },
    });
    if (!thread) {
      throw new NotFoundException(`Thread with ID ${id} not found`);
    }
    return this.mapToThreadDto(thread);
  }

  // Find thread by originalId
  async findByOriginalId(originalId: string): Promise<ThreadDto> {
    const thread = await this.threadRepository.findOne({
      where: { originalId, deletedAt: null },
    });
    if (!thread) {
      throw new NotFoundException(`Thread with original ID ${originalId} not found`);
    }
    return this.mapToThreadDto(thread);
  }

  // Create a new thread
  async create(createThreadDto: CreateThreadDto): Promise<ThreadDto> {
    const thread = this.threadRepository.create({
      name: createThreadDto.title,
      description: createThreadDto.content,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncAt: null,
    });

    const savedThread = await this.threadRepository.save(thread);
    return this.mapToThreadDto(savedThread);
  }

  // Update a thread
  async update(
    id: number,
    updateThreadDto: UpdateThreadDto,
  ): Promise<ThreadDto> {
    const thread = await this.getThreadEntityById(id);

    if (updateThreadDto.title) {
      thread.name = updateThreadDto.title;
    }

    if (updateThreadDto.content) {
      thread.description = updateThreadDto.content;
    }

    thread.updatedAt = new Date();

    const updatedThread = await this.threadRepository.save(thread);
    return this.mapToThreadDto(updatedThread);
  }

  // Delete a thread (soft delete)
  async remove(id: number): Promise<void> {
    const thread = await this.getThreadEntityById(id);
    thread.deletedAt = new Date();
    await this.threadRepository.save(thread);
  }

  // Find thread posts with pagination
  async findThreadPosts(
    threadId: number,
    pagination: PaginationDto = new PaginationDto(),
  ): Promise<PaginatedResponseDto<PostDto>> {
    // Check if thread exists
    await this.getThreadEntityById(threadId);

    const [posts, totalItems] = await this.postRepository.findAndCount({
      where: { thread: { id: threadId }, deletedAt: null },
      skip: pagination.skip,
      take: pagination.limit,
      order: { createdAt: 'ASC' },
    });

    const totalPages = Math.ceil(totalItems / pagination.limit);

    return {
      items: posts.map((post) => this.mapToPostDto(post)),
      meta: {
        totalItems,
        itemsPerPage: pagination.limit,
        currentPage: pagination.page,
        totalPages,
      },
    };
  }

  // Helper methods for entity to DTO mapping
  private mapToThreadDto(thread: Thread): ThreadDto {
    const threadDto = new ThreadDto();
    threadDto.id = thread.id;
    threadDto.title = thread.name || '';
    threadDto.content = thread.description || '';
    threadDto.createdAt = thread.createdAt;
    threadDto.updatedAt = thread.updatedAt;
    threadDto.lastSyncAt = thread.lastSyncAt;
    threadDto.originalId = thread.originalId;
    return threadDto;
  }

  private mapToPostDto(post: Post): PostDto {
    const postDto = new PostDto();
    postDto.id = post.id;
    postDto.threadId = post.thread?.id;
    postDto.content = post.content;
    postDto.createdAt = post.createdAt;
    return postDto;
  }

  // Helper method to get thread entity by id
  private async getThreadEntityById(id: number): Promise<Thread> {
    const thread = await this.threadRepository.findOne({
      where: { id, deletedAt: null },
    });
    if (!thread) {
      throw new NotFoundException(`Thread with ID ${id} not found`);
    }
    return thread;
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from '../_entities/Media';
import { MediaResponseDto } from './dto/media-response.dto';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
  ) {}

  async findByThreadId(threadId: number): Promise<MediaResponseDto[]> {
    const mediaItems = await this.mediaRepository
      .createQueryBuilder('media')
      .innerJoin('media.post', 'post')
      .where('post.threadId = :threadId', { threadId })
      .andWhere('media.deletedAt IS NULL')
      .orderBy('media.createdAt', 'ASC')
      .getMany();

    return mediaItems.map((media) => this.mapToDto(media));
  }

  async findByThreadIdAndType(
    threadId: number,
    mediaTypeId: number,
  ): Promise<MediaResponseDto[]> {
    let query = this.mediaRepository
      .createQueryBuilder('media')
      .innerJoin('media.post', 'post')
      .where('post.threadId = :threadId', { threadId })
      .andWhere('media.deletedAt IS NULL');

    if (mediaTypeId !== 0) {
      query = query.andWhere('media.mediaTypeId = :mediaTypeId', {
        mediaTypeId,
      });
    }

    const mediaItems = await query.orderBy('media.createdAt', 'ASC').getMany();

    return mediaItems.map((media) => this.mapToDto(media));
  }

  private mapToDto(media: Media): MediaResponseDto {
    return {
      id: media.id,
      postId: media.postId,
      mediaTypeId: media.mediaTypeId,
      originalId: media.originalId,
      caption: media.caption,
      url: media.url,
      thumbnailUrl: media.thumbnailUrl,
      filename: media.filename,
      isDownloaded: media.isDownloaded,
      localPath: media.localPath,
      mimeType: media.mimeType,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
    };
  }
}


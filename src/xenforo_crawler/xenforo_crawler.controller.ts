import {
  Body,
  Controller,
  Get,
  Post as HttpPost,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import * as Entities from 'src/_entities';
import { ForumResponseDto } from 'src/site/dto/forum-response.dto';
import { MediaTypeEnum } from 'src/types/media_type';
import {
  ListThreadPayloadDto,
  ThreadPayloadDto,
} from './dtos/list-thread-payload.dto';
import { XenforoBasePayloadDto } from './dtos/xenforo_base_payload.dto';
import { XenforoLoginDto } from './dtos/xenforo_login.dto';
import { XenforoCrawlerService } from './xenforo_crawler.service';

@ApiTags('Xenforo Crawler')
@Controller('/api/xenforo-crawler')
export class XenforoCrawlerController {
  constructor(private readonly xenforoCrawlerService: XenforoCrawlerService) {}

  @HttpPost('/login')
  @ApiBody({
    type: XenforoLoginDto,
  })
  @ApiResponse({
    type: String,
  })
  public async login(
    @Req() req: Request,
    @Res() res: Response,
    @Body('username') username: string,
    @Body('password') password: string,
    @Body('siteUrl') siteUrl: string,
  ): Promise<void> {
    try {
      const response = await this.xenforoCrawlerService.login(
        username,
        password,
        siteUrl,
        res,
      );
      res.header('content-type', response.headers['content-type']);
      res.status(200).json(response.data);
    } catch (error) {
      console.log(error);
      res.status(500).end(error?.response.data);
    }
  }

  @Get('/list-forums')
  @ApiQuery({
    type: XenforoBasePayloadDto,
  })
  @ApiResponse({
    type: [ForumResponseDto],
  })
  public async listForums(
    @Req() req: Request,
    @Res() res: Response,
    @Query('siteId') siteId: number,
  ): Promise<void> {
    await this.xenforoCrawlerService
      .listForums(siteId)
      .then((forums) => {
        res.status(200).json(forums);
      })
      .catch((error) => {
        res.status(500).end(error?.response.data);
      });
  }

  @ApiQuery({
    type: ListThreadPayloadDto,
  })
  @ApiResponse({
    type: [Entities.Thread],
  })
  @Get('/list-threads')
  public listThreads(
    @Query('siteId') siteId: number,
    @Query('forumId') forumId: number,
    @Query('page') page: number,
  ) {
    return this.xenforoCrawlerService.listThreads(siteId, forumId, page);
  }

  @ApiQuery({
    type: ThreadPayloadDto,
  })
  @ApiResponse({
    type: Number,
  })
  @Get('/count-threads')
  public countThreads(
    @Query('siteId') siteId: number,
    @Query('forumId') forumId: number,
  ) {
    return this.xenforoCrawlerService.countThreadPages(siteId, forumId);
  }

  @ApiQuery({
    name: 'siteId',
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'threadId',
    type: Number,
    required: true,
  })
  @ApiResponse({
    type: Number,
  })
  @Get('/count-post-pages')
  public countPostPages(
    @Query('siteId') siteId: number,
    @Query('threadId') threadId: number,
  ) {
    return this.xenforoCrawlerService.countPostPages(siteId, threadId);
  }

  @ApiQuery({
    name: 'siteId',
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'threadId',
    type: Number,
    required: true,
  })
  @ApiResponse({
    type: Entities.Thread,
  })
  @Get('/get-thread')
  public getThread(
    @Query('siteId') siteId: number,
    @Query('threadId') threadId: number,
  ) {
    return this.xenforoCrawlerService.getThread(siteId, threadId);
  }

  @ApiQuery({
    name: 'siteId',
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'threadId',
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Page number, defaults to 1',
  })
  @ApiResponse({
    type: [Entities.Post],
  })
  @Get('/get-thread-posts')
  public getThreadPosts(
    @Query('siteId') siteId: number,
    @Query('threadId') threadId: number,
    @Query('page') page: number = 1,
    @Req() req: Request,
  ) {
    return this.xenforoCrawlerService.getThreadPosts(
      siteId,
      threadId,
      page,
      req,
    );
  }

  @ApiQuery({
    name: 'siteId',
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'threadId',
    type: Number,
    required: true,
  })
  @ApiResponse({
    type: String,
    description: 'Success message',
  })
  @HttpPost('/sync-thread-posts')
  public async syncThreadPosts(
    @Query('siteId') siteId: number,
    @Query('threadId') threadId: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      await this.xenforoCrawlerService.syncAllThreadPosts(
        siteId,
        threadId,
        req,
      );
      res.status(200).json({ message: `Synced thread with ID: ${threadId}` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  @ApiQuery({
    name: 'siteId',
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'threadId',
    type: Number,
    required: true,
  })
  @ApiQuery({
    name: 'mediaTypeId',
    type: Number,
    required: false,
    description:
      'Media type to download (0=all, 1=image, 2=video, 3=link), defaults to 0',
    enum: MediaTypeEnum,
  })
  @ApiResponse({
    type: String,
    description: 'Download process initiated',
  })
  @HttpPost('/download-thread-media')
  public downloadThreadMedia(
    @Query('siteId') siteId: number,
    @Query('threadId') threadId: number,
    @Query('mediaTypeId') mediaTypeId: MediaTypeEnum = MediaTypeEnum.all,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      // Start the download process without awaiting its completion
      // Pass the request object to have access to cookies
      this.xenforoCrawlerService
        .downloadThreadMedia(siteId, threadId, mediaTypeId, req)
        .then((stats) => {
          console.log(
            `Download completed for thread ${threadId}. Results:`,
            stats,
          );
        })
        .catch((error) => {
          console.error(
            `Error downloading media for thread ${threadId}:`,
            error.message,
          );
        });

      // Return success message immediately
      res.status(200).json({
        message: `Download process triggered for thread ID: ${threadId}`,
        mediaType: MediaTypeEnum[mediaTypeId] || 'all',
        authenticated: !!req.headers.cookie, // Indicate if request is authenticated
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

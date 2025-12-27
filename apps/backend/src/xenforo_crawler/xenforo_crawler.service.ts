import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { load } from 'cheerio';
import type { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as Entities from 'src/_entities';
import type { ForumResponseDto } from 'src/site/dto/forum-response.dto';
import { MediaTypeEnum } from 'src/types/media_type';
import type { EntityManager, Repository } from 'typeorm';
import { XenforoClientService } from './xenforo_client.service';
import { Response } from 'express';

@Injectable()
export class XenforoCrawlerService {
  constructor(
    private readonly xenforoClientService: XenforoClientService,
    @InjectRepository(Entities.Forum)
    private readonly forumRepository: Repository<Entities.Forum>,
    @InjectRepository(Entities.Site)
    private readonly siteRepository: Repository<Entities.Site>,
    @InjectRepository(Entities.Thread)
    private readonly threadRepository: Repository<Entities.Thread>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  public async login(
    username: string,
    password: string,
    siteId: number,
    res?: Response,
  ) {
    const site = await this.siteRepository.findOne({
      where: { id: siteId },
    });
    const siteUrl = site?.url;
    return this.xenforoClientService.login(username, password, res, siteUrl);
  }

  public async loginWithCookie(siteId: number, res?: Response) {
    const site = await this.siteRepository.findOne({
      where: { id: siteId },
    });
    const siteUrl = site?.url;
    return this.xenforoClientService.loginWithCookie(res, siteUrl);
  }

  public async listForums(siteId: number): Promise<ForumResponseDto[]> {
    try {
      const site = await this.siteRepository.findOne({
        where: { id: siteId },
      });
      const siteUrl = site?.url;
      const response = await this.xenforoClientService.get('/', {
        baseURL: siteUrl,
      });
      const $ = load(response.data);
      const forums: ForumResponseDto[] = [];

      $('.node.node--forum .node-body .node-title a').each(
        function (_, element) {
          const href = $(this).attr('href');
          if (href?.startsWith('/forums/')) {
            const forumName = $(element).text().trim();
            const forumUrl = new URL(href, siteUrl).href;

            if (forumUrl) {
              forums.push({
                originalId: forumUrl.replace(/^(.*)\/([0-9]+)\/$/gi, '$2'),
                name: forumName,
                siteId,
                originalUrl: forumUrl,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
          }
        },
      );
      await this.forumRepository
        .upsert(forums, ['originalId', 'siteId'])
        .then(() => {
          console.log('Forums upserted successfully');
        });
      return forums;
    } catch (error) {
      console.error('Error fetching forums:', error);
      throw error;
    }
  }

  public async listThreads(
    siteId: number,
    forumSystemId: number,
    forumOriginalId: number,
    pageId = 1,
  ): Promise<Entities.Thread[]> {
    try {
      const site = await this.siteRepository.findOne({
        where: { id: Number(siteId) },
      });
      const siteUrl = site?.url;
      
      // Use originalId for API calls
      const response = await this.xenforoClientService.get(
        `/forums/${forumOriginalId}/page-${pageId}/`,
        {
          baseURL: siteUrl,
        },
      );
      const $ = load(response.data);
      const threads: Entities.Thread[] = [];

      $('.structItem-title a[data-xf-init="preview-tooltip"]').each(
        (_, element) => {
          const href = $(element).attr('href');

          const threadName = $(element).text().trim();
          const threadUrl = new URL(href, siteUrl).href;

          if (threadUrl) {
            let originalId = threadUrl.replace(/^(.*)\/([0-9]+)\/$/gi, '$2');

            if (originalId.startsWith('thread-')) {
              originalId = originalId.replace('thread-', '');
            }

            if (!isNaN(Number(originalId))) {
              threads.push({
                id: 0,
                description: '',
                originalId: originalId,
                name: threadName,
                forumId: String(forumSystemId), // Use system id for foreign key
                originalUrl: threadUrl,
                createdAt: new Date(),
                updatedAt: new Date(),
                lastMessage: '',
              });
            }
          }
        },
      );
      await this.threadRepository.upsert(threads, ['originalId', 'forumId']);
      return threads;
    } catch (error) {
      console.error('Error fetching threads:', error);
      throw error;
    }
  }

  public async countThreadPages(
    siteId: number,
    forumOriginalId: number,
  ): Promise<number> {
    try {
      const site = await this.siteRepository.findOne({
        where: { id: Number(siteId) },
      });
      const siteUrl = site?.url;
      // Use originalId for API calls
      const response = await this.xenforoClientService.get(
        `/forums/${forumOriginalId}/`,
        {
          baseURL: siteUrl,
        },
      );
      const $ = load(response.data);

      const lastPageEl = $('a.pageNavSimple-el.pageNavSimple-el--last');
      if (lastPageEl.length) {
        const lastPageHref = lastPageEl.attr('href');
        if (lastPageHref) {
          const pageNumberMatch = lastPageHref.match(
            /\/forums\/\d+\/page-(\d+)/,
          );
          if (pageNumberMatch && pageNumberMatch[1]) {
            return parseInt(pageNumberMatch[1], 10);
          }
        }
      }

      const threadsOnPage = $(
        '.structItem-title a[data-xf-init="preview-tooltip"]',
      ).length;
      return threadsOnPage;
    } catch (error) {
      console.error('Error counting threads:', error);
      throw error;
    }
  }

  public async syncAllThreads(siteId: number, forumId: number) {
    const site = await this.siteRepository.findOne({
      where: { id: Number(siteId) },
    });
    if (!site) {
      throw new Error(`Site with ID ${siteId} not found`);
    }
    
    // Find forum by system id to get originalId for API calls
    const forum = await this.forumRepository.findOne({
      where: { id: Number(forumId), siteId: Number(siteId) },
    });
    
    if (!forum) {
      throw new Error(`Forum with ID ${forumId} not found`);
    }
    
    if (!forum.originalId) {
      throw new Error(`Forum with ID ${forumId} has no originalId`);
    }
    
    // Use originalId for API calls, system id for database
    const forumOriginalId = Number(forum.originalId);
    const count = await this.countThreadPages(siteId, forumOriginalId);
    for (let i = 1; i <= count; i++) {
      await this.listThreads(siteId, Number(forumId), forumOriginalId, i);
    }
  }

  public async syncAllForumsAndThreads(siteId: number): Promise<void> {
    const site = await this.siteRepository.findOne({
      where: { id: Number(siteId) },
    });
    if (!site) {
      throw new Error(`Site with ID ${siteId} not found`);
    }

    console.log(`Starting sync for site: ${site.url} (ID: ${siteId})`);

    const forums = await this.listForums(siteId);
    console.log(`Found ${forums.length} forums to sync`);

    for (const forum of forums) {
      if (!forum.id) {
        console.log(
          `Skipping forum ${forum.name} - not saved to database yet`,
        );
        continue;
      }
      console.log(
        `Syncing threads for forum: ${forum.name} (System ID: ${forum.id}, Original ID: ${forum.originalId})`,
      );
      await this.syncAllThreads(siteId, Number(forum.id));
    }

    console.log(`Completed sync for site ID: ${siteId}`);
  }

  public async countPostPages(
    siteId: number,
    threadId: number,
  ): Promise<number> {
    try {
      const site = await this.siteRepository.findOne({
        where: { id: Number(siteId) },
      });
      const siteUrl = site?.url;

      // Get thread to use originalId for API call
      const thread = await this.getThread(siteId, threadId);
      if (!thread.originalId) {
        throw new Error(`Thread with ID ${threadId} has no originalId`);
      }

      const response = await this.xenforoClientService.get(
        `/threads/${thread.originalId}/`,
        {
          baseURL: siteUrl,
        },
      );
      const $ = load(response.data);

      const lastPageEl = $('a.pageNav-jump--prev + a.pageNav-jump');
      if (lastPageEl.length) {
        const lastPageText = lastPageEl.text().trim();
        if (lastPageText && !isNaN(parseInt(lastPageText, 10))) {
          return parseInt(lastPageText, 10);
        }
      }

      const pageLinks = $('.pageNav-page');
      if (pageLinks.length) {
        const pageNumbers = [];
        pageLinks.each((_, element) => {
          const pageNum = parseInt($(element).text().trim(), 10);
          if (!isNaN(pageNum)) {
            pageNumbers.push(pageNum);
          }
        });

        if (pageNumbers.length > 0) {
          return Math.max(...pageNumbers);
        }
      }

      return 1;
    } catch (error) {
      console.error('Error counting thread pages:', error);
      throw error;
    }
  }

  public async getThread(
    siteId: number,
    threadId: number,
  ): Promise<Entities.Thread> {
    const site = await this.siteRepository.findOne({
      where: { id: Number(siteId) },
    });
    if (!site) {
      throw new Error(`Site with ID ${siteId} not found`);
    }

    // First try to find by database ID
    let thread = await this.threadRepository.findOne({
      where: { id: Number(threadId) },
    });

    // If not found by database ID, try to find by originalId
    if (!thread) {
      let cleanThreadId = String(threadId);
      if (cleanThreadId.startsWith('thread-')) {
        cleanThreadId = cleanThreadId.replace('thread-', '');
      }

      thread = await this.threadRepository.findOne({
        where: { originalId: cleanThreadId },
      });
    }

    if (!thread) {
      throw new Error(`Thread with ID ${threadId} not found`);
    }

    return thread;
  }

  public async getThreadPosts(
    siteId: number,
    threadId: number,
    pageId = 1,
    req?: Request,
  ): Promise<Entities.Post[]> {
    try {
      const site = await this.siteRepository.findOne({
        where: { id: Number(siteId) },
      });
      const siteUrl = site?.url;

      const thread = await this.getThread(siteId, threadId);
      if (!thread.originalId) {
        throw new Error(`Thread with ID ${threadId} has no originalId`);
      }

      // Set request config with cookies if available
      const config: any = {
        baseURL: siteUrl,
      };

      // Pass cookies from request object if provided
      if (req && req.headers.cookie) {
        console.log('req.headers.cookie', req.headers.cookie);
        config.headers = {
          cookie: req.headers.cookie,
        };
      }

      const url =
        pageId > 1
          ? `/threads/${thread.originalId}/page-${pageId}`
          : `/threads/${thread.originalId}/`;

      const response = await this.xenforoClientService.get(url, config);

      const $ = load(response.data);
      const posts: Entities.Post[] = [];

      $('article.message').each((_, element) => {
        const postIdRaw =
          $(element).attr('data-content') || $(element).attr('id') || '';

        let originalId = postIdRaw;
        if (postIdRaw.startsWith('post-')) {
          originalId = postIdRaw.replace('post-', '');
        } else if (postIdRaw.startsWith('thread-')) {
          originalId = postIdRaw.replace('thread-', '');
        }

        if (!originalId || isNaN(Number(originalId))) return;

        const username = $(element).find('.message-name').text().trim();
        const userId = $(element)
          .find('.message-userInfo')
          .attr('data-user-id');

        const contentElement = $(element).find('.message-content .bbWrapper');
        const content = contentElement.html() || '';

        const post: Entities.Post = {
          id: 0,
          threadId: thread.id,
          username,
          userId: userId || null,
          content,
          parentId: null,
          originalId: originalId,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          media: [],
          thread: thread,
        };

        const mediaItems: Entities.Media[] = [];

        // Extract normal inline images
        contentElement.find('img.bbImage').each((_, imgElement) => {
          const url = $(imgElement).attr('src') || '';
          const alt = $(imgElement).attr('alt') || null;

          if (url) {
            mediaItems.push({
              id: 0,
              postId: 0,
              mediaTypeId: 1,
              originalId: null,
              caption: alt,
              url,
              thumbnailUrl: url,
              filename: url.split('/').pop() || null,
              isDownloaded: false,
              localPath: null,
              mimeType: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: null,
              post: null,
            });
          }
        });

        // Extract videos
        contentElement.find('video source').each((_, videoElement) => {
          const url = $(videoElement).attr('src') || '';
          const mimeType = $(videoElement).attr('type') || null;

          if (url) {
            mediaItems.push({
              id: 0,
              postId: 0,
              mediaTypeId: 2,
              originalId: null,
              caption: null,
              url,
              thumbnailUrl: null,
              filename: url.split('/').pop() || null,
              isDownloaded: false,
              localPath: null,
              mimeType,
              createdAt: new Date(),
              updatedAt: new Date(),
              deletedAt: null,
              post: null,
            });
          }
        });

        // Extract attachment lists (images in attachment galleries)
        $(element)
          .find('.attachmentList .file--linked')
          .each((_, attachmentElement) => {
            const attachmentLink = $(attachmentElement).find('a.file-preview');
            const fullSizeUrl = attachmentLink.attr('href') || '';

            // Get the full URL (handle both absolute and relative URLs)
            let imageUrl = fullSizeUrl;
            if (fullSizeUrl && fullSizeUrl.startsWith('/')) {
              imageUrl = new URL(fullSizeUrl, siteUrl).href;
            }

            // Get the thumbnail for reference
            const thumbnailImg = $(attachmentElement).find('img');
            const thumbnailSrc = thumbnailImg.attr('src') || '';
            let thumbnailUrl = thumbnailSrc;
            if (thumbnailSrc && thumbnailSrc.startsWith('/')) {
              thumbnailUrl = new URL(thumbnailSrc, siteUrl).href;
            }

            // Get caption/filename
            const fileName = $(attachmentElement)
              .find('.file-name')
              .text()
              .trim();
            const originalId =
              attachmentLink
                .find('a.u-anchorTarget')
                .attr('id')
                ?.replace('attachment-', '') || null;

            if (imageUrl) {
              mediaItems.push({
                id: 0,
                postId: 0,
                mediaTypeId: 1, // Image type
                originalId: originalId,
                caption: fileName || null,
                url: imageUrl,
                thumbnailUrl: thumbnailUrl,
                filename: fileName || imageUrl.split('/').pop() || null,
                isDownloaded: false,
                localPath: null,
                mimeType: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
                post: null,
              });
            }
          });

        // Extract links
        contentElement.find('a').each((_, linkElement) => {
          const url = $(linkElement).attr('href') || '';
          const caption = $(linkElement).text().trim();

          if (
            url &&
            !url.startsWith('#') &&
            !url.startsWith('/') &&
            !url.includes(siteUrl)
          ) {
            const isImageLink = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url);
            const isVideoLink = /\.(mp4|webm|ogg|avi|mov)(\?.*)?$/i.test(url);

            if (isImageLink || isVideoLink) {
              let mediaTypeId = 3; // Default to link
              if (isImageLink) {
                mediaTypeId = 1;
              } else if (isVideoLink) {
                mediaTypeId = 2;
              }

              mediaItems.push({
                id: 0,
                postId: 0,
                mediaTypeId,
                originalId: null,
                caption,
                url,
                thumbnailUrl: null,
                filename: null,
                isDownloaded: false,
                localPath: null,
                mimeType: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
                post: null,
              });
            }
          }
        });

        posts.push(post);

        post['_media'] = mediaItems;
      });

      const savedPosts: Entities.Post[] = [];

      for (const post of posts) {
        const mediaItems = post['_media'] as Entities.Media[];
        delete post['_media'];

        const existingPost = await this.entityManager.findOne(Entities.Post, {
          where: { threadId: thread.id, originalId: post.originalId },
        });

        if (existingPost) {
          existingPost.content = post.content;
          existingPost.updatedAt = new Date();
          await this.entityManager.save(Entities.Post, existingPost);
          existingPost.media = [];
          savedPosts.push(existingPost);

          // Process media items for this post
          for (const media of mediaItems) {
            if (!media.url) continue; // Skip media without URL

            media.postId = existingPost.id;
            // Use upsert to prevent duplicates based on postId and url
            await this.entityManager
              .createQueryBuilder()
              .insert()
              .into(Entities.Media)
              .values({
                ...media,
                post: undefined, // Remove circular reference for insert
              })
              .orUpdate(
                ['caption', 'thumbnailUrl', 'updatedAt'],
                ['postId', 'url'],
              )
              .execute();

            // Query the media after upsert to add to the post's media collection
            const savedMedia = await this.entityManager.findOne(
              Entities.Media,
              {
                where: { postId: existingPost.id, url: media.url },
              },
            );

            if (savedMedia) {
              existingPost.media.push(savedMedia);
            }
          }
        } else {
          const savedPost = await this.entityManager.save(Entities.Post, post);
          savedPost.media = [];
          savedPosts.push(savedPost);

          // Process media items for this post
          for (const media of mediaItems) {
            if (!media.url) continue; // Skip media without URL

            media.postId = savedPost.id;
            // Use upsert to prevent duplicates based on postId and url
            await this.entityManager
              .createQueryBuilder()
              .insert()
              .into(Entities.Media)
              .values({
                ...media,
                post: undefined, // Remove circular reference for insert
              })
              .orUpdate(
                ['caption', 'thumbnailUrl', 'updatedAt'],
                ['postId', 'url'],
              )
              .execute();

            // Query the media after upsert to add to the post's media collection
            const savedMedia = await this.entityManager.findOne(
              Entities.Media,
              {
                where: { postId: savedPost.id, url: media.url },
              },
            );

            if (savedMedia) {
              savedPost.media.push(savedMedia);
            }
          }
        }
      }

      return savedPosts;
    } catch (error) {
      console.error('Error fetching thread posts:', error);
      throw error;
    }
  }

  public async syncAllThreadPosts(
    threadId: number,
    req?: Request,
  ): Promise<void> {
    try {
      // Get thread with forum relation to access siteId
      const thread = await this.threadRepository.findOne({
        where: { id: Number(threadId) },
        relations: ['forum'],
      });

      if (!thread) {
        throw new Error(`Thread with ID ${threadId} not found`);
      }

      if (!thread.forum) {
        throw new Error(`Thread with ID ${threadId} has no associated forum`);
      }

      const siteId = thread.forum.siteId;

      if (!thread.originalId) {
        throw new Error(`Thread with ID ${threadId} has no originalId`);
      }
      console.log(`Starting sync for thread: ${thread.name} (originalId: ${thread.originalId})`);

      // Use originalId for all API operations
      const pageCount = await this.countPostPages(siteId, threadId);
      console.log(`Thread has ${pageCount} pages to sync`);

      for (let page = 1; page <= pageCount; page++) {
        console.log(`Syncing page ${page} of ${pageCount}`);
        const posts = await this.getThreadPosts(siteId, threadId, page, req);
        console.log(`Synced ${posts.length} posts from page ${page}`);

        await new Promise((resolve) => setTimeout(resolve, 75));
      }

      console.log(`Completed sync for thread originalId: ${thread.originalId}`);
    } catch (error) {
      console.error(`Error syncing thread ${threadId}:`, error);
      throw error;
    }
  }

  public async downloadThreadMedia(
    threadId: number,
    mediaTypeId: MediaTypeEnum = MediaTypeEnum.all,
    req?: Request,
  ): Promise<{
    total: number;
    downloaded: number;
    failed: number;
    skipped: number;
  }> {
    try {
      // Get thread with forum relation to access siteId
      const thread = await this.threadRepository.findOne({
        where: { id: Number(threadId) },
        relations: ['forum'],
      });

      if (!thread) {
        throw new Error(`Thread with ID ${threadId} not found`);
      }

      if (!thread.forum) {
        throw new Error(`Thread with ID ${threadId} has no associated forum`);
      }

      const siteId = thread.forum.siteId;

      console.log(
        `Starting media download for thread: ${thread.name} (ID: ${thread.id})`,
      );

      // Create download directories
      const downloadDir = path.resolve(
        `./downloads/thread-${thread.originalId}`,
      );
      const thumbnailDir = path.resolve(
        `./downloads/thread-${thread.originalId}/thumbnails`,
      );

      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      }

      // Find all media for this thread's posts
      let mediaQuery = this.entityManager
        .createQueryBuilder(Entities.Media, 'media')
        .innerJoin('media.post', 'post')
        .where('post.threadId = :threadId', { threadId: thread.id });

      // Filter by media type if specified
      if (mediaTypeId !== MediaTypeEnum.all) {
        mediaQuery = mediaQuery.andWhere('media.mediaTypeId = :mediaTypeId', {
          mediaTypeId,
        });
      }

      const mediaItems = await mediaQuery.getMany();

      console.log(`Found ${mediaItems.length} media items to process`);

      // Download stats
      const stats = {
        total: mediaItems.length,
        downloaded: 0,
        failed: 0,
        skipped: 0,
      };

      // Skip external links (mediaTypeId=3) as they are not direct media files
      const filteredMedia = mediaItems.filter(
        (media) => media.mediaTypeId !== MediaTypeEnum.link,
      );

      if (filteredMedia.length < mediaItems.length) {
        stats.skipped += mediaItems.length - filteredMedia.length;
        console.log(
          `Skipping ${mediaItems.length - filteredMedia.length} external links`,
        );
      }

      // Get unique media URLs to avoid duplicate downloads
      const uniqueMediaUrls = [
        ...new Set(filteredMedia.map((media) => media.url)),
      ];
      console.log(
        `Found ${uniqueMediaUrls.length} unique media items to download`,
      );

      stats.total = uniqueMediaUrls.length;

      // Get site URL for config
      const site = await this.siteRepository.findOne({
        where: { id: Number(siteId) },
      });
      const siteUrl = site?.url;

      // Set request config with cookies if available
      const config: any = {
        baseURL: siteUrl,
        responseType: 'stream',
      };

      config.headers = {
        ...(config.headers ?? {}),
        Referer: siteUrl,
      };

      // Pass cookies from request object if provided
      if (req && req.headers.cookie) {
        config.headers = {
          Cookie: req.headers.cookie,
        };
        console.log('Using authentication cookies from request');
      }

      // Download each unique media file
      for (const mediaUrl of uniqueMediaUrls) {
        // Find all media items with this URL to update them all
        const mediaItemsWithUrl = filteredMedia.filter((m) => m.url === mediaUrl);
        if (mediaItemsWithUrl.length === 0) continue;

        // Use the first media item for the download process
        const media = mediaItemsWithUrl[0];

        try {
          // Check if media is already downloaded and file exists on disk
          if (media.isDownloaded && media.localPath) {
            const fileExists = fs.existsSync(media.localPath);
            if (fileExists) {
              console.log(
                `Media ${media.id} already downloaded to ${media.localPath}, skipping`,
              );
              stats.skipped++;
              continue;
            } else {
              // File was deleted but database still says downloaded - reset status
              console.log(
                `Media ${media.id} marked as downloaded but file missing at ${media.localPath}, will re-download`,
              );
              await this.entityManager.update(
                Entities.Media,
                { id: media.id },
                {
                  isDownloaded: false,
                  localPath: null,
                  updatedAt: new Date(),
                },
              );
            }
          }

          // Get filename from URL if not present
          const filename =
            media.filename ||
            media.url.split('/').pop()?.split('?')[0] ||
            `media_${media.id}_${Date.now()}`;

          const filePath = path.join(downloadDir, filename);

          // Use the full URL for download
          const fullMediaUrl = media.url.startsWith('http')
            ? media.url
            : new URL(media.url, siteUrl).href;

          console.log(
            `Downloading media ${fullMediaUrl} with site URL ${siteUrl}`,
          );

          // Download the media file using the xenforoClientService
          const response = await this.xenforoClientService.get(fullMediaUrl, {
            ...config,
            validateStatus: (status) => status === 200,
          });

          // Check content type to ensure it's media
          const contentType = response.headers['content-type'];
          const isValidMedia =
            contentType &&
            (contentType.startsWith('image/') ||
              contentType.startsWith('video/') ||
              contentType.startsWith('audio/'));

          if (!isValidMedia) {
            console.log(
              `Skipping ${media.url} - not a valid media file (${contentType})`,
            );
            // Update all media records with this URL to mark as invalid/not downloadable
            await this.entityManager.update(
              Entities.Media,
              { url: media.url },
              {
                isDownloaded: false,
                localPath: null,
                updatedAt: new Date(),
              },
            );
            stats.failed++;
            continue;
          }

          // Save the media file
          const writer = fs.createWriteStream(filePath);
          response.data.pipe(writer);

          await new Promise<void>((resolve, reject) => {
            writer.on('finish', () => resolve());
            writer.on('error', (err) => reject(err));
          });

          // Verify file was written successfully
          if (!fs.existsSync(filePath)) {
            throw new Error('File was not created after download');
          }

          // Verify file has content (not empty)
          const fileStats = fs.statSync(filePath);
          if (fileStats.size === 0) {
            fs.unlinkSync(filePath); // Remove empty file
            throw new Error('Downloaded file is empty');
          }

          // If there's a thumbnail, download it too
          if (media.thumbnailUrl && media.thumbnailUrl !== media.url) {
            try {
              const thumbnailFilename = `thumb_${filename}`;
              const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);

              // Use the full thumbnail URL
              const thumbnailUrl = media.thumbnailUrl.startsWith('http')
                ? media.thumbnailUrl
                : new URL(media.thumbnailUrl, siteUrl).href;

              const thumbnailResponse = await this.xenforoClientService.get(
                thumbnailUrl,
                config,
              );

              const thumbnailWriter = fs.createWriteStream(thumbnailPath);
              thumbnailResponse.data.pipe(thumbnailWriter);

              await new Promise<void>((resolve, reject) => {
                thumbnailWriter.on('finish', () => resolve());
                thumbnailWriter.on('error', (err) => reject(err));
              });

              console.log(`Downloaded thumbnail to ${thumbnailPath}`);
            } catch (thumbnailError) {
              console.error(
                `Failed to download thumbnail for media ${media.id}:`,
                thumbnailError.message,
              );
              // Thumbnail failure doesn't affect main download status
            }
          }

          // Update all media records with this URL in the database
          // This ensures all instances of the same media URL are marked as downloaded
          await this.entityManager.update(
            Entities.Media,
            { url: media.url },
            {
              isDownloaded: true,
              localPath: filePath,
              mimeType: contentType,
              updatedAt: new Date(),
            },
          );

          console.log(
            `Downloaded media with URL ${media.url} to ${filePath} (updated ${mediaItemsWithUrl.length} records)`,
          );
          stats.downloaded++;

          // Add a delay to avoid rate limiting (429 errors)
          const delayTime = 200 + Math.floor(Math.random() * 150);
          console.log(`Waiting ${delayTime}ms before next download...`);
          await new Promise<void>((resolve) =>
            setTimeout(() => resolve(), delayTime),
          );
        } catch (error) {
          console.error(
            `Failed to download media with URL ${media.url}:`,
            error.message,
          );

          // Update all media records with this URL to mark download as failed
          // Keep isDownloaded as false/null but update timestamp to track attempt
          await this.entityManager.update(
            Entities.Media,
            { url: media.url },
            {
              isDownloaded: false,
              localPath: null,
              updatedAt: new Date(),
            },
          );

          // If we hit a rate limit, wait longer before continuing
          if (error.response && error.response.status === 429) {
            const retryAfter = error.response.headers['retry-after']
              ? parseInt(error.response.headers['retry-after'], 10) * 1000
              : 60000; // Default to 60 seconds if no retry-after header

            console.log(
              `Rate limited (429). Pausing for ${retryAfter / 1000} seconds...`,
            );
            await new Promise<void>((resolve) =>
              setTimeout(() => resolve(), retryAfter),
            );
          }

          stats.failed++;
        }
      }

      console.log(`Download complete for thread ${thread.id}. Stats:`, stats);
      return stats;
    } catch (error) {
      console.error(`Error downloading media for thread ${threadId}:`, error);
      throw error;
    }
  }
}

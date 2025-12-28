import { Controller, Get, Param, Query, Render } from '@nestjs/common';
import fs from 'fs';
import { resolve } from 'path';
import sharp from 'sharp';
import { Readable } from 'stream';

@Controller()
export class AppController {
  constructor() {}

  @Get('api/status')
  getStatus() {
    return {
      status: 'online',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('albums/:id')
  @Render('albums')
  public album(@Param('id') id: number) {
    // Read the folder containing images
    const folderPath = resolve(process.cwd(), `downloads/thread-${id}/`);
    try {
      const files = fs.readdirSync(folderPath);
      const imageFiles = files.filter((file) =>
        /\.(jpg|jpeg|png|gif)$/i.test(file),
      );

      return {
        imageFiles,
        id,
      };
    } catch (error) {
      return `<p>Error loading images: ${error}</p>`;
    }
  }

  @Get('albums/:id/thumbnails/:filename')
  async thumbnail(
    @Param('filename') fileName: string,
    @Param('id') id: number,
    @Query('size') size: number,
  ) {
    const imagePath = resolve(
      process.cwd(),
      `downloads/thread-${id}/${fileName}`,
    );
    const width = Number(size) | 100;
    const height = Number(size) | 100;
    const thumbnailPath = resolve(
      process.cwd(),
      `downloads/thread-${id}/thumbnails/${width}x${height}/${fileName}`,
    );

    try {
      // Check if thumbnail already exists
      if (fs.existsSync(thumbnailPath)) {
        // Return existing thumbnail
        const thumbnailBuffer = fs.readFileSync(thumbnailPath);
        return new Readable({
          read() {
            this.push(thumbnailBuffer);
            this.push(null);
          },
        });
      }

      // If thumbnail doesn't exist, create directory if needed
      const thumbnailDir = resolve(
        process.cwd(),
        `downloads/thread-${id}/thumbnails/`,
      );
      if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      }

      // Generate thumbnail
      const thumbnailBuffer = await sharp(imagePath)
        .resize(width, height, { fit: 'outside' })
        .toBuffer();

      // Save thumbnail for future use
      fs.writeFileSync(thumbnailPath, thumbnailBuffer);

      // Return generated thumbnail
      return new Readable({
        read() {
          this.push(thumbnailBuffer);
          this.push(null);
        },
      });
    } catch (error) {
      throw new Error(`Error generating thumbnail: ${error}`);
    }
  }
}

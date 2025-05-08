# XenForo Crawler and Media Viewer

A NestJS application for crawling XenForo forums, downloading media content, and viewing image albums.

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Features

- **Forum Crawling**: Crawl XenForo forum threads and extract posts and media
- **Media Downloading**: Download images and videos from threads
- **Image Gallery**: View downloaded images in an album format
- **Image Thumbnails**: Generate and cache thumbnails for better performance
- **RESTful API**: All functionality available through a clean API

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   $ yarn install
   ```
3. Create a `.env` file with your forum credentials:
   ```
   XENFORO_URL=https://your-forum-url.com
   XENFORO_USERNAME=your_username
   XENFORO_PASSWORD=your_password
   ```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## API Documentation

### Authentication Endpoints

#### Login with credentials
```
POST /api/crawler/login
```
Request body:
```json
{
  "username": "your_username",
  "password": "your_password"
}
```

#### Login with stored cookies
```
GET /api/crawler/login-with-cookies
```

### Crawler Endpoints

#### Crawl a thread
```
GET /api/crawler/threads?threadId=123&startPage=1&endPage=5&download=true&outputDir=/custom/path&mediaType=all
```
Query parameters:
- `threadId` (required): The ID of the thread to crawl
- `startPage`: Starting page number (optional)
- `endPage`: Ending page number (optional)
- `download`: Whether to download media (default: false)
- `outputDir`: Custom output directory (optional)
- `mediaType`: Type of media to download - 'all', 'images', or 'videos' (default: 'all')

#### Download media from a previously crawled thread
```
POST /api/crawler/download-media
```
Request body:
```json
{
  "threadId": "123",
  "outputDir": "/custom/path",
  "mediaType": "all"
}
```

### Media Viewer Endpoints

#### View album for a thread
```
GET /albums/:id
```
Renders an album page for the specified thread ID

#### Get thumbnail for an image
```
GET /albums/:id/thumbnail/:fileName?size=200
```
Parameters:
- `id`: Thread ID
- `fileName`: Name of the image file
- `size` (query parameter): Thumbnail size in pixels (optional, default: 100)

## Project Structure

- `src/crawler/`: Contains crawler functionality to fetch and download content
- `src/app.controller.ts`: Controls album and thumbnail generation
- `views/`: Contains templates for rendering albums

## Example Usage

1. Login to the forum:
   ```bash
   curl -X POST http://localhost:3000/api/crawler/login -H "Content-Type: application/json" -d '{"username":"your_username", "password":"your_password"}'
   ```

2. Crawl a thread:
   ```bash
   curl "http://localhost:3000/api/crawler/threads?threadId=123&download=true&mediaType=images"
   ```

3. View the downloaded images:
   - Open your browser to `http://localhost:3000/albums/123`
   - Images will display with thumbnails for better performance

## Notes

- Downloaded media is saved in the `downloads/thread-{threadId}/` directory
- Thumbnails are cached for improved performance
- Crawled thread data is saved in the `output` directory as JSON files

## License

This project is [MIT licensed](LICENSE).

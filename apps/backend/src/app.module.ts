import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entities from './_entities';
import type { AppConfig } from './_config/app_config';
import { SiteModule } from './site/site.module';
import { XenforoCrawlerModule } from './xenforo_crawler/xenforo_crawler.module';
import { ThreadModule } from './thread/thread.module';
import { MediaModule } from './media/media.module';

@Module({
  imports: [
    ConfigModule.forRoot<AppConfig>({
      validate: (config: AppConfig) => {
        if (!config.DB_HOST) {
          throw new Error('DB_HOST is not defined');
        }
        if (!config.DB_PORT) {
          throw new Error('DB_PORT is not defined');
        }
        if (!config.DB_USER) {
          throw new Error('DB_USER is not defined');
        }
        if (typeof config.DB_PASSWORD !== 'string') {
          throw new Error('DB_PASSWORD is not defined');
        }
        if (!config.DB_NAME) {
          throw new Error('DB_NAME is not defined');
        }
        return config;
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'downloads'),
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '3306', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: Object.values(entities),
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      logging: process.env.DB_LOGGING === 'true',
    }),
    DatabaseModule,
    SiteModule,
    ThreadModule,
    XenforoCrawlerModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

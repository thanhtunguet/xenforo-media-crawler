import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import 'src/_config/dotenv';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media, Post, Site, Thread } from 'src/_entities';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature(Object.values({ Thread, Post, Media, Site })),
  ],
  providers: [],
  exports: [],
})
export class DatabaseModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import 'src/_config/dotenv';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Thread, Post, Media, Site } from 'src/_entities';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature(Object.values({ Thread, Post, Media, Site })),
  ],
  providers: [],
  exports: [],
})
export class DatabaseModule {}

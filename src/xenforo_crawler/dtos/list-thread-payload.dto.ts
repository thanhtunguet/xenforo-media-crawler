export class ThreadPayloadDto {
  siteId: string;

  forumId: string;
}

export class ListThreadPayloadDto extends ThreadPayloadDto {
  page?: number;
}

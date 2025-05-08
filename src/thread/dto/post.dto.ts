export class PostDto {
  id: number;
  threadId: number;
  content: string;
  createdAt: Date;
}

export class CreatePostDto {
  threadId: number;
  content: string;
}

export class ThreadDto {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  originalId?: string | null;
}

export class CreateThreadDto {
  title: string;
  content: string;
}

export class UpdateThreadDto {
  title?: string;
  content?: string;
}

export class ThreadCountDto {
  count: number;
}

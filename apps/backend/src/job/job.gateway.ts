import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export interface JobProgressEvent {
  jobId: number;
  status: string;
  progress: number;
  totalItems?: number;
  processedItems?: number;
  currentStep?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:4200',
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL || 'http://localhost:4200',
    ],
    credentials: true,
  },
  namespace: '/jobs',
})
export class JobGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(JobGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, jobId: number) {
    this.logger.log(`Client ${client.id} subscribed to job ${jobId}`);
    client.join(`job:${jobId}`);
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, jobId: number) {
    this.logger.log(`Client ${client.id} unsubscribed from job ${jobId}`);
    client.leave(`job:${jobId}`);
  }

  emitProgress(event: JobProgressEvent) {
    this.server.to(`job:${event.jobId}`).emit('progress', event);
    this.logger.debug(`Progress emitted for job ${event.jobId}: ${event.progress}%`);
  }

  emitJobUpdate(event: JobProgressEvent) {
    this.server.to(`job:${event.jobId}`).emit('job:update', event);
    this.logger.debug(`Job update emitted for job ${event.jobId}`);
  }
}


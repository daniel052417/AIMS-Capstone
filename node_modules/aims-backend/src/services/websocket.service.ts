import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export class WebSocketService {
  private io: SocketIOServer;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Join sales room for real-time updates
      socket.join('sales');

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // Broadcast new transaction
  broadcastNewTransaction(transaction: any) {
    this.io.to('sales').emit('new_transaction', transaction);
  }

  // Broadcast updated transaction
  broadcastUpdatedTransaction(transaction: any) {
    this.io.to('sales').emit('updated_transaction', transaction);
  }

  // Broadcast deleted transaction
  broadcastDeletedTransaction(transactionId: string) {
    this.io.to('sales').emit('deleted_transaction', { id: transactionId });
  }
}
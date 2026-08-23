const { Server } = require('socket.io');

class SocketService {
  constructor() {
    this.io = null;
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: '*', // Allow all origins for local development
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket) => {
      // User joins their own private room on connection
      socket.on('join', (userId) => {
        if (userId) {
          socket.join(userId.toString());
          console.log(`Socket connection: User ${userId} joined notification channel`);
        }
      });

      socket.on('disconnect', () => {
        // Socket.io handles room departures automatically
      });
    });

    return this.io;
  }

  // Send real-time notification to a specific user room
  sendNotification(recipientId, notification) {
    if (this.io) {
      this.io.to(recipientId.toString()).emit('new-notification', notification);
    }
  }
}

module.exports = new SocketService();

import { io } from 'socket.io-client';

// Use host configuration from environment or fallback to localhost backend
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL 
  ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '') 
  : 'http://localhost:5000';

let socket = null;

export const initiateSocketConnection = (userId) => {
  if (!socket && userId) {
    socket = io(SOCKET_URL);
    socket.emit('join', userId);
    console.log(`WebSocket: Connected and joined room channel for user ${userId}`);
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('WebSocket: Disconnected connection channel');
  }
};

export const subscribeToNotifications = (callback) => {
  if (socket) {
    socket.on('new-notification', (notification) => {
      callback(notification);
    });
  }
};

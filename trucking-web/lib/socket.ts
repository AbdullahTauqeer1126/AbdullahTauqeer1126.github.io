import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const getAccessToken = () => {
  if (typeof window === 'undefined') return undefined
  return window.localStorage.getItem('access_token') || undefined
}

// Shared socket instances
export const trackingSocket: Socket = io(`${SOCKET_URL}/tracking`, {
  autoConnect: false,
  transports: ['websocket'],
  auth: (cb) => cb({ token: getAccessToken() }),
});

export const chatSocket: Socket = io(`${SOCKET_URL}/chat`, {
  autoConnect: false,
  transports: ['websocket'],
  auth: (cb) => cb({ token: getAccessToken() }),
});

export const notificationSocket: Socket = io(`${SOCKET_URL}/notifications`, {
  autoConnect: false,
  transports: ['websocket'],
});

// Helper to connect all
export const connectAllSockets = (userId: string) => {
  trackingSocket.connect();
  chatSocket.connect();
  notificationSocket.connect();

  notificationSocket.emit('subscribe', userId);
};

export const connectTrackingSocket = () => {
  if (!trackingSocket.connected) {
    trackingSocket.auth = { token: getAccessToken() }
    trackingSocket.connect()
  }
  return trackingSocket
}

// Helper to disconnect all
export const disconnectAllSockets = () => {
  trackingSocket.disconnect();
  chatSocket.disconnect();
  notificationSocket.disconnect();
};

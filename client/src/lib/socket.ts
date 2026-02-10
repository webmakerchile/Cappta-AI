import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(window.location.origin, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      withCredentials: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
    });
  }
  return socket;
}

export function connectSocket(email: string, name: string, sessionId: string): Socket {
  const s = getSocket();
  if (s.connected) {
    const currentAuth = s.auth as any;
    if (currentAuth?.sessionId !== sessionId) {
      s.disconnect();
      s.auth = { email, name, sessionId };
      s.connect();
    }
  } else {
    s.auth = { email, name, sessionId };
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
  }
}

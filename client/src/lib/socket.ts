import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(window.location.origin, {
      autoConnect: false,
      transports: ["polling", "websocket"],
      withCredentials: false,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      timeout: 8000,
      upgrade: true,
    });
  }
  return socket;
}

export function connectSocket(email: string, name: string, sessionId: string, tenantId?: number | null): Socket {
  const s = getSocket();
  const auth: Record<string, any> = { email, name, sessionId };
  if (tenantId) auth.tenantId = tenantId;
  if (s.connected) {
    const currentAuth = s.auth as any;
    if (currentAuth?.sessionId !== sessionId) {
      s.disconnect();
      s.auth = auth;
      s.connect();
    }
  } else {
    s.auth = auth;
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
  }
}

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

// URL do servidor (Render em produção; sobrescrevível em dev:
// VITE_SOCKET_URL=http://localhost:3000 npm run dev)
export const SOCKET_URL: string =
  (import.meta.env?.VITE_SOCKET_URL as string | undefined) ??
  "https://playhome-backend.onrender.com";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const socket = useContext(SocketContext);
  if (!socket) throw new Error("Socket not initialized");
  return socket;
}

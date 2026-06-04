import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let socketUrl = import.meta.env.VITE_SOCKET_URL;
    if (!socketUrl && import.meta.env.VITE_API_URL) {
      socketUrl = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
    }
    if (!socketUrl) {
      const origin = window.location.origin;
      if (origin.includes(':5173')) {
        socketUrl = origin.replace(':5173', ':5000');
      } else {
        socketUrl = origin;
      }
    }
    socketRef.current = io(socketUrl, { transports: ['websocket'] });
    socketRef.current.on('connect', () => setConnected(true));
    socketRef.current.on('disconnect', () => setConnected(false));
    return () => { socketRef.current?.disconnect(); };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

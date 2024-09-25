// WebSocketProvider.tsx

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface WebSocketContextValue {
  ws: WebSocket | null;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextValue>({ ws: null, isConnected: false });

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const serverUrl = 'wss://mobilewordguess.onrender.com'; // Replace with your server URL

  useEffect(() => {
    const connectWebSocket = () => {
      wsRef.current = new WebSocket(serverUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket connection closed. Reconnecting...');
        setIsConnected(false);
        setTimeout(connectWebSocket, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ ws: wsRef.current, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);

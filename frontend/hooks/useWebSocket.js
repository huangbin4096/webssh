import { useEffect, useRef, useState } from 'react';
import { sessionManager } from '../utils/sessionManager';

export const useWebSocket = (url, onMessage) => {
  const [sessionId, setSessionId] = useState(null);
  const websocketRef = useRef(null);

  const connect = () => {
    const websocket = new WebSocket(url);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      if (sessionId) {
        // 如果有sessionId，说明是重连
        sessionManager.reconnectSession(sessionId, websocket);
      }
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.sessionId && !sessionId) {
        // 第一次连接，保存sessionId
        setSessionId(data.sessionId);
        sessionManager.createSession(data.sessionId, websocket);
      }
      onMessage(data);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected, attempting to reconnect...');
      setTimeout(() => {
        connect(); // 尝试重连
      }, 3000);
    };

    websocketRef.current = websocket;
  };

  useEffect(() => {
    connect();

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [url]);

  return { sessionId };
};

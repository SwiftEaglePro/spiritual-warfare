import { useEffect, useRef, useState, useCallback } from 'react';

export const useGameSocket = (onStateUpdate, onMessage) => {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [playerId, setPlayerId] = useState(null);

  const connect = useCallback((username) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setConnected(true);
      wsRef.current.send(JSON.stringify({
        type: 'join-lobby',
        username: username || 'Player'
      }));
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'player-id') {
        setPlayerId(data.playerId);
      } else if (data.type === 'game-state') {
        onStateUpdate?.(data);
      } else {
        onMessage?.(data);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current.onclose = () => {
      setConnected(false);
    };
  }, [onStateUpdate, onMessage]);

  const send = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    connect,
    send,
    disconnect,
    connected,
    playerId,
    ws: wsRef.current
  };
};

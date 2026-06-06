import { useEffect, useRef, useState, useCallback } from 'react';

export function useGameSocket() {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [playerId, setPlayerId] = useState(null);
  const [gameState, setGameState] = useState(null);

  const send = useCallback((msg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const connect = useCallback((username) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setConnected(true);
      send({ type: 'join-lobby', username });
    };

    wsRef.current.onmessage = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.type === 'player-id') {
        setPlayerId(data.playerId);
      } else if (data.type === 'game-state') {
        setGameState(data);
      }
    };

    wsRef.current.onerror = (err) => console.error('WS error:', err);
    wsRef.current.onclose = () => setConnected(false);
  }, [send]);

  const disconnect = useCallback(() => {
    if (wsRef.current) wsRef.current.close();
  }, []);

  useEffect(() => () => { if (wsRef.current) wsRef.current.close(); }, []);

  return { connect, send, disconnect, connected, playerId, gameState };
}

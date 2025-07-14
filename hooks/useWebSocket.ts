import { useState, useEffect, useRef, useCallback } from 'react';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  kitchenId?: number;
  userId?: number;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastMessage: WebSocketMessage | null;
  connectionId: string | null;
}

export interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    autoConnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    onMessage,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastMessage: null,
    connectionId: null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const sessionTokenRef = useRef<string | null>(null);

  // Get session token from cookie
  const getSessionToken = useCallback(() => {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    const kitchenSessionCookie = cookies.find(cookie => 
      cookie.trim().startsWith('kitchen-session=')
    );
    
    if (kitchenSessionCookie) {
      return kitchenSessionCookie.split('=')[1];
    }
    
    return null;
  }, []);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (state.isConnected || state.isConnecting) return;

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Get session token
      const token = getSessionToken();
      if (!token) {
        throw new Error('No session token found');
      }
      sessionTokenRef.current = token;

      // Create WebSocket connection
      const wsUrl = `${url}?token=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null
        }));
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setState(prev => ({
            ...prev,
            lastMessage: message
          }));
          onMessage?.(message);
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false
        }));
        onDisconnect?.();

        // Attempt to reconnect if not a clean close
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`[WebSocket] Reconnecting... Attempt ${reconnectAttemptsRef.current}`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        const errorMessage = 'WebSocket connection error';
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isConnecting: false
        }));
        onError?.(errorMessage);
      };

    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isConnecting: false
      }));
      onError?.(errorMessage);
    }
  }, [url, state.isConnected, state.isConnecting, getSessionToken, reconnectInterval, maxReconnectAttempts, onConnect, onDisconnect, onError, onMessage]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      connectionId: null
    }));
  }, []);

  // Send message
  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'timestamp'>) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Cannot send message: not connected');
      return false;
    }

    try {
      const fullMessage: WebSocketMessage = {
        ...message,
        timestamp: Date.now()
      };
      
      wsRef.current.send(JSON.stringify(fullMessage));
      return true;
    } catch (error) {
      console.error('[WebSocket] Error sending message:', error);
      return false;
    }
  }, []);

  // Send order status update
  const updateOrderStatus = useCallback((orderId: number, status: string, notes?: string) => {
    return sendMessage({
      type: 'order_status_update',
      data: { orderId, status, notes }
    });
  }, [sendMessage]);

  // Send batch progress update
  const updateBatchProgress = useCallback((batchId: number, progress: number, notes?: string) => {
    return sendMessage({
      type: 'batch_progress_update',
      data: { batchId, progress, notes }
    });
  }, [sendMessage]);

  // Send kitchen capacity update
  const updateKitchenCapacity = useCallback((capacity: any) => {
    return sendMessage({
      type: 'kitchen_capacity_update',
      data: capacity
    });
  }, [sendMessage]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
    updateOrderStatus,
    updateBatchProgress,
    updateKitchenCapacity
  };
} 
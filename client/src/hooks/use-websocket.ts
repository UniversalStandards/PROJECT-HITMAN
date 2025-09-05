import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface WebSocketMessage {
  type: 'notification' | 'update' | 'alert' | 'broadcast';
  data: any;
  timestamp: number;
}

interface WebSocketState {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  notifications: WebSocketMessage[];
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    lastMessage: null,
    notifications: []
  });

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setState(prev => ({ ...prev, isConnected: true }));
        
        // Send authentication info if available
        if (isAuthenticated && user) {
          ws.send(JSON.stringify({
            type: 'auth',
            userId: (user as any).id,
            organizationId: (user as any).organizationId,
            role: (user as any).role
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          setState(prev => ({
            ...prev,
            lastMessage: message,
            notifications: [...prev.notifications, message].slice(-50) // Keep last 50
          }));

          // Handle different message types
          switch (message.type) {
            case 'notification':
              toast({
                title: message.data.title,
                description: message.data.message,
              });
              break;
            
            case 'alert':
              toast({
                title: message.data.title,
                description: message.data.message,
                variant: message.data.severity === 'error' ? 'destructive' : 'default'
              });
              break;
            
            case 'broadcast':
              toast({
                title: message.data.title,
                description: message.data.message,
                variant: message.data.severity === 'error' ? 'destructive' : 'default'
              });
              break;
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setState(prev => ({ ...prev, isConnected: false }));
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setState(prev => ({ ...prev, isConnected: false }));
        wsRef.current = null;

        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          connect();
        }, 5000);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setState(prev => ({ ...prev, isConnected: false }));
    }
  }, [isAuthenticated, user, toast]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setState(prev => ({ ...prev, notifications: [] }));
  }, []);

  const markNotificationRead = useCallback((timestamp: number) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => 
        n.timestamp === timestamp ? { ...n, read: true } : n
      )
    }));
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected: state.isConnected,
    lastMessage: state.lastMessage,
    notifications: state.notifications,
    sendMessage,
    clearNotifications,
    markNotificationRead,
    unreadCount: state.notifications.filter(n => !(n as any).read).length
  };
}
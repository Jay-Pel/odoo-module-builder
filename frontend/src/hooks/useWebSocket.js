import { useState, useEffect, useRef } from 'react';

export const useWebSocket = (projectId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const websocketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const messageHandlersRef = useRef([]);

  const wsUrl = `${import.meta.env.VITE_API_URL?.replace('http', 'ws') || 'ws://localhost:8001'}/ws/${projectId}`;

  const connect = () => {
    try {
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        return; // Already connected
      }

      websocketRef.current = new WebSocket(wsUrl);

      websocketRef.current.onopen = () => {
        console.log(`WebSocket connected to project ${projectId}`);
        setIsConnected(true);
        setConnectionError(null);
        
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      websocketRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
          
          // Call all registered message handlers
          messageHandlersRef.current.forEach(handler => {
            try {
              handler(message);
            } catch (error) {
              console.error('Error in message handler:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocketRef.current.onclose = (event) => {
        console.log(`WebSocket disconnected from project ${projectId}`, event.code, event.reason);
        setIsConnected(false);
        websocketRef.current = null;

        // Attempt to reconnect after 3 seconds unless it was a manual close
        if (event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect WebSocket for project ${projectId}`);
            connect();
          }, 3000);
        }
      };

      websocketRef.current.onerror = (error) => {
        console.error(`WebSocket error for project ${projectId}:`, error);
        setConnectionError('WebSocket connection error');
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionError('Failed to create WebSocket connection');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (websocketRef.current) {
      websocketRef.current.close(1000, 'Component unmounting');
      websocketRef.current = null;
    }
    
    setIsConnected(false);
    setLastMessage(null);
    setConnectionError(null);
  };

  const addMessageHandler = (handler) => {
    messageHandlersRef.current.push(handler);
    
    // Return a cleanup function
    return () => {
      messageHandlersRef.current = messageHandlersRef.current.filter(h => h !== handler);
    };
  };

  const sendMessage = (message) => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', message);
    }
  };

  // Connect when component mounts or projectId changes
  useEffect(() => {
    if (projectId) {
      connect();
    }

    // Cleanup on unmount or projectId change
    return () => {
      disconnect();
    };
  }, [projectId]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    lastMessage,
    connectionError,
    connect,
    disconnect,
    sendMessage,
    addMessageHandler
  };
}; 
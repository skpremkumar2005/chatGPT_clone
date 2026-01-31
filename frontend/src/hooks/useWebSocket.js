import { useState, useEffect, useRef, useCallback } from "react";

const WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:8080/ws";

/**
 * A custom hook to manage a WebSocket connection.
 * (For future real-time features)
 * @param {function} onMessage - Callback function to handle incoming messages.
 */
export const useWebSocket = (onMessage) => {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);
  const onMessageRef = useRef(onMessage);

  // Update ref when callback changes
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    // Do not connect if there's no handler
    if (!onMessageRef.current) return;

    // Initialize WebSocket connection
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (onMessageRef.current) {
        onMessageRef.current(message);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // Cleanup on component unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []); // Only connect once

  // Function to send data through the WebSocket
  const sendMessage = (data) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    } else {
      console.error("WebSocket is not connected.");
    }
  };

  return { isConnected, sendMessage };
};

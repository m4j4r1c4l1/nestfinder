import { useEffect, useRef } from 'react';

export const useWebSocket = (url, onMessage) => {
    const wsRef = useRef(null);
    const retryDelay = useRef(1000); // Start delay at 1s
    const timeoutRef = useRef(null);
    const savedOnMessage = useRef(onMessage);

    // Keep the latest callback current without triggering reconnection
    useEffect(() => {
        savedOnMessage.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        const connect = () => {
            // Prevent multiple connections
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

            console.log('🔌 WebSocket connecting...');
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('✅ WebSocket connected');
                retryDelay.current = 1000; // Reset delay on successful connection
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (savedOnMessage.current) {
                        savedOnMessage.current(message);
                    }
                } catch (err) {
                    console.error('WebSocket parse error:', err);
                }
            };

            ws.onclose = (event) => {
                // Determine if this was a clean close or error
                if (!event.wasClean) {
                    console.log(`❌ WebSocket closed unexpectedly. Retrying in ${retryDelay.current}ms...`);

                    // Recursive reconnect with exponential backoff
                    timeoutRef.current = setTimeout(() => {
                        connect();
                    }, retryDelay.current);

                    // Increase delay for next time (cap at 30s)
                    retryDelay.current = Math.min(retryDelay.current * 1.5, 30000);
                } else {
                    console.log('WebSocket connection closed cleanly');
                }
            };

            ws.onerror = (err) => {
                console.error('WebSocket error encountered:', err);
                ws.close(); // Force close to trigger recovery logic
            };
        };

        connect();

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (wsRef.current) {
                // Remove listeners to prevent zombie callbacks
                wsRef.current.onclose = null;
                wsRef.current.close();
            }
        };
    }, [url]);
};

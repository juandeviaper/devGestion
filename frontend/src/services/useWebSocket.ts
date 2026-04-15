import { useEffect, useRef, useState, useCallback } from 'react';

export const useWebSocket = (projectId: string | number | undefined) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);

    const connect = useCallback(() => {
        if (!projectId) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // En desarrollo usualmente es localhost:8000
        const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
        const socketUrl = `${protocol}//${host}/ws/project/${projectId}/`;

        console.log('Connecting to WebSocket:', socketUrl);
        const socket = new WebSocket(socketUrl);

        socket.onopen = () => {
            console.log('WebSocket Connected');
            setIsConnected(true);
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setMessages((prev) => [...prev, data]);
        };

        socket.onclose = (e) => {
            console.log('WebSocket Disconnected', e.reason);
            setIsConnected(false);
            // Intentar reconectar después de 3 segundos
            setTimeout(() => {
                if (projectId) connect();
            }, 3000);
        };

        socket.onerror = (err) => {
            console.error('WebSocket Error:', err);
            socket.close();
        };

        socketRef.current = socket;
    }, [projectId]);

    useEffect(() => {
        connect();
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [connect]);

    const sendMessage = (message: string) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ message }));
        }
    };

    return { messages, sendMessage, isConnected };
};

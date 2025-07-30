import { useEffect } from "react";
import socket from "../services/soket"; // Kết nối socket.io client instance

export const useSocket = (
    eventName: string,
    callback: (data: any) => void
) => {
    useEffect(() => {
        if (!window.socket) return;

        window.socket.on(eventName, callback);

        return () => {
            window.socket?.off(eventName, callback);
        };
    }, [eventName, callback]);
};

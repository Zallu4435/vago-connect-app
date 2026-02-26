import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { useSocketStore } from '@/stores/socketStore';
import { showToast } from '@/lib/toast';

const SOCKET_HOST = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";

export function useSocketConnection() {
  const userInfo = useAuthStore((s) => s.userInfo);
  // message and call handlers are in separate hooks

  const setSocket = useSocketStore((s) => s.setSocket);
  const clearSocket = useSocketStore((s) => s.clearSocket);
  const socket = useSocketStore((s) => s.socket);
  const shouldConnect = useSocketStore((s) => s.shouldConnect);

  // no socketSync usage here; dedicated hooks handle it

  const socketRef = useRef<any>(null);
  const connectionToastId = useRef<any>(null);
  const lifecycleAttachedRef = useRef(false);

  // Initialize socket once when user is known
  useEffect(() => {
    if (userInfo && shouldConnect && !socket.current) {
      socketRef.current = io(SOCKET_HOST, {
        transports: ['websocket'],
        upgrade: false,
        withCredentials: true,
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 500,
        reconnectionDelayMax: 2000,
        timeout: 20000,
      });
      setSocket(socketRef);
      try { socketRef.current.connect(); } catch { }
    }
  }, [userInfo, shouldConnect, setSocket, socket]);

  // Register socket lifecycle listeners only
  useEffect(() => {
    const s = socket.current;
    if (s && !lifecycleAttachedRef.current) {
      const onDisconnect = () => {
        connectionToastId.current = showToast.loading('Severed connection to the ethereal plane...');
      };
      const onConnect = () => {
        if (connectionToastId.current) {
          showToast.dismiss(connectionToastId.current);
          connectionToastId.current = null;
        }
        showToast.success('Reconnected to the ethereal plane!');
        try { if (userInfo?.id) s.emit('add-user', userInfo.id); } catch { }
      };
      const onConnectError = () => {
        if (connectionToastId.current) {
          showToast.dismiss(connectionToastId.current);
          connectionToastId.current = null;
        }
        showToast.error('Failed to connect to the ethereal plane.');
      };

      // Connection lifecycle
      s.on('disconnect', onDisconnect);
      s.on('connect', onConnect);
      s.on('connect_error', onConnectError);

      lifecycleAttachedRef.current = true;

      return () => {
        s.off('disconnect', onDisconnect);
        s.off('connect', onConnect);
        s.off('connect_error', onConnectError);
        lifecycleAttachedRef.current = false;
      };
    }
  }, [socket, userInfo?.id]);

  // Disconnect and clear on auth sign-out or when shouldConnect turns false
  useEffect(() => {
    if ((!userInfo || !shouldConnect) && socket.current) {
      try { socket.current.disconnect(); } catch { }
      clearSocket();
      lifecycleAttachedRef.current = false;
    }
  }, [userInfo, shouldConnect, socket, clearSocket]);

  return socket;
}

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_HOST } from '@/utils/ApiRoutes';
import { useAuthStore } from '@/stores/authStore';
import { useSocketStore } from '@/stores/socketStore';
import { showToast } from '@/lib/toast';

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
      try { socketRef.current.connect(); } catch {}
    }
  }, [userInfo, shouldConnect, setSocket]);

  // Register socket lifecycle listeners only
  useEffect(() => {
    if (socket.current && !lifecycleAttachedRef.current) {
      // Connection lifecycle
      socket.current.on('disconnect', () => {
        connectionToastId.current = showToast.loading('Severed connection to the ethereal plane...');
      });
      socket.current.on('connect', () => {
        if (connectionToastId.current) {
          showToast.dismiss(connectionToastId.current);
          connectionToastId.current = null;
        }
        showToast.success('Reconnected to the ethereal plane!');
        try { if (userInfo?.id) socket.current.emit('add-user', userInfo.id); } catch {}
      });
      socket.current.on('connect_error', () => {
        if (connectionToastId.current) {
          showToast.dismiss(connectionToastId.current);
          connectionToastId.current = null;
        }
        showToast.error('Failed to connect to the ethereal plane.');
      });
      lifecycleAttachedRef.current = true;
    }

    return () => {
      if (socket.current) {
        socket.current.off('disconnect');
        socket.current.off('connect');
        socket.current.off('connect_error');
      }
    };
  }, [socket.current, userInfo?.id]);

  // Disconnect and clear on auth sign-out or when shouldConnect turns false
  useEffect(() => {
    if ((!userInfo || !shouldConnect) && socket.current) {
      try { socket.current.disconnect(); } catch {}
      clearSocket();
      lifecycleAttachedRef.current = false;
    }
  }, [userInfo, shouldConnect, socket, clearSocket]);

  return socket;
}

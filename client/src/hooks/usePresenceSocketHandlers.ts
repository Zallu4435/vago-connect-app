import { useEffect } from 'react';
import { useSocketStore } from '@/stores/socketStore';
import { useChatStore } from '@/stores/chatStore';

export function usePresenceSocketHandlers() {
  const socket = useSocketStore((s) => s.socket);
  const setOnlineUsers = useChatStore((s) => s.setOnlineUsers);

  useEffect(() => {
    if (!socket.current) return;

    const onOnlineUsers = (users: any[]) => {
      setOnlineUsers(users || []);
    };

    socket.current.on('online-users', onOnlineUsers);

    return () => {
      if (!socket.current) return;
      socket.current.off('online-users', onOnlineUsers);
    };
  }, [socket.current, setOnlineUsers]);
}

import { useEffect } from 'react';
import { useSocketStore } from '@/stores/socketStore';
import { useChatStore } from '@/stores/chatStore';

export function usePresenceSocketHandlers() {
  const socket = useSocketStore((s) => s.socket);
  const setOnlineUsers = useChatStore((s) => s.setOnlineUsers);

  useEffect(() => {
    const s = socket.current;
    if (!s) return;

    const onOnlineUsers = (users: any[]) => {
      setOnlineUsers(users || []);
    };

    s.on('online-users', onOnlineUsers);

    return () => {
      s.off('online-users', onOnlineUsers);
    };
  }, [socket, setOnlineUsers]);
}

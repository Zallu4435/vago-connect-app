import { useEffect } from 'react';
import { useSocketStore } from '@/stores/socketStore';
import { useChatStore } from '@/stores/chatStore';

export function usePresenceSocketHandlers() {
  const socket = useSocketStore((s) => s.socket);
  const setOnlineUsers = useChatStore((s) => s.setOnlineUsers);
  const addTypingUser = useChatStore((s) => s.addTypingUser);
  const removeTypingUser = useChatStore((s) => s.removeTypingUser);

  useEffect(() => {
    const s = socket.current;
    if (!s) return;

    const onOnlineUsers = (users: any[]) => {
      setOnlineUsers(users || []);
    };

    const onTyping = (data: { from: string | number }) => {
      if (data?.from) addTypingUser(Number(data.from));
    };

    const onStopTyping = (data: { from: string | number }) => {
      if (data?.from) removeTypingUser(Number(data.from));
    };

    s.on('online-users', onOnlineUsers);
    s.on('typing', onTyping);
    s.on('stop-typing', onStopTyping);

    return () => {
      s.off('online-users', onOnlineUsers);
      s.off('typing', onTyping);
      s.off('stop-typing', onStopTyping);
    };
  }, [socket, setOnlineUsers, addTypingUser, removeTypingUser]);
}

import { useEffect } from 'react';
import { useSocketStore } from '@/stores/socketStore';
import { useChatStore } from '@/stores/chatStore';
import { useQueryClient } from '@tanstack/react-query';

export function usePresenceSocketHandlers() {
  const socket = useSocketStore((s) => s.socket);
  const setOnlineUsers = useChatStore((s) => s.setOnlineUsers);
  const onlineUsers = useChatStore((s) => s.onlineUsers);
  const addTypingUser = useChatStore((s) => s.addTypingUser);
  const removeTypingUser = useChatStore((s) => s.removeTypingUser);
  const qc = useQueryClient();

  useEffect(() => {
    const s = socket.current;
    if (!s) return;

    const onOnlineUsers = (users: any[]) => {
      setOnlineUsers(users ? users.map(Number) : []);
    };

    const onUserOnline = ({ userId }: { userId: string | number }) => {
      const currentOnline = useChatStore.getState().onlineUsers || [];
      const idNum = Number(userId);
      if (!currentOnline.includes(idNum)) {
        setOnlineUsers([...currentOnline, idNum]);
      }
      qc.invalidateQueries({ queryKey: ['contacts'] });
    };

    const onUserOffline = ({ userId }: { userId: string | number }) => {
      const currentOnline = useChatStore.getState().onlineUsers || [];
      const idNum = Number(userId);
      setOnlineUsers(currentOnline.filter((id) => id !== idNum));
      qc.invalidateQueries({ queryKey: ['contacts'] });
    };

    const onTyping = (data: { from: string | number }) => {
      if (data?.from) addTypingUser(Number(data.from));
    };

    const onStopTyping = (data: { from: string | number }) => {
      if (data?.from) removeTypingUser(Number(data.from));
    };

    s.on('online-users', onOnlineUsers);
    s.on('user-online', onUserOnline);
    s.on('user-offline', onUserOffline);
    s.on('typing', onTyping);
    s.on('stop-typing', onStopTyping);

    return () => {
      s.off('online-users', onOnlineUsers);
      s.off('user-online', onUserOnline);
      s.off('user-offline', onUserOffline);
      s.off('typing', onTyping);
      s.off('stop-typing', onStopTyping);
    };
  }, [socket, setOnlineUsers, addTypingUser, removeTypingUser, qc]);
}

import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSocketStore } from '@/stores/socketStore';
import { useAuthStore } from '@/stores/authStore';

export interface ForwardMessagesInput {
  messageIds: Array<number | string>;
  toConversationIds: Array<number | string>;
}

export interface MinimalForwardedMessage {
  id: number;
  conversationId: number;
  senderId: number;
  type: string;
  content: string;
  status: string;
  createdAt: string;
}

export function useForwardMessages(): UseMutationResult<{ messages: MinimalForwardedMessage[] }, Error, ForwardMessagesInput> {
  const qc = useQueryClient();
  const userInfo = useAuthStore((s) => s.userInfo);
  return useMutation<{ messages: MinimalForwardedMessage[] }, Error, ForwardMessagesInput>({
    mutationFn: async (input) => {
      const socket = useSocketStore.getState().socket;
      if (socket.current) {
        socket.current.emit("forward-messages", {
          messageIds: input.messageIds,
          toConversationIds: input.toConversationIds,
          requesterId: userInfo?.id
        });
      }
      return Promise.resolve({ messages: [] });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

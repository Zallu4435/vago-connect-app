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
      if (!socket.current) return Promise.reject(new Error("Socket not connected"));

      return new Promise((resolve, reject) => {
        socket.current?.emit("forward-messages", {
          messageIds: input.messageIds,
          toConversationIds: input.toConversationIds,
          requesterId: userInfo?.id
        }, (res: { success: boolean, error?: string }) => {
          if (res?.success) {
            resolve({ messages: [] });
          } else {
            reject(new Error(res?.error || "Forwarding failed"));
          }
        });

        // Safety timeout in case callback is never called
        setTimeout(() => reject(new Error("Forwarding timed out")), 15000);
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

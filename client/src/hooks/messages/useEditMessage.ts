import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import type { Message } from '@/types';
import { useSocketStore } from '@/stores/socketStore';
import { useAuthStore } from '@/stores/authStore';

export interface EditMessageInput {
  id: number | string;
  content: string;
}

export function useEditMessage(): UseMutationResult<Message, Error, EditMessageInput> {
  const qc = useQueryClient();
  const userInfo = useAuthStore((s) => s.userInfo);
  return useMutation<Message, Error, EditMessageInput>({
    mutationFn: async ({ id, content }) => {
      const socket = useSocketStore.getState().socket;
      if (socket.current) {
        socket.current.emit("edit-message", { messageId: id, content, requesterId: userInfo?.id });
      }
      return Promise.resolve({ id, content } as any);
    },
    onSuccess: (_data, _vars) => {
      qc.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

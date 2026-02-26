import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useSocketStore } from '@/stores/socketStore';
import { useAuthStore } from '@/stores/authStore';

export type DeleteType = 'forMe' | 'forEveryone';
export interface DeleteMessageInput {
  id: number | string;
  deleteType: DeleteType;
}

export function useDeleteMessage(): UseMutationResult<unknown, Error, DeleteMessageInput> {
  const qc = useQueryClient();
  const userInfo = useAuthStore((s) => s.userInfo);
  return useMutation<unknown, Error, DeleteMessageInput>({
    mutationFn: async ({ id, deleteType }) => {
      const socket = useSocketStore.getState().socket;
      if (socket.current) {
        socket.current.emit("delete-message", { messageId: id, deleteType, requesterId: userInfo?.id });
      }
      return Promise.resolve({ id, deleteType } as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

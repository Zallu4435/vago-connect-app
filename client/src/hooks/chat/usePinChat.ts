import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { ChatService } from '@/services/chatService';
import { showToast } from '@/lib/toast';

interface PinChatInput {
  conversationId: number | string;
  pinned: boolean;
  userId: number | string; // for updating the contacts cache key
}

export function usePinChat(): UseMutationResult<any, Error, PinChatInput> {
  const qc = useQueryClient();

  return useMutation<any, Error, PinChatInput>({
    mutationFn: async ({ conversationId, pinned }) => {
      return await ChatService.pinChat(conversationId, pinned);
    },
    onSuccess: (updated, variables) => {
      showToast.success(variables.pinned ? "Chat pinned" : "Chat unpinned");
      qc.invalidateQueries({ queryKey: ['contacts', String(variables.userId)] });
    },
  });
}

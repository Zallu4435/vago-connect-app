import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { MessageService } from '@/services/messageService';

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
  return useMutation<{ messages: MinimalForwardedMessage[] }, Error, ForwardMessagesInput>({
    mutationFn: async (input) => {
      const data = await MessageService.forwardMessages(input.messageIds as any, input.toConversationIds as any);
      return data as { messages: MinimalForwardedMessage[] };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

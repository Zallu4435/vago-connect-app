import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { MessageService } from '@/services/messageService';
import type { Message } from '@/types';
import { useRef } from 'react';
import { showToast } from '@/lib/toast';

export interface SendMessageInput {
  from: string | number;
  to: string | number;
  content: string;
  type: 'text' | 'image' | 'audio';
  replyToMessageId?: string | number;
  isGroup?: boolean;
}

export function useSendMessage(): UseMutationResult<Message, Error, SendMessageInput> {
  const qc = useQueryClient();
  const mutateRef = useRef<UseMutationResult<Message, Error, SendMessageInput>["mutate"] | null>(null);

  type Ctx = { previousMessages?: Message[]; key: string[] };
  const mutation = useMutation<Message, Error, SendMessageInput, Ctx>({
    mutationFn: async (input) => {
      return await MessageService.sendMessage(input as any);
    },
    onMutate: async (variables) => {
      const key = ['messages', String(variables.from), String(variables.to)];
      const previousMessages = qc.getQueryData<Message[]>(key);
      return { previousMessages, key };
    },
    onSuccess: (newMsg, variables) => {
      // Optimistically update message list cache for this conversation
      const key = ['messages', String(variables.from), String(variables.to)];
      qc.setQueryData<Message[]>(key, (old = []) => [...old, newMsg]);

      // Invalidate contacts cache to force re-fetch of contact's last message, unread counts, and ordering
      qc.invalidateQueries({ queryKey: ['contacts', String(variables.from)] });
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update (if any)
      if (context?.previousMessages) {
        qc.setQueryData<Message[]>(['messages', String(variables.from), String(variables.to)], context.previousMessages);
      }
      // Show error toast with retry
      showToast.withAction('Message failed to send', 'Retry', () => {
        if (mutateRef.current) mutateRef.current(variables);
      });
    },
  });

  mutateRef.current = mutation.mutate;
  return mutation;
}

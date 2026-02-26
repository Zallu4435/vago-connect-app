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

      // Update contacts list for the sender (preview, order)
      const contactsKey = ['contacts', String(variables.from)];
      qc.setQueryData<any[]>(
        contactsKey,
        (old = []) => {
          if (!Array.isArray(old)) return old;
          const idx = old.findIndex((c: any) => String(c.id) === String(variables.to));
          if (idx === -1) return old;
          const contact = old[idx] || {};
          const updated = {
            ...contact,
            message: (newMsg as any).content || (newMsg as any).message || contact.message,
            type: (newMsg as any).type || 'text',
            timestamp: (newMsg as any).timestamp || new Date().toISOString(),
            senderId: variables.from,
            messageStatus: (newMsg as any).messageStatus || contact.messageStatus,
            totalUnreadMessages: contact.totalUnreadMessages || 0,
          };
          const rest = old.filter((_: any, i: number) => i !== idx);
          return [updated, ...rest];
        }
      );
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

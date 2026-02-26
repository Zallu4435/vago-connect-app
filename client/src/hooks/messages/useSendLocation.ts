import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { MessageService } from '@/services/messageService';
import type { Message } from '@/types';

export interface SendLocationInput {
  from: string | number;
  to: string | number;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
  replyToMessageId?: string | number;
  isGroup?: boolean;
}

export function useSendLocation(): UseMutationResult<Message, Error, SendLocationInput> {
  const qc = useQueryClient();
  return useMutation<Message, Error, SendLocationInput>({
    mutationFn: async (input) => {
      return await MessageService.sendLocation(input as any);
    },
    onSuccess: (_msg, variables) => {
      qc.invalidateQueries({ queryKey: ['messages', String(variables.from), String(variables.to)] });
    },
  });
}

import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { EDIT_MESSAGE_ROUTE } from '@/utils/ApiRoutes';
import type { Message } from '@/types';

export interface EditMessageInput {
  id: number | string;
  content: string;
}

export function useEditMessage(): UseMutationResult<Message, Error, EditMessageInput> {
  const qc = useQueryClient();
  return useMutation<Message, Error, EditMessageInput>({
    mutationFn: async ({ id, content }) => {
      const { data } = await api.patch(EDIT_MESSAGE_ROUTE(id), { content });
      return data as Message;
    },
    onSuccess: (_data, _vars) => {
      qc.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

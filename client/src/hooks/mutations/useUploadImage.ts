import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ADD_IMAGE_ROUTE } from '@/utils/ApiRoutes';
import type { Message } from '@/types';

export function useUploadImage(): UseMutationResult<Message, Error, FormData> {
  const qc = useQueryClient();
  return useMutation<Message, Error, FormData>({
    mutationFn: async (form) => {
      const { data } = await api.post(ADD_IMAGE_ROUTE, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data as Message;
    },
    onSuccess: () => {
      // Invalidate message queries so conversation refreshes
      qc.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

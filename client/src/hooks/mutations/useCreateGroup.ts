import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CREATE_GROUP_ROUTE } from '@/utils/ApiRoutes';

export function useCreateGroup(): UseMutationResult<any, Error, FormData> {
  const qc = useQueryClient();
  return useMutation<any, Error, FormData>({
    mutationFn: async (form) => {
      const { data } = await api.post(CREATE_GROUP_ROUTE, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

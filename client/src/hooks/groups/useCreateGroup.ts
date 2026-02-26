import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { GroupService } from '@/services/groupService';

export function useCreateGroup(): UseMutationResult<any, Error, FormData> {
  const qc = useQueryClient();
  return useMutation<any, Error, FormData>({
    mutationFn: async (form) => {
      return await GroupService.createGroup(form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

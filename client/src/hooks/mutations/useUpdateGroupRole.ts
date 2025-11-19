import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { UPDATE_GROUP_ROLE_ROUTE } from '@/utils/ApiRoutes';

export interface UpdateGroupRoleInput {
  groupId: number | string;
  userId: number | string;
  role: 'admin' | 'member';
}

export function useUpdateGroupRole(): UseMutationResult<any, Error, UpdateGroupRoleInput> {
  const qc = useQueryClient();
  return useMutation<any, Error, UpdateGroupRoleInput>({
    mutationFn: async ({ groupId, userId, role }) => {
      const { data } = await api.post(UPDATE_GROUP_ROLE_ROUTE(groupId), { userId, role });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

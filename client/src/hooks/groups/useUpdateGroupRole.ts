import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { GroupService } from '@/services/groupService';

export interface UpdateGroupRoleInput {
  groupId: number | string;
  userId: number | string;
  role: 'admin' | 'member';
}

export function useUpdateGroupRole(): UseMutationResult<any, Error, UpdateGroupRoleInput> {
  const qc = useQueryClient();
  return useMutation<any, Error, UpdateGroupRoleInput>({
    mutationFn: async ({ groupId, userId, role }) => {
      return await GroupService.updateRole(groupId, userId, role);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { GroupService } from '@/services/groupService';
import { showToast } from '@/lib/toast';

export function useLeaveGroup(): UseMutationResult<any, Error, string | number> {
  const qc = useQueryClient();
  return useMutation<any, Error, string | number>({
    mutationFn: async (groupId) => {
      return await GroupService.leaveGroup(groupId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['messages'] });
      showToast.success("Left group successfully");
    }
  });
}

export function useDeleteGroup(): UseMutationResult<any, Error, string | number> {
  const qc = useQueryClient();
  return useMutation<any, Error, string | number>({
    mutationFn: async (groupId) => {
      return await GroupService.deleteGroup(groupId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['messages'] });
      showToast.success("Deleted group successfully");
    }
  });
}

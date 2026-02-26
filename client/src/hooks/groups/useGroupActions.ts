import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { GroupService } from '@/services/groupService';

export function useLeaveGroup(): UseMutationResult<any, Error, string | number> {
  return useMutation<any, Error, string | number>({
    mutationFn: async (groupId) => {
      return await GroupService.leaveGroup(groupId);
    },
  });
}

export function useDeleteGroup(): UseMutationResult<any, Error, string | number> {
  return useMutation<any, Error, string | number>({
    mutationFn: async (groupId) => {
      return await GroupService.deleteGroup(groupId);
    },
  });
}

import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { GroupService } from '@/services/groupService';

export interface GroupMembersInput {
  groupId: number | string;
  members: Array<number | string>;
}

export function useAddGroupMembers(): UseMutationResult<any, Error, GroupMembersInput> {
  const qc = useQueryClient();
  return useMutation<any, Error, GroupMembersInput>({
    mutationFn: async ({ groupId, members }) => {
      return await GroupService.addMembers(groupId, members);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useRemoveGroupMembers(): UseMutationResult<any, Error, GroupMembersInput> {
  const qc = useQueryClient();
  return useMutation<any, Error, GroupMembersInput>({
    mutationFn: async ({ groupId, members }) => {
      return await GroupService.removeMembers(groupId, members);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

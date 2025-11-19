import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ADD_GROUP_MEMBERS_ROUTE, REMOVE_GROUP_MEMBERS_ROUTE } from '@/utils/ApiRoutes';

export interface GroupMembersInput {
  groupId: number | string;
  members: Array<number | string>;
}

export function useAddGroupMembers(): UseMutationResult<any, Error, GroupMembersInput> {
  const qc = useQueryClient();
  return useMutation<any, Error, GroupMembersInput>({
    mutationFn: async ({ groupId, members }) => {
      const { data } = await api.post(ADD_GROUP_MEMBERS_ROUTE(groupId), { members });
      return data;
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
      const { data } = await api.post(REMOVE_GROUP_MEMBERS_ROUTE(groupId), { members });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

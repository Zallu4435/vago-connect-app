import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DELETE_GROUP_ROUTE, LEAVE_GROUP_ROUTE } from '@/utils/ApiRoutes';

export function useLeaveGroup(): UseMutationResult<any, Error, string | number> {
  return useMutation<any, Error, string | number>({
    mutationFn: async (groupId) => {
      const { data } = await api.post(LEAVE_GROUP_ROUTE(groupId));
      return data;
    },
  });
}

export function useDeleteGroup(): UseMutationResult<any, Error, string | number> {
  return useMutation<any, Error, string | number>({
    mutationFn: async (groupId) => {
      const { data } = await api.delete(DELETE_GROUP_ROUTE(groupId));
      return data;
    },
  });
}

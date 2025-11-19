import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { UPDATE_GROUP_SETTINGS_ROUTE } from '@/utils/ApiRoutes';

export interface UpdateGroupSettingsInput {
  groupId: number | string;
  groupName?: string;
  groupDescription?: string;
  groupIconUrl?: string;
}

export function useUpdateGroupSettings(): UseMutationResult<any, Error, UpdateGroupSettingsInput> {
  const qc = useQueryClient();
  return useMutation<any, Error, UpdateGroupSettingsInput>({
    mutationFn: async ({ groupId, ...data }) => {
      const { data: res } = await api.patch(UPDATE_GROUP_SETTINGS_ROUTE(groupId), data);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

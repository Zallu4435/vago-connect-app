import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { UPDATE_GROUP_SETTINGS_ROUTE } from '@/utils/ApiRoutes';

export interface UpdateGroupSettingsInput {
  groupId: number | string;
  groupName?: string;
  groupDescription?: string;
  groupIconUrl?: string;
}

export function useUpdateGroupSettings(): UseMutationResult<any, Error, FormData> {
  const qc = useQueryClient();
  return useMutation<any, Error, FormData>({
    mutationFn: async (formData) => {
      const groupId = formData.get("groupId");
      const { data: res } = await api.patch(UPDATE_GROUP_SETTINGS_ROUTE(groupId as string), formData);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

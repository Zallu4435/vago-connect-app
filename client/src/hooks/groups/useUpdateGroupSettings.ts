import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { GroupService } from '@/services/groupService';

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
      return await GroupService.updateSettings(groupId as string, formData);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

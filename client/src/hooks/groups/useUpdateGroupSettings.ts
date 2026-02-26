import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { GroupService } from '@/services/groupService';
import { useChatStore } from '@/stores/chatStore';
import { updateGroupProfileInCache } from '@/lib/cacheHelpers';

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
    onSuccess: (data) => {
      updateGroupProfileInCache(qc, data.id, data);

      const store = useChatStore.getState();
      const current = store.currentChatUser;
      if (current && (current.id === data.id || (current as any).conversationId === data.id)) {
        store.setCurrentChatUser({
          ...current,
          name: data.groupName,
          description: data.groupDescription,
          profilePicture: data.groupIcon,
          image: data.groupIcon,
          groupName: data.groupName,
          groupDescription: data.groupDescription,
          groupIcon: data.groupIcon,
        } as any);
      }
    },
  });
}

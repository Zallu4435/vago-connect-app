import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { GroupService } from '@/services/groupService';
import { showToast } from '@/lib/toast';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';

export function useLeaveGroup(): UseMutationResult<any, Error, string | number> {
  const qc = useQueryClient();
  const self = useAuthStore((s) => s.userInfo);

  return useMutation<any, Error, string | number>({
    mutationFn: async (groupId) => {
      return await GroupService.leaveGroup(groupId);
    },
    onSuccess: (_, groupId) => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['messages'] });

      const { currentChatUser, setCurrentChatUser } = useChatStore.getState();
      const isTarget = String(currentChatUser?.id) === String(groupId) || String((currentChatUser as any)?.conversationId) === String(groupId);

      if (isTarget) {
        const leftAt = new Date().toISOString();
        const updatedParticipants = (currentChatUser as any).participants?.map((p: any) =>
          String(p.userId) === String(self?.id) ? { ...p, leftAt } : p
        );
        setCurrentChatUser({
          ...currentChatUser,
          leftAt,
          participants: updatedParticipants
        } as any);
      }

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
    onSuccess: (_, groupId) => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['messages'] });

      // Clear active chat if it's the one we just deleted
      const { currentChatUser, setCurrentChatUser } = useChatStore.getState();
      const isTarget = String(currentChatUser?.id) === String(groupId) || String((currentChatUser as any)?.conversationId) === String(groupId);
      if (isTarget) {
        setCurrentChatUser(null);
      }

      showToast.success("Deleted group successfully");
    }
  });
}

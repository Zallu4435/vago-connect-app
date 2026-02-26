import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { ChatService } from '@/services/chatService';
import { showToast } from '@/lib/toast';
import { useChatStore } from '@/stores/chatStore';

export function useClearChat(): UseMutationResult<unknown, Error, { chatId: number | string }> {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { chatId: number | string }>({
    mutationFn: async ({ chatId }) => {
      return await ChatService.clearChat(chatId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
      // The currently active chat UI reads from the Zustand store
      useChatStore.getState().setMessages([]);
      showToast.success("Chat cleared successfully");
    },
  });
}

export function useDeleteChat(): UseMutationResult<unknown, Error, { chatId: number | string }> {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { chatId: number | string }>({
    mutationFn: async ({ chatId }) => {
      return await ChatService.deleteChat(chatId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
      // The currently active chat UI reads from the Zustand store
      useChatStore.getState().setMessages([]);
      showToast.success("Chat deleted successfully");
    },
  });
}

export function useArchiveChat(): UseMutationResult<unknown, Error, { chatId: number | string; archive?: boolean }> {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { chatId: number | string; archive?: boolean }>({
    mutationFn: async ({ chatId, archive = true }) => {
      return await ChatService.archiveChat(chatId, archive);
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      showToast.success(variables.archive ? "Chat archived" : "Chat unarchived");
    },
  });
}

export function useMuteChat(): UseMutationResult<unknown, Error, { chatId: number | string; mutedUntil?: string | null }> {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { chatId: number | string; mutedUntil?: string | null }>({
    mutationFn: async ({ chatId, mutedUntil = null }) => {
      return await ChatService.muteChat(chatId, true, mutedUntil as any);
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      showToast.success(variables.mutedUntil ? "Chat muted" : "Chat unmuted");
    },
  });
}

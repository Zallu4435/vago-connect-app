import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CLEAR_CHAT_ROUTE, DELETE_CHAT_ROUTE, ARCHIVE_CHAT_ROUTE, PIN_CHAT_ROUTE, MUTE_CHAT_ROUTE } from '@/utils/ApiRoutes';
import { showToast } from '@/lib/toast';

export function useClearChat(): UseMutationResult<unknown, Error, { chatId: number | string }> {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { chatId: number | string }>({
    mutationFn: async ({ chatId }) => {
      const { data } = await api.delete(CLEAR_CHAT_ROUTE(chatId));
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
      showToast.success("Chat cleared successfully");
    },
  });
}

export function useDeleteChat(): UseMutationResult<unknown, Error, { chatId: number | string }> {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { chatId: number | string }>({
    mutationFn: async ({ chatId }) => {
      const { data } = await api.delete(DELETE_CHAT_ROUTE(chatId));
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
      showToast.success("Chat deleted successfully");
    },
  });
}

export function useArchiveChat(): UseMutationResult<unknown, Error, { chatId: number | string; archive?: boolean }> {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { chatId: number | string; archive?: boolean }>({
    mutationFn: async ({ chatId, archive = true }) => {
      const { data } = await api.post(ARCHIVE_CHAT_ROUTE(chatId), { archive });
      return data;
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
      const { data } = await api.post(MUTE_CHAT_ROUTE(chatId), { mutedUntil });
      return data;
    },
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      showToast.success(variables.mutedUntil ? "Chat muted" : "Chat unmuted");
    },
  });
}

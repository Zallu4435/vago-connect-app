import { useMutation, UseMutationResult, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { REACT_MESSAGE_ROUTE } from '@/utils/ApiRoutes';
import { useAuthStore } from '@/stores/authStore';

export interface ReactToMessageInput {
  id: number | string;
  emoji: string;
}

export interface ReactToMessageResult { id: number; reactions: Array<{ emoji: string; userId: number }> }

type Ctx = { prev: Array<[QueryKey, any]> };

export function useReactToMessage(): UseMutationResult<ReactToMessageResult, Error, ReactToMessageInput, Ctx> {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.userInfo);
  return useMutation<ReactToMessageResult, Error, ReactToMessageInput, Ctx>({
    mutationFn: async ({ id, emoji }) => {
      const { data } = await api.post(REACT_MESSAGE_ROUTE(id), { emoji });
      return data as ReactToMessageResult;
    },
    onMutate: async ({ id, emoji }) => {
      const userId = Number(user?.id);
      const keyPredicate = { queryKey: ['messages'] as any };
      await qc.cancelQueries(keyPredicate);
      const prev = qc.getQueriesData<any>(keyPredicate);
      prev.forEach(([key, data]: [QueryKey, any]) => {
        if (!data) return;
        if (Array.isArray(data.pages)) {
          const newPages = data.pages.map((p: any) => {
            const newMsgs = (p.messages || []).map((m: any) => {
              if (Number(m.id) !== Number(id)) return m;
              const current: Array<{ emoji: string; userId: number }> = Array.isArray(m.reactions) ? [...m.reactions] : [];
              const idx = current.findIndex((r) => r.userId === userId && r.emoji === emoji);
              let next = current.slice();
              if (idx === -1) {
                // add or switch reaction for this user
                // remove any previous emoji by same user
                next = next.filter((r) => r.userId !== userId);
                next.push({ emoji, userId });
              } else {
                // toggle off existing same emoji
                next.splice(idx, 1);
              }
              return { ...m, reactions: next };
            });
            return { ...p, messages: newMsgs };
          });
          qc.setQueryData(key, { ...data, pages: newPages });
        }
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      const keyPredicate = { queryKey: ['messages'] as any };
      (ctx?.prev || []).forEach(([key, data]: [QueryKey, any]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

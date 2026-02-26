import { useMutation, UseMutationResult, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { MessageService } from '@/services/messageService';
import { useAuthStore } from '@/stores/authStore';

export interface StarMessageInput {
  id: number | string;
  starred: boolean;
}

export interface StarMessageResult { id: number; starred: boolean }

type Ctx = { prev: Array<[QueryKey, any]> };

export function useStarMessage(): UseMutationResult<StarMessageResult, Error, StarMessageInput, Ctx> {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.userInfo);
  return useMutation<StarMessageResult, Error, StarMessageInput, Ctx>({
    mutationFn: async ({ id, starred }) => {
      return await MessageService.starMessage(id, starred);
    },
    onMutate: async ({ id, starred }) => {
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
              const current = Array.isArray(m.starredBy) ? [...m.starredBy] : [];
              const has = current.some((e: any) => (e?.userId ?? e) === userId);
              let nextArr: any[];
              if (starred) {
                nextArr = has ? current : [...current, { userId }];
              } else {
                nextArr = current.filter((e: any) => (e?.userId ?? e) !== userId);
              }
              return { ...m, starredBy: nextArr };
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

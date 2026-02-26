import { useMutation, UseMutationResult, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useSocketStore } from '@/stores/socketStore';
import { useAuthStore } from '@/stores/authStore';

export interface ReactToMessageInput {
  id: number | string;
  emoji: string;
  peerId?: string | number; // Added peerId for specific query targeting
}

export interface ReactionDetail {
  emoji: string;
  userId: number;
  user?: {
    id: number;
    name: string;
    profileImage: string | null;
  };
}

export interface ReactToMessageResult { id: number; reactions: ReactionDetail[] }

type Ctx = { prev: Array<[QueryKey, any]> };

export function useReactToMessage(): UseMutationResult<ReactToMessageResult, Error, ReactToMessageInput, Ctx> {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.userInfo);
  const userId = Number(user?.id);

  return useMutation<ReactToMessageResult, Error, ReactToMessageInput, Ctx>({
    mutationFn: async ({ id, emoji, peerId }) => {

      const socket = useSocketStore.getState().socket;
      if (socket.current) {
        socket.current.emit("react-message", { messageId: id, emoji, requesterId: user?.id });
      }
      return Promise.resolve({ id, reactions: [] } as any);
    },
    onMutate: async ({ id, emoji, peerId }) => {
      // 1. Precise targeting if peerId is provided
      const keyPredicate = peerId
        ? { queryKey: ['messages', String(userId), String(peerId)] as any }
        : { queryKey: ['messages'] as any };

      await qc.cancelQueries(keyPredicate);
      const prev = qc.getQueriesData<any>(keyPredicate);

      prev.forEach(([key, data]: [QueryKey, any]) => {
        if (!data || !Array.isArray(data.pages)) return;

        let queryChanged = false;
        const newPages = data.pages.map((p: any) => {
          let pageChanged = false;
          const newMsgs = (p.messages || []).map((m: any) => {
            if (Number(m.id) !== Number(id)) return m;

            pageChanged = true;
            queryChanged = true;
            const current: ReactionDetail[] = Array.isArray(m.reactions) ? [...m.reactions] : [];
            const idx = current.findIndex((r) => r.userId === userId && r.emoji === emoji);
            let next = current.slice();

            if (idx === -1) {
              // add or switch reaction for this user
              next = next.filter((r) => r.userId !== userId);
              next.push({
                emoji,
                userId,
                user: user ? {
                  id: Number(user.id),
                  name: user.name,
                  profileImage: user.profileImage
                } : undefined
              });
            } else {
              // toggle off existing same emoji
              next.splice(idx, 1);
            }
            return { ...m, reactions: next };
          });

          return pageChanged ? { ...p, messages: newMsgs } : p;
        });

        if (queryChanged) {
          qc.setQueryData(key, { ...data, pages: newPages });
        }
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      const keyPredicate = { queryKey: ['messages'] as any };
      (ctx?.prev || []).forEach(([key, data]: [QueryKey, any]) => qc.setQueryData(key, data));
    },
    onSettled: (_data, _err, { peerId }) => {
      // Avoid immediate broad invalidation to prevent "ping-pong" effect.
      // Sockets will naturally sync the state.
      if (peerId) {
        // Optional: shallow invalidate for this chat only after a buffer
        setTimeout(() => {
          qc.invalidateQueries({ queryKey: ['messages', String(userId), String(peerId)], exact: false });
        }, 2000);
      }
    },
  });
}

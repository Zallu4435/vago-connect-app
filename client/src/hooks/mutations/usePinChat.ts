import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PIN_CHAT_ROUTE } from '@/utils/ApiRoutes';

interface PinChatInput {
  conversationId: number | string;
  pinned: boolean;
  userId: number | string; // for updating the contacts cache key
}

export function usePinChat(): UseMutationResult<any, Error, PinChatInput> {
  const qc = useQueryClient();

  return useMutation<any, Error, PinChatInput>({
    mutationFn: async ({ conversationId, pinned }) => {
      const { data } = await api.post(PIN_CHAT_ROUTE(conversationId), { pinned });
      return data;
    },
    onSuccess: (updated, variables) => {
      const contactsKey = ['contacts', String(variables.userId)];
      qc.setQueryData<any[]>(contactsKey, (old = []) => {
        if (!Array.isArray(old)) return old;
        // Find contact by conversationId (self-chat entry)
        const idx = old.findIndex((c: any) => Number(c?.conversationId) === Number(variables.conversationId));
        if (idx === -1) return old;
        const contact = old[idx];
        const next = { ...contact, isPinned: updated?.isPinned ?? variables.pinned, pinOrder: updated?.pinOrder ?? contact.pinOrder };
        const rest = old.filter((_: any, i: number) => i !== idx);
        // Resort: pinned first by pinOrder asc, then by timestamp desc
        const resorted = [next, ...rest].slice().sort((a: any, b: any) => {
          if (a.isPinned && b.isPinned) return (a.pinOrder ?? 0) - (b.pinOrder ?? 0);
          if (a.isPinned) return -1;
          if (b.isPinned) return 1;
          const ta = new Date(a.timestamp || 0).getTime();
          const tb = new Date(b.timestamp || 0).getTime();
          return tb - ta;
        });
        return resorted;
      });
    },
  });
}

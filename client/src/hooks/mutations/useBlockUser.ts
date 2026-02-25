import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BLOCK_USER_ROUTE, UNBLOCK_USER_ROUTE } from '@/utils/ApiRoutes';
import { showToast } from '@/lib/toast';

export function useBlockUser(): UseMutationResult<unknown, Error, { userId: number | string; block: boolean }> {
    const qc = useQueryClient();
    return useMutation<unknown, Error, { userId: number | string; block: boolean }>({
        mutationFn: async ({ userId, block }) => {
            if (block) {
                const { data } = await api.post(BLOCK_USER_ROUTE(userId));
                return data;
            } else {
                const { data } = await api.delete(UNBLOCK_USER_ROUTE(userId));
                return data;
            }
        },
        onSuccess: (data, variables) => {
            qc.invalidateQueries({ queryKey: ['contacts'] });
            qc.invalidateQueries({ queryKey: ['messages'] }); // Edge case block status invalidates reply ability
            showToast.success(variables.block ? "User blocked" : "User unblocked");
        },
    });
}

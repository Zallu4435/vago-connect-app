import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { UserService } from '@/services/userService';
import { showToast } from '@/lib/toast';

export function useBlockUser(): UseMutationResult<unknown, Error, { userId: number | string; block: boolean }> {
    const qc = useQueryClient();
    return useMutation<unknown, Error, { userId: number | string; block: boolean }>({
        mutationFn: async ({ userId, block }) => {
            return await UserService.toggleBlockUser(userId, block);
        },
        onSuccess: (data, variables) => {
            qc.invalidateQueries({ queryKey: ['contacts'] });
            qc.invalidateQueries({ queryKey: ['messages'] }); // Edge case block status invalidates reply ability
            showToast.success(variables.block ? "User blocked" : "User unblocked");
        },
    });
}

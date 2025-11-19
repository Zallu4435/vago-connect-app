import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ONBOARD_USER_ROUTE } from '@/utils/ApiRoutes';

export interface OnboardInput {
  email: string;
  name: string;
  about?: string;
  image?: string;
}

export function useOnboardUser(): UseMutationResult<any, Error, OnboardInput> {
  return useMutation<any, Error, OnboardInput>({
    mutationFn: async (input) => {
      const { data } = await api.post(ONBOARD_USER_ROUTE, input);
      return data;
    },
  });
}

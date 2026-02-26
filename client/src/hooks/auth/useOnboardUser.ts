import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { AuthService } from '@/services/authService';

export interface OnboardInput {
  email: string;
  name: string;
  about?: string;
  image?: string;
}

export function useOnboardUser(): UseMutationResult<any, Error, OnboardInput> {
  return useMutation<any, Error, OnboardInput>({
    mutationFn: async (input) => {
      return await AuthService.onboardUser(input as any);
    },
  });
}

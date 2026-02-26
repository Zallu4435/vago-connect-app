import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/services/authService";

export const useLoginUser = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({ email, firebaseToken }) => {
            return AuthService.login(firebaseToken, email);
        },
        onSuccess: (data) => {
            // Invalidate queries that might depend on auth state
            qc.invalidateQueries({ queryKey: ["user"] });
            qc.invalidateQueries({ queryKey: ["messages"] });
            // NOTE: actual store dispatch and navigation is typically handled by the component using this hook
        },
    });
};

export const useOnboardUser = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({ email, name, about, image }) => {
            return AuthService.onboardUser({ email, name, about, image });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["user"] });
        },
    });
};

export const useLogoutUser = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            // 1. Backend logout
            await AuthService.logout();
            // 2. Firebase logout
            await FirebaseService.signOut();
            return true;
        },
        onSuccess: () => {
            // Clear all react-query cache on logout
            qc.clear();
            // NOTE: store clearing and routing remain in component
        }
    });
};

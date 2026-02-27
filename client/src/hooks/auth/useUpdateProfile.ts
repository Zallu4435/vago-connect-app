import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "react-hot-toast";
import { updateContactProfileInCache } from "@/lib/cacheHelpers";

export function useUpdateProfile() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            return await AuthService.updateProfile(data);
        },
        onSuccess: (data) => {
            if (data?.status && data?.user) {
                const store = useAuthStore.getState();
                store.setUserInfo({ ...store.userInfo, ...data.user } as any);
                updateContactProfileInCache(qc, data.user.id, data.user);
                toast.success(data?.message || "Profile updated successfully");
            } else {
                toast.error(data?.message || "Failed to update profile");
            }
        },
        onError: (err) => {
            toast.error("Failed to update profile");
        },
    });
}

import { useMutation } from "@tanstack/react-query";
import { AuthService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "react-hot-toast";

export function useUpdateProfile() {
    const setUserInfo = useAuthStore((s) => s.setUserInfo);

    return useMutation({
        mutationFn: async (data: any) => {
            return await AuthService.updateProfile(data);
        },
        onSuccess: (data) => {
            if (data.status && data.user) {
                setUserInfo(data.user);
            }
        },
        onError: (err) => {
            console.error("Failed to update profile", err);
            toast.error("Failed to update profile");
        },
    });
}

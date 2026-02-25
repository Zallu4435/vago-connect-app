import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "react-hot-toast";

export function useUpdateProfile() {
    const setUserInfo = useAuthStore((s) => s.setUserInfo);

    return useMutation({
        mutationFn: async (data) => {
            const res = await api.post("/api/auth/update-profile", data);
            return res.data;
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

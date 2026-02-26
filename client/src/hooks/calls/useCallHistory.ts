import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export function useCallHistory(query = "", date = "") {
    const userInfo = useAuthStore((s) => s.userInfo);

    return useQuery({
        queryKey: ["call-history", userInfo?.id, query, date],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (query) params.append("q", query);
            if (date) params.append("date", date);
            const { data } = await api.get(`/api/messages/calls/${userInfo?.id}?${params.toString()}`);
            return data?.calls || [];
        },
        enabled: !!userInfo?.id,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });
}

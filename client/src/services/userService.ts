import { api } from '@/lib/api';

const USER_PREFIX = '/api/users';
const AUTH_PREFIX = '/api/auth';

export class UserService {
    static async getAllContacts() {
        // Legacy route still bound to auth controller on backend
        const { data } = await api.get(`${AUTH_PREFIX}/all-users`);
        return data;
    }

    static async getAllContactsPaginated(params: { q?: string; limit?: number; cursor?: number; sort?: string; userId?: string }) {
        const { data } = await api.get(`${AUTH_PREFIX}/all-users`, { params });
        return data;
    }

    static async toggleBlockUser(userId: string | number, isBlocked: boolean) {
        const { data } = await api.put(`${USER_PREFIX}/${userId}/block`, { isBlocked });
        return data;
    }

    static async reportUser(userId: string | number, params: { reason: string; description?: string; conversationId?: number; softDelete?: boolean }) {
        const { data } = await api.post(`${USER_PREFIX}/report/${userId}`, params);
        return data;
    }
}

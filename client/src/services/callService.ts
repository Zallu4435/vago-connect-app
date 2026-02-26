import { api } from '@/lib/api';

const CALLS_PREFIX = '/api/messages/calls';

export class CallService {
    static async getCallHistory(userId: string | number, params?: { limit?: number; cursor?: number }) {
        const { data } = await api.get(`${CALLS_PREFIX}/${userId}`, { params });
        return data;
    }
}

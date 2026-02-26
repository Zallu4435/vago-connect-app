import { api } from '@/lib/api';

const MESSAGES_PREFIX = '/api/messages';

export class MessageService {

    static async sendImage(formData: FormData, onUploadProgress?: any) {
        const { data } = await api.post(`${MESSAGES_PREFIX}/image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress
        });
        return data;
    }

    static async sendAudio(formData: FormData, onUploadProgress?: any) {
        const { data } = await api.post(`${MESSAGES_PREFIX}/audio`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress
        });
        return data;
    }

    static async sendVideo(formData: FormData, onUploadProgress?: any) {
        const { data } = await api.post(`${MESSAGES_PREFIX}/video`, formData, {
            // Explicit large payload timeout override to prevent broken pipes
            timeout: 60000,
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress
        });
        return data;
    }

    static async sendFile(formData: FormData, onUploadProgress?: any) {
        const { data } = await api.post(`${MESSAGES_PREFIX}/file`, formData, {
            timeout: 60000,
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress
        });
        return data;
    }

    static async getMessages(to: number, params?: { isGroup?: boolean; limit?: number; cursor?: number; direction?: 'before' | 'after'; markRead?: boolean }) {
        // 'from' is now inferred on the backend via verifyAccessToken (req.userId)
        const { data } = await api.get(`${MESSAGES_PREFIX}/${to}`, { params });
        return data;
    }

    static async getInitialContacts(params?: { limit?: number; cursor?: number; isGroup?: boolean; q?: string; date?: string }) {
        // 'from' is now inferred on the backend via verifyAccessToken (req.userId)
        const { data } = await api.get(`${MESSAGES_PREFIX}/contacts`, { params });
        return data;
    }

    static async updateStatus(params: { messageId?: number; status: 'delivered' | 'read' }) {
        const { data } = await api.put(`${MESSAGES_PREFIX}/update-status`, params);
        return data;
    }

    static async starMessage(messageId: number | string, starred: boolean) {
        const { data } = await api.post(`${MESSAGES_PREFIX}/${messageId}/star`, { starred });
        return data;
    }

    static async searchMessages(chatId: number | string, q: string, limit?: number, cursor?: string | number) {
        const search = new URLSearchParams();
        if (q.trim()) search.set('q', q.trim());
        if (limit) search.set('limit', String(limit));
        if (cursor) search.set('cursor', String(cursor));
        const { data } = await api.get(`${MESSAGES_PREFIX}/chats/${chatId}/messages/search?${search.toString()}`);
        return data;
    }

    static async downloadMedia(mediaId: number | string) {
        const { data } = await api.get(`${MESSAGES_PREFIX}/media/${mediaId}/download`);
        return data;
    }

    static getDownloadUrl(mediaId: number | string) {
        // This isn't strictly an async fetch; sometimes the client just uses the string for an <a> tag href
        return `${api.defaults.baseURL || ''}${MESSAGES_PREFIX}/media/${mediaId}/download`;
    }
}

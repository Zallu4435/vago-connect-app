import { api } from '@/lib/api';

const MESSAGES_PREFIX = '/api/messages';

export class MessageService {
    static async sendMessage(params: { from: number; to: number; isGroup?: boolean; content?: string; type?: string; replyToMessageId?: number; caption?: string; }) {
        const { data } = await api.post(`${MESSAGES_PREFIX}/add-message`, params);
        return data;
    }

    static async sendImage(formData: FormData, onUploadProgress?: any) {
        const { data } = await api.post(`${MESSAGES_PREFIX}/add-image`, formData, {
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
        const { data } = await api.post(`${MESSAGES_PREFIX}/add-file`, formData, {
            timeout: 60000,
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress
        });
        return data;
    }

    static async sendLocation(params: { from: number; to: number; isGroup?: boolean; latitude: number; longitude: number; name?: string; address?: string; replyToMessageId?: number; }) {
        const { data } = await api.post(`${MESSAGES_PREFIX}/location`, params);
        return data;
    }

    static async getMessages(from: number, to: number, params?: { isGroup?: boolean; limit?: number; cursor?: number; direction?: 'before' | 'after'; markRead?: boolean }) {
        const { data } = await api.get(`${MESSAGES_PREFIX}/get-messages/${from}/${to}`, { params });
        return data;
    }

    static async getInitialContacts(from: number, params?: { limit?: number; cursor?: number; isGroup?: boolean; q?: string; date?: string }) {
        const { data } = await api.get(`${MESSAGES_PREFIX}/get-initial-contacts/${from}`, { params });
        return data;
    }

    static async updateStatus(params: { messageId?: number; status: 'delivered' | 'read' }) {
        const { data } = await api.put(`${MESSAGES_PREFIX}/update-status`, params);
        return data;
    }

    static async editMessage(messageId: number | string, content: string) {
        const { data } = await api.patch(`${MESSAGES_PREFIX}/${messageId}/edit`, { content });
        return data;
    }

    static async deleteMessage(messageId: number | string, deleteType: 'forMe' | 'forEveryone' = 'forEveryone') {
        const { data } = await api.delete(`${MESSAGES_PREFIX}/${messageId}`, { params: { deleteType } });
        return data;
    }

    static async starMessage(messageId: number | string, starred: boolean) {
        const { data } = await api.post(`${MESSAGES_PREFIX}/${messageId}/star`, { starred });
        return data;
    }

    static async reactToMessage(messageId: number | string, emoji: string | null) {
        const { data } = await api.post(`${MESSAGES_PREFIX}/${messageId}/react`, { emoji });
        return data;
    }

    static async forwardMessages(messageIds: number[], toConversationIds: number[]) {
        const { data } = await api.post(`${MESSAGES_PREFIX}/forward`, { messageIds, toConversationIds });
        return data;
    }

    static async searchMessages(chatId: number | string, q: string) {
        const search = new URLSearchParams();
        if (q.trim()) search.set('q', q.trim());
        const { data } = await api.get(`${MESSAGES_PREFIX}/${chatId}/search-messages?${search.toString()}`);
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

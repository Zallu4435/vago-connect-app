import { api } from '@/lib/api';

const CHATS_PREFIX = '/api/messages/chats';

export class ChatService {
    static async clearChat(chatId: string | number) {
        const { data } = await api.delete(`${CHATS_PREFIX}/${chatId}/messages`);
        return data;
    }

    static async deleteChat(chatId: string | number) {
        const { data } = await api.delete(`${CHATS_PREFIX}/${chatId}`);
        return data;
    }

    static async archiveChat(chatId: string | number, archived: boolean, keepArchived?: boolean) {
        const { data } = await api.patch(`${CHATS_PREFIX}/${chatId}/archive`, { archived, keepArchived });
        return data;
    }

    static async pinChat(chatId: string | number, pinned: boolean) {
        const { data } = await api.patch(`${CHATS_PREFIX}/${chatId}/pin`, { pinned });
        return data;
    }

    static async muteChat(chatId: string | number, muted: boolean, until?: Date | null) {
        const { data } = await api.patch(`${CHATS_PREFIX}/${chatId}/mute`, { muted, until });
        return data;
    }

    static async getMedia(chatId: string | number, params?: { type?: string; limit?: number; offset?: number }) {
        const { data } = await api.get(`${CHATS_PREFIX}/${chatId}/media`, { params });
        return data;
    }

    static async searchMedia(chatId: string | number, params?: { q?: string; limit?: number; offset?: number }) {
        const { data } = await api.get(`${CHATS_PREFIX}/${chatId}/media/search`, { params });
        return data;
    }

    static async searchMessages(chatId: string | number, q: string) {
        const { data } = await api.get(`${CHATS_PREFIX}/${chatId}/messages/search`, { params: { q } });
        return data;
    }
}

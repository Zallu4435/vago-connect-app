import { api } from '@/lib/api';

const GROUPS_PREFIX = '/api/messages/groups';

export class GroupService {
    static async createGroup(formData: FormData) {
        const { data } = await api.post(`${GROUPS_PREFIX}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    }

    static async addMembers(groupId: string | number, members: any[]) {
        const { data } = await api.post(`${GROUPS_PREFIX}/${groupId}/members`, { members });
        return data;
    }

    static async removeMembers(groupId: string | number, members: any[]) {
        const { data } = await api.delete(`${GROUPS_PREFIX}/${groupId}/members`, { data: { members } });
        return data;
    }

    static async updateRole(groupId: string | number, userId: string | number, role: 'admin' | 'member', permissions?: any) {
        const { data } = await api.patch(`${GROUPS_PREFIX}/${groupId}/roles`, { userId, role, permissions });
        return data;
    }

    static async updateSettings(groupId: string | number, formData: FormData) {
        const { data } = await api.patch(`${GROUPS_PREFIX}/${groupId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    }

    static async leaveGroup(groupId: string | number) {
        const { data } = await api.delete(`${GROUPS_PREFIX}/${groupId}/members/me`);
        return data;
    }

    static async deleteGroup(groupId: string | number) {
        const { data } = await api.delete(`${GROUPS_PREFIX}/${groupId}`);
        return data;
    }
}

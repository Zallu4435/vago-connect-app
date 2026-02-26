import { api } from '@/lib/api';

const AUTH_PREFIX = '/api/auth';

export class AuthService {
    static async checkUser(email: string) {
        const { data } = await api.post(`${AUTH_PREFIX}/check-user`, { email });
        return data;
    }

    static async onboardUser(params: { email: string; name: string; about: string; image: string }) {
        const { data } = await api.post(`${AUTH_PREFIX}/onboard-user`, params);
        return data;
    }

    static async updateProfile(params: { userId: string | number; name: string; about: string; profileImage: string }) {
        const { data } = await api.post(`${AUTH_PREFIX}/update-profile`, params);
        return data;
    }

    static async login(firebaseToken: string, email: string) {
        const { data } = await api.post(`${AUTH_PREFIX}/login`, { firebaseToken, email });
        return data;
    }

    static async logout() {
        const { data } = await api.post(`${AUTH_PREFIX}/logout`);
        return data;
    }
}

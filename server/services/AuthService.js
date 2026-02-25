import getPrismaInstance from "../utils/PrismaClient.js";
import jwt from "jsonwebtoken";

const ACCESS_TTL_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export class AuthService {
    static signAccessToken(user) {
        const secret = process.env.JWT_ACCESS_SECRET || "dev_access_secret";
        const payload = { userId: String(user?.id || ""), email: user?.email };
        return jwt.sign(payload, secret, { expiresIn: ACCESS_TTL_SECONDS });
    }

    static signRefreshToken(user) {
        const secret = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret";
        const payload = { userId: String(user?.id || ""), email: user?.email };
        return jwt.sign(payload, secret, { expiresIn: REFRESH_TTL_SECONDS });
    }

    static setRefreshCookie(res, token) {
        const isProd = process.env.NODE_ENV === "production";
        res.cookie("refreshToken", token, {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? "none" : "lax",
            maxAge: REFRESH_TTL_SECONDS * 1000,
            path: "/",
        });
    }

    static async login({ firebaseToken, email }) {
        if (!firebaseToken || !email) {
            throw Object.assign(new Error("firebaseToken and email are required"), { status: 400 });
        }
        // TODO: Optionally verify firebaseToken with Firebase Admin SDK.
        const prisma = getPrismaInstance();
        let user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, name: true, email: true, about: true, profileImage: true }
        });

        // If user doesn't exist yet, allow client to onboard later; return minimal user shape
        if (!user) {
            user = { id: "", name: email.split("@")[0], email, about: "", profileImage: "" };
        }

        const accessToken = this.signAccessToken(user);
        const refreshToken = this.signRefreshToken(user);

        return { accessToken, refreshToken, user };
    }

    static async refresh({ token }) {
        if (!token) throw Object.assign(new Error("No refresh token"), { status: 401 });
        const secret = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret";
        let payload;
        try {
            payload = jwt.verify(token, secret);
        } catch (err) {
            throw Object.assign(new Error("Invalid refresh token"), { status: 401 });
        }
        const prisma = getPrismaInstance();
        const user = payload?.email ? await prisma.user.findUnique({ where: { email: payload.email } }) : null;
        const effectiveUser = user || { id: payload?.userId || "", email: payload?.email || "" };
        const accessToken = this.signAccessToken(effectiveUser);
        return { accessToken };
    }
}

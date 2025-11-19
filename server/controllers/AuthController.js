import getPrismaInstance from "../utils/PrismaClient.js";
import jwt from "jsonwebtoken";

const ACCESS_TTL_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function signAccessToken(user) {
  const secret = process.env.JWT_ACCESS_SECRET || "dev_access_secret";
  const payload = { userId: String(user?.id || ""), email: user?.email };
  return jwt.sign(payload, secret, { expiresIn: ACCESS_TTL_SECONDS });
}

function signRefreshToken(user) {
  const secret = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret";
  const payload = { userId: String(user?.id || ""), email: user?.email };
  return jwt.sign(payload, secret, { expiresIn: REFRESH_TTL_SECONDS });
}

function setRefreshCookie(res, token) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: REFRESH_TTL_SECONDS * 1000,
    path: "/",
  });
}

export const checkUser = async (req, res, next) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({ message: "Email is required", status: false })
        }

        const prisma = getPrismaInstance()

        const user = await prisma.user.findUnique({ where: { email } })

        if (!user) {
            return res.status(200).json({ message: "User not found", status: false })
        }

        return res.status(200).json({ message: "User found", status: true, user })

    } catch (error) {
        next(error)
    }
}

export const onBoardUser = async (req, res, next) => {
    try {
        const { name, email, about, image, profileImage } = req.body

        const finalProfileImage = typeof profileImage === 'string' ? profileImage : (typeof image === 'string' ? image : null);
        if (!name || !email) {
            return res.status(400).json({ message: "Name and email are required", status: false })
        }

        const prisma = getPrismaInstance()

        const user = await prisma.user.create({ data: { name, email, about: about || undefined, profileImage: finalProfileImage || undefined } })

        return res.status(200).json({ message: "User created", status: true, user })
    } catch (error) {
        next(error)
    }
}

export const getAllUser = async (req, res, next) => {
    try {
        const prisma = getPrismaInstance()
        const users = await prisma.user.findMany({
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                email: true,
                about: true,
                profileImage: true,
            }
        })

        const usersGroupByInitialLetters = users.reduce((acc, user) => {
            const initial = user.name.charAt(0).toUpperCase();
            if (!acc[initial]) {
                acc[initial] = [];
            }
            acc[initial].push(user);
            return acc;
        }, {});

        return res.status(200).json({ message: "Users found", status: true, users: usersGroupByInitialLetters });
    } catch (error) {
        next(error)
    }
}

// New: Login -> validate firebase token (basic presence), issue JWTs, set refresh cookie
export const login = async (req, res, next) => {
  try {
    const { firebaseToken, email } = req.body || {};
    if (!firebaseToken || !email) {
      return res.status(400).json({ message: "firebaseToken and email are required" });
    }
    // TODO: Optionally verify firebaseToken with Firebase Admin SDK.
    const prisma = getPrismaInstance();
    let user = await prisma.user.findUnique({ where: { email } });
    // If user doesn't exist yet, allow client to onboard later; return minimal user shape
    if (!user) {
      user = { id: "", name: email.split("@")[0], email, about: "", profileImage: "" };
    }
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    setRefreshCookie(res, refreshToken);
    return res.status(200).json({ accessToken, user });
  } catch (error) {
    next(error);
  }
};

// New: Refresh -> verify refresh cookie and issue new access token
export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });
    const secret = process.env.JWT_REFRESH_SECRET || "dev_refresh_secret";
    const payload = jwt.verify(token, secret);
    const prisma = getPrismaInstance();
    const user = payload?.email ? await prisma.user.findUnique({ where: { email: payload.email } }) : null;
    const effectiveUser = user || { id: payload?.userId || "", email: payload?.email || "" };
    const accessToken = signAccessToken(effectiveUser);
    return res.status(200).json({ accessToken });
  } catch (error) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

// New: Logout -> clear refresh cookie
export const logout = async (_req, res, _next) => {
  try {
    res.clearCookie("refreshToken", { path: "/" });
    return res.status(200).json({ message: "Logged out" });
  } catch {
    return res.status(200).json({ message: "Logged out" });
  }
};
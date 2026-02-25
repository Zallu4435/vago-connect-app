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

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, about: true, profileImage: true },
    })

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

    const created = await prisma.user.create({ data: { name, email, about: about || undefined, profileImage: finalProfileImage || undefined } })
    const user = {
      id: created.id,
      name: created.name,
      email: created.email,
      about: created.about,
      profileImage: created.profileImage,
    }

    return res.status(201).json({ message: "User created", status: true, user })
  } catch (error) {
    next(error)
  }
}

export const updateProfile = async (req, res, next) => {
  try {
    const { userId, name, about, profileImage } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required", status: false });
    }

    const prisma = getPrismaInstance();

    // Partial update - only update fields that are provided and valid
    const dataToUpdate = {};
    if (typeof name === 'string' && name.trim()) dataToUpdate.name = name.trim();
    if (typeof about === 'string' && about.trim()) dataToUpdate.about = about.trim();
    if (profileImage !== undefined) dataToUpdate.profileImage = profileImage;

    const updated = await prisma.user.update({
      where: { id: Number(userId) },
      data: dataToUpdate,
      select: { id: true, name: true, email: true, about: true, profileImage: true },
    });

    return res.status(200).json({ message: "Profile updated", status: true, user: updated });
  } catch (error) {
    next(error);
  }
};


export const getAllUser = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();

    // Query params: q, limit, cursor, sort
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const rawLimit = Number(req.query.limit);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50;
    const cursorId = req.query.cursor ? Number(req.query.cursor) : undefined;
    const sort = req.query.sort === 'name_desc' ? 'desc' : 'asc';

    const where = q
      ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      }
      : undefined;

    const rows = await prisma.user.findMany({
      where,
      orderBy: { name: sort },
      take: limit + 1,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      select: {
        id: true,
        name: true,
        email: true,
        about: true,
        profileImage: true,
      },
    });

    let nextCursor = null;
    let list = rows;
    if (rows.length > limit) {
      const next = rows.pop();
      nextCursor = next?.id ? String(next.id) : null;
      list = rows;
    }

    const usersGroupByInitialLetters = list.reduce((acc, user) => {
      const initial = (user?.name || '').charAt(0).toUpperCase() || '#';
      if (!acc[initial]) acc[initial] = [];
      acc[initial].push(user);
      return acc;
    }, {});

    return res.status(200).json({
      message: 'Users found',
      status: true,
      users: usersGroupByInitialLetters,
      nextCursor,
    });
  } catch (error) {
    next(error);
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
    let user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true, about: true, profileImage: true } });
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
    return res.status(204).send();
  } catch {
    return res.status(204).send();
  }
};
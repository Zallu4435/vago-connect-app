import { AuthService } from "../services/AuthService.js";
import { UserService } from "../services/UserService.js";

export const checkUser = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await UserService.checkUser({ email });
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const onBoardUser = async (req, res, next) => {
  try {
    const { name, email, about, image, profileImage } = req.body;
    const result = await UserService.onBoardUser({ name, email, about, image, profileImage });
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { userId, name, about, profileImage } = req.body;
    const result = await UserService.updateProfile({ userId, name, about, profileImage });
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const getAllUser = async (req, res, next) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const rawLimit = Number(req.query.limit);
    const cursorId = req.query.cursor ? Number(req.query.cursor) : undefined;
    const sort = req.query.sort === 'name_desc' ? 'desc' : 'asc';
    const userId = req.query.userId ? Number(req.query.userId) : undefined;

    const result = await UserService.getAllUser({ q, rawLimit, cursorId, sort, userId });
    return res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { firebaseToken, email } = req.body || {};
    const result = await AuthService.login({ firebaseToken, email });
    AuthService.setRefreshCookie(res, result.refreshToken);
    return res.status(200).json({ accessToken: result.accessToken, user: result.user });
  } catch (error) {
    const status = error?.status || 500;
    res.status(status).json({ message: error.message || "Internal error" });
  }
};

export const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    const result = await AuthService.refresh({ token });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

export const logout = async (_req, res, _next) => {
  try {
    res.clearCookie("refreshToken", { path: "/" });
    return res.status(204).send();
  } catch {
    return res.status(204).send();
  }
};
import multer from "multer";

export const memory = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
});

// Audio-only upload (15MB max)
export const audioUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype && file.mimetype.startsWith("audio/")) return cb(null, true);
        cb(new Error("Only audio files are allowed"));
    },
});

// Image-only upload (25MB max)
export const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype && file.mimetype.startsWith("image/")) return cb(null, true);
        cb(new Error("Only image files are allowed"));
    },
});

// Video-only upload (50MB max)
export const videoUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype && file.mimetype.startsWith("video/")) return cb(null, true);
        cb(new Error("Only video files are allowed"));
    },
});

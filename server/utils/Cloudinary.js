import { v2 as cloudinary } from 'cloudinary';

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

export function initCloudinary() {
  try {
    console.log('[Cloudinary:init] starting init', {
      cloudNamePresent: Boolean(CLOUDINARY_CLOUD_NAME),
      apiKeyPresent: Boolean(CLOUDINARY_API_KEY),
      apiSecretPresent: Boolean(CLOUDINARY_API_SECRET),
    });
  } catch (_) {}
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  try {
    console.log('[Cloudinary:init] configured', { cloudName: CLOUDINARY_CLOUD_NAME });
  } catch (_) {}
  return cloudinary;
}

export function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const cld = initCloudinary();
    try {
      console.log('[Cloudinary:uploadBuffer] start', {
        bufferLength: buffer ? buffer.length : 0,
        options,
        ts: Date.now(),
      });
    } catch (_) {}
    const stream = cld.uploader.upload_stream(
      { resource_type: 'auto', ...options },
      (error, result) => {
        if (error) {
          try { console.error('[Cloudinary:uploadBuffer] error', { error }); } catch (_) {}
          return reject(error);
        }
        try {
          console.log('[Cloudinary:uploadBuffer] success', {
            public_id: result?.public_id,
            bytes: result?.bytes,
            resource_type: result?.resource_type,
            format: result?.format,
          });
        } catch (_) {}
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export function buildCloudinaryUrl(publicId, opts = {}) {
  if (!publicId) return null;
  const cld = initCloudinary();
  const { resource_type = 'image', transformation = [] } = opts;
  return cld.url(publicId, {
    resource_type,
    secure: true,
    transformation,
  });
}

// Returns a downloadable URL (attachment). If sign_url is desired, set SIGNED_DOWNLOAD=true in env later.
export function buildCloudinaryDownloadUrl(publicId, opts = {}) {
  if (!publicId) return null;
  const cld = initCloudinary();
  const { resource_type = 'auto', fileNameOverride } = opts;
  return cld.url(publicId, {
    resource_type,
    secure: true,
    flags: 'attachment',
    filename_override: fileNameOverride,
    sign_url: false,
  });
}

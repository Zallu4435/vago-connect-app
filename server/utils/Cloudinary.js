import { v2 as cloudinary } from 'cloudinary';

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

export function initCloudinary() {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

export function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const cld = initCloudinary();
    const stream = cld.uploader.upload_stream(
      { resource_type: 'auto', ...options },
      (error, result) => {
        if (error) {
          return reject(error);
        }
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

// Safely destroys an orphaned Cloudinary file using its public_id.
export function deleteCloudinaryFile(publicId, resourceType = 'image') {
  return new Promise((resolve) => {
    if (!publicId) return resolve(false);
    const cld = initCloudinary();

    cld.uploader.destroy(publicId, { resource_type: resourceType }, (error, result) => {
      if (error) {
        // Don't reject, just resolve false so it doesn't crash the server recovery loop
        return resolve(false);
      }
      resolve(true);
    });
  });
}

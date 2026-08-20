const MEBIBYTE = 1024 * 1024;

/**
 * Source uploads are allowed to be larger than the stored image so they can be
 * normalized server-side. The separate source cap protects the Node process
 * from unbounded multipart bodies.
 */
export const MAX_IMAGE_UPLOAD_SOURCE_BYTES = 50 * MEBIBYTE;
export const MAX_IMAGE_UPLOAD_REQUEST_BYTES = MAX_IMAGE_UPLOAD_SOURCE_BYTES + MEBIBYTE;

/**
 * Keep the persisted WebP comfortably below the product-facing 20 MiB limit.
 */
export const MAX_IMAGE_UPLOAD_OUTPUT_BYTES = 19 * MEBIBYTE;

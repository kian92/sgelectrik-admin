const BUNNY_API_KEY = process.env.BUNNY_STORAGE_API_KEY;
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;
const BUNNY_STORAGE_ENDPOINT = process.env.BUNNY_STORAGE_ENDPOINT;
const BUNNY_CDN_HOST = process.env.BUNNY_CDN_HOST;
const NODE_ENV = process.env.NODE_ENV || "production";

export interface UploadResponse {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface FileMetadata {
  originalName: string;
  mimeType: string;
  size: number;
}

// Content types for organization
export type ContentType =
  | "blog"
  | "rentals"
  | "vehicles"
  | "dealers"
  | "charging"
  | "workshops"
  | "general";

// Supported media types
const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

const SUPPORTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/mpeg"];

const SUPPORTED_TYPES = [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_VIDEO_TYPES];

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

/**
 * Generate a unique filename for storage
 */
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split(".").pop() || "bin";
  return `${timestamp}-${random}.${ext}`;
}

function getFolderPath(
  mimeType: string,
  contentType: ContentType = "general",
): string {
  let mediaType = "files";

  if (SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
    mediaType = "images";
  } else if (SUPPORTED_VIDEO_TYPES.includes(mimeType)) {
    mediaType = "videos";
  }

  // Build hierarchical path: environment/mediaType/contentType
  return `${NODE_ENV}/${mediaType}/${contentType}`;
}

/**
 * Validate file before upload
 */
export function validateFile(
  mimeType: string,
  fileSize: number,
): { valid: boolean; error?: string } {
  if (!SUPPORTED_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `File type ${mimeType} is not supported. Supported types: ${SUPPORTED_TYPES.join(", ")}`,
    };
  }

  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size ${(fileSize / 1024 / 1024).toFixed(2)}MB exceeds maximum of 500MB`,
    };
  }

  return { valid: true };
}

/**
 * Upload file to Bunny.net storage
 * Organizes files: {environment}/{mediaType}/{contentType}/filename
 *
 * @param file - File data as Buffer or Uint8Array
 * @param originalFileName - Original filename for extension
 * @param mimeType - MIME type of the file
 * @param contentType - Content category (blog, rentals, etc.)
 */
export async function uploadToBunny(
  file: Buffer | Uint8Array,
  originalFileName: string,
  mimeType: string,
  contentType: ContentType = "general",
): Promise<UploadResponse> {
  try {
    if (!BUNNY_API_KEY || !BUNNY_STORAGE_ZONE || !BUNNY_STORAGE_ENDPOINT) {
      throw new Error(
        "Bunny.net credentials not configured in environment variables",
      );
    }

    // Validate file
    const validation = validateFile(mimeType, file.length);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate filename and path
    const fileName = generateFileName(originalFileName);
    const folderPath = getFolderPath(mimeType, contentType);
    const storagePath = `/${BUNNY_STORAGE_ZONE}/${folderPath}/${fileName}`; // ← ADD
    const cdnUrl = `https://${BUNNY_CDN_HOST}/${folderPath}/${fileName}`; // ← ADD

    // Convert buffer to ArrayBuffer for Blob
    const arrayBuffer = Buffer.isBuffer(file)
      ? file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)
      : file.buffer;

    const blob = new Blob([arrayBuffer as ArrayBuffer], { type: mimeType });

    // Upload to Bunny.net storage
    const response = await fetch(
      `https://${BUNNY_STORAGE_ENDPOINT}${storagePath}`,
      {
        method: "PUT",
        headers: {
          AccessKey: BUNNY_API_KEY,
          "Content-Type": mimeType,
        },
        body: blob,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Bunny.net upload failed: ${response.status} - ${errorText}`,
      );
    }

    return {
      success: true,
      url: cdnUrl,
      path: `${folderPath}/${fileName}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Bunny.net upload error:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Delete file from Bunny.net storage
 */
export async function deleteFromBunny(filePath: string): Promise<boolean> {
  try {
    if (!BUNNY_API_KEY || !BUNNY_STORAGE_ZONE || !BUNNY_STORAGE_ENDPOINT) {
      throw new Error(
        "Bunny.net credentials not configured in environment variables",
      );
    }

    const storagePath = `/${BUNNY_STORAGE_ZONE}/${filePath}`;

    const response = await fetch(
      `https://${BUNNY_STORAGE_ENDPOINT}${storagePath}`,
      {
        method: "DELETE",
        headers: {
          AccessKey: BUNNY_API_KEY,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Bunny.net delete failed: ${response.status} - ${errorText}`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Bunny.net delete error:", error);
    return false;
  }
}

/**
 * Get CDN URL for a stored file
 */
export function getCdnUrl(filePath: string): string {
  if (!BUNNY_CDN_HOST) {
    throw new Error("BUNNY_CDN_HOST not configured");
  }
  return `https://${BUNNY_CDN_HOST}/${filePath}`;
}

/**
 * Extract file path from CDN URL
 */
export function extractPathFromUrl(cdnUrl: string): string | null {
  if (!BUNNY_CDN_HOST) {
    return null;
  }
  const baseUrl = `https://${BUNNY_CDN_HOST}/`;
  if (cdnUrl.startsWith(baseUrl)) {
    return cdnUrl.slice(baseUrl.length);
  }
  return null;
}

export const BUNNY_CONFIG = {
  CDN_HOST: BUNNY_CDN_HOST,
  ZONE: BUNNY_STORAGE_ZONE,
  IS_CONFIGURED:
    !!BUNNY_API_KEY && !!BUNNY_STORAGE_ZONE && !!BUNNY_STORAGE_ENDPOINT,
};

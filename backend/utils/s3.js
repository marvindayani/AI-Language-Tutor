import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

const awsRegion = process.env.AWS_REGION || "us-east-1";
const hasExplicitAwsKeys = Boolean(
  process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY,
);

if (!hasExplicitAwsKeys) {
  console.log(
    "Using AWS SDK default credential chain (EC2 IAM role / environment / shared config).",
  );
}

const s3Client = new S3Client({
  region: awsRegion,
  ...(hasExplicitAwsKeys
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

const bucketName = process.env.AWS_S3_BUCKET_NAME || "ai-language-tutor-bucket";
const maxFileSize = parseInt(process.env.AWS_S3_MAX_FILE_SIZE) || 5242880; // 5MB default

/**
 * Upload a file to S3
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {string} fileName - Original filename (without extension preferred)
 * @param {string} mimeType - MIME type of the file (e.g., 'image/jpeg')
 * @param {string} folder - S3 folder path (e.g., 'profile-pictures')
 * @returns {Promise<{key: string, url: string}>} S3 key and URL
 */
export const uploadToS3 = async (
  fileBuffer,
  fileName,
  mimeType,
  folder = "uploads",
) => {
  try {
    // Validate file size
    if (fileBuffer.length > maxFileSize) {
      throw new Error(
        `File size exceeds maximum limit of ${maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const uniqueId = uuidv4().split("-")[0];
    const fileExtension = getFileExtension(mimeType);
    const key = `${folder}/${timestamp}-${uniqueId}-${fileName}${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      Metadata: {
        "original-filename": fileName,
        "upload-date": new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    // Generate public URL
    const url = `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;

    return { key, url };
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

/**
 * Delete a file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<void>}
 */
export const deleteFromS3 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error("S3 Delete Error:", error);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
};

/**
 * Extract file extension from MIME type
 * @param {string} mimeType - MIME type (e.g., 'image/jpeg')
 * @returns {string} File extension (e.g., '.jpg')
 */
const getFileExtension = (mimeType) => {
  const mimeToExt = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
  };

  return mimeToExt[mimeType] || ".bin";
};

/**
 * Validate image file
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} mimeType - MIME type
 * @returns {boolean} Is valid image
 */
export const isValidImageFile = (fileBuffer, mimeType) => {
  const validMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (!validMimeTypes.includes(mimeType)) {
    return false;
  }

  // Check minimum size (at least 1KB)
  if (fileBuffer.length < 1024) {
    return false;
  }

  // Check maximum size
  if (fileBuffer.length > maxFileSize) {
    return false;
  }

  return true;
};

/**
 * Extract S3 key from URL
 * @param {string} url - S3 URL
 * @returns {string} S3 key
 */
export const getKeyFromUrl = (url) => {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    // Remove leading slash and bucket name if present
    const key = pathname.startsWith("/") ? pathname.substring(1) : pathname;
    return key;
  } catch (error) {
    console.error("Error parsing S3 URL:", error);
    return null;
  }
};

export default { uploadToS3, deleteFromS3, isValidImageFile, getKeyFromUrl };

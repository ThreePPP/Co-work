import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';
import { FileCategory } from '../types/enums.js';

const uploadDirectory = path.resolve(process.cwd(), env.UPLOAD_DIR);

const subfolders = ['avatars', 'documents', 'images', 'videos', 'audio', 'archives', 'others'];

// Ensure all categorical subdirectories exist on startup
for (const sub of subfolders) {
  const dir = path.join(uploadDirectory, sub);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export const decodeOriginalFilename = (rawName: string): string => {
  try {
    // When Multer parses multipart headers, non-ASCII UTF-8 characters are parsed as latin1
    // Converting latin1 bytes back to utf8 recovers Thai, Chinese, Japanese, and accented characters.
    const decoded = Buffer.from(rawName, 'latin1').toString('utf8');
    return decoded;
  } catch {
    return rawName;
  }
};

export const getFileCategory = (mimeType: string, filename: string): FileCategory => {
  const ext = path.extname(filename).toLowerCase();

  if (mimeType.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
    return FileCategory.IMAGE;
  }
  if (
    mimeType.startsWith('application/pdf') ||
    mimeType.includes('word') ||
    mimeType.includes('document') ||
    mimeType.includes('sheet') ||
    mimeType.includes('presentation') ||
    ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md', '.csv'].includes(ext)
  ) {
    return FileCategory.DOCUMENT;
  }
  if (mimeType.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {
    return FileCategory.AUDIO;
  }
  if (mimeType.startsWith('video/') || ['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) {
    return FileCategory.VIDEO;
  }
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('tar') ||
    ['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)
  ) {
    return FileCategory.ARCHIVE;
  }
  return FileCategory.OTHER;
};

export const getCategorySubfolder = (category: FileCategory): string => {
  switch (category) {
    case FileCategory.DOCUMENT:
      return 'documents';
    case FileCategory.IMAGE:
      return 'images';
    case FileCategory.VIDEO:
      return 'videos';
    case FileCategory.AUDIO:
      return 'audio';
    case FileCategory.ARCHIVE:
      return 'archives';
    default:
      return 'others';
  }
};

// 1. Storage for Workspace Files (Categorized into documents, images, videos, audio, archives, others)
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const originalName = decodeOriginalFilename(file.originalname);
    const category = getFileCategory(file.mimetype, originalName);
    const subfolder = getCategorySubfolder(category);
    const targetDir = path.join(uploadDirectory, subfolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (_req, file, cb) => {
    const decodedName = decodeOriginalFilename(file.originalname);
    const ext = path.extname(decodedName) || path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max limit
  },
});

// 2. Storage for Private Profile Avatars (Separated into uploads/avatars)
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const targetDir = path.join(uploadDirectory, 'avatars');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max limit for avatar
  },
});

import fs from 'fs';
import path from 'path';
import { prisma } from '../../config/db.js';
import { ApiError } from '../../utils/apiResponse.js';
import { getFileCategory, decodeOriginalFilename } from '../../middleware/upload.middleware.js';
import { FileCategory } from '../../types/enums.js';

export interface FileListOptions {
  category?: FileCategory;
  uploaderId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class FileService {
  static async saveFile(
    file: Express.Multer.File,
    uploaderId: string,
    messageId?: string
  ) {
    const originalName = decodeOriginalFilename(file.originalname);
    const category = getFileCategory(file.mimetype, originalName);
    const subfolder = path.basename(file.destination || 'others');
    const relativeUrl = `/uploads/${subfolder}/${file.filename}`;

    const fileRecord = await prisma.fileItem.create({
      data: {
        filename: file.filename,
        originalName: originalName,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        url: relativeUrl,
        category,
        uploaderId,
        messageId: messageId || null,
      },
      include: {
        uploader: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: uploaderId,
        action: 'FILE_UPLOADED',
        details: `Uploaded file ${originalName} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      },
    });

    return fileRecord;
  }

  static async listFiles(options: FileListOptions) {
    const page = options.page || 1;
    const limit = options.limit || 30;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.category) {
      where.category = options.category;
    }

    if (options.uploaderId) {
      where.uploaderId = options.uploaderId;
    }

    if (options.search) {
      where.originalName = { contains: options.search, mode: 'insensitive' };
    }

    const [files, total] = await Promise.all([
      prisma.fileItem.findMany({
        where,
        include: {
          uploader: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.fileItem.count({ where }),
    ]);

    return {
      files,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async getFileById(fileId: string) {
    const file = await prisma.fileItem.findUnique({
      where: { id: fileId },
      include: {
        uploader: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    if (!file) {
      throw ApiError.notFound('File not found');
    }

    return file;
  }

  static async deleteFile(fileId: string, userId: string) {
    const file = await prisma.fileItem.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw ApiError.notFound('File not found');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (file.uploaderId !== userId && user?.role !== 'ADMIN') {
      throw ApiError.forbidden('You do not have permission to delete this file');
    }

    // Delete physically from disk if exists
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (err) {
      console.warn('Failed to delete physical file from disk:', err);
    }

    await prisma.fileItem.delete({
      where: { id: fileId },
    });

    return { message: 'File deleted successfully' };
  }

  static async getFileStats() {
    const [totalFiles, totalSizeResult, categoryBreakdown] = await Promise.all([
      prisma.fileItem.count(),
      prisma.fileItem.aggregate({
        _sum: { size: true },
      }),
      prisma.fileItem.groupBy({
        by: ['category'],
        _count: true,
        _sum: { size: true },
      }),
    ]);

    return {
      totalFiles,
      totalSize: totalSizeResult._sum.size || 0,
      categoryBreakdown: categoryBreakdown.map((item: { category: FileCategory; _count: number; _sum: { size: number | null } }) => ({
        category: item.category,
        count: item._count,
        size: item._sum.size || 0,
      })),
    };
  }
}
